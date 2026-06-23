# FRAGSTACK — Prompt Complementar #2
## Login + RBAC + Configuração de Pesos Dinâmicos

> Este prompt complementa o FRAGSTACK-prompt-claude-code.md já implementado.
> O projeto base (ranking, partidas, sorteio) já existe. Implemente apenas o que está descrito aqui.

---

## 1. SISTEMA DE AUTENTICAÇÃO

### Stack
- **JWT** (JSON Web Token) com `python-jose` + `passlib[bcrypt]`
- Tokens com expiração de 7 dias (refresh automático no frontend)
- Sem OAuth por ora — login simples com nickname + senha

### Novo modelo no banco

```sql
-- Adicionar coluna na tabela players existente
ALTER TABLE players ADD COLUMN password_hash VARCHAR(255);
ALTER TABLE players ADD COLUMN role VARCHAR(20) DEFAULT 'viewer' NOT NULL;
-- role pode ser: 'admin' ou 'viewer'

ALTER TABLE players ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Tabela de configuração global (singleton — sempre 1 linha)
CREATE TABLE ranking_config (
  id              SERIAL PRIMARY KEY,
  weight_combat   NUMERIC(5,4) DEFAULT 0.50,  -- peso combate
  weight_duel     NUMERIC(5,4) DEFAULT 0.30,  -- peso duelos
  weight_utility  NUMERIC(5,4) DEFAULT 0.20,  -- peso utility
  updated_at      TIMESTAMP DEFAULT NOW(),
  updated_by      INTEGER REFERENCES players(id)
  -- CONSTRAINT: weight_combat + weight_duel + weight_utility = 1.0
);

-- Inserir linha inicial
INSERT INTO ranking_config (weight_combat, weight_duel, weight_utility) VALUES (0.50, 0.30, 0.20);
```

### Schemas Pydantic novos (`schemas.py`)

```python
class LoginRequest(BaseModel):
    nickname: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    player: PlayerPublic   # id, nickname, role, avatar_initials

class PlayerPublic(BaseModel):
    id: int
    nickname: str
    role: str              # 'admin' | 'viewer'
    avatar_initials: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class RankingConfigUpdate(BaseModel):
    weight_combat: float
    weight_duel: float
    weight_utility: float

    @validator('weight_utility', always=True)
    def soma_deve_ser_um(cls, v, values):
        total = values.get('weight_combat', 0) + values.get('weight_duel', 0) + v
        if abs(total - 1.0) > 0.001:
            raise ValueError(f'Soma dos pesos deve ser 1.0 (atual: {total:.3f})')
        return v
```

---

## 2. ENDPOINTS DE AUTH (`auth.py` — novo arquivo)

```python
# Criar auth.py separado para organização

POST /api/auth/login
    body: { nickname, password }
    → 200: { access_token, token_type, player }
    → 401: "Credenciais inválidas"

POST /api/auth/logout
    # Stateless JWT — apenas instrui o frontend a deletar o token
    → 200: { message: "ok" }

GET  /api/auth/me
    header: Authorization: Bearer <token>
    → 200: PlayerPublic com role
    → 401: "Token inválido ou expirado"

POST /api/auth/change-password
    header: Authorization: Bearer <token>
    body: { current_password, new_password }
    → 200: "Senha alterada"
    → 400: "Senha atual incorreta"
```

### Dependências FastAPI para proteger rotas

```python
# Em auth.py

def get_current_player(token: str = Depends(oauth2_scheme), db = Depends(get_db)) -> Player:
    """Valida JWT e retorna o player. Usado em qualquer rota autenticada."""
    ...

def require_admin(current: Player = Depends(get_current_player)) -> Player:
    """Só passa se role == 'admin'. Caso contrário → 403 Forbidden."""
    if current.role != 'admin':
        raise HTTPException(status_code=403, detail="Acesso restrito a gestores")
    return current
```

---

## 3. PROTEÇÃO DAS ROTAS EXISTENTES

Atualizar `main.py` adicionando as dependências nas rotas já existentes:

