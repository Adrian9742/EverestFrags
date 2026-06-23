/**
 * Página /sort — sorteio de times equilibrados
 *
 * Checkboxes para selecionar quais jogadores estão presentes.
 * Toggle para 2 ou 3 times.
 * Resultado: cards por time com lista de jogadores, score total e diferença.
 */

import { useEffect, useState } from "react";
import { playersApi, sortApi, type PlayerResponse, type SortTeamsResponse } from "../api/client";
import { useNavigate } from "react-router-dom";

const TEAM_COLORS = ["#cc2200", "#7c3aed", "#e0a82e"];

export function Sort() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<PlayerResponse[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [nTeams, setNTeams] = useState(2);
  const [result, setResult] = useState<SortTeamsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    playersApi.list().then(ps => {
      setPlayers(ps);
      // Seleciona todos por padrão
      setSelected(new Set(ps.map(p => p.id)));
    });
  }, []);

  function togglePlayer(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() { setPlayers(ps => { setSelected(new Set(ps.map(p => p.id))); return ps; }); }
  function clearAll() { setSelected(new Set()); }

  async function handleSort() {
    if (selected.size < nTeams) {
      setError(`Selecione ao menos ${nTeams} jogadores`);
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await sortApi.sort(Array.from(selected), nTeams);
      setResult(res);
    } catch (e: any) {
      setError(e.message ?? "Erro ao sortear");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#e8e8e8", fontFamily: "'Inter', sans-serif", padding: "32px 48px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button onClick={() => navigate("/")} style={{ background: "transparent", border: "none", color: "#555", fontSize: 12, cursor: "pointer", padding: 0, letterSpacing: 1 }}>
            ← RANKING
          </button>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 700, color: "#f4f4f4", marginTop: 6 }}>
            SORTEAR TIMES
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#5a5a5a", marginTop: 4 }}>
            algoritmo: snake draft
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>

          {/* Seleção de players */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: "2px", color: "#6a6a6a" }}>
                JOGADORES PRESENTES ({selected.size}/{players.length})
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={selectAll} style={{ background: "transparent", border: "1px solid #2a2a2a", color: "#666", fontSize: 10, padding: "4px 8px", cursor: "pointer" }}>TODOS</button>
                <button onClick={clearAll} style={{ background: "transparent", border: "1px solid #2a2a2a", color: "#666", fontSize: 10, padding: "4px 8px", cursor: "pointer" }}>NENHUM</button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 400, overflowY: "auto" }}>
              {players.map(p => (
                <label
                  key={p.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 12px", border: "1px solid #161616",
                    background: selected.has(p.id) ? "#0d0d0d" : "#080808",
                    cursor: "pointer", userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => togglePlayer(p.id)}
                    style={{ accentColor: "#cc2200" }}
                  />
                  <div
                    style={{
                      width: 24, height: 24, background: "#141414", border: "1px solid #2a2a2a",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#888",
                    }}
                  >
                    {p.avatar_initials}
                  </div>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 600, color: selected.has(p.id) ? "#d0d0d0" : "#555" }}>
                    {p.nickname}
                  </span>
                </label>
              ))}
            </div>

            {/* Nº de times + botão sortear */}
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              {[2, 3].map(n => (
                <button
                  key={n}
                  onClick={() => setNTeams(n)}
                  style={{
                    flex: 1, background: nTeams === n ? "#cc2200" : "transparent",
                    border: `1px solid ${nTeams === n ? "#cc2200" : "#2a2a2a"}`,
                    color: nTeams === n ? "#fff" : "#666",
                    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                    fontSize: 16, letterSpacing: 1, padding: "10px", cursor: "pointer",
                  }}
                >
                  {n} TIMES
                </button>
              ))}
            </div>

            {error && (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#ff5a33", marginTop: 10 }}>
                // {error}
              </div>
            )}

            <button
              onClick={handleSort}
              disabled={loading}
              style={{
                width: "100%", marginTop: 12, background: "#cc2200", border: "none",
                color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                fontSize: 18, letterSpacing: 2, padding: 13, cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? "SORTEANDO..." : "SORTEAR"}
            </button>
          </div>

          {/* Resultado */}
          <div>
            {result ? (
              <>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#5a5a5a", marginBottom: 16 }}>
                  diferença de score: <span style={{ color: result.diff_score < 10 ? "#44bb44" : "#ff5a33" }}>{result.diff_score}</span>
                </div>
                {result.teams.map((team, ti) => (
                  <div
                    key={team.team_number}
                    style={{ border: `1px solid ${TEAM_COLORS[ti]}33`, background: "#0a0a0a", padding: "16px", marginBottom: 12, position: "relative" }}
                  >
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: TEAM_COLORS[ti] }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, color: TEAM_COLORS[ti] }}>
                        TIME {team.team_number}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: "#d0d0d0" }}>
                          {team.total_score}
                        </div>
                        <div style={{ fontSize: 9, letterSpacing: "1.5px", color: "#5a5a5a" }}>SCORE TOTAL</div>
                      </div>
                    </div>
                    {team.players.map((p, pi) => (
                      <div key={p.player_id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: pi < team.players.length - 1 ? "1px solid #141414" : "none" }}>
                        <div style={{ width: 22, height: 22, background: "#141414", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#888" }}>
                          {p.avatar_initials}
                        </div>
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 600, color: "#ccc", flex: 1 }}>
                          {p.player_nickname}
                        </span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#666" }}>
                          {p.score_final}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: 60, color: "#333", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, border: "1px dashed #1a1a1a" }}>
                selecione os players e clique em SORTEAR
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
