/**
 * Head-to-Head — página /h2h
 *
 * Confronto direto entre dois jogadores: quantas vezes cada um matou
 * e flashou o outro, somado em todas as partidas que jogaram juntos.
 * Só cobre partidas processadas via upload de demo (não retroativo).
 */

import { useEffect, useState } from "react";
import { playersApi, playersVsApi, type PlayerResponse, type HeadToHeadResponse } from "../api/client";
import { Navbar } from "../components/Navbar";

function StatCard({ label, valueA, valueB }: { label: string; valueA: number; valueB: number }) {
  const total = valueA + valueB;
  const pctA = total === 0 ? 50 : Math.round((valueA / total) * 100);
  const pctB = 100 - pctA;
  const aWins = valueA > valueB;
  const bWins = valueB > valueA;

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          fontSize: 20,
          color: aWins ? "#22d3ee" : bWins ? "#5d6d80" : "#f0f9ff",
        }}>{valueA}</span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9.5,
          letterSpacing: "1.5px",
          color: "#5d6d80",
          alignSelf: "center",
        }}>{label}</span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          fontSize: 20,
          color: bWins ? "#22d3ee" : aWins ? "#5d6d80" : "#f0f9ff",
        }}>{valueB}</span>
      </div>
      <div style={{ height: 4, background: "#1b2530", display: "flex" }}>
        <div style={{ width: `${pctA}%`, background: aWins ? "#0e7490" : "#2a3a4a", transition: "width 0.5s" }} />
        <div style={{ width: `${pctB}%`, background: bWins ? "#6366f1" : "#2a3a4a", transition: "width 0.5s" }} />
      </div>
    </div>
  );
}

export function HeadToHead() {
  const [players, setPlayers] = useState<PlayerResponse[]>([]);
  const [playerA, setPlayerA] = useState<number | "">("");
  const [playerB, setPlayerB] = useState<number | "">("");
  const [result, setResult] = useState<HeadToHeadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    playersApi.list().then(setPlayers).catch(console.error);
  }, []);

  async function handleCompare() {
    if (!playerA || !playerB) return;
    if (playerA === playerB) { setError("Selecione dois jogadores diferentes."); return; }
    setError("");
    setLoading(true);
    try {
      const data = await playersVsApi.headToHead(Number(playerA), Number(playerB));
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar confronto.");
    } finally {
      setLoading(false);
    }
  }

  const selectStyle: React.CSSProperties = {
    background: "rgba(0,0,0,0.3)",
    border: "1px solid var(--ef-border)",
    color: "var(--ef-snow)",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    padding: "10px 14px",
    outline: "none",
    cursor: "pointer",
    flex: 1,
    minWidth: 160,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--ef-bg)", color: "var(--ef-snow)", fontFamily: "'Inter', sans-serif", paddingBottom: 80 }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "var(--ef-aurora)" }} />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 3px, rgba(0,0,0,0.10) 4px, rgba(0,0,0,0) 5px)", opacity: 0.2 }} />

      <Navbar />

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "32px 48px 0", position: "relative", zIndex: 10 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ef-ghost)", letterSpacing: "0.5px", marginBottom: 4 }}>
            // h2h · selecione dois jogadores para comparar
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, fontWeight: 900, color: "var(--ef-summit)", letterSpacing: "2px", lineHeight: 1 }}>
            HEAD-TO-HEAD
          </div>
        </div>

        {/* Seleção de jogadores */}
        <div style={{ border: "1px solid var(--ef-border)", background: "var(--ef-card)", padding: "24px 28px", marginBottom: 24, position: "relative", borderRadius: "var(--ef-radius-md)" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "var(--ef-glacier)", borderRadius: "var(--ef-radius-md) var(--ef-radius-md) 0 0" }} />
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ display: "block", fontSize: 9.5, letterSpacing: "1.5px", color: "#566476", marginBottom: 6 }}>JOGADOR A</label>
              <select value={playerA} onChange={e => setPlayerA(e.target.value ? Number(e.target.value) : "")} style={selectStyle}>
                <option value="">Selecionar...</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.display_name || p.nickname}</option>
                ))}
              </select>
            </div>

            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 24, color: "#5d6d80", paddingBottom: 8 }}>VS</div>

            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ display: "block", fontSize: 9.5, letterSpacing: "1.5px", color: "#566476", marginBottom: 6 }}>JOGADOR B</label>
              <select value={playerB} onChange={e => setPlayerB(e.target.value ? Number(e.target.value) : "")} style={selectStyle}>
                <option value="">Selecionar...</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.display_name || p.nickname}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCompare}
              disabled={!playerA || !playerB || loading}
              style={{
                background: (!playerA || !playerB) ? "#0a1822" : "#0e7490",
                border: "none",
                color: (!playerA || !playerB) ? "#3a4757" : "#fff",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: 2,
                padding: "11px 28px",
                cursor: (!playerA || !playerB) ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "CARREGANDO..." : "COMPARAR"}
            </button>
          </div>
          {error && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ef-danger)", marginTop: 12 }}>
              // {error}
            </div>
          )}
        </div>

        {/* Resultado */}
        {result && (
          <div style={{ border: "1px solid var(--ef-border)", background: "var(--ef-card)", padding: "28px 32px", position: "relative", borderRadius: "var(--ef-radius-md)" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#0e7490,#6366f1)" }} />

            {/* Cabeçalho com nomes */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 26, color: "#22d3ee" }}>
                  {result.player_nickname}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "1.5px", color: "#4a5868" }}>JOGADOR A</div>
              </div>
              <div style={{ textAlign: "center", alignSelf: "center" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#5d6d80" }}>
                  {result.matches_together} partida{result.matches_together !== 1 ? "s" : ""} juntos
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 26, color: "#818cf8" }}>
                  {result.opponent_nickname}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "1.5px", color: "#4a5868" }}>JOGADOR B</div>
              </div>
            </div>

            {result.matches_together === 0 ? (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#4a5868", textAlign: "center", padding: "16px 0" }}>
                // nenhuma partida em comum registrada via demo
              </div>
            ) : (
              <>
                <StatCard label="KILLS" valueA={result.player_kills} valueB={result.opponent_kills} />
                <StatCard label="FLASH ASSISTS" valueA={result.player_flash_assists} valueB={result.opponent_flash_assists} />

                {/* Veredito */}
                {(result.player_kills !== result.opponent_kills) && (
                  <div style={{ marginTop: 20, textAlign: "center" }}>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, letterSpacing: "2px", color: "#5d6d80", marginBottom: 4 }}>DOMINA O CONFRONTO</div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 28, color: result.player_kills > result.opponent_kills ? "#22d3ee" : "#818cf8" }}>
                      {result.player_kills > result.opponent_kills ? result.player_nickname : result.opponent_nickname}
                    </div>
                  </div>
                )}
                {result.player_kills === result.opponent_kills && result.player_kills > 0 && (
                  <div style={{ marginTop: 20, textAlign: "center", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, letterSpacing: "2px", color: "#5d6d80" }}>
                    EMPATE NO CONFRONTO
                  </div>
                )}

                <div style={{ marginTop: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#3a4757", textAlign: "center" }}>
                  * Apenas partidas processadas via upload de demo
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
