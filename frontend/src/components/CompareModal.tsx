/**
 * CompareModal — rebrand "Estação de Altitude" (#3b)
 * 880px · header grid 1fr auto 1fr · radar duplo sobreposto · barras espelhadas
 */

import { useEffect, useState } from "react";
import { playersVsApi, type RankingEntry, type HeadToHeadResponse } from "../api/client";

interface CompareModalProps {
  allEntries: RankingEntry[];
  initialA?: RankingEntry | null;
  onClose: () => void;
}

interface MetricDef {
  key: keyof RankingEntry;
  label: string;
  category: "COMBATE" | "DUELOS" | "UTILITY";
  inverted?: boolean;
  format: (v: number) => string;
}

const METRICS: MetricDef[] = [
  { key: "score_combat",    label: "COMBATE",        category: "COMBATE",  format: v => v.toFixed(1) },
  { key: "kd_ratio",        label: "K/D",            category: "COMBATE",  format: v => v.toFixed(2) },
  { key: "adr",             label: "ADR",            category: "COMBATE",  format: v => v.toFixed(1) },
  { key: "hltv_rating",     label: "RATING",         category: "COMBATE",  format: v => v.toFixed(2) },
  { key: "kast_percent",    label: "KAST%",          category: "COMBATE",  format: v => `${v.toFixed(0)}%` },
  { key: "score_duel",      label: "DUELOS",         category: "DUELOS",   format: v => v.toFixed(1) },
  { key: "opening_kills",   label: "OPENING KILLS",  category: "DUELOS",   format: v => String(v) },
  { key: "opening_deaths",  label: "OPENING DEATHS", category: "DUELOS",   inverted: true, format: v => String(v) },
  { key: "trade_kills",     label: "TRADE KILLS",    category: "DUELOS",   format: v => String(v) },
  { key: "time_to_kill_ms", label: "TTK (MS)",       category: "DUELOS",   inverted: true, format: v => v.toFixed(0) },
  { key: "score_utility",   label: "UTILITY",        category: "UTILITY",  format: v => v.toFixed(1) },
  { key: "flash_assists",   label: "FLASH ASSISTS",  category: "UTILITY",  format: v => String(v) },
  { key: "grenade_damage",  label: "DANO GRANADA",   category: "UTILITY",  format: v => String(v) },
  { key: "fire_damage",     label: "DANO MOLOTOV",   category: "UTILITY",  format: v => String(v) },
];

function numOf(entry: RankingEntry, key: keyof RankingEntry): number {
  const v = entry[key];
  return typeof v === "number" ? v : 0;
}

function polarToXY(angle: number, r: number, cx: number, cy: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function DoubleRadar({ entryA, entryB }: { entryA: RankingEntry; entryB: RankingEntry }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.34;
  const angles = [0, 60, 120, 180, 240, 300];
  const labels = ["ADR", "KAST", "RATING", "OPEN K", "K/D", "UTIL"];

  const valsA = [
    entryA.score_combat, entryA.kast_percent, entryA.hltv_rating * 50,
    entryA.score_duel, Math.min(entryA.kd_ratio * 33, 100), entryA.score_utility,
  ].map(v => Math.min(100, Math.max(0, v)));

  const valsB = [
    entryB.score_combat, entryB.kast_percent, entryB.hltv_rating * 50,
    entryB.score_duel, Math.min(entryB.kd_ratio * 33, 100), entryB.score_utility,
  ].map(v => Math.min(100, Math.max(0, v)));

  const pointsA = valsA.map((v, i) => polarToXY(angles[i], (v / 100) * maxR, cx, cy));
  const pointsB = valsB.map((v, i) => polarToXY(angles[i], (v / 100) * maxR, cx, cy));

  const pathA = pointsA.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
  const pathB = pointsB.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible", display: "block", margin: "0 auto" }}>
        {gridLevels.map((lvl, li) => {
          const pts = angles.map(a => { const p = polarToXY(a, maxR * lvl, cx, cy); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; });
          return <polygon key={li} points={pts.join(" ")} fill="none" stroke={li === 3 ? "#1a2530" : "rgba(26,37,48,0.7)"} strokeWidth={li === 3 ? 1 : 0.5} />;
        })}
        {angles.map((a, i) => {
          const end = polarToXY(a, maxR, cx, cy);
          return <line key={i} x1={cx} y1={cy} x2={end.x.toFixed(1)} y2={end.y.toFixed(1)} stroke="#1a2530" strokeWidth={0.5} />;
        })}

        {/* Polígono B primeiro (tracejado, indigo) */}
        <path d={pathB} fill="rgba(129,140,248,0.08)" stroke="#818cf8" strokeWidth={1.5} strokeDasharray="4 3" strokeLinejoin="round" />
        {/* Polígono A por cima (sólido, teal) */}
        <path d={pathA} fill="rgba(34,211,238,0.08)" stroke="#22d3ee" strokeWidth={2} strokeLinejoin="round" />

        {/* Labels */}
        {angles.map((a, i) => {
          const pos = polarToXY(a, maxR + size * 0.10, cx, cy);
          const isTop = a === 0; const isBottom = a === 180;
          const isRight = a === 60 || a === 120;
          return (
            <text key={i} x={pos.x} y={pos.y}
              fontSize={9} fontFamily="'JetBrains Mono', monospace" fill="#45566b"
              textAnchor={isTop || isBottom ? "middle" : isRight ? "start" : "end"}
              dominantBaseline={isTop ? "text-after-edge" : isBottom ? "text-before-edge" : "middle"}
            >{labels[i]}</text>
          );
        })}
      </svg>
    </div>
  );
}

