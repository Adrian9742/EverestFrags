/**
 * PodiumCard — card grande para as posições 1, 2, 3 do ranking
 *
 * Exibe: posição, iniciais, nick, partidas, K/D, radar hexagonal,
 * barras de categoria e pills de ADR/Rating/KAST%.
 *
 * Cores por posição: 1º vermelho, 2º cinza claro, 3º dourado
 */

import { type RankingEntry } from "../api/client";
import { RadarChart } from "./RadarChart";
import { CategoryBar } from "./CategoryBar";

const POSITION_COLORS = ["#cc2200", "#aaaaaa", "#e0a82e"];
const POSITION_BORDER = ["rgba(204,34,0,0.4)", "rgba(170,170,170,0.2)", "rgba(224,168,46,0.3)"];

interface PodiumCardProps {
  entry: RankingEntry;
}

export function PodiumCard({ entry }: PodiumCardProps) {
  const idx = entry.rank - 1;
  const color = POSITION_COLORS[idx] ?? "#cc2200";
  const borderColor = POSITION_BORDER[idx] ?? "rgba(204,34,0,0.3)";
  const rankLabel = String(entry.rank).padStart(2, "0");

  return (
    <div
      style={{
        flex: 1,
        minWidth: 220,
        border: `1px solid ${borderColor}`,
        background: "#0d0d0d",
        padding: "20px 20px 16px",
        position: "relative",
      }}
    >
      {/* Linha superior colorida */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color }} />

      {/* Posição + iniciais + nick */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 36,
            fontWeight: 800,
            color,
            lineHeight: 1,
            minWidth: 48,
          }}
        >
          {rankLabel}
        </span>
        <div
          style={{
            width: 28,
            height: 28,
            background: color + "22",
            border: `1px solid ${color}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 700,
            color,
          }}
        >
          {entry.avatar_initials}
        </div>
        <div>
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: "#f4f4f4",
              lineHeight: 1.1,
            }}
          >
            {entry.player_nickname}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#6a6a6a", marginTop: 2 }}>
            {entry.total_matches} partidas · K/D {entry.kd_ratio.toFixed(2)}
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 32, fontWeight: 700, color: "#f4f4f4", lineHeight: 1 }}>
            {Math.round(entry.score_final)}
          </div>
          <div style={{ fontSize: 9, letterSpacing: "2px", color: "#6a6a6a" }}>SCORE</div>
        </div>
      </div>

      {/* Radar */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <RadarChart
          adr={entry.score_combat}
          kast={entry.kast_percent}
          rating={entry.hltv_rating * 50}
          openK={entry.score_duel}
          trade={entry.score_duel}
          util={entry.score_utility}
          color={color}
          size={110}
        />
      </div>

      {/* Barras de categoria */}
      <CategoryBar label="COMBATE" value={entry.score_combat} color="#cc2200" />
      <CategoryBar label="DUELOS" value={entry.score_duel} color="#7c3aed" />
      <CategoryBar label="UTILITY" value={entry.score_utility} color="#e0a82e" />

      {/* Pills de stats */}
      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        {[
          { label: "ADR", value: entry.adr.toFixed(1) },
          { label: "RATING", value: entry.hltv_rating.toFixed(2) },
          { label: "KAST%", value: entry.kast_percent.toFixed(0) },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              flex: 1,
              border: "1px solid #1f1f1f",
              background: "#0a0a0a",
              padding: "5px 6px",
              textAlign: "center",
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: "#e8e8e8" }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 8, letterSpacing: "1.5px", color: "#5a5a5a", marginTop: 1 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
