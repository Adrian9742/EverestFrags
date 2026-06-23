"""
Router — sorteio de times

GET /api/sort-teams?players=1,2,3,4&teams=2 → público, retorna times balanceados

Query params:
  players → IDs separados por vírgula (ex: "1,2,3,4,5,6")
  teams   → número de times (2 ou 3, padrão 2)
"""

from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.sort import SortTeamsResponse
from app.services.sort_service import sort_teams

router = APIRouter(prefix="/api", tags=["sort"])


@router.get("/sort-teams", response_model=SortTeamsResponse)
def sort(
    players: str = Query(..., description="IDs dos jogadores separados por vírgula: '1,2,3,4'"),
    teams: int = Query(2, ge=2, le=3, description="Número de times (2 ou 3)"),
    db: Session = Depends(get_db),
):
    """
    Sorteia times equilibrados usando Snake Draft.
    Retorna a lista de times, score total de cada um e a diferença entre o mais forte e o mais fraco.
    """
    try:
        player_ids = [int(p.strip()) for p in players.split(",") if p.strip()]
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Formato inválido para 'players'. Use IDs inteiros separados por vírgula.",
        )

    if not player_ids:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Nenhum jogador informado",
        )

    return sort_teams(db, player_ids, n_teams=teams)
