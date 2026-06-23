# EverestFrags — CS2 Mix Squad Tracker
## Prompt Completo para Claude Code

---

## CONTEXTO DO PROJETO

Você vai construir o **EverestFrags**, um sistema web fullstack para rastrear estatísticas e gerar rankings dos jogadores de um grupo fixo de ~15 amigos que jogam CS2 juntos ("mix"). O sistema deve:

1. Calcular um **ranking consolidado** com score único por jogador (0–100)
2. Permitir **adicionar partidas manualmente** com dados do scope.gg
3. Ter uma tela de **sorteio de times equilibrados** baseada no ranking
4. Rodar num **servidor sempre online** (Railway/Render + Vercel)

---

## STACK

```
Backend:  FastAPI (Python 3.11+) + PostgreSQL + SQLAlchemy
Frontend: React 18 + TypeScript + Vite + CSS custom properties (sem Tailwind)
Deploy:   Render (backend) + Vercel (frontend)
Auth:     Nenhuma por ora — sistema interno do grupo
```

---

## IDENTIDADE VISUAL

- **Paleta:** Preto puro `#080808` como fundo, vermelho `#cc2200` como cor primária de ação, roxo `#7c3aed` como cor secundária, cinza escuro `#111111` para cards
- **Tipografia:** Barlow Condensed (display/títulos) + Inter (corpo) + JetBrains Mono (números/dados)
- **Tom:** Interface de FPS — minimalista, densa, técnica. Sem gradientes coloridos, sem bordas arredondadas excessivas, sem emojis na UI
- **Textura:** Scanlines sutis no fundo via CSS `repeating-linear-gradient`
- **Nome:** EverestFrags

---

## FÓRMULA DO SCORE (IMPLEMENTAR EXATAMENTE ASSIM)

### Passo 1 — Normalização min-max por métrica

Para cada métrica M, normaliza o valor de cada jogador relativo ao grupo:

```
score_normalizado(jogador, M) = (valor(jogador, M) - min(M)) / (max(M) - min(M)) * 100
```

Para métricas onde MENOR é melhor (Mortes, TTK):
```
score_normalizado(jogador, M) = (max(M) - valor(jogador, M)) / (max(M) - min(M)) * 100
```

Se todos os jogadores têm o mesmo valor numa métrica → score = 50 para todos.

### Passo 2 — Score por categoria (média das métricas da categoria)

**Combate (peso 50%)** — média de:
- Kills (normalizado)
- Mortes (invertido)
- Assistências (normalizado)
- Dano Total (normalizado)
- ADR (normalizado)
- ADR Difference (normalizado)
- HLTV Rating (normalizado)
- KAST % (normalizado)
- Grenade Damage (normalizado)

**Duelos (peso 30%)** — média de:
- Opening Kills (normalizado)
- Trade Kills (normalizado)
- Time to Kill / TTK (invertido — menor é melhor)

**Utility (peso 20%)** — média de:
- Impactful Flash Assists (normalizado)
- HE Grenade Damage (normalizado)
- Enemies Damaged with HE (normalizado)
- Enemies Damaged with Fire (normalizado)

### Passo 3 — Score Final

```
score_final = (score_combate * 0.50) + (score_duelo * 0.30) + (score_utility * 0.20)
```

---

## BANCO DE DADOS (PostgreSQL)

