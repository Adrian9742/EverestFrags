"""
Model ORM — tabela 'ranking_config'

Tabela singleton (sempre exatamente 1 linha). Armazena os pesos das três categorias
do score. O seed.py cria a linha inicial com os pesos padrão (50/30/20).

Os pesos são lidos a cada cálculo do ranking — nunca hardcodados no ranking_service.
Apenas admins podem alterar via PUT /api/ranking/config.

CONSTRAINT implícita: weight_combat + weight_duel + weight_utility deve ser exatamente 1.0.
A validação é feita no schema Pydantic (RankingConfigUpdate), não no banco.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.database import Base


class RankingConfig(Base):
    __tablename__ = "ranking_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Peso da categoria Combate (kills, deaths, assists, ADR, rating, KAST, etc.)
    weight_combat: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False, default=0.50)

    # Peso da categoria Duelos (opening kills, trade kills, TTK)
    weight_duel: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False, default=0.30)

    # Peso da categoria Utility (flash assists, grenade/HE/fire damage)
    weight_utility: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False, default=0.20)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Qual admin fez a última alteração — nullable pois a linha inicial não tem autor
    updated_by: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("players.id", ondelete="SET NULL"), nullable=True
    )

    def __repr__(self) -> str:
        return (
            f"<RankingConfig combat={self.weight_combat} "
            f"duel={self.weight_duel} utility={self.weight_utility}>"
        )
