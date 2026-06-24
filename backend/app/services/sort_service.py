"""
Service — sorteio de times equilibrado e aleatório

Algoritmo:
  1. Calcula o score de cada jogador selecionado via ranking_service
  2. Gera TODAS as divisões possíveis (ou amostragem para grupos grandes)
  3. Filtra as que estão dentro da margem de equilíbrio (40-60% do score total)
  4. Escolhe UMA ALEATORIAMENTE entre as válidas → times diferentes a cada sorteio
  5. Se nenhuma combinação estiver dentro da margem, usa a de menor diferença (best_effort)

Limites de combinações:
  2 times, 10 jogadores → C(9,4) = 126 únicas   → enumera tudo
  2 times, 18 jogadores → C(17,8) = 24310 únicas → enumera tudo
  3 times, 9 jogadores  → C(9,3)×C(6,3) = 1680   → enumera tudo
  3 times, 15 jogadores → C(15,5)×C(10,5) = 756k  → amostragem aleatória

Margens:
  2 times → diff / total_score <= 0.20  (garante 40-60%)
  3 times → diff / total_score <= 0.15  (garante ~±8% por time)
"""

import random
from itertools import combinations
from math import comb
from typing import List, Dict

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.player import Player
from app.schemas.ranking import RankingEntry
from app.schemas.sort import PlayerInTeam, TeamResult, SortTeamsResponse
from app.services.ranking_service import get_ranking

MARGIN_2TEAMS  = 0.20    # diff/total <= 20% → equilíbrio 40/60
MARGIN_3TEAMS  = 0.15    # diff/total <= 15% para 3 times
MAX_ENUMERATE  = 15_000  # acima disso usa amostragem aleatória
MAX_SAMPLE     = 6_000   # tentativas na amostragem


# ── Helpers ───────────────────────────────────────────────────────────────────

def _team_score(team: List[PlayerInTeam]) -> float:
    return sum(p.score_final for p in team)


def _diff_fraction(teams: List[List[PlayerInTeam]]) -> float:
    """Diferença entre o time mais forte e o mais fraco, como fração do total."""
    scores = [_team_score(t) for t in teams]
    total = sum(scores)
    if total == 0:
        return 0.0
    return (max(scores) - min(scores)) / total


def _split_sizes(n: int, n_teams: int) -> List[int]:
    """Divide n jogadores em n_teams grupos do mesmo tamanho (±1 para restos)."""
    base = n // n_teams
    rem  = n % n_teams
    return [base + (1 if i < rem else 0) for i in range(n_teams)]


# ── Geradores de splits ───────────────────────────────────────────────────────

def _all_2team_splits(players: List[PlayerInTeam]):
    """
    Gera todos os splits únicos para 2 times.
    Para N par: fixa o jogador[0] no time A para evitar contar (A,B) e (B,A).
    Para N ímpar: todos os C(N, N//2) são únicos pois os times têm tamanhos diferentes.
    """
    n = len(players)
    size_a = n // 2

    if n % 2 == 0:
        # Fixa índice 0 no time A → C(N-1, N//2-1) splits únicos
        rest = list(range(1, n))
        for combo in combinations(rest, size_a - 1):
            idx_a = frozenset({0} | set(combo))
            team_a = [players[i] for i in sorted(idx_a)]
            team_b = [players[i] for i in range(n) if i not in idx_a]
            yield team_a, team_b
    else:
        for combo in combinations(range(n), size_a):
            idx_a = set(combo)
            team_a = [players[i] for i in combo]
            team_b = [players[i] for i in range(n) if i not in idx_a]
            yield team_a, team_b


def _all_3team_splits(players: List[PlayerInTeam]):
    """Enumera todos os splits para 3 times via dupla combinação."""
    n = len(players)
    s0, s1 = _split_sizes(n, 3)[:2]
    indices = list(range(n))
    for combo_a in combinations(indices, s0):
        set_a = set(combo_a)
        rest = [i for i in indices if i not in set_a]
        for combo_b in combinations(rest, s1):
            set_b = set(combo_b)
            team_a = [players[i] for i in combo_a]
            team_b = [players[i] for i in combo_b]
            team_c = [players[i] for i in rest if i not in set_b]
            yield team_a, team_b, team_c


