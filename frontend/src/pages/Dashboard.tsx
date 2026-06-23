/**
 * Página / — Dashboard / Ranking
 *
 * Exibe:
 * - Header: logo, stats globais (partidas/players), chips de peso, avatar do player logado
 * - Pódio (top 3): PodiumCards grandes com radar
 * - Grade 4×N para posições 4–11: RankCards médios
 * - Lista compacta para 12+: RankCards compactos
 * - Botão ⚙ Configurar Pesos (só admin) que abre WeightConfigModal
 */

import { useEffect, useState } from "react";
import { rankingApi, playersApi, type RankingEntry } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { PodiumCard } from "../components/PodiumCard";
import { RankCard } from "../components/RankCard";
import { WeightConfigModal } from "../components/WeightConfigModal";

export function Dashboard() {
  const { player, isAdmin, logout } = useAuth();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [weights, setWeights] = useState({ combat: 50, duel: 30, utility: 20 });
  const [showWeights, setShowWeights] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [r, players] = await Promise.all([rankingApi.get(), playersApi.list()]);
      setRanking(r);
      setTotalPlayers(players.length);
    } catch (e) {
      console.error("Erro ao carregar ranking:", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadWeights() {
    try {
      const config = await rankingApi.getConfig();
      setWeights({
        combat: Math.round(config.weight_combat * 100),
        duel: Math.round(config.weight_duel * 100),
        utility: Math.round(config.weight_utility * 100),
      });
    } catch {
      // Não é admin ou falhou — mantém os valores padrão exibidos
    }
  }

  useEffect(() => {
    loadData();
    if (isAdmin) loadWeights();
  }, [isAdmin]);

  const podium = ranking.slice(0, 3);
  const midGrid = ranking.slice(3, 11);
  const tail = ranking.slice(11);
  const totalMatches = ranking.length > 0 ? Math.max(...ranking.map(r => r.total_matches)) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#e8e8e8", fontFamily: "'Inter', sans-serif", paddingBottom: 64 }}>

      {/* Scanlines */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.22) 3px, rgba(0,0,0,0) 4px)", opacity: 0.6 }} />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 51, background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(204,34,0,0.10), transparent 60%)" }} />

      {/* Header */}
      <header style={{ position: "relative", zIndex: 10, borderBottom: "1px solid #1c1c1c", background: "linear-gradient(180deg,#0c0c0c,#080808)", padding: "26px 48px 24px" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 46, height: 46, border: "2px solid #cc2200", display: "flex", alignItems: "center", justifyContent: "center", background: "#120504", boxShadow: "0 0 18px rgba(204,34,0,.35)" }}>
              <div style={{ width: 14, height: 14, background: "#cc2200", transform: "rotate(45deg)" }} />
            </div>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 40, lineHeight: 0.92, letterSpacing: 1 }}>
                <span style={{ color: "#f4f4f4" }}>EVEREST</span>
                <span style={{ color: "#cc2200" }}>FRAGS</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "3.5px", color: "#6a6a6a", marginTop: 5 }}>
                CS2 · MIX SQUAD TRACKER
              </div>
            </div>
          </div>

          {/* Stats + pesos + user */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Contadores */}
            {[
              { value: totalMatches, label: "PARTIDAS" },
              { value: totalPlayers, label: "PLAYERS" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column", border: "1px solid #1f1f1f", background: "#101010", padding: "8px 16px", minWidth: 78 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "#f4f4f4", lineHeight: 1 }}>{s.value}</span>
                <span style={{ fontSize: 9.5, letterSpacing: "2px", color: "#6a6a6a", marginTop: 3 }}>{s.label}</span>
              </div>
            ))}

            <div style={{ width: 1, height: 42, background: "#1f1f1f", margin: "0 4px" }} />

            {/* Pesos */}
            {[
              { val: `${weights.combat}%`, label: "COMBATE", color: "#cc2200", border: "rgba(204,34,0,.3)", bg: "rgba(204,34,0,.08)" },
              { val: `${weights.duel}%`, label: "DUELOS", color: "#a472f5", border: "rgba(124,58,237,.3)", bg: "rgba(124,58,237,.08)" },
              { val: `${weights.utility}%`, label: "UTILITY", color: "#e0a82e", border: "rgba(224,168,46,.3)", bg: "rgba(224,168,46,.08)" },
            ].map(w => (
              <div key={w.label} style={{ display: "flex", alignItems: "center", gap: 7, border: `1px solid ${w.border}`, background: w.bg, padding: "9px 13px" }}>
                <span style={{ width: 7, height: 7, background: w.color, borderRadius: "50%" }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: w.color }}>{w.val}</span>
                <span style={{ fontSize: 9.5, letterSpacing: "1.5px", color: "#9a9a9a" }}>{w.label}</span>
              </div>
            ))}

            {/* Admin: botão de config */}
            {isAdmin && (
              <button
                onClick={() => setShowWeights(true)}
                style={{ background: "#111", border: "1px solid #2a2a2a", color: "#888", fontSize: 10, letterSpacing: "1.5px", padding: "9px 12px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace" }}
              >
                ⚙ PESOS
              </button>
            )}

            {/* Avatar + logout */}
            {player && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
                <div style={{ width: 32, height: 32, background: "#1a0505", border: "1px solid #cc220044", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: "#cc2200" }}>
                  {player.avatar_initials}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#ccc", fontWeight: 600 }}>{player.nickname}</div>
                  <div style={{ fontSize: 9, letterSpacing: "1px", color: player.role === "admin" ? "#cc2200" : "#555" }}>
                    {player.role === "admin" ? "GESTOR" : "PLAYER"}
                  </div>
                </div>
                <button onClick={logout} style={{ background: "transparent", border: "1px solid #1f1f1f", color: "#555", fontSize: 11, padding: "4px 8px", cursor: "pointer" }}>
                  SAIR
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "32px 48px 0", position: "relative", zIndex: 10 }}>

        {loading && (
          <div style={{ textAlign: "center", padding: 80, fontFamily: "'JetBrains Mono', monospace", color: "#444" }}>
            carregando ranking...
          </div>
        )}

        {!loading && ranking.length === 0 && (
          <div style={{ textAlign: "center", padding: 80, fontFamily: "'JetBrains Mono', monospace", color: "#444" }}>
            nenhum jogador com partidas ainda
          </div>
        )}

        {!loading && ranking.length > 0 && (
          <>
            {/* Pódio */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, letterSpacing: "4px", color: "#4a4a4a", marginBottom: 16 }}>PÓDIO</div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {podium.map(e => <PodiumCard key={e.player_id} entry={e} />)}
              </div>
            </div>

            {/* Grade 4 colunas */}
            {midGrid.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, letterSpacing: "4px", color: "#4a4a4a", marginBottom: 16 }}>CLASSIFICAÇÃO</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                  {midGrid.map(e => <RankCard key={e.player_id} entry={e} />)}
                </div>
              </div>
            )}

            {/* Lista compacta */}
            {tail.length > 0 && (
              <div style={{ marginTop: 24 }}>
                {tail.map(e => <RankCard key={e.player_id} entry={e} compact />)}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal de pesos */}
      {showWeights && (
        <WeightConfigModal
          initialCombat={weights.combat / 100}
          initialDuel={weights.duel / 100}
          initialUtility={weights.utility / 100}
          onClose={() => setShowWeights(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