```sql
-- Jogadores do grupo
CREATE TABLE players (
  id         SERIAL PRIMARY KEY,
  nickname   VARCHAR(50) UNIQUE NOT NULL,
  steam_id   VARCHAR(20),           -- opcional, para integração futura
  avatar_initials VARCHAR(2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Partidas registradas
CREATE TABLE matches (
  id         SERIAL PRIMARY KEY,
  scope_url  TEXT,                  -- URL do scope.gg para referência
  played_at  DATE NOT NULL,
  map_name   VARCHAR(50),
  notes      TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Stats de cada jogador por partida
CREATE TABLE player_match_stats (
  id               SERIAL PRIMARY KEY,
  player_id        INTEGER REFERENCES players(id) ON DELETE CASCADE,
  match_id         INTEGER REFERENCES matches(id) ON DELETE CASCADE,

  -- Combate básico
  kills            INTEGER DEFAULT 0,
  deaths           INTEGER DEFAULT 0,
  assists          INTEGER DEFAULT 0,
  damage_total     INTEGER DEFAULT 0,
  adr              NUMERIC(6,2) DEFAULT 0,
  adr_difference   NUMERIC(6,2) DEFAULT 0,
  hltv_rating      NUMERIC(5,3) DEFAULT 0,
  kast_percent     NUMERIC(5,2) DEFAULT 0,

  -- Duelos
  opening_kills    INTEGER DEFAULT 0,
  trade_kills      INTEGER DEFAULT 0,
  time_to_kill_ms  INTEGER DEFAULT 0,    -- em milissegundos

  -- Utility
  flash_assists    INTEGER DEFAULT 0,
  grenade_damage   INTEGER DEFAULT 0,
  he_enemies_hit   INTEGER DEFAULT 0,
  fire_enemies_hit INTEGER DEFAULT 0,

  UNIQUE(player_id, match_id)
);

-- View materializada do ranking (recalculada a cada partida adicionada)
-- Implementar como função Python no backend, não view SQL
```

---

## ENDPOINTS FASTAPI

```
GET  /api/ranking              → ranking consolidado de todos os jogadores
GET  /api/players              → lista de jogadores cadastrados
POST /api/players              → cadastrar novo jogador
GET  /api/matches              → histórico de partidas
POST /api/matches              → adicionar nova partida com stats dos jogadores
GET  /api/matches/{id}         → detalhes de uma partida
GET  /api/players/{id}/stats   → stats consolidados de um jogador
GET  /api/sort-teams           → sugestão de times equilibrados (algoritmo de balanceamento)
```

### Lógica do `/api/ranking`

1. Busca todas as `player_match_stats` de todas as partidas
2. Agrega por jogador (soma ou média, dependendo da métrica — ver abaixo)
3. Aplica normalização min-max no grupo
4. Calcula score_combate, score_duelo, score_utility
5. Calcula score_final
6. Retorna ordenado por score_final DESC

**Agregação das métricas por jogador (múltiplas partidas):**
- Kills, Deaths, Assists, Damage, Opening Kills, Trade Kills, Flash Assists, Grenade DMG, HE Enemies Hit, Fire Enemies Hit → **SOMA** de todas as partidas
- ADR, ADR Diff, HLTV Rating, KAST %, TTK → **MÉDIA** de todas as partidas

---

## ALGORITMO DE SORTEIO DE TIMES

Endpoint `GET /api/sort-teams?players=id1,id2,...&teams=2`

```python
def balance_teams(player_scores: list[tuple[str, float]], n_teams: int) -> list[list[str]]:
    """
    Distribui jogadores em n_teams de forma que a diferença de score
    total entre os times seja mínima.
    
    Algoritmo: Snake Draft
    - Ordena jogadores por score DESC
    - Distribui em serpentina: time1 pega o 1º, time2 o 2º, ..., time_n o nº,
      time_n pega o (n+1)º, time_(n-1) o (n+2)º, ... (inverte a ordem)
    - Repete até distribuir todos
    
    Para 15 jogadores em 3 times de 5:
    Rodada 1: T1←1º, T2←2º, T3←3º
    Rodada 2: T3←4º, T2←5º, T1←6º
    Rodada 3: T1←7º, T2←8º, T3←9º
    ... e assim por diante
    """
```

---

## FRONTEND — PÁGINAS

### `/` — Dashboard / Ranking

Exibe:
- Header com nome EverestFrags, total de partidas, total de players, chips de peso (50/30/20)
- Pódio top 3: cards grandes com radar SVG hexagonal (6 eixos: ADR, KAST, Rating, Open K, Trade, Util), barras por categoria, pills de stats
- Grid 4x2 para posições 4–11: card médio com barra de score e 3 barras de categoria
- Lista compacta para posições 12–15
- Footer com legenda das categorias

### `/matches` — Histórico de Partidas

- Tabela com data, mapa, players, URL scope.gg
- Botão "Adicionar Partida"

