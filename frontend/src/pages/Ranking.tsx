/**
 * Ranking — /ranking
 * Rebrand "Estação de Altitude": pódio hero + altitude ruler + cards 4-11 + lista 12+
 */

import { useEffect, useState } from "react";
import { rankingApi, playersApi, type RankingEntry } from "../api/client";
import { PodiumCard } from "../components/PodiumCard";
import { RankCard } from "../components/RankCard";
import { PlayerDetailModal } from "../components/PlayerDetailModal";
import { CompareModal } from "../components/CompareModal";
import { Navbar } from "../components/Navbar";

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "36px 0 20px" }}>
      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: 3, color: "var(--ef-fog)", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(148,197,233,0.18), transparent)" }} />
    </div>
  );
}

export function Ranking() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<RankingEntry | null>(null);
  const [comparing, setComparing] = useState(false);

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

  useEffect(() => { loadData(); }, []);

  const podium  = ranking.slice(0, 3);
  const midGrid = ranking.slice(3, 11);
  const tail    = ranking.slice(11);

  return (
    <div style={{ minHeight: "100vh", background: "var(--ef-bg)", color: "var(--ef-snow)", fontFamily: "var(--ef-font-body)", paddingBottom: 64, position: "relative" }}>

      {/* Camadas atmosféricas */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "var(--ef-aurora)" }} />
      <svg style={{ position: "fixed", bottom: 0, left: 0, width: "100%", height: 240, pointerEvents: "none", zIndex: 0 }} viewBox="0 0 1440 240" preserveAspectRatio="none">
        <path d="M0,185 L120,105 L240,155 L380,75 L520,145 L680,45 L820,135 L960,85 L1100,155 L1240,95 L1360,145 L1440,115 L1440,240 L0,240 Z" fill="rgba(157,220,240,0.035)" />
        <path d="M0,215 L160,145 L300,195 L460,115 L620,185 L760,95 L920,175 L1080,125 L1240,185 L1440,145 L1440,240 L0,240 Z" fill="rgba(157,220,240,0.055)" />
      </svg>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.2, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.5) 0px, rgba(0,0,0,0.5) 1px, transparent 1px, transparent 3px)" }} />

      <Navbar />

      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "32px 48px 0", position: "relative", zIndex: 10 }}>

        {/* Compact page title */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontFamily: "var(--ef-font-mono)", fontSize: 11, color: "var(--ef-ghost)" }}>
              // ranking · temporada 04 · {totalPlayers} jogadores
            </span>
            <span style={{ fontFamily: "var(--ef-font-display)", fontWeight: 900, fontSize: 34, letterSpacing: 2, color: "var(--ef-summit)" }}>
              A ESCALADA
            </span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setComparing(true)}
              style={{ fontFamily: "var(--ef-font-mono)", fontSize: 12, color: "var(--ef-ice)", background: "var(--ef-glacier-dim)", border: "1px solid rgba(34,211,238,0.30)", borderRadius: "var(--ef-radius-sm)", padding: "9px 16px", cursor: "pointer" }}
            >
              comparar →
            </button>
            <a
              href="/api/export"
              download="everestfrags.xlsx"
              style={{ fontFamily: "var(--ef-font-mono)", fontSize: 12, color: "var(--ef-fog)", background: "transparent", border: "1px solid rgba(148,197,233,0.14)", borderRadius: "var(--ef-radius-sm)", padding: "9px 16px", textDecoration: "none" }}
            >
              exportar ↓
            </a>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 80, fontFamily: "var(--ef-font-mono)", color: "var(--ef-ghost)" }}>
            // carregando ranking...
          </div>
        )}

        {!loading && ranking.length === 0 && (
          <div style={{ background: "var(--ef-card)", border: "1px solid var(--ef-border)", borderRadius: "var(--ef-radius-md)", height: 132, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 110%, rgba(157,220,240,0.07), transparent 65%)" }} />
            <svg width="30" height="30" viewBox="0 0 24 24" style={{ opacity: 0.35 }}>
              <path d="M2.5 20 L9.5 5.5 L13 11.5 L15.5 7.5 L21.5 20 Z" fill="none" stroke="#7a8ca1" strokeWidth="1.5" />
            </svg>
            <span style={{ fontFamily: "var(--ef-font-mono)", fontSize: 11, color: "var(--ef-ghost)", position: "relative" }}>// nenhum dado ainda</span>
            <span style={{ fontSize: 12, color: "var(--ef-fog)", position: "relative" }}>registre a primeira partida para iniciar a escalada</span>
          </div>
        )}

        {!loading && ranking.length > 0 && (
          <>
            {/* Pódio hero — 1fr 1.25fr 1fr, alinhado na base */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.25fr 1fr", gap: 20, alignItems: "end" }}>
              {/* Ordena: 2º · 1º · 3º */}
              {[podium[1], podium[0], podium[2]].map((e, idx) =>
                e ? <PodiumCard key={e.player_id} entry={e} index={idx} onClick={() => setSelectedEntry(e)} /> : null
              )}
            </div>

            {/* Cards 4-11 + altitude ruler */}
            {midGrid.length > 0 && (
              <>
                <SectionDivider label="CLASSIFICAÇÃO" />
                <div style={{ display: "flex", gap: 24 }}>
                  {/* Altitude ruler */}
                  <div style={{ width: 56, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end", borderRight: "1px solid rgba(148,197,233,0.12)", paddingRight: 12, paddingTop: 4, paddingBottom: 4 }}>
                    {[
                      { label: "7600M", color: "var(--ef-glacier-br)" },
                      { label: "7000M", color: "var(--ef-ghost)" },
                      { label: "6400M", color: "var(--ef-ghost)" },
                      { label: "5800M", color: "var(--ef-ghost)" },
                      { label: "BASE\nCAMP", color: "var(--ef-fog)" },
                    ].map((m) => (
                      <div key={m.label} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                        {m.label.split("\n").map(l => (
                          <span key={l} style={{ fontFamily: "var(--ef-font-mono)", fontSize: 10, color: m.color, lineHeight: 1.2 }}>{l}</span>
                        ))}
                        <span style={{ width: 10, height: 1, background: "rgba(148,197,233,0.35)", alignSelf: "flex-end" }} />
                      </div>
                    ))}
                  </div>

                  {/* Grid 4 colunas */}
                  <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                    {midGrid.map((e, i) => <RankCard key={e.player_id} entry={e} index={i} onClick={() => setSelectedEntry(e)} />)}
                  </div>
                </div>
              </>
            )}

            {/* Lista compacta 12+ */}
            {tail.length > 0 && (
              <>
                <SectionDivider label="ZONA DE ACLIMATAÇÃO" />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {tail.map((e, i) => <RankCard key={e.player_id} entry={e} index={i} compact onClick={() => setSelectedEntry(e)} />)}
                </div>
              </>
            )}

            {/* Legenda de categorias */}
            <footer style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginTop: 40, paddingTop: 20, borderTop: "1px solid rgba(148,197,233,0.08)" }}>
              <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
                {[
                  { color: "#0e7490", label: "Combate 30%", detail: "kills, dano, ADR, rating, KAST" },
                  { color: "#6366f1", label: "Duelos 36%",  detail: "opening, trades, TTK" },
                  { color: "#e0a82e", label: "Utility 34%", detail: "flashes, HE, incendiária" },
                ].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ width: 8, height: 8, background: l.color, borderRadius: "50%", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: "var(--ef-fog)" }}>
                      <b style={{ color: "var(--ef-snow)" }}>{l.label}</b> — {l.detail}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 10, letterSpacing: "1.5px", color: "var(--ef-ghost)" }}>
                // score normalizado min-max · grupo de {totalPlayers}
              </div>
            </footer>
          </>
        )}
      </main>

      {selectedEntry && (
        <PlayerDetailModal entry={selectedEntry} allEntries={ranking} onClose={() => setSelectedEntry(null)} />
      )}

      {comparing && (
        <CompareModal allEntries={ranking} onClose={() => setComparing(false)} />
      )}
    </div>
  );
}
