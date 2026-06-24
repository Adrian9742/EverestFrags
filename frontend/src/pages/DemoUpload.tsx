/**
 * DemoUpload — /demo
 * Upload de arquivo .dem do CS2 para extração automática de métricas.
 * Somente admin. Após parse, exibe tabela de stats e permite criar a partida.
 */

import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

interface PlayerStat {
  nickname: string;
  kills: number;
  deaths: number;
  assists: number;
  damage_total: number;
  adr: number;
  adr_difference: number;
  hltv_rating: number;
  kast_percent: number;
  opening_kills: number;
  trade_kills: number;
  trade_denials: number;
  time_to_kill_ms: number;
  flash_assists: number;
  grenade_damage: number;
  he_enemies_hit: number;
  fire_enemies_hit: number;
  disadvantage_kills: number;
  advantage_kills: number;
  eco_kills: number;
}

interface ParseResult {
  map_name: string | null;
  total_rounds: number;
  players: PlayerStat[];
  errors: string[];
}

const METRICS: { key: keyof PlayerStat; label: string }[] = [
  { key: "kills",             label: "K"     },
  { key: "deaths",            label: "D"     },
  { key: "assists",           label: "A"     },
  { key: "adr",               label: "ADR"   },
  { key: "hltv_rating",       label: "HLTV"  },
  { key: "kast_percent",      label: "KAST%" },
  { key: "opening_kills",     label: "ENTRY" },
  { key: "trade_kills",       label: "TRADE" },
  { key: "trade_denials",     label: "T.DEN" },
  { key: "disadvantage_kills",label: "DISADV"},
  { key: "advantage_kills",   label: "ADVTG" },
  { key: "eco_kills",         label: "ECO"   },
  { key: "flash_assists",     label: "FLASH" },
  { key: "grenade_damage",    label: "NADE"  },
  { key: "he_enemies_hit",    label: "HE"    },
  { key: "fire_enemies_hit",  label: "FIRE"  },
  { key: "time_to_kill_ms",   label: "TTK"   },
];

