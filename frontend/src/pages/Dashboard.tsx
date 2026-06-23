/**
 * Dashboard — página principal (/)
 *
 * Layout: header com logo montanha + stats + chips de peso + avatar logado,
 * Navbar rebrand, depois: pódio 3 colunas, grade 4 colunas para 4–11,
 * lista compacta para 12+, rodapé com legenda de categorias.
 *
 * Paleta rebrand v2: #070a0e fundo, #0e7490 teal, #6366f1 indigo, #e0a82e ouro.
 */

import { useEffect, useState } from "react";
import { rankingApi, playersApi, type RankingEntry } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { PodiumCard } from "../components/PodiumCard";
import { RankCard } from "../components/RankCard";
import { WeightConfigModal } from "../components/WeightConfigModal";
import { Navbar } from "../components/Navbar";

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
        combat:  Math.round(config.weight_combat * 100),
        duel:    Math.round(config.weight_duel * 100),
        utility: Math.round(config.weight_utility * 100),
      });
    } catch { /* viewer não tem acesso — mantém padrão 50/30/20 */ }
  }

  useEffect(() => {
    loadData();
    if (isAdmin) loadWeights();
  }, [isAdmin]);

  const podium  = ranking.slice(0, 3);
  const midGrid = ranking.slice(3, 11);
  const tail    = ranking.slice(11);
  const totalMatches = ranking.length > 0 ? Math.max(...ranking.map(r => r.total_matches)) : 0;

  const weightChips = [
    { val: `${weights.combat}%`,  label: "COMBATE", color: "#0e7490", bright: "#22d3ee", border: "rgba(14,116,144,.3)",  bg: "rgba(14,116,144,.08)" },
    { val: `${weights.duel}%`,    label: "DUELOS",  color: "#6366f1", bright: "#818cf8", border: "rgba(99,102,241,.3)", bg: "rgba(99,102,241,.08)" },
    { val: `${weights.utility}%`, label: "UTILITY", color: "#e0a82e", bright: "#e8b948", border: "rgba(224,168,46,.3)", bg: "rgba(224,168,46,.08)" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#070a0e", color: "#dde6f0", fontFamily: "'Inter', sans-serif", paddingBottom: 64 }}>

      {/* Scanlines overlay */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 3px, rgba(0,0,0,0.10) 4px, rgba(0,0,0,0) 5px)", opacity: 0.35 }} />
      {/* Glow radial teal no topo */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 51, background: "radial-gradient(ellipse 90% 55% at 50% -10%, rgba(14,116,144,0.08), transparent 62%)" }} />

      {/* Header */}
      <header style={{ position: "relative", zIndex: 10, borderBottom: "1px solid #1b2530", background: "linear-gradient(180deg,#0d1218,#070a0e)", padding: "26px 48px 24px" }}>
        {/* Silhueta de montanhas decorativa no fundo do header */}
        <svg viewBox="0 0 1320 130" preserveAspectRatio="xMidYMax slice"
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: 130, zIndex: 0, pointerEvents: "none" }}
          aria-hidden="true">
          <path d="M0 130 L120 70 L210 96 L340 40 L430 88 L560 30 L660 78 L820 18 L930 74 L1080 44 L1180 86 L1320 52 L1320 130 Z" fill="rgba(14,116,144,0.06)" />
          <path d="M0 130 L160 92 L300 110 L470 64 L600 104 L780 56 L900 100 L1060 72 L1220 104 L1320 84 L1320 130 Z" fill="rgba(99,102,241,0.05)" />
        </svg>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1320, margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
          {/* Logo montanha */}
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 46, height: 46, border: "2px solid #0e7490", display: "flex", alignItems: "center", justifyContent: "center", background: "#04222b", boxShadow: "0 0 14px rgba(14,116,144,.22)" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M2 21 L9 7 L12.5 13 L15.5 6 L22 21 Z" fill="#0e7490" />
                <path d="M15.5 6 L13.2 10 L17.8 10 Z" fill="#cfe6ee" />
                <path d="M9 7 L7.3 10 L10.7 10 Z" fill="#cfe6ee" />
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 40, lineHeight: 0.92, letterSpacing: 1 }}>
                <span style={{ color: "#f0f9ff" }}>EVEREST</span>
                <span style={{ color: "#0e7490" }}>FRAGS</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "3.5px", color: "#4a5868", marginTop: 5 }}>
                8849M · CS2 MIX SQUAD
              </div>
            </div>
          </div>

          {/* Stats + chips + usuário */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {[{ value: totalMatches, label: "PARTIDAS" }, { value: totalPlayers, label: "PLAYERS" }].map(s => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column", border: "1px solid #1e2a36", background: "#11171f", padding: "8px 16px", minWidth: 78 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "#f0f9ff", lineHeight: 1 }}>{s.value}</span>
                <span style={{ fontSize: 9.5, letterSpacing: "2px", color: "#4a5868", marginTop: 3 }}>{s.label}</span>
              </div>
            ))}

            <div style={{ width: 1, height: 42, background: "#1e2a36", margin: "0 4px" }} />

            {weightChips.map(w => (
              <div key={w.label} style={{ display: "flex", alignItems: "center", gap: 7, border: `1px solid ${w.border}`, background: w.bg, padding: "9px 13px" }}>
                <span style={{ width: 7, height: 7, background: w.color, borderRadius: "50%" }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: w.bright }}>{w.val}</span>
                <span style={{ fontSize: 9.5, letterSpacing: "1.5px", color: "#6a7a8d" }}>{w.label}</span>
              </div>
            ))}

            {isAdmin && (
              <button
                onClick={() => setShowWeights(true)}
                style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid rgba(14,116,144,.35)", background: "rgba(14,116,144,.1)", padding: "9px 13px", cursor: "pointer", color: "#22d3ee", marginLeft: 2 }}
              >
                <span style={{ width: 8, height: 8, background: "#0e7490", transform: "rotate(45deg)", flexShrink: 0 }} />
                <span style={{ fontSize: 9.5, letterSpacing: "1.5px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>CONFIG. PESOS</span>
              </button>
            )}

            <div style={{ width: 1, height: 42, background: "#1e2a36", margin: "0 2px" }} />

            {player && (
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{ width: 38, height: 38, border: "1px solid #1e2a36", background: "#0d1218", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, color: "#c6d2e0" }}>
                  {player.avatar_initials}
                </div>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, color: "#e3ebf3", lineHeight: 1 }}>{player.nickname}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "1.5px", color: player.role === "admin" ? "#22d3ee" : "#566476", marginTop: 3 }}>
                    {player.role === "admin" ? "GESTOR" : "PLAYER"}
                  </div>
                </div>
                <button onClick={logout} style={{ marginLeft: 2, width: 34, height: 34, border: "1px solid #212d3a", background: "#0d1218", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5d6d80" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 3v9" /><path d="M6.4 6.4a8 8 0 1 0 11.2 0" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navegação rebrand */}
      <Navbar />

      {/* Conteúdo */}
      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "0 48px", position: "relative", zIndex: 10 }}>

        {loading && (
          <div style={{ textAlign: "center", padding: 80, fontFamily: "'JetBrains Mono', monospace", color: "#3a4757" }}>
            carregando ranking...
          </div>
        )}

        {!loading && ranking.length === 0 && (
          <div style={{ textAlign: "center", padding: 80, fontFamily: "'JetBrains Mono', monospace", color: "#3a4757" }}>
            nenhum jogador com partidas registradas ainda
          </div>
        )}

        {!loading && ranking.length > 0 && (
          <>
            {/* Seção pódio */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "34px 0 22px" }}>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "3px", color: "#5d6d80" }}>PÓDIO</span>
              <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg,#1e2a36,transparent)" }} />
            </div>
            {/* 3 colunas com o centro levemente maior (1º lugar destacado) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.08fr 1fr", gap: 18, alignItems: "end" }}>
              {podium.map(e => <PodiumCard key={e.player_id} entry={e} />)}
            </div>

            {/* Seção classificação (4–11) */}
            {midGrid.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "40px 0 22px" }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "3px", color: "#5d6d80" }}>CLASSIFICAÇÃO</span>
                  <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg,#1e2a36,transparent)" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                  {midGrid.map(e => <RankCard key={e.player_id} entry={e} />)}
                </div>
              </>
            )}

            {/* Lista compacta (12+) */}
            {tail.length > 0 && (
              <div style={{ border: "1px solid #172029", background: "#0a0e13", marginTop: 14 }}>
                {tail.map(e => <RankCard key={e.player_id} entry={e} compact />)}
              </div>
            )}

            {/* Legenda de categorias */}
            <footer style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginTop: 34, paddingTop: 20, borderTop: "1px solid #151d26" }}>
              <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
                {[
                  { color: "#0e7490", label: "Combate 50%", detail: "kills, dano, ADR, rating, KAST" },
                  { color: "#6366f1", label: "Duelos 30%",  detail: "opening, trades, TTK" },
                  { color: "#e0a82e", label: "Utility 20%", detail: "flashes, HE, incendiária" },
                ].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ width: 10, height: 10, background: l.color }} />
                    <span style={{ fontSize: 11, color: "#5d6d80" }}>
                      <b style={{ color: "#aebccd" }}>{l.label}</b> — {l.detail}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "1.5px", color: "#334155" }}>
                SCORE NORMALIZADO MIN-MAX · GRUPO DE {totalPlayers}
              </div>
            </footer>
          </>
        )}
      </main>

      {showWeights && (
        <WeightConfigModal
          initialCombat={weights.combat / 100}
          initialDuel={weights.duel / 100}
          initialUtility={weights.utility / 100}
          onClose={() => setShowWeights(false)}
          onSaved={() => { loadData(); if (isAdmin) loadWeights(); }}
        />
      )}
    </div>
  );
}
