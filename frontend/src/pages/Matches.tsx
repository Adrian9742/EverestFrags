import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { matchesApi, type MatchResponse } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";

const MAP_ACCENT: Record<string, string> = {
  de_dust2:   "#e0a82e",
  de_mirage:  "#6366f1",
  de_inferno: "#f97316",
  de_nuke:    "#22d3ee",
  de_ancient: "#0d9488",
  de_anubis:  "#a78bfa",
  de_vertigo: "#3b82f6",
  de_train:   "#ef4444",
  de_cache:   "#10b981",
  de_overpass:"#f59e0b",
};

function mapColor(name: string | null | undefined): string {
  if (!name) return "#334155";
  return MAP_ACCENT[name.toLowerCase()] ?? "#8892a0";
}

function mapLabel(name: string | null | undefined): string {
  if (!name) return "MAPA DESCONHECIDO";
  return name.replace("de_", "").toUpperCase();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function Matches() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hoverId, setHoverId] = useState<number | null>(null);

  async function load(p = 1) {
    setLoading(true);
    try {
      const res = await matchesApi.list(p, 20);
      setMatches(res.items);
      setTotal(res.total);
      setPage(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number) {
    if (!confirm("Deletar esta partida e todas as suas stats?")) return;
    try {
      await matchesApi.delete(id);
      load(page);
    } catch (e: any) {
      alert(e.message);
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div style={{ minHeight: "100vh", background: "#070a0e", color: "#e8e8e8", fontFamily: "'Inter', sans-serif", paddingBottom: 48 }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "3px", color: "#22d3ee", marginBottom: 6 }}>
              HISTÓRICO
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 38, fontWeight: 900, color: "#f0f9ff", lineHeight: 1 }}>
              PARTIDAS
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#3a4757", marginTop: 6 }}>
              {total} partidas registradas
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate("/matches/new")}
              style={{
                background: "linear-gradient(135deg, #0e7490 0%, #0369a1 100%)",
                border: "none", color: "#fff",
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                fontSize: 15, letterSpacing: "2px",
                padding: "11px 24px", borderRadius: 10, cursor: "pointer",
              }}
            >
              + ADICIONAR PARTIDA
            </button>
          )}
        </div>

        {/* Lista */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 80, fontFamily: "'JetBrains Mono', monospace", color: "#2a3a4a" }}>
            carregando...
          </div>
        ) : matches.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, fontFamily: "'JetBrains Mono', monospace", color: "#2a3a4a" }}>
            nenhuma partida registrada ainda
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {matches.map((m, i) => {
              const accent = mapColor(m.map_name);
              const isHovered = hoverId === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => navigate(`/matches/${m.id}`)}
                  onMouseEnter={() => setHoverId(m.id)}
                  onMouseLeave={() => setHoverId(null)}
                  style={{
                    display: "flex", alignItems: "stretch",
                    background: "#0d1218",
                    border: `1px solid ${isHovered ? accent + "55" : "#1b2530"}`,
                    borderRadius: 14, overflow: "hidden", cursor: "pointer",
                    transform: isHovered ? "translateY(-2px)" : "none",
                    boxShadow: isHovered ? `0 8px 28px rgba(0,0,0,0.4)` : "none",
                    transition: "border-color 0.15s, transform 0.15s, box-shadow 0.15s",
                  }}
                >
                  {/* Stripe de cor do mapa */}
                  <div style={{ width: 5, flexShrink: 0, background: accent, opacity: 0.85 }} />

                  {/* Número */}
                  <div style={{
                    width: 52, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#2a3a4a",
                    borderRight: "1px solid #131d27",
                  }}>
                    #{i + 1 + (page - 1) * 20}
                  </div>

                  {/* Conteúdo principal */}
                  <div style={{ flex: 1, padding: "16px 20px", display: "flex", alignItems: "center", gap: 20 }}>

                    {/* Mapa */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800,
                        color: "#f0f9ff", letterSpacing: "0.5px", lineHeight: 1,
                      }}>
                        {mapLabel(m.map_name)}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 5 }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#3a4757" }}>
                          {formatDate(m.played_at)}
                        </span>
                        {m.scope_url && (
                          <a
                            href={m.scope_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: accent, opacity: 0.8, textDecoration: "none" }}
                          >
                            scope.gg ↗
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Players pill */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
                      color: accent,
                      background: accent + "14",
                      border: `1px solid ${accent}30`,
                      borderRadius: 8, padding: "6px 14px", flexShrink: 0,
                    }}>
                      <span style={{ fontSize: 16 }}>{m.player_count}</span>
                      <span style={{ fontSize: 9, opacity: 0.7, letterSpacing: "1px" }}>PLAYERS</span>
                    </div>

                    {/* Resultado registrado */}
                    {m.winning_team != null && (
                      <div style={{
                        fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 700,
                        letterSpacing: "1.5px", color: "#22c55e",
                        background: "rgba(34,197,94,0.08)",
                        border: "1px solid rgba(34,197,94,0.22)",
                        borderRadius: 6, padding: "4px 9px", flexShrink: 0,
                      }}>
                        RESULTADO ✓
                      </div>
                    )}

                    {/* Chevron */}
                    <div style={{ color: isHovered ? accent : "#1e2d3e", fontSize: 20, flexShrink: 0, transition: "color 0.15s" }}>
                      ›
                    </div>
                  </div>

                  {/* Delete (admin) */}
                  {isAdmin && (
                    <div style={{ display: "flex", alignItems: "center", padding: "0 14px", borderLeft: "1px solid #131d27" }}>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(m.id); }}
                        style={{
                          background: "transparent", border: "1px solid #1b2530", color: "#3a4757",
                          fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                          padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                          transition: "border-color 0.15s, color 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef444466"; e.currentTarget.style.color = "#ef4444"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#1b2530"; e.currentTarget.style.color = "#3a4757"; }}
                      >
                        DEL
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 32 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => load(p)}
                style={{
                  background: p === page ? "#0e7490" : "transparent",
                  border: `1px solid ${p === page ? "#0e7490" : "#1b2530"}`,
                  color: p === page ? "#fff" : "#3a4757",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                  padding: "6px 14px", borderRadius: 8, cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