export function CompareModal({ allEntries, initialA, onClose }: CompareModalProps) {
  const [idA, setIdA] = useState<number | "">(initialA?.player_id ?? "");
  const [idB, setIdB] = useState<number | "">("");
  const [h2h, setH2h] = useState<HeadToHeadResponse | null>(null);
  const [h2hLoading, setH2hLoading] = useState(false);

  const entryA = allEntries.find(e => e.player_id === idA) || null;
  const entryB = allEntries.find(e => e.player_id === idB) || null;

  useEffect(() => {
    if (!entryA || !entryB) { setH2h(null); return; }
    setH2hLoading(true);
    playersVsApi.headToHead(entryA.player_id, entryB.player_id)
      .then(setH2h).catch(() => setH2h(null)).finally(() => setH2hLoading(false));
  }, [entryA?.player_id, entryB?.player_id]);

  const nameA = entryA ? (entryA.player_display_name || entryA.player_nickname) : "—";
  const nameB = entryB ? (entryB.player_display_name || entryB.player_nickname) : "—";

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(4,7,12,0.72)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24, overflowY: "auto" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        position: "relative", width: 880, maxWidth: "100%",
        background: "var(--ef-bg-elevated)",
        border: "1px solid var(--ef-border)",
        borderRadius: "var(--ef-radius-lg)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        maxHeight: "92vh", overflowY: "auto",
      }}>
        {/* Barra teal→indigo */}
        <div style={{ position: "sticky", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #22d3ee 0%, transparent 45%, transparent 55%, #818cf8 100%)", borderRadius: "var(--ef-radius-lg) var(--ef-radius-lg) 0 0", zIndex: 2 }} />

        {/* Header grid 1fr auto 1fr */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 16, padding: "28px 32px 22px", borderBottom: "1px solid var(--ef-border)" }}>
          {/* Jogador A */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #0e7490, #22d3ee)", border: "2px solid rgba(34,211,238,0.4)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontFamily: "var(--ef-font-display)", fontWeight: 800, fontSize: 22, color: "#060a10", flexShrink: 0 }}>
              {entryA?.avatar_url ? <img src={entryA.avatar_url} alt={nameA} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (entryA?.avatar_initials ?? "A")}
            </div>
            <div>
              <div style={{ fontFamily: "var(--ef-font-display)", fontWeight: 900, fontSize: 24, color: "var(--ef-summit)", lineHeight: 1 }}>{nameA}</div>
              {entryA && <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 16, color: "var(--ef-glacier-br)", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{Math.round(entryA.score_final)} pts</div>}
            </div>
          </div>

          {/* VS centro */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--ef-font-display)", fontWeight: 900, fontSize: 26, color: "var(--ef-ghost)" }}>VS</div>
            {entryA && entryB && (
              <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 9, color: "var(--ef-ghost)", letterSpacing: 1 }}>
                #{entryA.rank} · #{entryB.rank}
              </div>
            )}
          </div>

          {/* Jogador B (espelhado) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 14 }}>
            <div>
              <div style={{ fontFamily: "var(--ef-font-display)", fontWeight: 900, fontSize: 24, color: "var(--ef-summit)", lineHeight: 1, textAlign: "right" }}>{nameB}</div>
              {entryB && <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 16, color: "var(--ef-indigo-br)", fontVariantNumeric: "tabular-nums", marginTop: 2, textAlign: "right" }}>{Math.round(entryB.score_final)} pts</div>}
            </div>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #818cf8)", border: "2px solid rgba(129,140,248,0.4)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontFamily: "var(--ef-font-display)", fontWeight: 800, fontSize: 22, color: "#060a10", flexShrink: 0 }}>
              {entryB?.avatar_url ? <img src={entryB.avatar_url} alt={nameB} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (entryB?.avatar_initials ?? "B")}
            </div>
          </div>
        </div>

        {/* Seletores */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 32px 0" }}>
          <select value={idA} onChange={e => setIdA(e.target.value ? Number(e.target.value) : "")}
            style={{ flex: 1, background: "var(--ef-card)", border: "1px solid var(--ef-border)", color: "var(--ef-snow)", padding: "10px 12px", fontFamily: "var(--ef-font-mono)", fontSize: 12, borderRadius: "var(--ef-radius-sm)" }}>
            <option value="">— jogador A —</option>
            {allEntries.map(e => <option key={e.player_id} value={e.player_id} disabled={e.player_id === idB}>#{e.rank} {e.player_display_name || e.player_nickname}</option>)}
          </select>
          <span style={{ fontFamily: "var(--ef-font-display)", fontWeight: 700, fontSize: 14, color: "var(--ef-ghost)" }}>↔</span>
          <select value={idB} onChange={e => setIdB(e.target.value ? Number(e.target.value) : "")}
            style={{ flex: 1, background: "var(--ef-card)", border: "1px solid var(--ef-border)", color: "var(--ef-snow)", padding: "10px 12px", fontFamily: "var(--ef-font-mono)", fontSize: 12, borderRadius: "var(--ef-radius-sm)" }}>
            <option value="">— jogador B —</option>
            {allEntries.map(e => <option key={e.player_id} value={e.player_id} disabled={e.player_id === idA}>#{e.rank} {e.player_display_name || e.player_nickname}</option>)}
          </select>
        </div>

        {!entryA || !entryB ? (
          <div style={{ textAlign: "center", padding: "48px 0", fontFamily: "var(--ef-font-mono)", fontSize: 12, color: "var(--ef-ghost)" }}>
            // escolha 2 jogadores para comparar
          </div>
        ) : (
          <>
            {/* Corpo grid 320px + 1fr */}
            <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24, padding: "24px 32px" }}>

              {/* ─── Coluna esq: radar duplo ─── */}
              <div style={{ background: "var(--ef-card)", border: "1px solid var(--ef-border)", borderRadius: "var(--ef-radius-md)", padding: "20px 16px" }}>
                <DoubleRadar entryA={entryA} entryB={entryB} />
                {/* Legenda */}
                <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ display: "block", width: 20, height: 2, background: "#22d3ee" }} />
                    <span style={{ fontFamily: "var(--ef-font-mono)", fontSize: 10, color: "var(--ef-ice)" }}>{nameA.slice(0, 8)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="20" height="2" style={{ flexShrink: 0 }}><line x1="0" y1="1" x2="20" y2="1" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
                    <span style={{ fontFamily: "var(--ef-font-mono)", fontSize: 10, color: "var(--ef-indigo-br)" }}>{nameB.slice(0, 8)}</span>
                  </div>
                </div>
                {/* Veredito */}
                <div style={{ marginTop: 16, textAlign: "center", fontFamily: "var(--ef-font-mono)", fontSize: 11, color: "var(--ef-fog)", lineHeight: 1.5 }}>
                  {entryA.score_final === entryB.score_final ? "empate no score final" : (
                    <>
                      <strong style={{ color: entryA.score_final > entryB.score_final ? "var(--ef-ice)" : "var(--ef-indigo-br)" }}>
                        {entryA.score_final > entryB.score_final ? nameA : nameB}
                      </strong>
                      {" +"}
                      <strong style={{ color: "var(--ef-snow)" }}>
                        {Math.abs(entryA.score_final - entryB.score_final).toFixed(1)} pts
                      </strong>
                      {" à frente"}
                    </>
                  )}
                </div>
              </div>

              {/* ─── Coluna dir: barras espelhadas por categoria ─── */}
              <div style={{ background: "var(--ef-card)", border: "1px solid var(--ef-border)", borderRadius: "var(--ef-radius-md)", padding: "16px 20px" }}>
                <div style={{ fontFamily: "var(--ef-font-display)", fontWeight: 700, fontSize: 13, letterSpacing: "2px", color: "var(--ef-fog)", marginBottom: 14 }}>
                  DIFERENÇAS POR CATEGORIA
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {METRICS.map(m => {
                    const va = numOf(entryA, m.key);
                    const vb = numOf(entryB, m.key);
                    const aWins = m.inverted ? va < vb : va > vb;
                    const bWins = m.inverted ? vb < va : vb > va;
                    const maxVal = Math.max(va, vb, 1);
                    const wA = `${Math.round((va / maxVal) * 100)}%`;
                    const wB = `${Math.round((vb / maxVal) * 100)}%`;
                    return (
                      <div key={m.key} style={{ display: "grid", gridTemplateColumns: "52px 1fr 90px 1fr 52px", alignItems: "center", gap: 8 }}>
                        {/* Valor A */}
                        <div style={{ fontFamily: "var(--ef-font-mono)", fontWeight: 700, fontSize: 12, color: aWins ? "var(--ef-ice)" : "var(--ef-fog)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          {m.format(va)}
                        </div>
                        {/* Barra A (espelhada, cresce da direita) */}
                        <div style={{ height: 5, background: "var(--ef-surface-2)", borderRadius: 2, display: "flex", justifyContent: "flex-end" }}>
                          <div style={{ height: "100%", width: wA, background: aWins ? "var(--ef-glacier)" : "rgba(14,116,144,0.35)", borderRadius: 2 }} />
                        </div>
                        {/* Label central */}
                        <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 9, color: "var(--ef-ghost)", textAlign: "center", letterSpacing: "0.5px" }}>{m.label}</div>
                        {/* Barra B */}
                        <div style={{ height: 5, background: "var(--ef-surface-2)", borderRadius: 2 }}>
                          <div style={{ height: "100%", width: wB, background: bWins ? "var(--ef-indigo)" : "rgba(99,102,241,0.35)", borderRadius: 2 }} />
                        </div>
                        {/* Valor B */}
                        <div style={{ fontFamily: "var(--ef-font-mono)", fontWeight: 700, fontSize: 12, color: bWins ? "var(--ef-indigo-br)" : "var(--ef-fog)", textAlign: "left", fontVariantNumeric: "tabular-nums" }}>
                          {m.format(vb)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Head-to-head */}
            <div style={{ padding: "0 32px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 16px" }}>
                <span style={{ fontFamily: "var(--ef-font-display)", fontWeight: 700, fontSize: 13, letterSpacing: "3px", color: "var(--ef-fog)", whiteSpace: "nowrap" }}>
                  HEAD-TO-HEAD · TIMES OPOSTOS
                </span>
                <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(148,197,233,0.18), transparent)" }} />
              </div>

              {h2hLoading && (
                <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 11, color: "var(--ef-ghost)" }}>// carregando confronto...</div>
              )}
              {!h2hLoading && h2h && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {/* Vitórias A */}
                  <div style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.18)", borderRadius: "var(--ef-radius-md)", padding: "16px", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--ef-font-mono)", fontWeight: 700, fontSize: 30, color: "var(--ef-glacier-br)", fontVariantNumeric: "tabular-nums" }}>{h2h.player_kills}</div>
                    <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 10, color: "var(--ef-fog)", marginTop: 4 }}>kills de {nameA.slice(0, 10)}</div>
                  </div>
                  {/* Confrontos totais */}
                  <div style={{ background: "var(--ef-card)", border: "1px solid var(--ef-border)", borderRadius: "var(--ef-radius-md)", padding: "16px", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--ef-font-mono)", fontWeight: 700, fontSize: 30, color: "var(--ef-snow)", fontVariantNumeric: "tabular-nums" }}>{h2h.matches_together}</div>
                    <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 10, color: "var(--ef-fog)", marginTop: 4 }}>partidas juntos</div>
                  </div>
                  {/* Vitórias B */}
                  <div style={{ background: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.18)", borderRadius: "var(--ef-radius-md)", padding: "16px", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--ef-font-mono)", fontWeight: 700, fontSize: 30, color: "var(--ef-indigo-br)", fontVariantNumeric: "tabular-nums" }}>{h2h.opponent_kills}</div>
                    <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 10, color: "var(--ef-fog)", marginTop: 4 }}>kills de {nameB.slice(0, 10)}</div>
                  </div>
                </div>
              )}
              {!h2hLoading && !h2h && (
                <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 11, color: "var(--ef-ghost)" }}>
                  // sem dados de confronto direto ainda
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderTop: "1px solid var(--ef-border)", background: "rgba(6,10,16,0.4)" }}>
          {entryA && entryB ? (
            <span style={{ fontFamily: "var(--ef-font-mono)", fontSize: 10, color: "var(--ef-ghost)" }}>
              // vantagem geral: <span style={{ color: entryA.score_final >= entryB.score_final ? "var(--ef-ice)" : "var(--ef-indigo-br)" }}>
                {entryA.score_final >= entryB.score_final ? nameA : nameB}
              </span> · {Math.abs(entryA.score_final - entryB.score_final).toFixed(1)} pts de diferença
            </span>
          ) : (
            <span style={{ fontFamily: "var(--ef-font-mono)", fontSize: 10, color: "var(--ef-ghost)" }}>// selecione 2 jogadores</span>
          )}
          <button
            onClick={onClose}
            style={{ fontFamily: "var(--ef-font-mono)", fontSize: 12, color: "var(--ef-fog)", background: "transparent", border: "1px solid var(--ef-border)", borderRadius: "var(--ef-radius-sm)", padding: "8px 16px", cursor: "pointer" }}
          >
            fechar
          </button>
        </div>
      </div>
    </div>
  );
}
