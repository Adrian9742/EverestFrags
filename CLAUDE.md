# EverestFrags — CS2 Mix Squad Tracker
## Documentação técnica completa para o dev

---

## O que é este projeto

Sistema web fullstack para rastrear estatísticas e gerar rankings de um grupo fixo de ~15 amigos que jogam CS2 ("mix"). Permite:

1. Registrar partidas manualmente com dados do scope.gg
2. Calcular um ranking consolidado com score único por jogador (0–100)
3. Sortear times equilibrados com Snake Draft baseado no ranking
4. Configurar dinamicamente os pesos das categorias de score (admin)
5. Autenticação com dois níveis: `admin` (gestor) e `viewer` (player)

---

## Stack

```
Backend:  FastAPI (Python 3.11+) + PostgreSQL + SQLAlchemy 2.0
Frontend: React 18 + TypeScript + Vite + CSS custom properties (sem Tailwind)
Auth:     JWT com python-jose + bcrypt (passlib)
Deploy:   Render (backend + banco PostgreSQL) + Vercel (frontend)
```

---

## Estrutura de pastas

```
EverestFrags/
├── backend/
│   ├── main.py                  ← FastAPI app, CORS, routers, create_all()
│   ├── seed.py                  ← Popula banco com admin + players + partidas de exemplo
│   ├── .env                     ← Variáveis de ambiente (não commitar)
│   ├── .env.example             ← Template do .env
│   ├── requirements.txt
│   └── app/
│       ├── database.py          ← Engine SQLAlchemy, SessionLocal, get_db()
│       ├── models/
│       │   ├── player.py        ← Model Player (com campos de auth)
│       │   ├── match.py         ← Models Match + PlayerMatchStats
│       │   └── ranking_config.py← Model RankingConfig (singleton de pesos)
│       ├── schemas/
│       │   ├── player.py        ← PlayerCreate, PlayerUpdate, PlayerPublic, PlayerResponse
│       │   ├── match.py         ← MatchCreate, MatchDetailResponse, PaginatedMatchResponse
│       │   ├── auth.py          ← LoginRequest, TokenResponse, PasswordChange
│       │   ├── ranking.py       ← RankingEntry, RankingConfigUpdate (valida soma = 1.0)
│       │   └── sort.py          ← SortTeamsResponse, TeamResult
│       ├── services/
│       │   ├── auth_service.py  ← JWT, bcrypt, get_current_player, require_admin
│       │   ├── player_service.py← CRUD players, authenticate(), change_password()
│       │   ├── match_service.py ← CRUD matches + stats (transação única)
│       │   ├── ranking_service.py← Fórmula min-max + pesos do banco
│       │   └── sort_service.py  ← Algoritmo Snake Draft
│       └── routers/
│           ├── auth.py          ← POST /api/auth/login, GET /me, POST /change-password
│           ├── players.py       ← GET/POST /api/players, GET /api/players/{id}/stats
│           ├── matches.py       ← GET/POST /api/matches, DELETE /api/matches/{id}
│           ├── ranking.py       ← GET /api/ranking, GET/PUT /api/ranking/config
│           └── sort.py          ← GET /api/sort-teams
│
├── frontend/
│   ├── index.html               ← HTML base com fontes Google (Barlow Condensed, Inter, JetBrains Mono)
│   ├── .env                     ← VITE_API_URL vazio em dev (usa proxy Vite → 8001)
│   ├── .env.production          ← VITE_API_URL=https://SEU-APP.onrender.com (preencher no Vercel)
│   ├── vite.config.ts           ← Proxy /api → localhost:8001 (sem strip de path)
│   └── src/
│       ├── main.tsx             ← Entry point React
│       ├── App.tsx              ← Roteamento (react-router-dom v6)
│       ├── index.css            ← Design system: reset, ef-slider, efShake, scanlines
│       ├── vite-env.d.ts        ← Referência de tipos Vite (import.meta.env)
│       ├── api/
│       │   └── client.ts        ← Fetch wrapper tipado: injeta token, trata 401, todas as interfaces
│       ├── context/
│       │   └── AuthContext.tsx  ← Estado global de auth, login(), logout()
│       ├── components/
│       │   ├── ProtectedRoute.tsx  ← ProtectedRoute + AdminRoute para react-router
│       │   ├── RadarChart.tsx   ← SVG hexagonal puro, 6 eixos, sem biblioteca
│       │   ├── CategoryBar.tsx  ← Barra de progresso por categoria (Combate/Duelos/Utility)
│       │   ├── PodiumCard.tsx   ← Card grande para top 3 (com radar + barras + pills)
│       │   ├── RankCard.tsx     ← Card médio (4–11) e compacto (12+)
│       │   └── WeightConfigModal.tsx ← Modal com sliders interdependentes para pesos
│       └── pages/
│           ├── Login.tsx        ← Tela de login com crosshair CS2
│           ├── Dashboard.tsx    ← Ranking completo: pódio + grade + lista compacta
│           ├── Matches.tsx      ← Histórico paginado + delete (admin)
│           ├── AddMatch.tsx     ← Formulário de nova partida (tabela com todas as métricas)
│           └── Sort.tsx         ← Sorteio de times com checkboxes + resultado
│
└── Everest Frags rebrand/       ← Referências de design (NÃO é código de produção)
    ├── EverestFrags Dashboard.dc.html ← Protótipo interativo Declutter (referência visual)
    ├── screenshots/             ← Prints do design finalizado
    └── uploads/
        ├── EverestFrags-prompt-claude-code.md  ← Spec original do projeto
        └── FRAGSTACK-prompt-complementar-2.md  ← Spec do sistema de auth + pesos dinâmicos
```

