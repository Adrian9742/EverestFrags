"""
Router — estatísticas consolidadas do grupo

GET /api/stats/group-averages → público, médias da EverestFrags (não por jogador)
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.ranking import GroupAveragesResponse
from app.services.ranking_service import get_group_averages

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/group-averages", response_model=GroupAveragesResponse)
def group_averages(db: Session = Depends(get_db)):
    """
    Média de cada métrica (kills, deaths, ADR, etc.) entre todas as linhas de
    player_match_stats — um número só representando o grupo todo, não por
    jogador. Ver docstring de ranking_service.get_group_averages.
    """
    return get_group_averages(db)
