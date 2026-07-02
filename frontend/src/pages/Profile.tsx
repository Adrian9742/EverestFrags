/**
 * Perfil — página /profile
 *
 * Mostra o cartão de identidade do player logado:
 * - Posição no ranking + score final + barras de categoria
 * - Stats gerais: K/D, ADR, HLTV Rating, KAST%, total de partidas
 * - Aba "Alterar Senha" para trocar a senha (players com conta interna)
 *
 * Players que logaram APENAS via Steam não têm senha — o formulário fica oculto.
 *
 * Paleta rebrand v2: #070a0e fundo, #0e7490 teal, #6366f1 indigo, #e0a82e ouro.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { rankingApi, authApi, playersApi, aiApi, type RankingEntry, type PlayerMatchHistory } from "../api/client";
import { RadarChart } from "../components/RadarChart";
import { CategoryBar } from "../components/CategoryBar";
import { Navbar } from "../components/Navbar";

function HistoryChart({ data }: { data: PlayerMatchHistory[] }) {
  const W = 100; // viewBox width (%)
  const H = 80;
  const PAD = { top: 8, bottom: 24, left: 32, right: 8 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxRating = Math.max(...data.map(d => d.hltv_rating), 2.0);
  const minRating = Math.min(...data.map(d => d.hltv_rating), 0);
  const range = maxRating - minRating || 1;

  const xOf = (i: number) => PAD.left + (i / (data.length - 1)) * innerW;
  const yOf = (v: number) => PAD.top + innerH - ((v - minRating) / range) * innerH;

  const points = data.map((d, i) => `${xOf(i).toFixed(1)},${yOf(d.hltv_rating).toFixed(1)}`).join(" ");
  const areaBottom = `${xOf(data.length - 1).toFixed(1)},${(PAD.top + innerH).toFixed(1)} ${xOf(0).toFixed(1)},${(PAD.top + innerH).toFixed(1)}`;

  const yLabels = [minRating, (minRating + maxRating) / 2, maxRating];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 140, display: "block" }}>
      {/* y-axis labels */}
      {yLabels.map(v => (
        <text key={v} x={PAD.left - 2} y={yOf(v) + 3} textAnchor="end"
          style={{ fontSize: 4, fill: "#4a5868", fontFamily: "JetBrains Mono, monospace" }}>
          {v.toFixed(2)}
        </text>
      ))}

      {/* horizontal gridlines */}
      {yLabels.map(v => (
        <line key={v} x1={PAD.left} x2={PAD.left + innerW} y1={yOf(v)} y2={yOf(v)}
          stroke="#1b2530" strokeWidth="0.3" />
      ))}

      {/* reference line at 1.0 rating */}
      {minRating <= 1.0 && maxRating >= 1.0 && (
        <line x1={PAD.left} x2={PAD.left + innerW} y1={yOf(1.0)} y2={yOf(1.0)}
          stroke="#2a3f50" strokeWidth="0.5" strokeDasharray="1,1" />
      )}

      {/* area fill */}
      <polygon points={`${points} ${areaBottom}`} fill="rgba(14,116,144,0.08)" />

      {/* line */}
      <polyline points={points} fill="none" stroke="#0e7490" strokeWidth="1.2" strokeLinejoin="round" />

      {/* dots */}
      {data.map((d, i) => (
        <circle key={i} cx={xOf(i)} cy={yOf(d.hltv_rating)} r="1.8"
          fill={d.hltv_rating >= 1.0 ? "#0e7490" : "#3a4757"} stroke="#070a0e" strokeWidth="0.5">
          <title>{d.map_name ?? "partida"} — Rating: {d.hltv_rating.toFixed(2)} | K/D: {d.kills}/{d.deaths} | ADR: {d.adr.toFixed(0)}</title>
        </circle>
      ))}

      {/* x-axis labels (only first, middle and last) */}
      {[0, Math.floor(data.length / 2), data.length - 1].filter((v, i, a) => a.indexOf(v) === i).map(i => (
        <text key={i} x={xOf(i)} y={H - 4} textAnchor="middle"
          style={{ fontSize: 3.5, fill: "#4a5868", fontFamily: "JetBrains Mono, monospace" }}>
          {data[i].played_at.slice(5)}
        </text>
      ))}
    </svg>
  );
}

function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌎";
  const offset = 127397;
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => c.charCodeAt(0) + offset));
}

