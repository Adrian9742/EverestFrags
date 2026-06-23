"""
Router — ranking e configuração de pesos

GET /api/ranking          → público, ranking completo ordenado por score_final
GET /api/ranking/config   → admin, configuração atual de pesos
PUT /api/ranking/config   → admin, atualiza pesos (soma deve ser 1.0)
"""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.ranking import RankingEntry, RankingConfigResponse, RankingConfigUpdate
from app.services.auth_service import require_admin
from app.services.ranking_service import get_ranking, get_ranking_config, update_ranking_config
from app.models.player import Player

router = APIRouter(prefix="/api/ranking", tags=["ranking"])


@router.get("", response_model=List[RankingEntry])
def ranking(db: Session = Depends(get_db)):
    """
    Retorna o ranking completo de todos os jogadores com ao menos 1 partida.
    Ordenado por score_final DESC. Inclui scores por categoria e métricas brutas.
    """
    return get_ranking(db)


@router.get("/config", response_model=RankingConfigResponse)
def get_config(
    db: Session = Depends(get_db),
    _: Player = Depends(require_admin),
):
    """Retorna os pesos atuais das categorias. Apenas admins."""
    config = get_ranking_config(db)
    # Busca o nickname de quem atualizou por último
    updated_by_nickname = None
    if config.updated_by:
        updater = db.query(Player).filter(Player.id == config.updated_by).first()
        if updater:
            updated_by_nickname = updater.nickname
    return RankingConfigResponse(
        id=config.id,
        weight_combat=float(config.weight_combat),
        weight_duel=float(config.weight_duel),
        weight_utility=float(config.weight_utility),
        updated_at=config.updated_at,
        updated_by_nickname=updated_by_nickname,
    )


@router.put("/config", response_model=RankingConfigResponse)
def update_config(
    data: RankingConfigUpdate,
    db: Session = Depends(get_db),
    current: Player = Depends(require_admin),
):
    """
    Atualiza os pesos das categorias. Apenas admins.
    O schema RankingConfigUpdate valida que a soma é exatamente 1.0.
    """
    config = update_ranking_config(
        db,
        weight_combat=data.weight_combat,
        weight_duel=data.weight_duel,
        weight_utility=data.weight_utility,
        updated_by=current.id,
    )
    return RankingConfigResponse(
        id=config.id,
        weight_combat=float(config.weight_combat),
        weight_duel=float(config.weight_duel),
        weight_utility=float(config.weight_utility),
        updated_at=config.updated_at,
        updated_by_nickname=current.nickname,
    )
