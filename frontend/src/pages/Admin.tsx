/**
 * Gestão — página /admin (somente admin)
 *
 * Duas abas:
 *  1. PLAYERS — lista todos os players; permite criar novo, ativar/desativar, promover/rebaixar
 *  2. PARTIDAS — lista paginada de partidas; permite deletar
 *
 * Paleta rebrand v2: #070a0e fundo, #0e7490 teal, #6366f1 indigo, #e0a82e ouro.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { playersApi, matchesApi, type PlayerResponse, type MatchResponse } from "../api/client";
import { Navbar } from "../components/Navbar";

type Tab = "players" | "matches";

export function Admin() {
  const { player, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("players");

  // Players
  const [players, setPlayers] = useState<PlayerResponse[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  // Novo player
  const [newNick, setNewNick] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newRole, setNewRole] = useState("viewer");
  const [newSteamId, setNewSteamId] = useState("");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");
  const [createError, setCreateError] = useState(false);

  // Partidas
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [matchPage, setMatchPage] = useState(1);
  const [matchTotal, setMatchTotal] = useState(0);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Redireciona se não for admin
  useEffect(() => {
    if (!isLoading && (!player || !isAdmin)) navigate("/");
  }, [player, isAdmin, isLoading, navigate]);

  function loadPlayers() {
    setLoadingPlayers(true);
    playersApi.list().then(setPlayers).catch(console.error).finally(() => setLoadingPlayers(false));
  }

  function loadMatches(page: number) {
    setLoadingMatches(true);
    matchesApi.list(page, 15)
      .then(res => { setMatches(res.items); setMatchTotal(res.total); })
      .catch(console.error)
      .finally(() => setLoadingMatches(false));
  }

  useEffect(() => { if (!isLoading && isAdmin) loadPlayers(); }, [isAdmin, isLoading]);
  useEffect(() => { if (!isLoading && isAdmin && tab === "matches") loadMatches(matchPage); }, [tab, matchPage, isAdmin, isLoading]);

  async function handleCreatePlayer() {
    setCreateMsg(""); setCreateError(false);
    if (!newNick.trim()) { setCreateMsg("Nickname obrigatório."); setCreateError(true); return; }
    setCreating(true);
    try {
      await playersApi.create({
        nickname: newNick.trim(),
        password: newPwd || undefined,
        role: newRole,
        steam_id: newSteamId.trim() || undefined,
      });
      setNewNick(""); setNewPwd(""); setNewRole("viewer"); setNewSteamId("");
      setCreateMsg("Player criado com sucesso.");
      loadPlayers();
    } catch (e: any) {
      setCreateMsg(e.message ?? "Erro ao criar player."); setCreateError(true);
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(p: PlayerResponse) {
    try {
      await playersApi.update(p.id, { is_active: !p.is_active });
      loadPlayers();
    } catch (e: any) { alert(e.message); }
  }

  async function toggleRole(p: PlayerResponse) {
    const newRole = p.role === "admin" ? "viewer" : "admin";
    try {
      await playersApi.update(p.id, { role: newRole });
      loadPlayers();
    } catch (e: any) { alert(e.message); }
  }

  async function handleDeleteMatch(id: number) {
    if (!confirm("Apagar esta partida permanentemente?")) return;
    try {
      await matchesApi.delete(id);
      loadMatches(matchPage);
    } catch (e: any) { alert(e.message); }
  }

  if (isLoading || !player || !isAdmin) return null;

  const totalPages = Math.ceil(matchTotal / 15);

  const inputStyle: React.CSSProperties = {
    background: "#080c11", border: "1px solid #212d3a",
    color: "#e3ebf3", fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
    padding: "9px 12px", outline: "none", boxSizing: "border-box", width: "100%",
  };

  const TAB_STYLES = (active: boolean): React.CSSProperties => ({
    background: "none", border: "none", cursor: "pointer",
    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
    fontSize: 15, letterSpacing: "2px", padding: "8px 22px",
    color: active ? "#22d3ee" : "#566476",
    borderBottom: active ? "2px solid #0e7490" : "2px solid transparent",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#070a0e", color: "#dde6f0", fontFamily: "'Inter', sans-serif", paddingBottom: 80 }}>

      {/* Scanlines */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 3px, rgba(0,0,0,0.10) 4px, rgba(0,0,0,0) 5px)", opacity: 0.35 }} />

      {/* Header mínimo */}
      <header style={{ borderBottom: "1px solid #1b2530", background: "linear-gradient(180deg,#0d1218,#070a0e)", padding: "22px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 38, height: 38, border: "2px solid #0e7490", display: "flex", alignItems: "center", justifyContent: "center", background: "#04222b" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M2 21 L9 7 L12.5 13 L15.5 6 L22 21 Z" fill="#0e7490" />
              <path d="M15.5 6 L13.2 10 L17.8 10 Z" fill="#cfe6ee" />
              <path d="M9 7 L7.3 10 L10.7 10 Z" fill="#cfe6ee" />
            </svg>
          </div>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: 1 }}>
            <span style={{ color: "#f0f9ff" }}>EVEREST</span>
            <span style={{ color: "#0e7490" }}>FRAGS</span>
          </span>
        </div>
      </header>

      <Navbar />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 48px 0", position: "relative", zIndex: 10 }}>

        {/* Título */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "3px", color: "#5d6d80" }}>GESTÃO</span>
          <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg,#1e2a36,transparent)" }} />
        </div>

        {/* Abas */}
        <div style={{ display: "flex", borderBottom: "1px solid #1b2530", marginBottom: 28 }}>
          <button style={TAB_STYLES(tab === "players")} onClick={() => setTab("players")}>PLAYERS</button>
          <button style={TAB_STYLES(tab === "matches")} onClick={() => setTab("matches")}>PARTIDAS</button>
        </div>

        {/* ── ABA PLAYERS ─────────────────────────────────────────────────── */}
        {tab === "players" && (
          <>
            {/* Formulário criar player */}
            <div style={{ border: "1px solid #1e2a36", background: "linear-gradient(180deg,#0f161d,#0a0e13)", padding: "22px 26px", marginBottom: 24, position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#0e7490,#6366f1)" }} />
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: "2px", color: "#e3ebf3", marginBottom: 16 }}>
                NOVO PLAYER
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 2fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 9.5, letterSpacing: "1.5px", color: "#566476", marginBottom: 5 }}>NICKNAME *</label>
                  <input value={newNick} onChange={e => setNewNick(e.target.value)} placeholder="GodBR" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 9.5, letterSpacing: "1.5px", color: "#566476", marginBottom: 5 }}>SENHA</label>
                  <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="deixar em branco = Steam only" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 9.5, letterSpacing: "1.5px", color: "#566476", marginBottom: 5 }}>ROLE</label>
                  <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ ...inputStyle }}>
                    <option value="viewer">viewer</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 9.5, letterSpacing: "1.5px", color: "#566476", marginBottom: 5 }}>STEAM ID (opcional)</label>
                  <input value={newSteamId} onChange={e => setNewSteamId(e.target.value)} placeholder="76561198xxxxxxxxx" style={inputStyle} />
                </div>
              </div>
              {createMsg && (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: createError ? "#f87171" : "#34d399", marginBottom: 10 }}>
                  // {createMsg}
                </div>
              )}
              <button
                onClick={handleCreatePlayer}
                disabled={creating}
                style={{ background: creating ? "#0a5567" : "#0e7490", border: "none", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: 2, padding: "10px 24px", cursor: creating ? "wait" : "pointer" }}
              >
                {creating ? "CRIANDO..." : "CRIAR PLAYER"}
              </button>
            </div>

            {/* Lista de players */}
            {loadingPlayers ? (
              <div style={{ textAlign: "center", padding: 40, fontFamily: "'JetBrains Mono', monospace", color: "#3a4757" }}>carregando...</div>
            ) : (
              <div style={{ border: "1px solid #172029", background: "#0a0e13" }}>
                {/* Header da tabela */}
                <div style={{ display: "grid", gridTemplateColumns: "50px 1fr 100px 120px 100px 160px", gap: 0, borderBottom: "1px solid #172029", padding: "10px 18px" }}>
                  {["ID", "NICKNAME", "ROLE", "STEAM", "STATUS", "AÇÕES"].map(h => (
                    <span key={h} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "1.5px", color: "#4a5868" }}>{h}</span>
                  ))}
                </div>
                {players.map(p => (
                  <div key={p.id} style={{ display: "grid", gridTemplateColumns: "50px 1fr 100px 120px 100px 160px", gap: 0, alignItems: "center", padding: "12px 18px", borderBottom: "1px solid #11171f", opacity: p.is_active ? 1 : 0.5 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#3a4757" }}>#{p.id}</span>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 18, color: "#e3ebf3" }}>{p.nickname}</span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "1px",
                      color: p.role === "admin" ? "#22d3ee" : "#566476",
                    }}>{p.role}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: p.steam_id ? "#34d399" : "#3a4757" }}>
                      {p.steam_id ? "VINCULADO" : "—"}
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: p.is_active ? "#34d399" : "#f87171" }}>
                      {p.is_active ? "ATIVO" : "INATIVO"}
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => toggleActive(p)}
                        style={{ fontSize: 10, letterSpacing: "1px", padding: "5px 10px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", background: p.is_active ? "#1a0d0d" : "#0a1a0a", border: `1px solid ${p.is_active ? "#5a1010" : "#1a4a1a"}`, color: p.is_active ? "#f87171" : "#34d399" }}
                      >
                        {p.is_active ? "DESATIVAR" : "ATIVAR"}
                      </button>
                      <button
                        onClick={() => toggleRole(p)}
                        style={{ fontSize: 10, letterSpacing: "1px", padding: "5px 10px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.25)", color: "#818cf8" }}
                      >
                        {p.role === "admin" ? "→ VIEWER" : "→ ADMIN"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── ABA PARTIDAS ────────────────────────────────────────────────── */}
        {tab === "matches" && (
          <>
            {/* Botão nova partida */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
              <button
                onClick={() => navigate("/matches/new")}
                style={{ background: "#0e7490", border: "none", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: 2, padding: "10px 22px", cursor: "pointer" }}
              >
                + NOVA PARTIDA
              </button>
            </div>

            {loadingMatches ? (
              <div style={{ textAlign: "center", padding: 40, fontFamily: "'JetBrains Mono', monospace", color: "#3a4757" }}>carregando...</div>
            ) : (
              <>
                <div style={{ border: "1px solid #172029", background: "#0a0e13" }}>
                  {/* Header */}
                  <div style={{ display: "grid", gridTemplateColumns: "60px 130px 160px 1fr 100px", gap: 0, borderBottom: "1px solid #172029", padding: "10px 18px" }}>
                    {["ID", "DATA", "MAPA", "SCOPE", "AÇÃO"].map(h => (
                      <span key={h} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "1.5px", color: "#4a5868" }}>{h}</span>
                    ))}
                  </div>
                  {matches.map(m => (
                    <div key={m.id} style={{ display: "grid", gridTemplateColumns: "60px 130px 160px 1fr 100px", gap: 0, alignItems: "center", padding: "12px 18px", borderBottom: "1px solid #11171f" }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#3a4757" }}>#{m.id}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#aebccd" }}>
                        {new Date(m.played_at).toLocaleDateString("pt-BR")}
                      </span>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, color: "#e3ebf3" }}>
                        {m.map_name ?? "—"}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#566476", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.scope_url ?? "sem link"}
                      </span>
                      <button
                        onClick={() => handleDeleteMatch(m.id)}
                        style={{ fontSize: 10, letterSpacing: "1px", padding: "5px 10px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", background: "#1a0d0d", border: "1px solid #5a1010", color: "#f87171" }}
                      >
                        APAGAR
                      </button>
                    </div>
                  ))}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setMatchPage(p)}
                        style={{ width: 34, height: 34, border: `1px solid ${p === matchPage ? "#0e7490" : "#1e2a36"}`, background: p === matchPage ? "rgba(14,116,144,.15)" : "#0d1218", color: p === matchPage ? "#22d3ee" : "#566476", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