### `/matches/new` — Adicionar Partida

- Campo URL scope.gg (apenas para referência)
- Campo data e mapa
- Tabela de entrada: uma linha por jogador, colunas = todas as métricas
- Validação client-side antes de enviar
- Ao salvar: POST /api/matches, redireciona para /

### `/sort` — Sorteio de Times

- Checkbox para selecionar quais dos 15 jogadores estão presentes
- Slider para escolher número de times (2 ou 3)
- Botão "Sortear"
- Resultado: cards por time com lista de jogadores, score total do time, diferença entre times

---

## ARQUIVOS A CRIAR

```
everestfrags/
├── backend/
│   ├── main.py              # FastAPI app, CORS, rotas
│   ├── database.py          # SQLAlchemy engine, session
│   ├── models.py            # ORM models
│   ├── schemas.py           # Pydantic schemas
│   ├── ranking.py           # Lógica de cálculo do score (min-max + pesos)
│   ├── sorteio.py           # Algoritmo snake draft
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── styles/
│   │   │   └── globals.css  # CSS custom properties, reset, tipografia
│   │   ├── components/
│   │   │   ├── PodiumCard.tsx
│   │   │   ├── RankCard.tsx
│   │   │   ├── RadarChart.tsx   # SVG hexagonal puro, sem biblioteca
│   │   │   ├── CategoryBar.tsx
│   │   │   └── TeamCard.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Matches.tsx
│   │   │   ├── AddMatch.tsx
│   │   │   └── Sort.tsx
│   │   └── api/
│   │       └── client.ts    # fetch wrapper tipado
│   ├── package.json
│   └── vite.config.ts
│
├── CLAUDE.md                # contexto do projeto para próximas sessões
└── README.md
```

---

## INTEGRAÇÃO FUTURA COM SCOPE.GG (não implementar agora, documentar)

O scope.gg não tem API pública. A integração possível é via:

1. **Steam Web API** — dados básicos (kills, deaths) via `ISteamUserStats` com Steam ID público
2. **Parsing de demo** — o scope.gg analisa arquivos `.dem` do CS2; poderíamos fazer o mesmo com bibliotecas Python como `awpy` (https://github.com/pnxenopoulos/awpy)
3. **Entrada manual** — solução atual e mais confiável para o escopo do projeto

Documentar no README como adicionar integração futura via `awpy`.

---

## CLAUDE.md (gerar este arquivo ao final)

```markdown
# EverestFrags — CS2 Mix Squad Tracker

## Stack
- Backend: FastAPI + PostgreSQL + SQLAlchemy (backend/)
- Frontend: React 18 + TypeScript + Vite (frontend/)
- CSS: custom properties puras, sem Tailwind

## Identidade visual
- Fundo: #080808, Primário: #cc2200 (vermelho), Secundário: #7c3aed (roxo)
- Fontes: Barlow Condensed (display), Inter (corpo), JetBrains Mono (mono)
- Sem border-radius excessivo, scanlines sutis no background

## Fórmula do score
- Normalização min-max por métrica dentro do grupo
- Score Combate (50%) + Score Duelos (30%) + Score Utility (20%)
- Ver ranking.py para implementação completa

## Banco
- players, matches, player_match_stats
- Ranking calculado em runtime pelo backend, não salvo em tabela

## Sorteio de times
- Algoritmo Snake Draft em sorteio.py
- Endpoint: GET /api/sort-teams?players=ids&teams=2

## Como rodar local
cd backend && uvicorn main:app --reload
cd frontend && npm run dev
```

---

## ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

1. `database.py` + `models.py` — estrutura do banco
2. `ranking.py` — lógica de score (testar com dados mockados)
3. `main.py` — endpoints FastAPI com dados mockados primeiro
4. Frontend: `globals.css` com tokens visuais
5. Frontend: componentes base (CategoryBar, RadarChart SVG)
6. Frontend: página Dashboard com dados hardcoded para validar visual
7. Conectar frontend ao backend real
8. Página AddMatch com formulário completo
9. Página Sort com snake draft
10. Deploy: Render (backend) + Vercel (frontend)
```
