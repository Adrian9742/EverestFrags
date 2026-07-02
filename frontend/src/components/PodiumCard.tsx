import { useEffect, useState } from "react";
import { type RankingEntry } from "../api/client";
import { RadarChart } from "./RadarChart";
import { CategoryBar } from "./CategoryBar";

/* Paleta por posição — rebrand "Estação de Altitude" */
const ACCENT   = ["#22d3ee", "#9ddcf0", "#818cf8"];   /* 1º teal-br · 2º ice · 3º indigo-br */
const BORDER   = ["rgba(34,211,238,0.40)", "rgba(157,220,240,0.22)", "rgba(129,140,248,0.25)"];
const CARD_TOP = ["#101a26", "#0d141d", "#0d141d"];
const NUM_COL  = ["#22d3ee", "#9ddcf0", "#818cf8"];
const MEDAL    = ["01", "02", "03"];
const NICK_SZ  = [40,  28,  28];
const SCORE_SZ = [60,  34,  34];

interface PodiumCardProps { entry: RankingEntry; index?: number; onClick?: () => void }

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

export function PodiumCard({ entry, index = 0, onClick }: PodiumCardProps) {
  const i        = Math.min(entry.rank - 1, 2);
  const accent   = ACCENT[i];
  const border   = BORDER[i];
  const cardTop  = CARD_TOP[i];
  const numColor = NUM_COL[i];
  const is1st    = entry.rank === 1;
  const delayClass = `ef-delay-${index + 1}`;

  const displayScore = useCountUp(Math.round(entry.score_final), 800, is1st ? 600 : index * 200);

  const avatarSize = is1st ? 84 : 64;
  const nickSize   = NICK_SZ[i];
  const scoreSize  = SCORE_SZ[i];

  return (
    <div
      onClick={onClick}
      className={`ef-fade-in ef-card ${delayClass}`}
      style={{
        border: `1px solid ${border}`,
        background: `linear-gradient(180deg, ${cardTop}, #0d141d)`,
        padding: is1st ? "34px 24px 28px" : "24px",
        position: "relative",
        borderRadius: is1st ? 16 : 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: is1st ? 12 : 10,
        cursor: onClick ? "pointer" : undefined,
        overflow: is1st ? "visible" : "hidden",
        ...(is1st && { animation: "efFadeIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.6s both, efGlow 3s ease-in-out 1.4s infinite" }),
      }}
    >
      {/* Barra colorida no topo */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, borderRadius: is1st ? "16px 16px 0 0" : "12px 12px 0 0" }} />

      {/* Badge SUMMIT — só no 1º lugar */}
      {is1st && (
        <div className="ef-float" style={{
          position: "absolute", top: -16,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11, letterSpacing: 2, fontWeight: 700,
          color: "#060a10",
          background: "linear-gradient(135deg, #e8b948, #e0a82e)",
          borderRadius: 8, padding: "5px 14px",
          zIndex: 2,
        }}>
          ▲ SUMMIT
        </div>
      )}

      {/* Posição + altitude */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        color: is1st ? "#e8b948" : accent,
        fontVariantNumeric: "tabular-nums",
      }}>
        {MEDAL[i]} · {is1st ? "8 849M" : i === 1 ? "8 400M" : "8 000M"}
      </span>

      {/* Avatar circular */}
      <div style={{
        width: avatarSize, height: avatarSize,
        borderRadius: "50%",
        background: is1st
          ? "linear-gradient(135deg, #22d3ee, #6366f1)"
          : i === 1
            ? "linear-gradient(135deg, #0e7490, #9ddcf0)"
            : "linear-gradient(135deg, #6366f1, #818cf8)",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 800,
        fontSize: is1st ? 32 : 24,
        color: "#060a10",
        flexShrink: 0,
        boxShadow: is1st ? "0 0 32px rgba(34,211,238,0.35)" : undefined,
      }}>
        {entry.avatar_url
          ? <img src={entry.avatar_url} alt={entry.player_nickname} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : entry.avatar_initials}
      </div>

      {/* Nickname */}
      <span style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 900,
        fontSize: nickSize,
        letterSpacing: is1st ? "3px" : "2px",
        color: "#f0f9ff",
        lineHeight: 1,
        textAlign: "center",
      }}>
        {entry.player_display_name || entry.player_nickname}
      </span>

      {/* Score (count-up) */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
        fontSize: scoreSize,
        color: numColor,
        lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
        fontFeatureSettings: '"tnum"',
        ...(is1st && { textShadow: "0 0 40px rgba(34,211,238,0.4)" }),
      }}>
        {displayScore}
      </span>

      {/* Meta stats */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: "#45566b",
        fontVariantNumeric: "tabular-nums",
      }}>
        {entry.total_matches} partidas · K/D {entry.kd_ratio.toFixed(2)}
      </span>

      {/* Level badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 11, letterSpacing: "1px",
          color: "#e0a82e",
          background: "rgba(224,168,46,.1)",
          border: "1px solid rgba(224,168,46,.3)",
          padding: "1px 7px", borderRadius: 4,
        }}>
          {entry.level_name.toUpperCase()}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#4a5868" }}>
          {entry.xp_total.toLocaleString()} XP
        </span>
      </div>

      {/* Radar */}
      <div style={{ display: "flex", justifyContent: "center", margin: "4px 0 10px" }}>
        <RadarChart
          adr={entry.score_combat}
          kast={entry.kast_percent}
          rating={entry.hltv_rating * 50}
          openK={entry.score_duel}
          trade={Math.min(entry.kd_ratio * 33, 100)}
          util={entry.score_utility}
          color={accent}
          size={is1st ? 200 : 170}
        />
      </div>

      {/* Category bars */}
      <div style={{ width: "100%" }}>
        <CategoryBar label="COMBATE" value={entry.score_combat} color="#0e7490" textColor="#22d3ee" height={5} />
        <CategoryBar label="DUELOS"  value={entry.score_duel}   color="#6366f1" textColor="#818cf8" height={5} />
        <CategoryBar label="UTILITY" value={entry.score_utility} color="#e0a82e" textColor="#e8b948" height={5} />
      </div>

      {/* Stat pills */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "#1a222c", border: "1px solid #1a222c", borderRadius: 8, overflow: "hidden", width: "100%", marginTop: 4 }}>
        {[
          { label: "ADR",    value: entry.adr.toFixed(1) },
          { label: "RATING", value: entry.hltv_rating.toFixed(2) },
          { label: "KAST%",  value: entry.kast_percent.toFixed(0) },
        ].map(s => (
          <div key={s.label} style={{ background: "#0c1015", padding: "9px 6px", textAlign: "center" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: "#dde6f0", fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' }}>{s.value}</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "1.5px", color: "#475569", marginTop: 2, textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
