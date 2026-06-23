/**
 * RankCard — card médio para posições 4–11 e card compacto para 12+
 *
 * Modo "compact" reduz a altura para listagem densa (12º em diante).
 */

import { type RankingEntry } from "../api/client";
import { CategoryBar } from "./CategoryBar";

interface RankCardProps {
  entry: RankingEntry;
  compact?: boolean;
}

export function RankCard({ entry, compact = false }: RankCardProps) {
  if (compact) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 14px",
          border: "1px solid #161616",
          background: "#0a0a0a",
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: "#4a4a4a",
            minWidth: 22,
          }}
        >
          {String(entry.rank).padStart(2, "0")}
        </span>
        <div
          style={{
            width: 22,
            height: 22,
            background: "#181818",
            border: "1px solid #2a2a2a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: "#888",
          }}
        >
          {entry.avatar_initials}
        </div>
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 600, color: "#d0d0d0", flex: 1 }}>
          {entry.player_nickname}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#6a6a6a" }}>
          K/D {entry.kd_ratio.toFixed(2)}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 15,
            fontWeight: 700,
            color: "#c0c0c0",
            minWidth: 30,
            textAlign: "right",
          }}
        >
          {Math.round(entry.score_final)}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #1a1a1a",
        background: "#0a0a0a",
        padding: "14px 16px",
        position: "relative",
      }}
    >
      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            color: "#4a4a4a",
            minWidth: 24,
          }}
        >
          {String(entry.rank).padStart(2, "0")}
        </span>
        <div
          style={{
            width: 24,
            height: 24,
            background: "#141414",
            border: "1px solid #2a2a2a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: "#888",
          }}
        >
          {entry.avatar_initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, color: "#e0e0e0", lineHeight: 1.1 }}>
            {entry.player_nickname.length > 8 ? entry.player_nickname.slice(0, 7) + "…" : entry.player_nickname}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#5a5a5a" }}>
            K/D {entry.kd_ratio.toFixed(2)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "#d0d0d0", lineHeight: 1 }}>
            {Math.round(entry.score_final)}
          </div>
        </div>
      </div>

      {/* Barras */}
      <CategoryBar label="COMBATE" value={entry.score_combat} color="#cc2200" />
      <CategoryBar label="DUELOS" value={entry.score_duel} color="#7c3aed" />
      <CategoryBar label="UTILITY" value={entry.score_utility} color="#e0a82e" />
    </div>
  );
}
