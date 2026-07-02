/**
 * PlayerDetailModal — rebrand "Estação de Altitude" (#3a)
 * 980px · backdrop blur · header com count-up rating · grid radar+categorias
 */

import { useEffect, useState } from "react";
import { type RankingEntry } from "../api/client";
import { RadarChart } from "./RadarChart";
import { CategoryBar } from "./CategoryBar";

interface PlayerDetailModalProps {
  entry: RankingEntry;
  allEntries: RankingEntry[];
  onClose: () => void;
}

const WEIGHT_COMBAT  = 0.30;
const WEIGHT_DUEL    = 0.36;
const WEIGHT_UTILITY = 0.34;

const INVERTED_KEYS = new Set<keyof RankingEntry>(["deaths", "time_to_kill_ms", "opening_deaths"]);

const JUDGABLE_METRICS: { key: keyof RankingEntry; label: string; inverted?: boolean }[] = [
  { key: "hltv_rating",    label: "RATING" },
  { key: "adr",            label: "ADR" },
  { key: "kast_percent",   label: "KAST%" },
  { key: "opening_kills",  label: "OPENING KILLS" },
  { key: "opening_deaths", label: "OPENING DEATHS", inverted: true },
  { key: "mvps",           label: "MVPs" },
  { key: "trade_kills",    label: "TRADE KILLS" },
  { key: "trade_denials",  label: "TRADE DENIALS" },
  { key: "flash_assists",  label: "FLASH ASSISTS" },
  { key: "fire_damage",    label: "DANO MOLOTOV" },
  { key: "grenade_damage", label: "DANO GRANADA" },
  { key: "deaths",         label: "DEATHS", inverted: true },
  { key: "time_to_kill_ms",label: "TTK", inverted: true },
];

interface StatItem { label: string; value: string; key: keyof RankingEntry }
interface StatGroup { label: string; color: string; accent: string; stats: StatItem[] }

function numOf(entry: RankingEntry, key: keyof RankingEntry): number {
  const v = entry[key];
  return typeof v === "number" ? v : 0;
}

function groupAverage(entries: RankingEntry[], key: keyof RankingEntry): number {
  if (!entries.length) return 0;
  return entries.reduce((sum, e) => sum + numOf(e, key), 0) / entries.length;
}

function useCountUp(target: number, duration = 800, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setValue(target); return; }
    const timeout = setTimeout(() => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(2, -10 * p);
        setValue(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick); else setValue(target);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return value;
}

