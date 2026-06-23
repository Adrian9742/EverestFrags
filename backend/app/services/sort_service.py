"""
Service — sorteio de times (Snake Draft)

Algoritmo Snake Draft:
  1. Ordena jogadores por score_final DESC
  2. Distribui em serpentina entre os times
  3. Exemplo com 6 jogadores em 2 times:
     Rodada 1: T1 ← 1º, T2 ← 2º
     Rodada 2: T2 ← 3º, T1 ← 4º   (ordem invertida)
     Rodada 3: T1 ← 5º, T2 ← 6º

  Isso minimiza a diferença de score total entre os times sem força-bruta.

NOTA: jogadores sem partidas têm score_final = 0.0 (o ranking não os inclui,
mas o sort ainda pode recebê-los — eles ficam no fim da lista).
"""

from typing import List, Dict
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.player import Player
from app.schemas.ranking import RankingEntry
from app.schemas.sort import PlayerInTeam, TeamResult, SortTeamsResponse
from app.services.ranking_service import get_ranking


def sort_teams(db: Session, player_ids: List[int], n_teams: int) -> SortTeamsResponse:
    """
    Sorteia n_teams times equilibrados a partir da lista de player_ids.

    Validações:
    - n_teams deve ser 2 ou 3
    - Deve haver players suficientes para formar os times (mínimo n_teams jogadores)
    - Todos os player_ids devem existir no banco
    """
    if n_teams not in (2, 3):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Número de times deve ser 2 ou 3",
        )
    if len(player_ids) < n_teams:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Mínimo de {n_teams} jogadores para {n_teams} times",
        )

    # Busca ranking completo e mapeia por player_id
    ranking = get_ranking(db)
    scores_by_id: Dict[int, RankingEntry] = {r.player_id: r for r in ranking}

    # Valida que todos os IDs existem e monta lista ordenada por score
    players_sorted: List[PlayerInTeam] = []
    for pid in player_ids:
        player = db.query(Player).filter(Player.id == pid, Player.is_active == True).first()  # noqa: E712
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Jogador {pid} não encontrado ou inativo",
            )
        entry = scores_by_id.get(pid)
        score = entry.score_final if entry else 0.0
        players_sorted.append(
            PlayerInTeam(
                player_id=pid,
                player_nickname=player.nickname,
                avatar_initials=player.avatar_initials,
                score_final=score,
            )
        )

    # Ordena por score DESC antes do draft
    players_sorted.sort(key=lambda p: p.score_final, reverse=True)

    # Inicializa times vazios
    teams: List[List[PlayerInTeam]] = [[] for _ in range(n_teams)]

    # Snake Draft
    idx = 0
    round_num = 0
    while idx < len(players_sorted):
        # Determina a ordem dos times nesta rodada (normal ou invertida)
        order = list(range(n_teams)) if round_num % 2 == 0 else list(range(n_teams - 1, -1, -1))
        for team_idx in order:
            if idx >= len(players_sorted):
                break
            teams[team_idx].append(players_sorted[idx])
            idx += 1
        round_num += 1

    # Monta resposta
    team_results = []
    for i, team_players in enumerate(teams):
        total = sum(p.score_final for p in team_players)
        avg = total / len(team_players) if team_players else 0.0
        team_results.append(
            TeamResult(
                team_number=i + 1,
                players=team_players,
                total_score=round(total, 1),
                avg_score=round(avg, 1),
            )
        )

    scores = [t.total_score for t in team_results]
    diff = round(max(scores) - min(scores), 1) if scores else 0.0

    return SortTeamsResponse(teams=team_results, diff_score=diff)
