/**
 * RankCard — card médio para posições 4–11 e compacto para 12+
 * Rebrand "Estação de Altitude": avatares circulares, delta, altitude label
 */

import { type RankingEntry } from "../api/client";

/* Altitude string derivada do rank */
function altLabel(rank: number): string {
  if (rank <= 3) return "";
  if (rank <= 11) {
    const m = 7600 - (rank - 4) * 300;
    return `${m.toLocaleString("pt-BR")}M`;
  }
  return "BASE CAMP";
}

/* Delta indicator — mostra — quando backend ainda não envia rank_change */
function DeltaBadge({ delta }: { delta?: number | null }) {
  if (delta == null || delta === 0) {
    return <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--ef-ghost)" }}>—</span>;
  }
  const up = delta > 0;
  return (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: up ? "var(--ef-success)" : "var(--ef-danger)" }}>
      {up ? "▲" : "▼"}{Math.abs(delta)}
    </span>
  );
}

interface RankCardProps {
  entry: RankingEntry & { rank_change?: number | null };
  compact?: boolean;
  index?: number;
  onClick?: () => void;
}

export function RankCard({ entry, compact = false, index = 0, onClick }: RankCardProps) {
  const delayClass = index <= 12 ? `ef-delay-${index}` : "";
  const scoreW  = `${Math.round(entry.score_final)}%`;
  const combatW = `${Math.round(entry.score_combat)}%`;
  const duelW   = `${Math.round(entry.score_duel)}%`;
  const utilW   = `${Math.round(entry.score_utility)}%`;
  const alt     = altLabel(entry.rank);

  /* ── Modo compacto (12+) ── */
  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`ef-fade-in ${delayClass}`}
        style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "11px 18px",
          background: "var(--ef-card)",
          border: "1px solid var(--ef-border)",
          borderRadius: "var(--ef-radius-sm)",
          cursor: onClick ? "pointer" : undefined,
          transition: "background 0.18s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "var(--ef-card-hover)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "var(--ef-card)"; }}
      >
        {/* Rank + delta */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 17, color: "var(--ef-ghost)", fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' }}>
            {entry.rank}
          </span>
          <DeltaBadge delta={entry.rank_change} />
        </div>

        {/* Avatar circular */}
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: "linear-gradient(135deg, #0e2030, #1a3040)",
          border: "1px solid var(--ef-border)",
          overflow: "hidden", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--ef-fog)",
        }}>
          {entry.avatar_url
            ? <img src={entry.avatar_url} alt={entry.player_nickname} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : entry.avatar_initials}
        </div>

        {/* Nickname */}
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 18, color: "var(--ef-snow)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {entry.player_display_name || entry.player_nickname}
        </span>

        {/* Altitude */}
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--ef-ghost)", letterSpacing: 1, flexShrink: 0 }}>
          {alt}
        </span>

        {/* Stats */}
        <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
          {[
            { l: "K/D",  v: entry.kd_ratio.toFixed(2) },
            { l: "ADR",  v: entry.adr.toFixed(1) },
            { l: "RTG",  v: entry.hltv_rating.toFixed(2) },
          ].map(s => (
            <span key={s.l} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ef-ghost)", fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' }}>
              {s.l} <span style={{ color: "var(--ef-ice)" }}>{s.v}</span>
            </span>
          ))}
        </div>

        {/* Score + barra */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, width: 180, flexShrink: 0 }}>
          <div style={{ flex: 1, height: 3, background: "var(--ef-surface-2)" }}>
            <div style={{ height: "100%", width: scoreW, background: "linear-gradient(90deg, var(--ef-glacier), #6366f1)" }} />
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 20, color: "var(--ef-ice)", width: 30, textAlign: "right", fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' }}>
            {Math.round(entry.score_final)}
          </span>
        </div>
      </div>
    );
  }

  /* ── Modo card (4–11) ── */
  return (
    <div
      onClick={onClick}
      className={`ef-fade-in ef-card ${delayClass}`}
      style={{
        border: "1px solid var(--ef-border)",
        background: "var(--ef-card)",
        borderRadius: "var(--ef-radius-md)",
        padding: 16,
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      {/* Header: rank + delta + avatar + nick + score */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        {/* Rank + delta */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24, flexShrink: 0 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 20, color: "var(--ef-ghost)", fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' }}>
            {entry.rank}
          </span>
          <DeltaBadge delta={entry.rank_change} />
        </div>

        {/* Avatar circular */}
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "linear-gradient(135deg, #0e2030, #1a3040)",
          border: "1px solid var(--ef-border)",
          overflow: "hidden", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--ef-fog)",
        }}>
          {entry.avatar_url
            ? <img src={entry.avatar_url} alt={entry.player_nickname} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : entry.avatar_initials}
        </div>

        {/* Nickname + level */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 18, color: "var(--ef-snow)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {entry.player_display_name || entry.player_nickname}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--ef-ghost)", fontVariantNumeric: "tabular-nums" }}>
              K/D {entry.kd_ratio.toFixed(2)}
            </span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 9, letterSpacing: "0.5px", color: "#8a6500", background: "rgba(224,168,46,.08)", border: "1px solid rgba(224,168,46,.2)", padding: "0 4px" }}>
              {entry.level_name.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Score */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 26, color: "var(--ef-ice)", fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"', lineHeight: 1 }}>
            {Math.round(entry.score_final)}
          </span>
          {alt && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--ef-ghost)", letterSpacing: 1 }}>
              {alt}
            </span>
          )}
        </div>
      </div>

      {/* Score bar */}
      <div style={{ height: 3, background: "var(--ef-surface-2)", marginBottom: 10, borderRadius: 2 }}>
        <div className="ef-bar-grow" style={{ height: "100%", background: "linear-gradient(90deg, var(--ef-glacier), #6366f1)", width: scoreW, borderRadius: 2 }} />
      </div>

      {/* Category bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {[
          { color: "#0e7490", width: combatW, score: Math.round(entry.score_combat) },
          { color: "#6366f1", width: duelW,   score: Math.round(entry.score_duel) },
          { color: "#e0a82e", width: utilW,   score: Math.round(entry.score_utility) },
        ].map((c, ci) => (
          <div key={ci} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 4, height: 4, background: c.color, borderRadius: "50%", flexShrink: 0 }} />
            <div style={{ flex: 1, height: 3, background: "var(--ef-surface-2)", borderRadius: 2 }}>
              <div className="ef-bar-grow" style={{ height: "100%", background: c.color, width: c.width, borderRadius: 2 }} />
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "var(--ef-ghost)", width: 18, textAlign: "right", fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' }}>
              {c.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
