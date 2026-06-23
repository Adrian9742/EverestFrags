"""
Schemas Pydantic — sorteio de times

SortTeamsRequest  → query params do GET /api/sort-teams
TeamResult        → um time com seus jogadores e score total
SortTeamsResponse → resposta com a lista de times e diferença de score
"""

from typing import List
from pydantic import BaseModel


class PlayerInTeam(BaseModel):
    """Dados do jogador dentro de um time sorteado."""

    player_id: int
    player_nickname: str
    avatar_initials: str
    score_final: float


class TeamResult(BaseModel):
    """Um time com seus jogadores e o score total do time."""

    team_number: int
    players: List[PlayerInTeam]
    total_score: float
    avg_score: float


class SortTeamsResponse(BaseModel):
    """
    Resultado do sorteio.

    diff_score é a diferença de score total entre o time mais forte e o mais fraco.
    Quanto menor, mais equilibrado o sorteio foi.
    """

    teams: List[TeamResult]
    diff_score: float
    algorithm: str = "snake_draft"