---

## Banco de dados

### Tabelas

```sql
-- Jogadores (são também os usuários do sistema)
players:
  id, nickname (unique), steam_id?, avatar_initials,
  password_hash?, role ('admin'|'viewer'), is_active, created_at

-- Partidas
matches:
  id, scope_url?, played_at (date), map_name?, notes?, created_at

-- Stats de cada jogador em cada partida (15 métricas)
player_match_stats:
  id, player_id (FK), match_id (FK),
  -- Combate (peso 50%)
  kills, deaths, assists, damage_total, adr, adr_difference, hltv_rating, kast_percent,
  -- Duelos (peso 30%)
  opening_kills, trade_kills, time_to_kill_ms,
  -- Utility (peso 20%)
  flash_assists, grenade_damage, he_enemies_hit, fire_enemies_hit,
  UNIQUE(player_id, match_id)

-- Configuração de pesos do ranking (sempre 1 linha — singleton)
ranking_config:
  id, weight_combat, weight_duel, weight_utility, updated_at, updated_by (FK player)
```

### Criação das tabelas

**Sem Alembic** por enquanto — `Base.metadata.create_all()` roda no startup da API (`main.py`).
Para o primeiro uso, rodar `python seed.py` que cria as tabelas + dados de exemplo.

> Quando o projeto crescer e precisar de migrações incrementais (adicionar colunas, índices),
> o próximo passo é configurar Alembic: `alembic init alembic` + `alembic revision --autogenerate`.

---

## Fórmula do Score (implementada em `ranking_service.py`)

### Passo 1 — Agrega métricas por jogador (todas as partidas)

| Tipo | Métricas |
|------|----------|
| **SOMA** | kills, deaths, assists, damage_total, opening_kills, trade_kills, flash_assists, grenade_damage, he_enemies_hit, fire_enemies_hit |
| **MÉDIA** | adr, adr_difference, hltv_rating, kast_percent, time_to_kill_ms |

### Passo 2 — Normalização min-max (0–100) dentro do grupo

```
score(jogador, M) = (valor - min(M)) / (max(M) - min(M)) * 100
```

Métricas **invertidas** (menor é melhor): `deaths`, `time_to_kill_ms`

```
score(jogador, M) = (max(M) - valor) / (max(M) - min(M)) * 100
```

Se todos têm o mesmo valor → score = 50 para todos.

### Passo 3 — Score por categoria (média das métricas normalizadas)

