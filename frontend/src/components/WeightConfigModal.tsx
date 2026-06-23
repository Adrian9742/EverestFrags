/**
 * WeightConfigModal — modal com sliders interdependentes para configurar pesos
 *
 * Quando um slider muda, os outros dois são redistribuídos proporcionalmente
 * para manter a soma em 100%.
 * O botão Salvar só ativa quando a soma for exatamente 100%.
 *
 * ATENÇÃO: os pesos são enviados como decimais (0.50, 0.30, 0.20).
 * Internamente o modal trabalha com inteiros (50, 30, 20) para os sliders.
 */

import { useState } from "react";
import { rankingApi } from "../api/client";

interface WeightConfigModalProps {
  initialCombat: number;   // ex: 0.50
  initialDuel: number;     // ex: 0.30
  initialUtility: number;  // ex: 0.20
  onClose: () => void;
  onSaved: () => void;
}

type Category = "combat" | "duel" | "utility";

export function WeightConfigModal({
  initialCombat, initialDuel, initialUtility,
  onClose, onSaved,
}: WeightConfigModalProps) {
  const [weights, setWeights] = useState({
    combat: Math.round(initialCombat * 100),
    duel: Math.round(initialDuel * 100),
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
    setSaving(true);
    setError("");
    try {
      await rankingApi.updateConfig(
        weights.combat / 100,
        weights.duel / 100,
        weights.utility / 100
      );
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const sliders: { key: Category; label: string; color: string; cls: string }[] = [
    { key: "combat", label: "COMBATE", color: "#cc2200", cls: "ef-slider ef-slider--combat" },
    { key: "duel", label: "DUELOS", color: "#7c3aed", cls: "ef-slider ef-slider--duel" },
    { key: "utility", label: "UTILITY", color: "#e0a82e", cls: "ef-slider ef-slider--utility" },
  ];

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100, padding: 24,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: 420, maxWidth: "100%", background: "#0e0e0e",
          border: "1px solid #1f1f1f", padding: "28px 28px 24px",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#cc2200" }} />

        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: 1, color: "#f4f4f4", marginBottom: 24 }}>
          CONFIGURAR PESOS DO RANKING
        </div>

        {sliders.map(s => (
          <div key={s.key} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 10, letterSpacing: "2px", color: "#7a7a7a" }}>{s.label}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: s.color }}>
                {weights[s.key]}%
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={98}
              value={weights[s.key]}
              onChange={e => handleSlider(s.key, parseInt(e.target.value))}
              className={s.cls}
              style={{
                width: "100%",
                background: `linear-gradient(to right, ${s.color} ${weights[s.key]}%, #2a2a2a ${weights[s.key]}%)`,
              }}
            />
          </div>
        ))}

        {/* Indicador de total */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            fontWeight: 700,
            color: isValid ? "#44bb44" : "#ff5a33",
            textAlign: "center",
            marginBottom: 20,
            padding: "8px",
            border: `1px solid ${isValid ? "#44bb4422" : "#ff5a3322"}`,
            background: isValid ? "#44bb4408" : "#ff5a3308",
          }}
        >
          TOTAL: {total}% {isValid ? "✓" : `— FALTAM ${100 - total}%`}
        </div>

        {error && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#ff5a33", marginBottom: 12, textAlign: "center" }}>
            // {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, background: "transparent", border: "1px solid #2a2a2a",
              color: "#888", fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 14, letterSpacing: 1, padding: "10px", cursor: "pointer",
            }}
          >
            CANCELAR
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || saving}
            style={{
              flex: 1, background: isValid ? "#cc2200" : "#2a2a2a",
              border: "none", color: isValid ? "#fff" : "#555",
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
              fontSize: 14, letterSpacing: 1, padding: "10px",
              cursor: isValid ? "pointer" : "not-allowed",
            }}
          >
            {saving ? "SALVANDO..." : "SALVAR"}
          </button>
        </div>
      </div>
    </div>
  );
}
