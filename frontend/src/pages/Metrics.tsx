/**
 * Métricas — página /metrics
 *
 * Leaderboard por métrica crua (sem score combinado): escolhe uma métrica
 * (kills, ADR, trades, dano de granada...) e vê o ranking só daquela métrica.
 * Carrega o mesmo GET /api/ranking já usado no Dashboard — sem endpoint novo.
 */

import { useEffect, useState } from "react";
import { rankingApi, type RankingEntry } from "../api/client";
import { Navbar } from "../components/Navbar";
import { PlayerDetailModal } from "../components/PlayerDetailModal";

type MetricKey =
  | "kills" | "deaths" | "assists" | "damage_total" | "adr" | "adr_difference"
  | "hltv_rating" | "kast_percent" | "disadvantage_kills" | "advantage_kills" | "eco_kills"
  | "opening_kills" | "opening_deaths" | "mvps" | "trade_kills" | "trade_denials" | "time_to_kill_ms"
  | "flash_assists" | "grenade_damage" | "he_enemies_hit" | "fire_enemies_hit" | "fire_damage";

type Category = "combat" | "duel" | "utility";

interface MetricDef {
  key: MetricKey;
  label: string;
  category: Category;
  inverted?: boolean;
  format: (v: number) => string;
}

const CATEGORY_COLOR: Record<Category, string> = { combat: "#0e7490", duel: "#6366f1", utility: "#e0a82e" };
const CATEGORY_BRIGHT: Record<Category, string> = { combat: "#22d3ee", duel: "#818cf8", utility: "#e8b948" };

const METRICS: MetricDef[] = [
  { key: "kills",              label: "KILLS",          category: "combat", format: v => String(v) },
  { key: "deaths",              label: "DEATHS",         category: "combat", inverted: true, format: v => String(v) },
  { key: "assists",             label: "ASSISTS",        category: "combat", format: v => String(v) },
  { key: "damage_total",        label: "DANO TOTAL",     category: "combat", format: v => String(v) },
  { key: "adr",                 label: "ADR",            category: "combat", format: v => v.toFixed(1) },
  { key: "adr_difference",      label: "ADR +/-",        category: "combat", format: v => v.toFixed(1) },
  { key: "hltv_rating",         label: "RATING",         category: "combat", format: v => v.toFixed(2) },
  { key: "kast_percent",        label: "KAST%",          category: "combat", format: v => `${v.toFixed(0)}%` },
  { key: "disadvantage_kills",  label: "DESVANTAGEM K",  category: "combat", format: v => String(v) },
  { key: "advantage_kills",     label: "VANTAGEM K",     category: "combat", format: v => String(v) },
  { key: "eco_kills",           label: "ECO KILLS",      category: "combat", format: v => String(v) },
  { key: "opening_kills",       label: "OPENING KILLS",  category: "duel", format: v => String(v) },
  { key: "opening_deaths",      label: "OPENING DEATHS", category: "duel", inverted: true, format: v => String(v) },
  { key: "mvps",                label: "MVPs",           category: "duel", format: v => String(v) },
  { key: "trade_kills",         label: "TRADE KILLS",    category: "duel", format: v => String(v) },
  { key: "trade_denials",       label: "TRADE DENIALS",  category: "duel", format: v => String(v) },
  { key: "time_to_kill_ms",     label: "TTK (MS)",       category: "duel", inverted: true, format: v => v.toFixed(0) },
  { key: "flash_assists",       label: "FLASH ASSISTS",  category: "utility", format: v => String(v) },
  { key: "grenade_damage",      label: "DANO GRANADA",   category: "utility", format: v => String(v) },
  { key: "he_enemies_hit",      label: "HE HIT",         category: "utility", format: v => String(v) },
  { key: "fire_enemies_hit",    label: "FIRE HIT",       category: "utility", format: v => String(v) },
  { key: "fire_damage",         label: "DANO MOLOTOV",   category: "utility", format: v => String(v) },
];

