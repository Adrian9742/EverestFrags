/**
 * Dashboard — "Acampamento Base" (#1c)
 * Rebrand: compact title, hero última sessão, feed "Diário de Expedição",
 * coluna direita "No Topo", camadas atmosféricas.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  matchesApi,
  playersApi,
  rankingApi,
  displayNameOf,
  type MatchResponse,
  type PlayerResponse,
  type RankingEntry,
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { PlayerDetailModal } from "../components/PlayerDetailModal";
import { CompareModal } from "../components/CompareModal";

function entryName(entry: RankingEntry): string {
  return entry.player_display_name || entry.player_nickname;
}
function num(v: number, d = 1) { return Number.isFinite(v) ? v.toFixed(d) : "0"; }
function sc(v: number) { return Math.round(v || 0); }

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
function formatDateShort(date: string) {
  const d = new Date(date);
  const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  return `${days[d.getDay()]} ${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
}

function getBestBy(ranking: RankingEntry[], key: keyof RankingEntry) {
  if (!ranking.length) return null;
  return ranking.reduce((best, cur) => Number(cur[key] || 0) > Number(best[key] || 0) ? cur : best, ranking[0]);
}

/* ── Seção divider ── */
function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0 16px" }}>
      <span style={{ fontFamily: "var(--ef-font-display)", fontWeight: 700, fontSize: 13, letterSpacing: 3, color: "var(--ef-fog)", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(148,197,233,0.18), transparent)" }} />
    </div>
  );
}

