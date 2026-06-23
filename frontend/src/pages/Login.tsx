/**
 * Página /login — tela de autenticação
 *
 * Visual: fundo preto, crosshair CS2 em SVG inline sutil, card central com logo.
 * Submit via onClick (não form HTML) conforme padrão do projeto.
 * Shake animation no card quando as credenciais são inválidas.
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const [nick, setNick] = useState("");
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("// credenciais inválidas");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Mostra erro se o Steam OpenID falhou (redirect de volta com ?error=steam_auth_failed)
  useEffect(() => {
    if (searchParams.get("error") === "steam_auth_failed") {
      setError(true);
      setErrorMsg("// falha na autenticação com a Steam");
    }
  }, [searchParams]);

  async function doLogin() {
    if (!nick || !pwd) return;
    setLoading(true);
    setError(false);
    try {
      await login(nick, pwd);
      navigate("/");
    } catch {
      setError(true);
      setErrorMsg("// credenciais inválidas");
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") doLogin();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080808",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
      }}
    >
      {/* Scanlines */}
      <div
        style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50,
          background: "repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.22) 3px, rgba(0,0,0,0) 4px)",
          opacity: 0.6,
        }}
      />

      {/* Crosshair CS2 background */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06, pointerEvents: "none" }}
      >
        <line x1="50" y1="0" x2="50" y2="100" stroke="#cc2200" strokeWidth="0.25" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#cc2200" strokeWidth="0.25" />
        <circle cx="50" cy="50" r="13" fill="none" stroke="#cc2200" strokeWidth="0.25" />
        <circle cx="50" cy="50" r="0.5" fill="#cc2200" />
      </svg>

      {/* Card */}
      <div
        style={{
          position: "relative",
          width: 380,
          maxWidth: "100%",
          border: "1px solid #1f1f1f",
          background: "linear-gradient(180deg, #0e0e0e, #0a0a0a)",
          padding: "38px 34px 32px",
          animation: shake ? "efShake 0.5s ease" : undefined,
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#cc2200" }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 28 }}>
          <div
            style={{
              width: 40, height: 40, border: "2px solid #cc2200",
              display: "flex", alignItems: "center", justifyContent: "center", background: "#120504",
            }}
          >
            <div style={{ width: 12, height: 12, background: "#cc2200", transform: "rotate(45deg)" }} />
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 30, letterSpacing: 0.5 }}>
            <span style={{ color: "#f4f4f4" }}>EVEREST</span>
            <span style={{ color: "#cc2200" }}>FRAGS</span>
          </div>
        </div>

        {/* Inputs */}
        <label style={{ display: "block", fontSize: 10, letterSpacing: "2px", color: "#7a7a7a", marginBottom: 7 }}>
          NICKNAME
        </label>
        <input
          value={nick}
          onChange={e => setNick(e.target.value)}
          onKeyDown={onKey}
          placeholder="seu nick"
          autoComplete="username"
          style={{
            width: "100%", background: "#070707", border: `1px solid ${error ? "#cc2200" : "#232323"}`,
            color: "#eee", fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
            padding: "11px 13px", marginBottom: 16, outline: "none", boxSizing: "border-box",
          }}
        />
        <label style={{ display: "block", fontSize: 10, letterSpacing: "2px", color: "#7a7a7a", marginBottom: 7 }}>
          SENHA
        </label>
        <input
          value={pwd}
          onChange={e => setPwd(e.target.value)}
          onKeyDown={onKey}
          type="password"
          placeholder="senha"
          autoComplete="current-password"
          style={{
            width: "100%", background: "#070707", border: `1px solid ${error ? "#cc2200" : "#232323"}`,
            color: "#eee", fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
            padding: "11px 13px", marginBottom: 10, outline: "none", boxSizing: "border-box",
          }}
        />

        {error && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#ff5a33", marginBottom: 8 }}>
            {errorMsg}
          </div>
        )}

        <button
          onClick={doLogin}
          disabled={loading || !nick || !pwd}
          style={{
            width: "100%", marginTop: 8, background: loading ? "#991800" : "#cc2200",
            border: "none", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700, fontSize: 19, letterSpacing: 2, padding: 13,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "AUTENTICANDO..." : "LOGIN"}
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 14px" }}>
          <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#3a3a3a", letterSpacing: "1px" }}>OU</span>
          <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
        </div>

        {/* Botão Steam */}
        <button
          onClick={() => { window.location.href = "/api/auth/steam"; }}
          style={{
            width: "100%", background: "#101b2b", border: "1px solid #1a3a5c",
            color: "#c6d4df", fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700, fontSize: 17, letterSpacing: 1.5, padding: "11px 13px",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}
        >
          {/* Ícone Steam (SVG inline simplificado) */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#c6d4df">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38l3.02-6.25A3.5 3.5 0 0 1 12 10.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5 3.5 3.5 0 0 1-2.95-1.62l-4.9 2.03C5.78 19.6 8.73 21 12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-4 14a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          </svg>
          ENTRAR COM A STEAM
        </button>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: "#3a3a3a", textAlign: "center", marginTop: 8, letterSpacing: "0.5px" }}>
          players do grupo — acesso via conta Steam
        </div>
      </div>
    </div>
  );
}