export function Profile() {
  const { player, isLoading, refreshPlayer } = useAuth();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<RankingEntry | null>(null);
  const [loadingRank, setLoadingRank] = useState(true);
  const [history, setHistory] = useState<PlayerMatchHistory[]>([]);

  // Coach IA
  const [coachText, setCoachText] = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachExpanded, setCoachExpanded] = useState(false);
  const [coachUnavailable, setCoachUnavailable] = useState(false);
  const [coachNoMatches, setCoachNoMatches] = useState(false);

  // Campos de troca de senha
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdError, setPwdError] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  // Edição do apelido (display_name)
  const [apelido, setApelido] = useState("");
  const [apelidoMsg, setApelidoMsg] = useState("");
  const [apelidoError, setApelidoError] = useState(false);
  const [savingApelido, setSavingApelido] = useState(false);

  // Edição de identidade: bio, mapa favorito, país
  const [bio, setBio] = useState("");
  const [favoriteMap, setFavoriteMap] = useState("");
  const [country, setCountry] = useState("");
  const [identityMsg, setIdentityMsg] = useState("");
  const [identityError, setIdentityError] = useState(false);
  const [savingIdentity, setSavingIdentity] = useState(false);

  useEffect(() => {
    setApelido(player?.display_name ?? "");
    setBio(player?.bio ?? "");
    setFavoriteMap(player?.favorite_map ?? "");
    setCountry(player?.country ?? "");
  }, [player]);

  // Redireciona se não estiver logado
  useEffect(() => {
    if (!isLoading && !player) navigate("/login");
  }, [player, isLoading, navigate]);

  async function handleSaveApelido() {
    if (!player) return;
    setApelidoMsg(""); setApelidoError(false);
    setSavingApelido(true);
    try {
      await playersApi.update(player.id, { display_name: apelido.trim() });
      await refreshPlayer();
      setApelidoMsg("Apelido salvo.");
    } catch (e: any) {
      setApelidoMsg(e.message ?? "Erro ao salvar apelido."); setApelidoError(true);
    } finally {
      setSavingApelido(false);
    }
  }

  async function handleSaveIdentity() {
    if (!player) return;
    setIdentityMsg(""); setIdentityError(false);
    setSavingIdentity(true);
    try {
      await playersApi.update(player.id, {
        bio: bio.trim(),
        favorite_map: favoriteMap,
        country: country.trim().toUpperCase().slice(0, 5),
      });
      await refreshPlayer();
      setIdentityMsg("Identidade salva.");
    } catch (e: any) {
      setIdentityMsg(e.message ?? "Erro ao salvar."); setIdentityError(true);
    } finally {
      setSavingIdentity(false);
    }
  }

  // Carrega a posição no ranking do player logado
  useEffect(() => {
    if (!player) return;
    rankingApi.get().then(ranking => {
      const found = ranking.find(r => r.player_id === player.id) ?? null;
      setEntry(found);
    }).catch(console.error).finally(() => setLoadingRank(false));
  }, [player]);

  // Carrega histórico de partidas para o gráfico de evolução
  useEffect(() => {
    if (!player) return;
    playersApi.history(player.id).then(setHistory).catch(console.error);
  }, [player]);

  async function handleChangePassword() {
    setPwdMsg(""); setPwdError(false);
    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdMsg("Preencha todos os campos."); setPwdError(true); return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg("Nova senha e confirmação não coincidem."); setPwdError(true); return;
    }
    if (newPwd.length < 6) {
      setPwdMsg("Nova senha precisa ter no mínimo 6 caracteres."); setPwdError(true); return;
    }
    setSavingPwd(true);
    try {
      await authApi.changePassword(currentPwd, newPwd);
      setPwdMsg("Senha alterada com sucesso.");
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch (e: any) {
      setPwdMsg(e.message ?? "Erro ao alterar senha."); setPwdError(true);
    } finally {
      setSavingPwd(false);
    }
  }

  async function handleCoach() {
    if (!player) return;
    setCoachExpanded(true);
    if (coachText !== null) return; // já carregado
    setCoachLoading(true);
    try {
      const res = await aiApi.coach(player.id);
      setCoachUnavailable(res.unavailable);
      setCoachText(res.text ?? null);
    } catch (e: any) {
      if (e.message?.includes("partidas suficientes")) {
        setCoachNoMatches(true);
      } else {
        setCoachUnavailable(true);
      }
    } finally {
      setCoachLoading(false);
    }
  }

  if (isLoading || !player) return null;

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid var(--ef-border)",
    color: "var(--ef-snow)", fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
    padding: "10px 12px", outline: "none", boxSizing: "border-box", borderRadius: "var(--ef-radius-sm)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--ef-bg)", color: "var(--ef-snow)", fontFamily: "'Inter', sans-serif", paddingBottom: 80 }}>

      {/* Atmospheric layers */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "var(--ef-aurora)" }} />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50, background: "repeating-linear-gradient(0deg,rgba(0,0,0,0) 0px,rgba(0,0,0,0) 3px,rgba(0,0,0,.08) 4px,rgba(0,0,0,0) 5px)", opacity: 0.2 }} />

      <Navbar />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 48px 0", position: "relative", zIndex: 10 }}>

        {/* Título */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ef-ghost)", letterSpacing: "0.5px", marginBottom: 4 }}>
            // perfil · {player.display_name || player.nickname}
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, fontWeight: 900, color: "var(--ef-summit)", letterSpacing: "2px", lineHeight: 1 }}>
            MEU PERFIL
          </div>
        </div>

        {/* Cartão de identidade */}
        <div style={{ border: "1px solid var(--ef-border)", background: "var(--ef-card)", padding: "28px 30px", marginBottom: 24, position: "relative", borderRadius: "var(--ef-radius-md)" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "var(--ef-glacier)", borderRadius: "var(--ef-radius-md) var(--ef-radius-md) 0 0" }} />
          <div style={{ display: "flex", gap: 36, flexWrap: "wrap", alignItems: "flex-start" }}>

            {/* Avatar + info básica */}
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%", border: "2px solid var(--ef-glacier)", background: "rgba(14,116,144,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 28, color: "var(--ef-glacier-br)",
                boxShadow: "0 0 32px rgba(34,211,238,0.20)",
              }}>
                {player.avatar_url
                  ? <img src={player.avatar_url} alt={player.nickname} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : player.avatar_initials}
              </div>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 36, color: "var(--ef-summit)", lineHeight: 1, letterSpacing: "1px" }}>
                  {player.display_name || player.nickname}
                </div>
                {player.display_name && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "var(--ef-ghost)", marginTop: 4 }}>
                    // steam: {player.nickname}
                  </div>
                )}
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "2px", color: player.role === "admin" ? "var(--ef-glacier-br)" : "var(--ef-ghost)", marginTop: 6 }}>
                  {player.role === "admin" ? "GESTOR" : "PLAYER"}
                </div>
                {entry && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 42, color: "#22d3ee", lineHeight: 1 }}>
                        #{entry.rank}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#4a5868" }}>NO RANKING</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "1.5px", color: "#e0a82e", background: "rgba(224,168,46,.1)", border: "1px solid rgba(224,168,46,.3)", padding: "2px 8px" }}>
                        {entry.level_name.toUpperCase()}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#4a5868" }}>
                        {entry.xp_total.toLocaleString()} XP
                      </span>
                    </div>
                    {/* Barra de XP animada */}
                    {(() => {
                      const levels = [0, 500, 1000, 2000, 3500, 5500, 9000];
                      const xp = entry.xp_total;
                      const nextIdx = levels.findIndex(t => t > xp);
                      const prevXp = nextIdx > 0 ? levels[nextIdx - 1] : levels[levels.length - 1];
                      const nextXp = nextIdx > 0 ? levels[nextIdx] : null;
                      const pct = nextXp ? Math.min(100, ((xp - prevXp) / (nextXp - prevXp)) * 100) : 100;
                      return (
                        <div style={{ marginTop: 8, maxWidth: 200 }}>
                          <div style={{ height: 3, background: "#151d26", overflow: "hidden" }}>
                            <div className="ef-bar-grow" style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #0e7490, #22d3ee)" }} />
                          </div>
                          {nextXp && (
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#334155", marginTop: 3, fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' }}>
                              {(nextXp - xp).toLocaleString()} XP para o próximo nível
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  </div>
                )}
              </div>
            </div>

            {/* Radar + barras */}
            {entry && (
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <RadarChart
                    adr={entry.score_combat}
                    kast={entry.kast_percent}
                    rating={entry.hltv_rating * 50}
                    openK={entry.score_duel}
                    trade={Math.min(entry.kd_ratio * 33, 100)}
                    util={entry.score_utility}
                    color="#0e7490"
                    size={160}
                  />
                  <div style={{ flex: 1, minWidth: 160, paddingTop: 8 }}>
                    <CategoryBar label="COMBATE" value={entry.score_combat} color="#0e7490" textColor="#22d3ee" height={5} />
                    <CategoryBar label="DUELOS"  value={entry.score_duel}   color="#6366f1" textColor="#818cf8" height={5} />
                    <CategoryBar label="UTILITY" value={entry.score_utility} color="#e0a82e" textColor="#e8b948" height={5} />
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 28, color: "#22d3ee", marginTop: 14, fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' }}>
                      {Math.round(entry.score_final)}
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "2px", color: "#566476", marginLeft: 8, textTransform: "uppercase" }}>SCORE</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loadingRank && (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#3a4757" }}>
                carregando stats...
              </div>
            )}
          </div>
        </div>

        {/* Stats em grid */}
        {entry && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 24 }}>
            {[
              { label: "PARTIDAS",    value: entry.total_matches },
              { label: "K/D RATIO",   value: entry.kd_ratio.toFixed(2) },
              { label: "ADR",         value: entry.adr.toFixed(1) },
              { label: "HLTV RATING", value: entry.hltv_rating.toFixed(2) },
              { label: "KAST%",       value: `${entry.kast_percent.toFixed(0)}%` },
            ].map(s => (
              <div key={s.label} style={{ border: "1px solid var(--ef-border)", background: "var(--ef-card)", padding: "14px 16px", borderRadius: "var(--ef-radius-sm)" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 22, color: "#22d3ee", fontVariantNumeric: "tabular-nums", fontFeatureSettings: '"tnum"' }}>{s.value}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 9.5, letterSpacing: "1.5px", color: "#4a5868", marginTop: 4, textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Evolução histórica — gráfico de HLTV Rating por partida */}
        {history.length >= 2 && (
          <div style={{ border: "1px solid var(--ef-border)", background: "var(--ef-card)", padding: "24px 28px", marginBottom: 24, position: "relative", borderRadius: "var(--ef-radius-md)" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#e0a82e,transparent)" }} />
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "2px", color: "#e3ebf3", marginBottom: 4 }}>
              EVOLUÇÃO — HLTV RATING
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#4a5868", marginBottom: 16 }}>
              {history.length} partida{history.length !== 1 ? "s" : ""} registradas
            </div>
            <HistoryChart data={history} />
          </div>
        )}

        {/* Coach IA — análise individual */}
        <div style={{ border: "1px solid #1e2a36", background: "linear-gradient(180deg,#0f161d,#0a0e13)", marginBottom: 24, position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#6366f1,transparent)" }} />
            <button
              onClick={handleCoach}
              style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "2px", color: "#e3ebf3" }}>
                  COACH IA
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#4a5868", marginTop: 3 }}>
                  análise individual baseada nos seus dados vs grupo
                </div>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: "#6366f1" }}>
                {coachExpanded ? "▲" : "▼"}
              </span>
            </button>

            {coachExpanded && (
              <div style={{ borderTop: "1px solid #1e2a36", padding: "20px 28px" }}>
                {coachLoading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 16, height: 16, border: "2px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#4a5868" }}>
                      analisando seu histórico...
                    </span>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                ) : coachUnavailable ? (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#f87171" }}>
                    // IA indisponível — configure GROQ_API_KEY no backend
                  </div>
                ) : coachNoMatches ? (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#566476" }}>
                    // sem partidas registradas — jogue um mix para desbloquear a análise
                  </div>
                ) : (
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, color: "#c8d8e8", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    {coachText}
                  </div>
                )}
              </div>
            )}
          </div>

        {/* Apelido — nome de exibição editável, separado do nickname sincronizado com a Steam */}
        <div style={{ border: "1px solid var(--ef-border)", background: "var(--ef-card)", padding: "24px 28px", marginBottom: 24, position: "relative", borderRadius: "var(--ef-radius-md)" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#0e7490,transparent)" }} />
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "2px", color: "#e3ebf3", marginBottom: 8 }}>
            APELIDO
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#4a5868", marginBottom: 16 }}>
            Nome de exibição no site. O nome da sua conta Steam ({player.nickname}) continua sincronizado por baixo e não muda.
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              value={apelido}
              onChange={e => setApelido(e.target.value)}
              placeholder={player.nickname}
              maxLength={50}
              style={{ ...inputStyle, flex: 1, minWidth: 200, marginBottom: 0 }}
            />
            <button
              onClick={handleSaveApelido}
              disabled={savingApelido}
              style={{ background: savingApelido ? "#0a5567" : "#0e7490", border: "none", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: 1.5, padding: "11px 24px", cursor: savingApelido ? "wait" : "pointer" }}
            >
              {savingApelido ? "SALVANDO..." : "SALVAR APELIDO"}
            </button>
          </div>
          {apelidoMsg && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: apelidoError ? "#f87171" : "#34d399", marginTop: 10 }}>
              // {apelidoMsg}
            </div>
          )}
        </div>

        {/* Identidade — bio, mapa favorito, país */}
        <div style={{ border: "1px solid var(--ef-border)", background: "var(--ef-card)", padding: "24px 28px", marginBottom: 24, position: "relative", borderRadius: "var(--ef-radius-md)" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#e0a82e,transparent)" }} />
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "2px", color: "#e3ebf3", marginBottom: 6 }}>
            IDENTIDADE
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#4a5868", marginBottom: 20 }}>
            Bio, mapa favorito e bandeira — aparecem no seu perfil público.
          </div>

          {/* Bio */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 9.5, letterSpacing: "1.5px", color: "#566476", marginBottom: 6 }}>
              BIO <span style={{ color: "#2a3a4a" }}>· max 200 caracteres</span>
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="Ex: Entry do grupo, main mirage, joga desde 2015..."
              style={{
                ...inputStyle, resize: "vertical", minHeight: 70,
                fontFamily: "'Inter', sans-serif", fontSize: 13, lineHeight: 1.6,
              }}
            />
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#2a3a4a", marginTop: 4, textAlign: "right" }}>
              {bio.length}/200
            </div>
          </div>

          {/* Mapa favorito + País */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: 9.5, letterSpacing: "1.5px", color: "#566476", marginBottom: 6 }}>MAPA FAVORITO</label>
              <select
                value={favoriteMap}
                onChange={e => setFavoriteMap(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">— nenhum</option>
                {["de_dust2","de_mirage","de_inferno","de_nuke","de_ancient","de_anubis","de_vertigo","de_train","de_overpass","de_cache"].map(m => (
                  <option key={m} value={m}>{m.replace("de_","")}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 9.5, letterSpacing: "1.5px", color: "#566476", marginBottom: 6 }}>
                PAÍS <span style={{ color: "#2a3a4a" }}>· código ISO (BR, PT, AR...)</span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {country && (
                  <span style={{ fontSize: 22, lineHeight: 1 }}>
                    {countryFlag(country)}
                  </span>
                )}
                <input
                  value={country}
                  onChange={e => setCountry(e.target.value.toUpperCase().slice(0, 2))}
                  maxLength={2}
                  placeholder="BR"
                  style={{ ...inputStyle, flex: 1, letterSpacing: "4px", fontWeight: 700, textTransform: "uppercase" }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={handleSaveIdentity}
              disabled={savingIdentity}
              style={{
                background: savingIdentity ? "#0a5567" : "#0e7490", border: "none", color: "#fff",
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: 1.5,
                padding: "11px 24px", cursor: savingIdentity ? "wait" : "pointer",
              }}
            >
              {savingIdentity ? "SALVANDO..." : "SALVAR IDENTIDADE"}
            </button>
            {identityMsg && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: identityError ? "#f87171" : "#34d399" }}>
                // {identityMsg}
              </span>
            )}
          </div>
        </div>

        {/* Alterar senha — só para players com conta interna (não steam-only) */}
        <div style={{ border: "1px solid #1e2a36", background: "linear-gradient(180deg,#0f161d,#0a0e13)", padding: "24px 28px", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#6366f1,transparent)" }} />
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "2px", color: "#e3ebf3", marginBottom: 18 }}>
            ALTERAR SENHA
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 9.5, letterSpacing: "1.5px", color: "#566476", marginBottom: 6 }}>SENHA ATUAL</label>
              <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 9.5, letterSpacing: "1.5px", color: "#566476", marginBottom: 6 }}>NOVA SENHA</label>
              <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 9.5, letterSpacing: "1.5px", color: "#566476", marginBottom: 6 }}>CONFIRMAR</label>
              <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {pwdMsg && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: pwdError ? "#f87171" : "#34d399", marginBottom: 12 }}>
              // {pwdMsg}
            </div>
          )}

          <button
            onClick={handleChangePassword}
            disabled={savingPwd}
            style={{ background: savingPwd ? "#0a5567" : "#0e7490", border: "none", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: 2, padding: "11px 28px", cursor: savingPwd ? "wait" : "pointer" }}
          >
            {savingPwd ? "SALVANDO..." : "SALVAR SENHA"}
          </button>
        </div>
      </main>
    </div>
  );
}