export function Metrics() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState<MetricKey>("kills");
  const [selectedEntry, setSelectedEntry] = useState<RankingEntry | null>(null);

  useEffect(() => {
    rankingApi.get().then(setRanking).catch(console.error).finally(() => setLoading(false));
  }, []);

  const active = METRICS.find(m => m.key === activeKey)!;
  const sorted = [...ranking].sort((a, b) => {
    const diff = (a[active.key] as number) - (b[active.key] as number);
    return active.inverted ? diff : -diff;
  });
  const maxValue = Math.max(1, ...sorted.map(e => Math.abs(e[active.key] as number)));

  return (
    <div style={{ minHeight: "100vh", background: "var(--ef-bg)", color: "var(--ef-snow)", fontFamily: "'Inter', sans-serif", paddingBottom: 64 }}>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "var(--ef-aurora)" }} />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 3px, rgba(0,0,0,0.10) 4px, rgba(0,0,0,0) 5px)", opacity: 0.2 }} />

      <Navbar />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 48px 0", position: "relative", zIndex: 10 }}>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ef-ghost)", letterSpacing: "0.5px", marginBottom: 4 }}>
            // métricas · leaderboard por métrica
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, fontWeight: 900, color: "var(--ef-summit)", letterSpacing: "2px", lineHeight: 1 }}>
            MÉTRICAS
          </div>
        </div>

        {/* Pills de seleção de métrica */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 26 }}>
          {METRICS.map(m => {
            const isActive = m.key === activeKey;
            const color = CATEGORY_COLOR[m.category];
            const bright = CATEGORY_BRIGHT[m.category];
            return (
              <button
                key={m.key}
                onClick={() => setActiveKey(m.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  border: `1px solid ${isActive ? color : "#1e2a36"}`,
                  background: isActive ? `${color}22` : "#0d1218",
                  padding: "8px 12px", cursor: "pointer",
                }}
              >
                <span style={{ width: 6, height: 6, background: color, flexShrink: 0 }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: "1px", fontWeight: 700, color: isActive ? bright : "#6a7a8d" }}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>

        {active.inverted && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "#566476", marginBottom: 14 }}>
            ↓ menor é melhor
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: 80, fontFamily: "'JetBrains Mono', monospace", color: "var(--ef-ghost)" }}>
            carregando...
          </div>
        )}

        {!loading && sorted.length === 0 && (
          <div style={{ textAlign: "center", padding: 80, fontFamily: "'JetBrains Mono', monospace", color: "var(--ef-ghost)" }}>
            nenhum jogador com partidas registradas ainda
          </div>
        )}

        {!loading && sorted.length > 0 && (
          <div style={{ border: "1px solid var(--ef-border)", background: "var(--ef-card)", marginBottom: 24 }}>
            {sorted.map((e, i) => {
              const value = e[active.key] as number;
              const barW = `${Math.min(100, Math.round((Math.abs(value) / maxValue) * 100))}%`;
              return (
                <div
                  key={e.player_id}
                  onClick={() => setSelectedEntry(e)}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "13px 18px", borderBottom: "1px solid #141b23",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, color: "var(--ef-ghost)", width: 26 }}>
                    {i + 1}
                  </span>
                  <div style={{
                    width: 30, height: 30, border: "1px solid #1d2833", background: "#0d1218",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, color: "#9aabbd", flexShrink: 0,
                  }}>
                    {e.avatar_initials}
                  </div>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 19, color: "#c6d2e0", width: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {e.player_nickname}
                  </span>
                  <div style={{ flex: 1, height: 4, background: "#151d26" }}>
                    <div style={{ height: "100%", width: barW, background: CATEGORY_COLOR[active.category] }} />
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 18, color: CATEGORY_BRIGHT[active.category], width: 70, textAlign: "right" }}>
                    {active.format(value)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedEntry && (
        <PlayerDetailModal entry={selectedEntry} allEntries={ranking} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  );
}
