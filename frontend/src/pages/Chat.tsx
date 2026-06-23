/**
 * Chat — página /chat (placeholder)
 *
 * O backend não tem suporte a WebSocket ainda. Esta página exibe um placeholder
 * indicando que o chat está em desenvolvimento, para não quebrar a navegação.
 *
 * TODO: implementar chat em tempo real com WebSocket no backend (FastAPI + Starlette).
 */

import { Navbar } from "../components/Navbar";

export function Chat() {
  return (
    <div style={{ minHeight: "100vh", background: "#070a0e", color: "#dde6f0", fontFamily: "'Inter', sans-serif" }}>

      {/* Scanlines */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 3px, rgba(0,0,0,0.10) 4px, rgba(0,0,0,0) 5px)", opacity: 0.35 }} />

      {/* Header mínimo */}
      <header style={{ borderBottom: "1px solid #1b2530", background: "linear-gradient(180deg,#0d1218,#070a0e)", padding: "22px 48px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", gap: 18 }}>
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

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "80px 48px", position: "relative", zIndex: 10, textAlign: "center" }}>
        {/* Ícone de bolha */}
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 24px", display: "block" }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#1e2a36" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="#0d1218" />
          <path d="M8 9h8M8 13h6" stroke="#0e7490" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 32, letterSpacing: 2, color: "#e3ebf3", marginBottom: 10 }}>
          CHAT EM BREVE
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#566476", lineHeight: 1.8 }}>
          O chat em tempo real ainda está sendo desenvolvido.<br />
          Requer suporte a WebSocket no backend (FastAPI + Starlette).
        </div>
      </main>
    </div>
  );
}