/* ── Hero: última sessão ── */
function HeroSession({ match, mvp }: { match: MatchResponse; mvp: RankingEntry | null }) {
  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(180deg, #101a26, #0d141d)",
      border: "1px solid rgba(34,211,238,0.25)",
      borderRadius: "var(--ef-radius-lg)",
      padding: "28px 32px",
      overflow: "hidden",
    }}>
      {/* Barra teal no topo */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, transparent, var(--ef-glacier-br), transparent)" }} />
      {/* Glow de fundo */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, background: "radial-gradient(ellipse at 50% 110%, rgba(34,211,238,0.06), transparent 70%)", pointerEvents: "none" }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 24, position: "relative" }}>
        {/* Info da partida */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 11, color: "var(--ef-ghost)", marginBottom: 10 }}>
            // última sessão · {formatDate(match.played_at)} · {match.map_name || "mapa"}
          </div>

          {/* Mapa + jogadores como "placar" visual */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
            <span style={{ fontFamily: "var(--ef-font-display)", fontWeight: 900, fontSize: 32, letterSpacing: 2, color: "var(--ef-summit)" }}>
              {match.map_name || "Mapa"}
            </span>
            <span style={{ fontFamily: "var(--ef-font-mono)", fontWeight: 700, fontSize: 52, color: "var(--ef-glacier-br)", lineHeight: 1, fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' }}>
              {match.player_count}
            </span>
            <span style={{ fontFamily: "var(--ef-font-mono)", fontSize: 14, color: "var(--ef-ghost)" }}>jogadores</span>
          </div>

          {/* Pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--ef-font-mono)", fontSize: 10, letterSpacing: "1.5px", background: "rgba(34,211,238,0.10)", border: "1px solid rgba(34,211,238,0.25)", color: "var(--ef-ice)", borderRadius: "var(--ef-radius-sm)", padding: "3px 10px" }}>
              MIX #{match.id}
            </span>
            {match.notes && (
              <span style={{ fontFamily: "var(--ef-font-mono)", fontSize: 10, letterSpacing: "1px", background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.22)", color: "var(--ef-indigo-br)", borderRadius: "var(--ef-radius-sm)", padding: "3px 10px" }}>
                {match.notes.slice(0, 24)}
              </span>
            )}
            <Link
              to={`/matches/${match.id}`}
              style={{ fontFamily: "var(--ef-font-mono)", fontSize: 10, letterSpacing: "1px", color: "var(--ef-fog)", textDecoration: "none" }}
            >
              ver detalhes →
            </Link>
          </div>
        </div>

        {/* MVP mini-card */}
        {mvp && (
          <div style={{
            background: "rgba(224,168,46,0.08)",
            border: "1px solid rgba(224,168,46,0.25)",
            borderRadius: "var(--ef-radius-md)",
            padding: "14px 18px",
            textAlign: "center",
            flexShrink: 0,
            minWidth: 140,
          }}>
            <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 9, letterSpacing: "2px", color: "#e8b948", marginBottom: 10 }}>★ NO TOPO</div>
            {/* Avatar 52px */}
            <div style={{
              width: 52, height: 52, borderRadius: "50%", margin: "0 auto 10px",
              background: "linear-gradient(135deg, #0e7490, #22d3ee)",
              boxShadow: "0 0 20px rgba(224,168,46,0.30)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
              fontFamily: "var(--ef-font-display)", fontWeight: 800, fontSize: 18, color: "#060a10",
            }}>
              {mvp.avatar_url
                ? <img src={mvp.avatar_url} alt={entryName(mvp)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : mvp.avatar_initials}
            </div>
            <div style={{ fontFamily: "var(--ef-font-display)", fontWeight: 900, fontSize: 18, color: "var(--ef-summit)", lineHeight: 1 }}>
              {entryName(mvp)}
            </div>
            <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 9, color: "var(--ef-ghost)", marginTop: 5 }}>
              {sc(mvp.kills)}k · {sc(mvp.deaths)}d · {num(mvp.hltv_rating, 2)} rtg
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Feed card: partida ── */
function MatchCard({ match }: { match: MatchResponse }) {
  return (
    <Link
      viewTransition
      to={`/matches/${match.id}`}
      style={{
        display: "flex", alignItems: "center", gap: 16,
        background: "var(--ef-card)", border: "1px solid var(--ef-border)",
        borderRadius: "var(--ef-radius-md)", padding: "14px 18px",
        textDecoration: "none", color: "inherit",
        transition: "border-color 0.18s, background 0.18s",
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = "var(--ef-card-hover)"; el.style.borderColor = "var(--ef-border-hover)"; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = "var(--ef-card)"; el.style.borderColor = "var(--ef-border)"; }}
    >
      {/* Ícone mapa */}
      <div style={{
        width: 38, height: 38, background: "var(--ef-glacier-dim)", border: "1px solid rgba(34,211,238,0.18)",
        borderRadius: "var(--ef-radius-sm)", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--ef-font-display)", fontWeight: 800, fontSize: 13, color: "var(--ef-ice)",
      }}>
        {(match.map_name || "?").replace("de_", "").slice(0, 2).toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--ef-font-display)", fontWeight: 700, fontSize: 17, color: "var(--ef-snow)", lineHeight: 1 }}>
          {match.map_name || "Mapa não informado"}
        </div>
        <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 10, color: "var(--ef-ghost)", marginTop: 3 }}>
          // mix #{match.id} · {formatDate(match.played_at)} · {match.player_count} jogadores
        </div>
      </div>

      <span style={{ fontFamily: "var(--ef-font-mono)", fontSize: 11, color: "var(--ef-fog)" }}>→</span>
    </Link>
  );
}

