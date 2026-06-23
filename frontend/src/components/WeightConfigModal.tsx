/**
 * WeightConfigModal — sliders interdependentes para pesos do ranking
 *
 * Paleta rebrand v2: teal #0e7490, indigo #6366f1, ouro #e0a82e
 * Slider muda um → os outros dois redistribuem proporcionalmente para manter soma = 100%.
 * Pesos são enviados como decimais (0.50) mas tratados internamente como inteiros (50).
 */

import { useState } from "react";
import { rankingApi } from "../api/client";

interface WeightConfigModalProps {
  initialCombat: number;
  initialDuel: number;
  initialUtility: number;
  onClose: () => void;
  onSaved: () => void;
}

type Category = "combat" | "duel" | "utility";

export function WeightConfigModal({ initialCombat, initialDuel, initialUtility, onClose, onSaved }: WeightConfigModalProps) {
  const [weights, setWeights] = useState({
    combat:  Math.round(initialCombat * 100),
    duel:    Math.round(initialDuel * 100),
    utility: Math.round(initialUtility * 100),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const total = weights.combat + weights.duel + weights.utility;
  const isValid = total === 100;

  function handleSlider(category: Category, newValue: number) {
    const remaining = 100 - newValue;
    const others = (["combat", "duel", "utility"] as Category[]).filter(c => c !== category);
    const currentSum = weights[others[0]] + weights[others[1]];
    let newA: number, newB: number;
    if (currentSum === 0) {
      newA = Math.round(remaining / 2);
      newB = remaining - newA;
    } else {
      const ratio = weights[others[0]] / currentSum;
      newA = Math.round(remaining * ratio);
      newB = remaining - newA;
    }
    setWeights({ ...weights, [category]: newValue, [others[0]]: newA, [others[1]]: newB });
  }

  async function handleSave() {
    if (!isValid) return;
    setSaving(true); setError("");
    try {
      await rankingApi.updateConfig(weights.combat / 100, weights.duel / 100, weights.utility / 100);
      onSaved(); onClose();
    } catch (e: any) {
      setError(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const sliders: { key: Category; label: string; color: string; numColor: string; cls: string }[] = [
    { key: "combat",  label: "COMBATE", color: "#0e7490", numColor: "#22d3ee", cls: "ef-slider ef-slider--combat" },
    { key: "duel",    label: "DUELOS",  color: "#6366f1", numColor: "#818cf8", cls: "ef-slider ef-slider--duel" },
    { key: "utility", label: "UTILITY", color: "#e0a82e", numColor: "#e8b948", cls: "ef-slider ef-slider--utility" },
  ];

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.74)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ position: "relative", width: 480, maxWidth: "100%", border: "1px solid #222e3b", background: "linear-gradient(180deg,#11171f,#0c1015)", padding: "30px 30px 26px" }}>
        {/* Linha topo tricolor */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#0e7490,#6366f1,#e0a82e)" }} />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 24, letterSpacing: 1, color: "#f0f9ff" }}>
            CONFIGURAR PESOS DO RANKING
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#566476", fontSize: 19, cursor: "pointer", lineHeight: 1, padding: "2px 4px" }}>✕</button>
        </div>
        <div style={{ fontSize: 11, color: "#566476", marginBottom: 26 }}>
          Os pesos se redistribuem automaticamente — o ranking recalcula ao vivo.
        </div>

        {sliders.map(s => (
          <div key={s.key} style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "1.5px", color: "#e3ebf3" }}>
                <span style={{ width: 9, height: 9, background: s.color, flexShrink: 0 }} />
                {s.label}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 18, color: s.numColor }}>
                {weights[s.key]}%
              </span>
            </div>
            <input
              type="range" min={1} max={98}
              value={weights[s.key]}
              onChange={e => handleSlider(s.key, parseInt(e.target.value))}
              className={s.cls}
              style={{ width: "100%", background: `linear-gradient(to right, ${s.color} ${weights[s.key]}%, #1e2a36 ${weights[s.key]}%)` }}
            />
          </div>
        ))}

        {error && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#f87171", marginBottom: 12, textAlign: "center" }}>
            // {error}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #1b2530", paddingTop: 18 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, letterSpacing: "1px", color: isValid ? "#34d399" : "#f87171" }}>
            TOTAL: {total}% {isValid ? "✓" : `— FALTAM ${100 - total}%`}
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setWeights({ combat: 50, duel: 30, utility: 20 })}
              style={{ background: "#0e141b", border: "1px solid #222e3b", color: "#6a7a8d", fontSize: 11, letterSpacing: "1px", padding: "10px 16px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace" }}
            >
              50 / 30 / 20
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid || saving}
              style={{ background: isValid ? "#0e7490" : "#1e2a36", border: "none", color: isValid ? "#fff" : "#566476", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "1.5px", padding: "10px 28px", cursor: isValid ? "pointer" : "not-allowed" }}
            >
              {saving ? "SALVANDO..." : "SALVAR"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