```python
# ROTAS PÚBLICAS (sem token) — qualquer um pode ver
GET  /api/ranking              → público
GET  /api/players              → público
GET  /api/matches              → público
GET  /api/sort-teams           → público

# ROTAS AUTENTICADAS (qualquer player logado)
GET  /api/auth/me              → get_current_player
GET  /api/players/{id}/stats   → get_current_player
POST /api/auth/change-password → get_current_player

# ROTAS DE ADMIN (só gestores)
POST /api/matches              → require_admin
POST /api/players              → require_admin
DELETE /api/matches/{id}       → require_admin
PUT  /api/ranking/config       → require_admin
GET  /api/ranking/config       → require_admin  (viewer não vê os pesos detalhados)
```

---

## 4. ENDPOINT DE CONFIGURAÇÃO DE PESOS

```python
GET  /api/ranking/config
    → { weight_combat, weight_duel, weight_utility, updated_at, updated_by_nickname }

PUT  /api/ranking/config
    header: Authorization: Bearer <token> (require_admin)
    body: { weight_combat: 0.40, weight_duel: 0.35, weight_utility: 0.25 }
    → valida que soma == 1.0
    → salva no banco com updated_by = player atual
    → retorna config atualizada

# IMPORTANTE: o endpoint GET /api/ranking deve ler os pesos do banco
# (não hardcodar 0.5/0.3/0.2 no código de ranking.py)
```

### Atualizar `ranking.py`

```python
def calcular_ranking(db: Session) -> list[PlayerRanking]:
    # Buscar pesos do banco (tabela ranking_config, primeira linha)
    config = db.query(RankingConfig).first()
    w_combat  = float(config.weight_combat)
    w_duel    = float(config.weight_duel)
    w_utility = float(config.weight_utility)

    # ... resto da lógica min-max já implementada ...

    score_final = (score_combate * w_combat) + (score_duelo * w_duel) + (score_utility * w_utility)
```

---

## 5. SCRIPT DE SEED — Criar admin inicial

```python
# backend/seed.py
# Rodar uma vez: python seed.py

from passlib.context import CryptContext
from database import SessionLocal
from models import Player

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin(nickname: str, password: str):
    db = SessionLocal()
    player = Player(
        nickname=nickname,
        password_hash=pwd_context.hash(password),
        role="admin",
        avatar_initials=nickname[:2].upper()
    )
    db.add(player)
    db.commit()
    print(f"Admin '{nickname}' criado com sucesso.")
    db.close()

if __name__ == "__main__":
    create_admin("admin", "fragstack2025")  # trocar a senha depois!
```

---

## 6. FRONTEND — NOVAS PÁGINAS E COMPONENTES

### Contexto global de Auth (`src/context/AuthContext.tsx`)

```tsx
interface AuthContextType {
  player: PlayerPublic | null
  isAdmin: boolean
  login: (nickname: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}
// Armazena token no localStorage
// Injeta header Authorization em todas as chamadas da api/client.ts
```

### `api/client.ts` — atualizar

```typescript
// Adicionar interceptor que:
// 1. Lê token do localStorage
// 2. Injeta Authorization: Bearer <token> em toda requisição
// 3. Se receber 401 → chama logout() e redireciona para /login
```

### Proteção de rotas no React

```tsx
// src/components/ProtectedRoute.tsx
// Redireciona para /login se não estiver autenticado
// AdminRoute: redireciona para / se não for admin
```

---

## 7. PÁGINAS FRONTEND

### `/login` — Página de Login

**Visual:** tela preta com fundo de crosshair CS2 (SVG inline sutil), card central com logo FRAGSTACK em vermelho, campo nickname, campo senha, botão LOGIN em vermelho sólido.

```tsx
// Comportamento:
// - POST /api/auth/login
// - Salva token no localStorage
// - Redireciona: admin → /admin, viewer → /
// - Erro: shake animation no card + mensagem "Credenciais inválidas"
```

**Não usar form HTML — usar onClick no botão como o padrão do projeto.**

### `/` — Dashboard (atualizar)

Adicionar no header:
- Avatar com iniciais do player logado (canto direito)
- Badge de role: `GESTOR` em vermelho ou `PLAYER` em cinza
- Botão de logout (ícone de saída)
- Se admin: chip clicável "⚙️ Configurar Pesos" que abre modal lateral

### `/admin` — Painel do Gestor (nova página, só admin)

Seções:
1. **Jogadores** — tabela com todos os players, botão "Cadastrar jogador", toggle de role (admin/viewer)
2. **Partidas** — listagem com botão deletar em cada linha
3. **Configuração de Pesos** — ver abaixo (também acessível via modal no dashboard)