/* ── Feed card: jogador em destaque ── */
function PlayerCard({ entry, subtitle, onOpen }: { entry: RankingEntry; subtitle: string; onOpen: () => void }) {
  return (
    <div
      onClick={onOpen}
      style={{
        display: "flex", alignItems: "center", gap: 16,
        background: "var(--ef-card)", border: "1px solid var(--ef-border)",
        borderRadius: "var(--ef-radius-md)", padding: "14px 18px",
        cursor: "pointer",
        transition: "border-color 0.18s, background 0.18s",
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = "var(--ef-card-hover)"; el.style.borderColor = "var(--ef-border-hover)"; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = "var(--ef-card)"; el.style.borderColor = "var(--ef-border)"; }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg, #0e7490, #22d3ee)",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        fontFamily: "var(--ef-font-display)", fontWeight: 800, fontSize: 14, color: "#060a10",
      }}>
        {entry.avatar_url
          ? <img src={entry.avatar_url} alt={entryName(entry)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : entry.avatar_initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--ef-font-display)", fontWeight: 700, fontSize: 17, color: "var(--ef-snow)", lineHeight: 1 }}>
          {entryName(entry)}
        </div>
        <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 10, color: "var(--ef-ghost)", marginTop: 3 }}>
          // {subtitle}
        </div>
      </div>

      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "var(--ef-font-mono)", fontWeight: 700, fontSize: 20, color: "var(--ef-ice)", fontVariantNumeric: "tabular-nums" }}>
          {sc(entry.score_final)}
        </div>
        <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 9, color: "var(--ef-ghost)" }}>score</div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { player, isAdmin } = useAuth();
  const [ranking, setRanking]       = useState<RankingEntry[]>([]);
  const [players, setPlayers]       = useState<PlayerResponse[]>([]);
  const [matches, setMatches]       = useState<MatchResponse[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<RankingEntry | null>(null);
  const [comparing, setComparing]   = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [rankingData, playersData, matchesData] = await Promise.all([
        rankingApi.get(),
        playersApi.list(),
        matchesApi.list(1, 6),
      ]);
      setRanking(rankingData);
      setPlayers(playersData);
      setMatches(matchesData.items);
      setTotalMatches(matchesData.total);
    } catch (e) {
      console.error("Erro ao carregar feed:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const leader    = ranking[0] ?? null;
  const topAdr    = useMemo(() => getBestBy(ranking, "adr"), [ranking]);
  const topDuel   = useMemo(() => getBestBy(ranking, "score_duel"), [ranking]);
  const topFrag   = useMemo(() => getBestBy(ranking, "kills"), [ranking]);
  const topUtil   = useMemo(() => getBestBy(ranking, "score_utility"), [ranking]);
  const topThree  = ranking.slice(0, 3);
  const lastMatch = matches[0] ?? null;
  const myEntry   = player ? ranking.find(r => r.player_id === player.id) ?? null : null;

  // Feed de atividades (partidas + destaques de jogadores intercalados)
  const feedPlayers = [leader, topAdr, topDuel]
    .filter(Boolean)
    .filter((e, i, arr) => arr.findIndex(x => x?.player_id === e?.player_id) === i) as RankingEntry[];

  return (
    <div style={{ minHeight: "100vh", background: "var(--ef-bg)", color: "var(--ef-snow)", fontFamily: "var(--ef-font-body)", position: "relative" }}>

      {/* Camadas atmosféricas */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "var(--ef-aurora)" }} />
      <svg style={{ position: "fixed", bottom: 0, left: 0, width: "100%", height: 240, pointerEvents: "none", zIndex: 0 }} viewBox="0 0 1440 240" preserveAspectRatio="none">
        <path d="M0,185 L120,105 L240,155 L380,75 L520,145 L680,45 L820,135 L960,85 L1100,155 L1240,95 L1360,145 L1440,115 L1440,240 L0,240 Z" fill="rgba(157,220,240,0.035)" />
        <path d="M0,215 L160,145 L300,195 L460,115 L620,185 L760,95 L920,175 L1080,125 L1240,185 L1440,145 L1440,240 L0,240 Z" fill="rgba(157,220,240,0.055)" />
      </svg>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.2, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.5) 0px, rgba(0,0,0,0.5) 1px, transparent 1px, transparent 3px)" }} />

      <Navbar />

      <main style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28, maxWidth: 1280, margin: "0 auto", padding: "32px 48px 64px", position: "relative", zIndex: 10 }}>

        {/* ─── Coluna principal ─── */}
        <div style={{ minWidth: 0 }}>

          {/* Compact page title */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: "var(--ef-font-mono)", fontSize: 11, color: "var(--ef-ghost)" }}>
                // acampamento base · {formatDateShort(new Date().toISOString())} · {players.length} expedicionários
              </span>
              <span style={{ fontFamily: "var(--ef-font-display)", fontWeight: 900, fontSize: 34, letterSpacing: 2, color: "var(--ef-summit)" }}>
                ACAMPAMENTO BASE
              </span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {ranking.length >= 2 && (
                <button
                  onClick={() => setComparing(true)}
                  style={{ fontFamily: "var(--ef-font-mono)", fontSize: 12, color: "var(--ef-ice)", background: "var(--ef-glacier-dim)", border: "1px solid rgba(34,211,238,0.30)", borderRadius: "var(--ef-radius-sm)", padding: "9px 16px", cursor: "pointer" }}
                >
                  comparar →
                </button>
              )}
              {isAdmin && (
                <Link
                  to="/matches/new"
                  style={{ fontFamily: "var(--ef-font-mono)", fontSize: 12, color: "var(--ef-fog)", background: "transparent", border: "1px solid var(--ef-border)", borderRadius: "var(--ef-radius-sm)", padding: "9px 16px", textDecoration: "none" }}
                >
                  + registrar partida
                </Link>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 80, fontFamily: "var(--ef-font-mono)", color: "var(--ef-ghost)" }}>
              // carregando acampamento...
            </div>
          ) : (
            <>
              {/* Hero: última sessão */}
              {lastMatch && <HeroSession match={lastMatch} mvp={leader} />}

              {/* Stats do jogador logado */}
              {player && myEntry && (
                <div style={{ marginTop: 20, background: "var(--ef-card)", border: "1px solid var(--ef-border)", borderRadius: "var(--ef-radius-md)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #818cf8)", border: "1px solid rgba(129,140,248,0.3)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontFamily: "var(--ef-font-display)", fontWeight: 800, fontSize: 14, color: "#060a10", flexShrink: 0 }}>
                    {player.avatar_url ? <img src={player.avatar_url} alt={displayNameOf(player)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : player.avatar_initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--ef-font-display)", fontWeight: 700, fontSize: 17, color: "var(--ef-snow)" }}>{displayNameOf(player)}</div>
                    <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 9, color: "var(--ef-ghost)" }}>#{myEntry.rank} · {myEntry.level_name?.toUpperCase()}</div>
                  </div>
                  {[
                    { label: "K/D", value: num(myEntry.kd_ratio, 2) },
                    { label: "ADR", value: num(myEntry.adr, 0) },
                    { label: "RATING", value: num(myEntry.hltv_rating, 2) },
                    { label: "SCORE", value: sc(myEntry.score_final) },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: "center", background: "var(--ef-glacier-dim)", border: "1px solid rgba(34,211,238,0.12)", borderRadius: "var(--ef-radius-sm)", padding: "6px 14px" }}>
                      <div style={{ fontFamily: "var(--ef-font-mono)", fontWeight: 700, fontSize: 15, color: "var(--ef-glacier-br)", fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                      <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 8, color: "var(--ef-ghost)", marginTop: 2, letterSpacing: "1.5px" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Links rápidos (visitante) */}
              {!player && (
                <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {[
                    { to: "/matches", label: "Partidas" },
                    { to: "/ranking", label: "Ranking" },
                    { to: "/sort", label: "Times" },
                    ...(isAdmin ? [{ to: "/matches/new", label: "Nova partida" }] : []),
                  ].map(l => (
                    <Link key={l.to} viewTransition to={l.to} style={{ fontFamily: "var(--ef-font-mono)", fontSize: 12, color: "var(--ef-ice)", background: "var(--ef-glacier-dim)", border: "1px solid rgba(34,211,238,0.22)", borderRadius: "var(--ef-radius-sm)", padding: "9px 18px", textDecoration: "none" }}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}

              {/* ── DIÁRIO DE EXPEDIÇÃO ── */}
              <SectionDivider label="DIÁRIO DE EXPEDIÇÃO" />

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Partidas */}
                {matches.slice(1).map(m => <MatchCard key={m.id} match={m} />)}

                {/* Destaques de jogadores */}
                {feedPlayers.map((e, i) => {
                  const subtitles = [
                    `#1 do squad · ${sc(e.score_final)} pts · K/D ${num(e.kd_ratio, 2)}`,
                    `maior ADR do grupo · ${num(e.adr, 1)} médio`,
                    `domina os duelos · score ${sc(e.score_duel)}`,
                  ];
                  return <PlayerCard key={e.player_id} entry={e} subtitle={subtitles[i] || ""} onOpen={() => setSelectedEntry(e)} />;
                })}

                {/* Empty state */}
                {matches.length === 0 && ranking.length === 0 && (
                  <div style={{ background: "var(--ef-card)", border: "1px solid var(--ef-border)", borderRadius: "var(--ef-radius-md)", padding: "40px", textAlign: "center" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" style={{ opacity: 0.3, marginBottom: 12 }}>
                      <path d="M2.5 20 L9.5 5.5 L13 11.5 L15.5 7.5 L21.5 20 Z" fill="none" stroke="#7a8ca1" strokeWidth="1.5" />
                    </svg>
                    <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 11, color: "var(--ef-ghost)", marginBottom: 6 }}>// nenhuma atividade ainda</div>
                    <div style={{ fontSize: 12, color: "var(--ef-fog)", marginBottom: 16 }}>registre a primeira partida para iniciar a expedição</div>
                    {isAdmin && (
                      <Link to="/matches/new" style={{ fontFamily: "var(--ef-font-mono)", fontSize: 12, color: "var(--ef-ice)", background: "var(--ef-glacier-dim)", border: "1px solid rgba(34,211,238,0.25)", borderRadius: "var(--ef-radius-sm)", padding: "8px 18px", textDecoration: "none" }}>
                        + cadastrar partida
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ─── Coluna direita ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 32, alignSelf: "flex-start" }}>

          {/* NO TOPO ESTA SEMANA */}
          <div style={{ background: "var(--ef-card)", border: "1px solid var(--ef-border)", borderRadius: "var(--ef-radius-md)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--ef-border)" }}>
              <span style={{ fontFamily: "var(--ef-font-display)", fontWeight: 700, fontSize: 13, letterSpacing: "2px", color: "var(--ef-fog)" }}>NO TOPO</span>
              <span style={{ fontFamily: "var(--ef-font-mono)", fontSize: 10, color: "var(--ef-ghost)" }}>{players.length} players</span>
            </div>
            {/* Stats rápidas */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--ef-border)", margin: "0 0 1px" }}>
              <div style={{ background: "var(--ef-card)", padding: "10px 14px" }}>
                <div style={{ fontFamily: "var(--ef-font-mono)", fontWeight: 700, fontSize: 18, color: "var(--ef-snow)" }}>{totalMatches}</div>
                <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 9, color: "var(--ef-ghost)", letterSpacing: "1px" }}>PARTIDAS</div>
              </div>
              <div style={{ background: "var(--ef-card)", padding: "10px 14px" }}>
                <div style={{ fontFamily: "var(--ef-font-mono)", fontWeight: 700, fontSize: 18, color: "var(--ef-snow)" }}>{ranking.length}</div>
                <div style={{ fontFamily: "var(--ef-font-mono)", fontSize: 9, color: "var(--ef-ghost)", letterSpacing: "1px" }}>NO RANKING</div>
              </div>
            </div>
            {/* Top 3 mini */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {topThree.length === 0 ? (
                <div style={{ padding: "20px 18px", fontFamily: "var(--ef-font-mono)", fontSize: 11, color: "var(--ef-ghost)" }}>// sem dados ainda</div>
              ) : topThree.map((e, i) => (
                <button
                  key={e.player_id}
                  onClick={() => setSelectedEntry(e)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", background: "transparent", border: "none", borderBottom: i < topThree.length - 1 ? `1px solid var(--ef-border)` : "none", cursor: "pointer", textAlign: "left" }}
                >
                  <span style={{ fontFamily: "var(--ef-font-mono)", fontSize: 12, color: "var(--ef-ghost)", width: 20 }}>#{e.rank}</span>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? "linear-gradient(135deg,#0e7490,#22d3ee)" : "linear-gradient(135deg,#1a2535,#243040)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontFamily: "var(--ef-font-display)", fontWeight: 700, fontSize: 11, color: i === 0 ? "#060a10" : "var(--ef-fog)", flexShrink: 0 }}>
                    {e.avatar_url ? <img src={e.avatar_url} alt={entryName(e)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : e.avatar_initials}
                  </div>
                  <span style={{ fontFamily: "var(--ef-font-display)", fontWeight: 700, fontSize: 15, color: "var(--ef-snow)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entryName(e)}</span>
                  <span style={{ fontFamily: "var(--ef-font-mono)", fontWeight: 700, fontSize: 14, color: i === 0 ? "var(--ef-glacier-br)" : "var(--ef-fog)", fontVariantNumeric: "tabular-nums" }}>{sc(e.score_final)}</span>
                </button>
              ))}
            </div>
            <div style={{ padding: "10px 18px", borderTop: "1px solid var(--ef-border)" }}>
              <Link to="/ranking" style={{ fontFamily: "var(--ef-font-mono)", fontSize: 11, color: "var(--ef-glacier-br)", textDecoration: "none" }}>ver ranking completo →</Link>
            </div>
          </div>

          {/* DESTAQUES */}
          <div style={{ background: "var(--ef-card)", border: "1px solid var(--ef-border)", borderRadius: "var(--ef-radius-md)", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--ef-border)" }}>
              <span style={{ fontFamily: "var(--ef-font-display)", fontWeight: 700, fontSize: 13, letterSpacing: "2px", color: "var(--ef-fog)" }}>DESTAQUES</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { icon: "▲", label: "Fragger",  entry: topFrag, stat: topFrag ? `${topFrag.kills} kills` : "—" },
                { icon: "◉", label: "ADR",      entry: topAdr,  stat: topAdr  ? `${num(topAdr.adr, 1)} ADR` : "—" },
                { icon: "◈", label: "Utility",  entry: topUtil, stat: topUtil ? `${sc(topUtil.score_utility)} util` : "—" },
              ].map((d, i, arr) => (
                <div key={d.label} onClick={() => d.entry && setSelectedEntry(d.entry)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderBottom: i < arr.length - 1 ? "1px solid var(--ef-border)" : "none", cursor: d.entry ? "pointer" : "default" }}>
                  <span style={{ fontFamily: "var(--ef-font-mono)", fontSize: 11, color: "var(--ef-glacier-br)", width: 14 }}>{d.icon}</span>
                  <span style={{ fontFamily: "var(--ef-font-mono)", fontSize: 10, color: "var(--ef-ghost)", width: 50 }}>{d.label}</span>
                  <span style={{ fontFamily: "var(--ef-font-display)", fontWeight: 700, fontSize: 14, color: "var(--ef-snow)", flex: 1 }}>{d.entry ? entryName(d.entry) : "—"}</span>
                  <span style={{ fontFamily: "var(--ef-font-mono)", fontSize: 10, color: "var(--ef-fog)" }}>{d.stat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Acesso rápido */}
          <div style={{ background: "var(--ef-card)", border: "1px solid var(--ef-border)", borderRadius: "var(--ef-radius-md)", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--ef-border)" }}>
              <span style={{ fontFamily: "var(--ef-font-display)", fontWeight: 700, fontSize: 13, letterSpacing: "2px", color: "var(--ef-fog)" }}>EXPEDIÇÃO</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { to: "/matches", label: "Histórico de partidas" },
                { to: "/ranking", label: "Ranking completo" },
                { to: "/sort", label: "Sortear times" },
                ...(isAdmin ? [{ to: "/admin", label: "Gestão" }] : []),
              ].map((l, i, arr) => (
                <Link key={l.to} viewTransition to={l.to} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px", borderBottom: i < arr.length - 1 ? "1px solid var(--ef-border)" : "none", textDecoration: "none", fontFamily: "var(--ef-font-body)", fontSize: 13, color: "var(--ef-fog)" }}>
                  {l.label} <span style={{ color: "var(--ef-ghost)" }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
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