export function PlayerDetailModal({ entry, allEntries, onClose }: PlayerDetailModalProps) {
  const displayScore = useCountUp(Math.round(entry.score_final), 800, 300);

  const groups: StatGroup[] = [
    {
      label: "COMBATE", color: "#0e7490", accent: "#22d3ee",
      stats: [
        { label: "K/D",          value: entry.kd_ratio.toFixed(2),        key: "kd_ratio" },
        { label: "KILLS",        value: String(entry.kills),               key: "kills" },
        { label: "DEATHS",       value: String(entry.deaths),              key: "deaths" },
        { label: "ASSISTS",      value: String(entry.assists),             key: "assists" },
        { label: "DANO TOTAL",   value: String(entry.damage_total),        key: "damage_total" },
        { label: "ADR",          value: entry.adr.toFixed(1),              key: "adr" },
        { label: "ADR +/-",      value: entry.adr_difference.toFixed(1),   key: "adr_difference" },
        { label: "RATING",       value: entry.hltv_rating.toFixed(2),      key: "hltv_rating" },
        { label: "KAST%",        value: `${entry.kast_percent.toFixed(0)}%`, key: "kast_percent" },
        { label: "ECO KILLS",    value: String(entry.eco_kills),           key: "eco_kills" },
        { label: "DESVANTAGEM K",value: String(entry.disadvantage_kills),  key: "disadvantage_kills" },
        { label: "VANTAGEM K",   value: String(entry.advantage_kills),     key: "advantage_kills" },
      ],
    },
    {
      label: "DUELOS", color: "#6366f1", accent: "#818cf8",
      stats: [
        { label: "OPENING KILLS", value: String(entry.opening_kills),    key: "opening_kills" },
        { label: "OPENING DEATHS",value: String(entry.opening_deaths),   key: "opening_deaths" },
        { label: "MVPs",          value: String(entry.mvps),             key: "mvps" },
        { label: "TRADE KILLS",   value: String(entry.trade_kills),      key: "trade_kills" },
        { label: "TRADE DENIALS", value: String(entry.trade_denials),    key: "trade_denials" },
        { label: "TTK (MS)",      value: entry.time_to_kill_ms.toFixed(0), key: "time_to_kill_ms" },
      ],
    },
    {
      label: "UTILITY", color: "#e0a82e", accent: "#e8b948",
      stats: [
        { label: "FLASH ASSISTS", value: String(entry.flash_assists),    key: "flash_assists" },
        { label: "DANO GRANADA",  value: String(entry.grenade_damage),   key: "grenade_damage" },
        { label: "HE HIT",        value: String(entry.he_enemies_hit),   key: "he_enemies_hit" },
        { label: "FIRE HIT",      value: String(entry.fire_enemies_hit), key: "fire_enemies_hit" },
        { label: "DANO MOLOTOV",  value: String(entry.fire_damage),      key: "fire_damage" },
      ],
    },
  ];

  const breakdown = [
    { label: "COMBATE", color: "#22d3ee", bg: "rgba(34,211,238,0.06)",  border: "rgba(34,211,238,0.18)", score: entry.score_combat,  weight: WEIGHT_COMBAT },
    { label: "DUELOS",  color: "#818cf8", bg: "rgba(129,140,248,0.06)", border: "rgba(129,140,248,0.18)", score: entry.score_duel,    weight: WEIGHT_DUEL },
    { label: "UTILITY", color: "#e8b948", bg: "rgba(232,185,72,0.06)",  border: "rgba(232,185,72,0.18)", score: entry.score_utility, weight: WEIGHT_UTILITY },
  ].map(c => ({ ...c, pts: c.score * c.weight }));
  const strongestCategory = breakdown.reduce((a, b) => (b.pts > a.pts ? b : a));

  const group = allEntries.length ? allEntries : [entry];
  let best: { label: string; deltaPct: number } | null = null;
  let worst: { label: string; deltaPct: number } | null = null;
  for (const m of JUDGABLE_METRICS) {
    const avg = groupAverage(group, m.key);
    if (avg === 0) continue;
    const raw = numOf(entry, m.key);
    const deltaPct = ((raw - avg) / avg) * 100;
    const goodness = m.inverted ? -deltaPct : deltaPct;
    if (!best || goodness > best.deltaPct) best = { label: m.label, deltaPct: goodness };
    if (!worst || goodness < worst.deltaPct) worst = { label: m.label, deltaPct: goodness };
  }

  const sorted = [...group].sort((a, b) => a.rank - b.rank);
  const idx = sorted.findIndex(e => e.player_id === entry.player_id);
  const better = idx > 0 ? sorted[idx - 1] : null;
  const worse = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(4,7,12,0.72)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24, overflowY: "auto" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        position: "relative", width: 980, maxWidth: "100%",
        background: "var(--ef-bg-elevated)",
        border: "1px solid var(--ef-border)",
        borderRadius: "var(--ef-radius-lg)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        maxHeight: "92vh", overflowY: "auto",
      }}>
        {/* Barra teal no topo */}
        <div style={{ position: "sticky", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, transparent, var(--ef-glacier-br), transparent)", borderRadius: "var(--ef-radius-lg) var(--ef-radius-lg) 0 0", zIndex: 2 }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "28px 32px 22px", borderBottom: "1px solid var(--ef-border)" }}>
          {/* Avatar circular 76px */}
          <div style={{
            width: 76, height: 76, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #0e7490, #22d3ee)",
            boxShadow: "0 0 32px rgba(34,211,238,0.30)",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
            fontFamily: "var(--ef-font-display)", fontWeight: 800, fontSize: 28, color: "#060a10",
          }}>
            {entry.avatar_url
              ? <img src={entry.avatar_url} alt={entry.player_nickname} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : entry.avatar_initials}
          </div>

          {/* Nickname + pills */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--ef-font-display)", fontWeight: 900, fontSize: 40, letterSpacing: 3, color: "var(--ef-summit)", lineHeight: 1 }}>
              {entry.player_display_name || entry.player_nickname}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              {/* Posição + altitude */}
              <span style={{ fontFamily: "var(--ef-font-mono)", fontSize: 11, color: "var(--ef-ice)", background: "var(--ef-glacier-dim)", border: "1px solid rgba(34,211,238,0.25)", borderRadius: "var(--ef-radius-sm)", padding: "3px 10px" }}>
                #{entry.rank} · {entry.rank === 1 ? "8 849M" : entry.rank === 2 ? "8 400M" : entry.rank === 3 ? "8 000M" : `${Math.max(5000, 7600 - (entry.rank - 4) * 300)}M`}
              </span>
              {/* Nível */}
              <span style={{ fontFamily: "var(--ef-font-mono)", fontSize: 11, color: "#e8b948", background: "rgba(224,168,46,0.08)", border: "1px solid rgba(224,168,46,0.25)", borderRadius: "var(--ef-radius-sm)", padding: "3px 10px" }}>
                {entry.level_name.toUpperCase()}
              </span>
              {/* Partidas */}
              <span style={{ fontFamily: "var(--ef-font-mono)", fontSize: 11, color: "var(--ef-fog)", padding: "3px 0" }}>
                {entry.total_matches} partidas · K/D {entry.kd_ratio.toFixed(2)}
              </span>
            </div>
          </div>

          {/* EF Rating (count-up) */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 10, letterSpacing: "2px", color: "var(--ef-ghost)", marginBottom: 2 }}>EF RATING</div>
            <div style={{ fontFamily: "var(--ef-font-mono)", fontWeight: 700, fontSize: 52, color: "var(--ef-glacier-br)", lineHeight: 1, textShadow: "0 0 40px rgba(34,211,238,0.35)", fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' }}>
              {displayScore}
            </div>
          </div>

          {/* Botão fechar */}
          <button
            onClick={onClose}
            style={{ width: 36, height: 36, flexShrink: 0, background: "transparent", border: "1px solid var(--ef-border)", borderRadius: "var(--ef-radius-sm)", color: "var(--ef-ghost)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "flex-start" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ef-border-hover)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ef-fog)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ef-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ef-ghost)"; }}
          >
            ✕
          </button>
        </div>

        {/* Corpo grid 360px + 1fr */}
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24, padding: "24px 32px" }}>

          {/* ─── Coluna esquerda: radar + stats rápidos ─── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Card radar */}
            <div style={{ background: "var(--ef-card)", borderRadius: "var(--ef-radius-md)", padding: 20, border: "1px solid var(--ef-border)" }}>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <RadarChart
                  adr={entry.score_combat}
                  kast={entry.kast_percent}
                  rating={entry.hltv_rating * 50}
                  openK={entry.score_duel}
                  trade={Math.min(entry.kd_ratio * 33, 100)}
                  util={entry.score_utility}
                  color="#22d3ee"
                  size={200}
                />
              </div>
              {/* 3 stats resumo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, marginTop: 16, background: "var(--ef-border)", borderRadius: "var(--ef-radius-sm)", overflow: "hidden" }}>
                {[
                  { label: "K/D",   value: entry.kd_ratio.toFixed(2) },
                  { label: "ADR",   value: entry.adr.toFixed(1) },
                  { label: "KAST%", value: `${entry.kast_percent.toFixed(0)}%` },
                ].map(s => (
                  <div key={s.label} style={{ background: "var(--ef-card)", padding: "10px 6px", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--ef-font-mono)", fontWeight: 700, fontSize: 16, color: "var(--ef-snow)", fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' }}>{s.value}</div>
                    <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 9, letterSpacing: "1.5px", color: "var(--ef-ghost)", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Por que esse rank? */}
            <div style={{ background: "var(--ef-card)", border: "1px solid var(--ef-border)", borderRadius: "var(--ef-radius-md)", padding: "16px 18px" }}>
              <div style={{ fontFamily: "var(--ef-font-display)", fontWeight: 700, fontSize: 13, letterSpacing: "2px", color: "var(--ef-fog)", marginBottom: 12 }}>
                POR QUE #{entry.rank}?
              </div>
              {/* Breakdown pts */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {breakdown.map(b => (
                  <div key={b.label} style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: b.label === strongestCategory.label ? b.bg : "transparent", border: `1px solid ${b.label === strongestCategory.label ? b.border : "transparent"}`, borderRadius: "var(--ef-radius-sm)" }}>
                    <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 8, letterSpacing: "1px", color: "var(--ef-ghost)" }}>{b.label} · {Math.round(b.weight * 100)}%</div>
                    <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 15, fontWeight: 700, color: b.color, marginTop: 2 }}>{b.pts.toFixed(1)}</div>
                  </div>
                ))}
              </div>
              {/* Frase automática */}
              {best && worst && (
                <div style={{ fontSize: 11, lineHeight: 1.6, color: "var(--ef-fog)", marginBottom: 10 }}>
                  Destaque em <strong style={{ color: "var(--ef-ice)" }}>{best.label}</strong>
                  {best.deltaPct >= 0 ? ` (+${best.deltaPct.toFixed(0)}% da média)` : ""}.
                  {" "}Melhorar: <strong style={{ color: "#e8b948" }}>{worst.label}</strong>
                  {worst.deltaPct < 0 ? ` (${Math.abs(worst.deltaPct).toFixed(0)}% abaixo)` : ""}.
                </div>
              )}
              {/* Gap ranking */}
              {(better || worse) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, fontFamily: "var(--ef-font-mono)", fontSize: 10 }}>
                  {better && (
                    <div style={{ color: "var(--ef-ghost)" }}>
                      ▼ <span style={{ color: "#e8b948" }}>-{(better.score_final - entry.score_final).toFixed(1)} pts</span> p/ alcançar #{better.rank}
                    </div>
                  )}
                  {worse && (
                    <div style={{ color: "var(--ef-ghost)" }}>
                      ▲ <span style={{ color: "var(--ef-ice)" }}>+{(entry.score_final - worse.score_final).toFixed(1)} pts</span> de vantagem s/ #{worse.rank}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ─── Coluna direita: categorias + métricas ─── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Card CATEGORIAS */}
            <div style={{ background: "var(--ef-card)", border: "1px solid var(--ef-border)", borderRadius: "var(--ef-radius-md)", padding: "16px 20px" }}>
              <div style={{ fontFamily: "var(--ef-font-display)", fontWeight: 700, fontSize: 13, letterSpacing: "2px", color: "var(--ef-fog)", marginBottom: 14 }}>
                CATEGORIAS
              </div>
              <CategoryBar label="COMBATE" value={entry.score_combat}  color="#0e7490" textColor="#22d3ee" height={6} />
              <CategoryBar label="DUELOS"  value={entry.score_duel}    color="#6366f1" textColor="#818cf8" height={6} />
              <CategoryBar label="UTILITY" value={entry.score_utility} color="#e0a82e" textColor="#e8b948" height={6} />
            </div>

            {/* Métricas cruas por grupo */}
            <div style={{ background: "var(--ef-card)", border: "1px solid var(--ef-border)", borderRadius: "var(--ef-radius-md)", padding: "16px 20px", flex: 1 }}>
              <div style={{ fontFamily: "var(--ef-font-display)", fontWeight: 700, fontSize: 13, letterSpacing: "2px", color: "var(--ef-fog)", marginBottom: 14 }}>
                MÉTRICAS DETALHADAS
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {groups.map(g => (
                  <div key={g.label} style={{ flex: "1 1 140px", minWidth: 130 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ width: 6, height: 6, background: g.color, borderRadius: "50%" }} />
                      <span style={{ fontFamily: "var(--ef-font-display)", fontWeight: 700, fontSize: 11, letterSpacing: "2px", color: "var(--ef-fog)" }}>{g.label}</span>
                    </div>
                    <div style={{ border: "1px solid var(--ef-border)", borderRadius: "var(--ef-radius-sm)", overflow: "hidden" }}>
                      {g.stats.map((s, i) => {
                        const avg = groupAverage(group, s.key);
                        const raw = numOf(entry, s.key);
                        const diff = raw - avg;
                        const showDelta = Math.abs(diff) >= 0.05;
                        const isGood = INVERTED_KEYS.has(s.key) ? diff < 0 : diff > 0;
                        return (
                          <div key={s.label} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 6, alignItems: "center", padding: "5px 8px", background: i % 2 === 0 ? "var(--ef-surface-2)" : "var(--ef-card)" }}>
                            <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 9, color: "var(--ef-ghost)" }}>{s.label}</div>
                            {showDelta && (
                              <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 8, color: isGood ? "var(--ef-success)" : "var(--ef-danger)" }}>
                                {diff > 0 ? "▲" : "▼"}
                              </div>
                            )}
                            <div style={{ fontFamily: "var(--ef-font-mono)", fontWeight: 700, fontSize: 11, color: "var(--ef-snow)", fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' }}>
                              {s.value}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderTop: "1px solid var(--ef-border)", background: "rgba(6,10,16,0.4)" }}>
          <span style={{ fontFamily: "var(--ef-font-mono)", fontSize: 10, color: "var(--ef-ghost)" }}>
            // dados de {entry.total_matches} partidas · {entry.xp_total.toLocaleString()} XP acumulado
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{ fontFamily: "var(--ef-font-mono)", fontSize: 12, color: "var(--ef-fog)", background: "transparent", border: "1px solid var(--ef-border)", borderRadius: "var(--ef-radius-sm)", padding: "8px 16px", cursor: "pointer" }}
            >
              fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
