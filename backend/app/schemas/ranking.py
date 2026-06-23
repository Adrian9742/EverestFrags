"""
Schemas Pydantic — ranking e configuração de pesos

RankingEntry         → uma linha do ranking (GET /api/ranking)
RankingConfigResponse → resposta do GET /api/ranking/config
RankingConfigUpdate  → corpo do PUT /api/ranking/config (admin)

A validação de que os pesos somam 1.0 está no model_validator de RankingConfigUpdate.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, model_validator


class RankingEntry(BaseModel):
    """
    Uma posição no ranking. Contém métricas agregadas de todas as partidas
    e os scores calculados pela fórmula min-max com pesos por categoria.
    """

    rank: int
    player_id: int
    player_nickname: str
    avatar_initials: str
    total_matches: int

    # Métricas brutas agregadas
    kills: int = 0
    deaths: int = 0
    kd_ratio: float = 0.0
    adr: float = 0.0
    hltv_rating: float = 0.0
    kast_percent: float = 0.0

    # Scores por categoria (0–100)
    score_combat: float = 0.0
    score_duel: float = 0.0
    score_utility: float = 0.0

    # Score final ponderado (0–100)
    score_final: float = 0.0


class RankingConfigResponse(BaseModel):
    """Resposta do GET /api/ranking/config."""

    id: int
    weight_combat: float
    weight_duel: float
    weight_utility: float
    updated_at: datetime
    # Nickname de quem fez a última alteração — None se foi o seed inicial
    updated_by_nickname: Optional[str] = None

    model_config = {"from_attributes": True}


class RankingConfigUpdate(BaseModel):
    """
    Corpo do PUT /api/ranking/config.
    Os três pesos devem somar exatamente 1.0 (tolerância de 0.001 para float).

    ATENÇÃO: a versão anterior usava @validator (Pydantic v1). Aqui usamos
    model_validator (Pydantic v2) que é a forma correta para validação entre campos.
    """

    weight_combat: float = Field(..., gt=0.0, le=1.0)
    weight_duel: float = Field(..., gt=0.0, le=1.0)
    weight_utility: float = Field(..., gt=0.0, le=1.0)

    @model_validator(mode="after")
    def soma_deve_ser_um(self) -> "RankingConfigUpdate":
        total = self.weight_combat + self.weight_duel + self.weight_utility
        if abs(total - 1.0) > 0.001:
            raise ValueError(
                f"A soma dos pesos deve ser 1.0. Atual: {total:.4f} "
                f"({self.weight_combat} + {self.weight_duel} + {self.weight_utility})"
            )
        return self