export function DemoUpload() {
  const { player, isAdmin } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  if (!player || !isAdmin) {
    navigate("/"); return null;
  }

  function handleFile(f: File) {
    if (!f.name.endsWith(".dem")) {
      setError("Apenas arquivos .dem do CS2 são aceitos.");
      return;
    }
    if (f.size > 750 * 1024 * 1024) {
      setError(`Arquivo muito grande (${(f.size / 1024 / 1024).toFixed(0)}MB). Limite: 750MB`);
      return;
    }
    setFile(f); setResult(null); setError(null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function upload() {
    if (!file) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const token = localStorage.getItem("ef_token");
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${BASE_URL}/api/demo/parse`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Erro desconhecido" }));
        throw new Error(err.detail ?? "Erro ao processar demo");
      }
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message ?? "Erro ao enviar arquivo");
    } finally {
      setLoading(false);
    }
  }

  async function createMatch() {
    if (!result) return;
    setCreating(true);
    try {
      // Navega para AddMatch passando os dados via sessionStorage
      sessionStorage.setItem("demo_result", JSON.stringify(result));
      navigate("/matches/new?from=demo");
    } finally {
      setCreating(false);
    }
  }

  const sz = file ? (file.size / (1024 * 1024)).toFixed(1) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#070a0e", color: "#dde6f0", fontFamily: "'Inter', sans-serif", paddingBottom: 80 }}>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50, background: "repeating-linear-gradient(0deg,rgba(0,0,0,0) 0px,rgba(0,0,0,0) 3px,rgba(0,0,0,.10) 4px,rgba(0,0,0,0) 5px)", opacity: 0.35 }} />

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
            <span style={{ color: "#f0f9ff" }}>EVEREST</span><span style={{ color: "#0e7490" }}>FRAGS</span>
          </span>
        </div>
      </header>

      <Navbar />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 48px 0", position: "relative", zIndex: 10 }}>

        {/* Título */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#0e7490" strokeWidth="1.5"/>
            <polyline points="14 2 14 8 20 8" stroke="#0e7490" strokeWidth="1.5"/>
            <line x1="12" y1="18" x2="12" y2="12" stroke="#0e7490" strokeWidth="1.5"/>
            <line x1="9" y1="15" x2="15" y2="15" stroke="#0e7490" strokeWidth="1.5"/>
          </svg>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "3px", color: "#5d6d80" }}>UPLOAD DE DEMO</span>
          <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg,#1e2a36,transparent)" }} />
        </div>

        {/* Drop zone */}
        {!result && (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? "#0e7490" : file ? "#1e3a4a" : "#1b2530"}`,
              background: dragging ? "rgba(14,116,144,0.06)" : file ? "rgba(14,116,144,0.03)" : "#0a0e13",
              borderRadius: 0, padding: "60px 40px", textAlign: "center",
              cursor: "pointer", transition: "all .15s", marginBottom: 24,
            }}
          >
            <input ref={inputRef} type="file" accept=".dem" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 16px", display: "block", opacity: file ? 1 : 0.4 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={file ? "#0e7490" : "#566476"} strokeWidth="1.5" strokeLinecap="round"/>
              <polyline points="17 8 12 3 7 8" stroke={file ? "#0e7490" : "#566476"} strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="12" y1="3" x2="12" y2="15" stroke={file ? "#0e7490" : "#566476"} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>

            {file ? (
              <>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: 1, color: "#22d3ee", marginBottom: 6 }}>
                  {file.name}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#3a4757" }}>
                  {sz} MB · clique para trocar
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: 1, color: "#3a4d5e", marginBottom: 6 }}>
                  ARRASTE O ARQUIVO .DEM AQUI
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#2a3a4a" }}>
                  ou clique para selecionar · limite 750MB
                </div>
              </>
            )}
          </div>
        )}

        {/* Erro */}
        {error && (
          <div style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", padding: "12px 16px", marginBottom: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#f87171" }}>
            // erro: {error}
          </div>
        )}

        {/* Botão parse */}
        {file && !result && (
          <button
            onClick={upload}
            disabled={loading}
            style={{ background: loading ? "#0a2733" : "#0e7490", border: "none", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "2px", padding: "13px 36px", cursor: loading ? "wait" : "pointer", marginBottom: 32 }}
          >
            {loading ? "PROCESSANDO DEMO..." : "EXTRAIR MÉTRICAS"}
          </button>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#3a4757", marginBottom: 20 }}>
            // analisando eventos do demo — pode levar alguns segundos...
          </div>
        )}

        {/* Resultado */}
        {result && (
          <>
            {/* Info do demo */}
            <div style={{ display: "flex", gap: 24, marginBottom: 24, flexWrap: "wrap" }}>
              <div style={{ background: "#0a0e13", border: "1px solid #1b2530", padding: "12px 20px" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "1.5px", color: "#3a4757", marginBottom: 4 }}>MAPA</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 20, color: "#e3ebf3" }}>{result.map_name ?? "—"}</div>
              </div>
              <div style={{ background: "#0a0e13", border: "1px solid #1b2530", padding: "12px 20px" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "1.5px", color: "#3a4757", marginBottom: 4 }}>ROUNDS</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 20, color: "#e3ebf3" }}>{result.total_rounds}</div>
              </div>
              <div style={{ background: "#0a0e13", border: "1px solid #1b2530", padding: "12px 20px" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "1.5px", color: "#3a4757", marginBottom: 4 }}>PLAYERS</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 20, color: "#e3ebf3" }}>{result.players.length}</div>
              </div>
              <div style={{ background: "#0a0e13", border: "1px solid #1b2530", padding: "12px 20px" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "1.5px", color: "#3a4757", marginBottom: 4 }}>ARQUIVO</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 20, color: "#22d3ee" }}>{file?.name}</div>
              </div>
            </div>

            {/* Avisos */}
            {result.errors.length > 0 && (
              <div style={{ background: "rgba(224,168,46,0.05)", border: "1px solid rgba(224,168,46,0.2)", padding: "10px 16px", marginBottom: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#e0a82e" }}>
                {result.errors.map((e, i) => <div key={i}>// aviso: {e}</div>)}
              </div>
            )}

            {/* Tabela de stats */}
            <div style={{ border: "1px solid #172029", background: "#0a0e13", overflowX: "auto", marginBottom: 24 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #172029" }}>
                    <th style={{ textAlign: "left", padding: "10px 16px", fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: "1.5px", color: "#4a5868", fontWeight: 400 }}>PLAYER</th>
                    {METRICS.map(m => (
                      <th key={m.key} style={{ textAlign: "center", padding: "10px 8px", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "1px", color: "#4a5868", fontWeight: 400, whiteSpace: "nowrap" }}>{m.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...result.players].sort((a, b) => b.kills - a.kills).map((p, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #0f161d" }}>
                      <td style={{ padding: "10px 16px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, color: "#e3ebf3", whiteSpace: "nowrap" }}>
                        {p.nickname}
                      </td>
                      {METRICS.map(m => (
                        <td key={m.key} style={{ textAlign: "center", padding: "10px 8px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#aebccd" }}>
                          {typeof p[m.key] === "number"
                            ? m.key === "hltv_rating" || m.key === "adr" || m.key === "kast_percent"
                              ? (p[m.key] as number).toFixed(1)
                              : p[m.key]
                            : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Ações */}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => { setResult(null); setFile(null); setError(null); }}
                style={{ background: "none", border: "1px solid #1e2a36", color: "#566476", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "2px", padding: "12px 24px", cursor: "pointer" }}
              >
                NOVO UPLOAD
              </button>
              <button
                onClick={createMatch}
                disabled={creating}
                style={{ background: "#0e7490", border: "none", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "2px", padding: "12px 32px", cursor: "pointer" }}
              >
                CRIAR PARTIDA COM ESSES DADOS
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
