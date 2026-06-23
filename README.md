# EVERESTFRAGS

> **CS2 Mix Squad Tracker** — sistema de ranking e sorteio de times para grupos de amigos que jogam Counter-Strike 2.

---

## Objetivo

O EverestFrags nasceu de uma necessidade real: um grupo fixo de amigos joga mixes de CS2 com frequência, mas não tinha como medir quem estava evoluindo, quem contribuía mais, ou como dividir os times de forma justa para um 5x5 equilibrado.

O sistema resolve dois problemas principais:

1. **Ranking consolidado** — cada partida jogada alimenta um score por jogador, calculado a partir de 15 métricas reais do jogo (kills, ADR, HLTV Rating, opening kills, flash assists, etc.). O ranking mostra quem são os melhores do grupo de forma objetiva e transparente.

2. **Sorteio equilibrado** — com o ranking calculado, o sistema usa Snake Draft para distribuir os jogadores entre dois ou três times, minimizando a diferença de skill total. Chega de times desequilibrados.

---

## Funcionalidades

- Login com Steam (OAuth OpenID) — sem precisar criar senha
- Login com nickname + senha para o gestor (admin)
- Dashboard com pódio top-3, ranking completo e scores por categoria
- Registro de partidas com todas as métricas do scope.gg
- Histórico paginado de partidas com detalhe por jogador
- Sorteio de times equilibrados com Snake Draft baseado no ranking
- Configuração dinâmica dos pesos do score (Combate / Duelos / Utility)

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | FastAPI (Python 3.11+) |
| Banco | PostgreSQL + SQLAlchemy 2.0 |
| Auth | JWT (python-jose) + bcrypt + Steam OpenID |
| Frontend | React 18 + TypeScript + Vite |
| Deploy | Render (backend + banco) + Vercel (frontend) |

---

## Como rodar localmente

### Backend

```bash
cd backend
cp .env.example .env        # preencher DATABASE_URL, SECRET_KEY, STEAM_API_KEY
pip install -r requirements.txt
python seed.py              # cria tabelas + dados de exemplo
uvicorn main:app --reload --port 8001
```

Docs: `http://localhost:8001/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre em `http://localhost:5173` — já configurado para fazer proxy das chamadas `/api/*` para o backend na porta 8001.

### Login de admin (criado pelo seed)

```
Nickname: admin
Senha:    fragstack2025   <- trocar apos o primeiro login
```

---

## Documentacao tecnica

Ver [CLAUDE.md](./CLAUDE.md) — arquitetura completa, formula do score, algoritmo de sorteio, bugs documentados e instrucoes de deploy.

---

## Licenca

Projeto privado do grupo Everest Frags. Uso interno.