def _random_3team_splits(players: List[PlayerInTeam], n_samples: int):
    """Amostragem aleatória para grupos grandes (> MAX_ENUMERATE combinações)."""
    n = len(players)
    sizes = _split_sizes(n, 3)
    seen: set = set()
    attempts = 0

    while len(seen) < n_samples and attempts < n_samples * 4:
        shuffled = players[:]
        random.shuffle(shuffled)
        t1 = shuffled[:sizes[0]]
        t2 = shuffled[sizes[0]:sizes[0] + sizes[1]]
        t3 = shuffled[sizes[0] + sizes[1]:]
        key = (frozenset(p.player_id for p in t1), frozenset(p.player_id for p in t2))
        attempts += 1
        if key not in seen:
            seen.add(key)
            yield t1, t2, t3


# ── Serviço principal ─────────────────────────────────────────────────────────

def sort_teams(db: Session, player_ids: List[int], n_teams: int) -> SortTeamsResponse:
    if n_teams not in (2, 3):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Número de times deve ser 2 ou 3",
        )

    min_players = n_teams * 2
    if len(player_ids) < min_players:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Mínimo de {min_players} jogadores para {n_teams} times equilibrados",
        )

    # Busca scores do ranking
    ranking = get_ranking(db)
    scores_by_id: Dict[int, RankingEntry] = {r.player_id: r for r in ranking}

    players_list: List[PlayerInTeam] = []
    for pid in player_ids:
        player = db.query(Player).filter(
            Player.id == pid, Player.is_active == True  # noqa: E712
        ).first()
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Jogador {pid} não encontrado ou inativo",
            )
        entry = scores_by_id.get(pid)
        players_list.append(PlayerInTeam(
            player_id=pid,
            player_nickname=player.nickname,
            avatar_initials=player.avatar_initials,
            score_final=round(entry.score_final, 1) if entry else 0.0,
        ))

    # Escolhe gerador de splits
    n = len(players_list)
    margin = MARGIN_2TEAMS if n_teams == 2 else MARGIN_3TEAMS

    if n_teams == 2:
        # Sempre enumera tudo — máximo prático é C(17,8) ≈ 24k para 18 jogadores
        gen = _all_2team_splits(players_list)
    else:
        s = _split_sizes(n, 3)
        total_combos = comb(n, s[0]) * comb(n - s[0], s[1])
        if total_combos <= MAX_ENUMERATE:
            gen = _all_3team_splits(players_list)
        else:
            gen = _random_3team_splits(players_list, MAX_SAMPLE)

    # Avalia todos os splits e coleta os válidos
    best_split: List[List[PlayerInTeam]] | None = None
    best_diff = float("inf")
    valid_splits: List[List[List[PlayerInTeam]]] = []

    for split in gen:
        df = _diff_fraction(list(split))
        if df < best_diff:
            best_diff = df
            best_split = list(split)
        if df <= margin:
            valid_splits.append(list(split))

    # Escolhe aleatoriamente entre os válidos; fallback = menor diferença encontrada
    if valid_splits:
        chosen = random.choice(valid_splits)
        algo = "random_balanced"
    else:
        chosen = best_split  # type: ignore[assignment]
        algo = "best_effort"

    # Monta resposta
    team_results: List[TeamResult] = []
    for i, team_players in enumerate(chosen):
        total = _team_score(team_players)
        avg   = total / len(team_players) if team_players else 0.0
        team_results.append(TeamResult(
            team_number=i + 1,
            players=team_players,
            total_score=round(total, 1),
            avg_score=round(avg, 1),
        ))

    scores = [t.total_score for t in team_results]
    diff   = round(max(scores) - min(scores), 1) if scores else 0.0

    return SortTeamsResponse(teams=team_results, diff_score=diff, algorithm=algo)