| Categoria | Peso padrão | Métricas |
|-----------|-------------|---------|
| Combate | 50% | kills, deaths, assists, damage_total, adr, adr_difference, hltv_rating, kast_percent, grenade_damage |
| Duelos | 30% | opening_kills, trade_kills, time_to_kill_ms |
| Utility | 20% | flash_assists, grenade_damage, he_enemies_hit, fire_enemies_hit |

### Passo 4 — Score final

```
score_final = (score_combate × w_combat) + (score_duelo × w_duel) + (score_utility × w_utility)
```

Os pesos são lidos da tabela `ranking_config` a cada cálculo. **Nunca hardcodados.**

---

## Algoritmo de Sorteio (Snake Draft — `sort_service.py`)

1. Ordena jogadores por `score_final` DESC
2. Distribui em serpentina entre N times:
   - Rodada ímpar: T1 ← 1º, T2 ← 2º, T3 ← 3º
   - Rodada par: T3 ← 4º, T2 ← 5º, T1 ← 6º (ordem invertida)
3. Repete até distribuir todos

Resultado: diferença de score total entre times minimizada sem força-bruta.

---

## Auth (JWT)

```
POST /api/auth/login          → público, retorna JWT (8h) + dados do player
POST /api/auth/logout         → stateless, instrui frontend a limpar token
GET  /api/auth/me             → autenticado, valida token e retorna player
POST /api/auth/change-password → autenticado, troca senha com verificação da atual
```

**Token:** armazenado em `localStorage` (`ef_token`). O `api/client.ts` injeta `Authorization: Bearer <token>` automaticamente em toda requisição.

**Rotas públicas** (sem token): `GET /api/ranking`, `/api/players`, `/api/matches`, `/api/sort-teams`

**Rotas admin:** `POST /api/players`, `PATCH /api/players/{id}`, `POST /api/matches`, `DELETE /api/matches/{id}`, `GET/PUT /api/ranking/config`

---

## Identidade Visual

| Token | Valor |
|-------|-------|
| Fundo principal | `#080808` |
| Cor primária (ação) | `#cc2200` (vermelho) |
| Cor secundária | `#7c3aed` (roxo) |
| Acento (utility/ouro) | `#e0a82e` (dourado) |
| Cards | `#0d0d0d` / `#0a0a0a` |
| Bordas | `#1c1c1c` / `#1f1f1f` |
| Texto principal | `#f4f4f4` |
| Texto secundário | `#9a9a9a` |
| Fonte display | Barlow Condensed (títulos, scores, nomes) |
| Fonte corpo | Inter (labels, textos corridos) |
| Fonte dados | JetBrains Mono (números, stats, código) |
| Efeito | Scanlines via `repeating-linear-gradient` |

Sem Tailwind. Sem border-radius excessivo. Sem emojis na UI. Estética FPS/militar.

---

## Como rodar localmente

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- PostgreSQL rodando (local ou Docker)

### Backend

```bash
cd backend

# 1. Copiar e preencher o .env
cp .env.example .env
# Editar .env com suas credenciais do PostgreSQL

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Criar tabelas + seed de exemplo
python seed.py

# 4. Subir o servidor
uvicorn main:app --reload --port 8001
# Docs interativas: http://localhost:8001/docs
```

### Frontend

```bash
cd frontend

npm install
npm run dev
# Abre em http://localhost:5173
# Proxy: /api/* → localhost:8001 (configurado em vite.config.ts)
```

### Login de teste (criado pelo seed.py)

```
Nickname: admin
Senha:    fragstack2025   ← TROCAR após o primeiro login!
```

Players de exemplo têm senha `player123`.

---

## Deploy

### Backend — Render

1. Criar novo **Web Service** no Render apontando para a pasta `backend/`
2. Render detecta `requirements.txt` automaticamente
3. **Build Command:** `pip install -r requirements.txt`
4. **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Criar um **PostgreSQL** no Render e copiar a `DATABASE_URL` para as env vars do serviço
6. Adicionar as demais env vars: `SECRET_KEY` (gerar uma string aleatória forte), `ALGORITHM=HS256`, `ACCESS_TOKEN_EXPIRE_MINUTES=480`
7. No primeiro deploy, rodar `python seed.py` via **Shell** do Render

### Frontend — Vercel

