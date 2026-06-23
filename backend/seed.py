"""
Seed — dados iniciais do EverestFrags

Executa UMA vez para criar:
  1. Admin inicial (nickname: "admin", senha: "fragstack2025")
  2. Linha inicial da ranking_config (pesos padrão 50/30/20)
  3. Players de exemplo (15 jogadores com nicks genéricos)
  4. Partidas de exemplo com stats fictícias para testar o ranking

IMPORTANTE: Trocar a senha do admin após o primeiro login!

Como rodar:
  cd backend
  python seed.py

Se os dados já existirem (ex: rodar duas vezes), o script ignora silenciosamente
graças às checagens de existência antes de cada insert.
"""

import os
import sys
import random
from datetime import date, timedelta

# Adiciona o diretório backend ao path para imports funcionarem
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app.database import SessionLocal, engine, Base
from app.models.player import Player
from app.models.match import Match, PlayerMatchStats
from app.models.ranking_config import RankingConfig
from app.services.auth_service import hash_password

# Cria as tabelas se não existirem
Base.metadata.create_all(bind=engine)


SAMPLE_PLAYERS = [
    ("GodBR", "GB"),
    ("Dr0pzin", "DZ"),
    ("clutchK1ng", "CK"),
    ("zEcA", "ZE"),
    ("bl4ster", "BL"),
    ("Capixaba", "CA"),
    ("k1to", "K1"),
    ("FalleNico", "FN"),
    ("rush_b_bb", "RB"),
    ("AWPer420", "AW"),
    ("NikoClone", "NC"),
    ("s1mplesBR", "SB"),
    ("TarikBR", "TB"),
    ("m0nesy_br", "MB"),
    ("ZywOoBR", "ZB"),
]

MAPS = ["de_dust2", "de_mirage", "de_inferno", "de_nuke", "de_ancient", "de_anubis"]


def seed():
    db = SessionLocal()
    try:
        # 1. Admin inicial
        if not db.query(Player).filter(Player.nickname == "admin").first():
            admin = Player(
                nickname="admin",
                avatar_initials="AD",
                password_hash=hash_password("fragstack2025"),
                role="admin",
                is_active=True,
            )
            db.add(admin)
            db.flush()
            print("✓ Admin criado (nick: admin, senha: fragstack2025) — TROQUE A SENHA!")
        else:
            print("- Admin já existe, pulando")

        # 2. Ranking config
        if not db.query(RankingConfig).first():
            config = RankingConfig(weight_combat=0.50, weight_duel=0.30, weight_utility=0.20)
            db.add(config)
            db.flush()
            print("✓ Ranking config criada (50/30/20)")
        else:
            print("- Ranking config já existe, pulando")

        # 3. Players de exemplo
        created_players = []
        for nickname, initials in SAMPLE_PLAYERS:
            existing = db.query(Player).filter(Player.nickname == nickname).first()
            if not existing:
                p = Player(
                    nickname=nickname,
                    avatar_initials=initials,
                    password_hash=hash_password("player123"),
                    role="viewer",
                    is_active=True,
                )
                db.add(p)
                db.flush()
                created_players.append(p)
            else:
                created_players.append(existing)

        print(f"✓ {len(SAMPLE_PLAYERS)} players verificados/criados")

        # 4. Partidas de exemplo — 11 partidas com 10 jogadores cada
        if db.query(Match).count() == 0:
            random.seed(42)  # seed fixo para resultados reproduzíveis
            today = date.today()

            for match_num in range(11):
                played = today - timedelta(days=match_num * 3)
                match = Match(
                    played_at=played,
                    map_name=random.choice(MAPS),
                    notes=f"Partida de exemplo #{match_num + 1}",
                )
                db.add(match)
                db.flush()

                # Sorteia 10 jogadores para a partida
                participants = random.sample(created_players, min(10, len(created_players)))
                for player in participants:
                    kills = random.randint(5, 30)
                    deaths = random.randint(5, 25)
                    assists = random.randint(0, 10)
                    stat = PlayerMatchStats(
                        match_id=match.id,
                        player_id=player.id,
                        kills=kills,
                        deaths=deaths,
                        assists=assists,
                        damage_total=kills * random.randint(80, 130),
                        adr=round(random.uniform(50, 120), 2),
                        adr_difference=round(random.uniform(-20, 40), 2),
                        hltv_rating=round(random.uniform(0.7, 1.8), 3),
                        kast_percent=round(random.uniform(45, 85), 2),
                        opening_kills=random.randint(0, 5),
                        trade_kills=random.randint(0, 6),
                        time_to_kill_ms=random.randint(200, 600),
                        flash_assists=random.randint(0, 8),
                        grenade_damage=random.randint(0, 150),
                        he_enemies_hit=random.randint(0, 4),
                        fire_enemies_hit=random.randint(0, 3),
                    )
                    db.add(stat)

            db.commit()
            print("✓ 11 partidas de exemplo criadas com stats fictícias")
        else:
            db.commit()
            print("- Partidas já existem, pulando")

        print("\n✅ Seed concluído! Inicie o servidor com:")
        print("   uvicorn main:app --reload --port 8000")
        print("\n⚠️  Troque a senha do admin em /api/auth/change-password após o primeiro login!")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Erro durante seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