### `/profile` — Perfil do Player (autenticado, qualquer role)

- Stats pessoais consolidados de todas as partidas
- Posição no ranking atual
- Radar chart individual
- Botão "Alterar senha"
- Histórico de partidas com performance individual

---

## 8. COMPONENTE — Modal de Configuração de Pesos

Este é o componente mais importante desta atualização.

```tsx
// src/components/WeightConfigModal.tsx

// Visual:
// - Modal overlay escuro com card central
// - Título: "CONFIGURAR PESOS DO RANKING"
// - 3 sliders, um por categoria:
//   ⚔️ COMBATE     [slider 0–100]  [valor%]
//   🎯 DUELOS      [slider 0–100]  [valor%]
//   💣 UTILITY     [slider 0–100]  [valor%]
//
// - Indicador de total: "TOTAL: 100%" (verde) ou "TOTAL: 95%" (vermelho, bloqueado)
// - Os 3 sliders são interdependentes:
//   quando um muda, o sistema redistribui o restante entre os outros dois proporcionalmente
// - Botão SALVAR só ativo quando total == 100%
// - Ao salvar: PUT /api/ranking/config → ranking recarrega automaticamente

// Lógica dos sliders interdependentes:
function handleSliderChange(category: 'combat' | 'duel' | 'utility', newValue: number) {
  const remaining = 100 - newValue
  const otherTwo = ['combat', 'duel', 'utility'].filter(c => c !== category)
  const currentSum = weights[otherTwo[0]] + weights[otherTwo[1]]

  if (currentSum === 0) {
    // distribuir igualmente
    setWeights({ ...weights, [category]: newValue, [otherTwo[0]]: remaining/2, [otherTwo[1]]: remaining/2 })
  } else {
    // manter proporção entre os outros dois
    const ratio = weights[otherTwo[0]] / currentSum
    setWeights({
      ...weights,
      [category]: newValue,
      [otherTwo[0]]: Math.round(remaining * ratio),
      [otherTwo[1]]: Math.round(remaining * (1 - ratio))
    })
  }
}

// Estilo dos sliders:
// Aparência custom via CSS — trilho vermelho, thumb quadrado (não circular)
// Combina com o visual CS2 do projeto
```

---

## 9. ATUALIZAR O `CLAUDE.md` DO PROJETO

Adicionar ao final do CLAUDE.md existente:

```markdown
## Auth (adicionado em Prompt #2)
- JWT com python-jose + passlib[bcrypt]
- Roles: 'admin' (gestor) | 'viewer' (player comum)
- Dependências FastAPI: get_current_player, require_admin (em auth.py)
- Token armazenado no localStorage do browser
- Rotas públicas: GET /ranking, GET /players, GET /matches, GET /sort-teams
- Rotas admin: POST /matches, POST /players, PUT /ranking/config

## Configuração de pesos (adicionado em Prompt #2)
- Tabela ranking_config (singleton — sempre 1 linha)
- Pesos lidos do banco a cada cálculo de ranking (não hardcodados)
- Frontend: WeightConfigModal com sliders interdependentes
- Validação: soma deve ser exatamente 1.0 (backend + frontend)

## Páginas (estado atual)
- /login        → pública
- /             → pública (dashboard + ranking)
- /profile      → autenticada (qualquer role)
- /matches/new  → admin only
- /admin        → admin only
- /sort         → pública
```

---

## 10. ORDEM DE IMPLEMENTAÇÃO

1. `backend/models.py` — adicionar campos `password_hash`, `role`, `is_active` em Player + criar model `RankingConfig`
2. `backend/auth.py` — funções JWT, `get_current_player`, `require_admin`
3. `backend/seed.py` — criar admin inicial, rodar
4. `backend/main.py` — proteger rotas existentes, adicionar `/api/auth/*` e `/api/ranking/config`
5. `backend/ranking.py` — buscar pesos do banco em vez de hardcodar
6. Frontend: `AuthContext.tsx` + atualizar `api/client.ts`
7. Frontend: `ProtectedRoute.tsx` + `AdminRoute.tsx`
8. Frontend: página `/login`
9. Frontend: `WeightConfigModal.tsx` (sliders interdependentes)
10. Frontend: atualizar header do Dashboard (avatar, badge, botão config)
11. Frontend: página `/profile`
12. Frontend: página `/admin`
13. Atualizar `CLAUDE.md`
```
