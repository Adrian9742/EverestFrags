"""
EverestFrags — entrada principal da aplicação FastAPI

Responsabilidades:
  - Cria a instância FastAPI com metadados (título, versão, docs)
  - Configura CORS para aceitar requisições do frontend (localhost:5173 em dev)
  - Registra todos os routers
  - Cria as tabelas no banco ao iniciar (create_all) — sem Alembic

NOTA: create_all() cria as tabelas se não existirem. Não altera tabelas existentes.
Para alterações de schema em produção, usar Alembic migrations.

Rotas públicas (sem token):
  GET  /api/ranking
  GET  /api/players
  GET  /api/matches
  GET  /api/sort-teams

Rotas autenticadas (qualquer player logado):
  GET  /api/auth/me
  GET  /api/players/{id}/stats
  POST /api/auth/change-password

Rotas de admin:
  POST /api/players
  PATCH /api/players/{id}
  POST /api/matches
  DELETE /api/matches/{id}
  GET  /api/ranking/config
  PUT  /api/ranking/config
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth, players, matches, ranking, sort

# Importa todos os models para garantir que o create_all os detecte
import app.models  # noqa: F401

app = FastAPI(
    title="EverestFrags API",
    description="CS2 Mix Squad Tracker — ranking, partidas e sorteio de times",
    version="1.0.0",
)

# CORS — em produção, substituir pelo domínio real do frontend (Vercel)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:4173",   # Vite preview
        "https://everestfrags.vercel.app",  # produção (ajustar conforme necessário)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra todos os routers
app.include_router(auth.router)
app.include_router(players.router)
app.include_router(matches.router)
app.include_router(ranking.router)
app.include_router(sort.router)


@app.on_event("startup")
def create_tables():
    """
    Cria todas as tabelas definidas nos models se não existirem.
    Equivalente a 'alembic upgrade head' para a migração inicial.
    """
    Base.metadata.create_all(bind=engine)


@app.get("/")
def health():
    """Health check — confirma que a API está no ar."""
    return {"status": "ok", "service": "EverestFrags API v1.0.0"}