1. Importar o repositório no Vercel apontando para a pasta `frontend/`
2. Framework: **Vite**
3. Adicionar env var: `VITE_API_URL=https://SEU-APP.onrender.com`
4. Deploy automático a cada push

---

## Bugs encontrados e corrigidos durante o desenvolvimento

### Bug 1 — Models com campos errados
A primeira versão tinha `name` em vez de `nickname` no Player, e o model `MatchPlayer`
com apenas `kills/deaths/assists/adr/hs_percentage/mvps/score`.
Isso tornava impossível calcular a fórmula de score por categoria (faltavam `hltv_rating`,
`kast_percent`, `opening_kills`, `trade_kills`, `time_to_kill_ms`, etc.).
**Fix:** Modelos reconstruídos do zero seguindo o spec original.

### Bug 2 — Tabela `users` separada de `players`
A primeira versão tinha um model `User` separado. No spec, o Player É o usuário —
tem `password_hash`, `role` e `is_active` diretamente. Tabela duplicada quebraria a lógica de auth.
**Fix:** Campos de auth movidos para o model `Player`. Tabela `users` removida.

### Bug 3 — Models `Team` e `TeamMember` que não existiam no spec
A primeira versão criou tabelas `teams` e `team_members`. No projeto, times não são
persistidos — o sorteio é um endpoint stateless (Snake Draft em memória).
**Fix:** Models removidos. Sorteio feito em `sort_service.py` sem escrita no banco.

### Bug 4 — `@validator` (Pydantic v1) em vez de `@model_validator` (Pydantic v2)
O segundo prompt do projeto usava sintaxe Pydantic v1 para validar que os pesos somam 1.0.
**Fix:** Usado `@model_validator(mode="after")` conforme Pydantic v2.

### Bug 5 — `import Field` faltando em `schemas/ranking.py`
`RankingConfigUpdate` usava `Field(...)` sem importar `Field` do pydantic.
**Fix:** Adicionado `Field` no import.

### Bug 6 — `index.css` do projeto errado
O arquivo `index.css` era do projeto FlameOS (glassmorphism, fundo `#0a0d13`, laranja `#f97316`).
**Fix:** Reescrito com o design system do EverestFrags.

### Bug 7 — Proxy do Vite removendo `/api` das rotas
`vite.config.ts` tinha `rewrite: path => path.replace(/^\/api/, '')` que removia o prefixo
`/api` antes de repassar para o backend. Como todas as rotas do FastAPI têm `/api`, isso
quebrava 100% das chamadas em desenvolvimento.
**Fix:** Rewrite removido. Proxy passa o path inteiro.

### Bug 8 — `BASE_URL` hardcodado para `localhost:8000`
`api/client.ts` defaultava `BASE_URL` para `"http://localhost:8000"` mesmo em dev,
bypassando o proxy do Vite e causando erros de CORS.
**Fix:** Default alterado para `""` (string vazia). Em dev usa proxy; em prod usa `VITE_API_URL`.

### Bug 9 — `.env.example` com encoding Windows-1252
O arquivo `.env.example` tinha comentários em português com caracteres acentuados salvos
em Latin-1/Windows-1252. O psycopg2 falhava ao ler o arquivo com `UnicodeDecodeError`.
**Fix:** `.env` recriado com conteúdo ASCII puro via PowerShell `-Encoding utf8`.

### Bug 10 — `vite-env.d.ts` ausente
Sem esse arquivo, o TypeScript não reconhece `import.meta.env` e gera erro
`Property 'env' does not exist on type 'ImportMeta'`.
**Fix:** Criado `src/vite-env.d.ts` com `/// <reference types="vite/client" />`.

---

## Próximos passos

- [ ] Deploy no Render + Vercel
- [ ] Testar todos os endpoints no Insomnia (etapa 5.6 do workflow) após deploy
- [ ] Trocar senha do admin após primeiro login
- [ ] Página `/profile` — stats pessoais + posição no ranking + histórico de partidas
- [ ] Página `/admin` — painel do gestor: gerenciar players, roles e partidas
- [ ] Integração futura com scope.gg via `awpy` (parser de demos .dem do CS2)
- [ ] Configurar Alembic para migrações incrementais quando o schema precisar evoluir
