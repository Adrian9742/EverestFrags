/**
 * CategoryBar — barra de progresso para score de categoria
 *
 * Exibe label, valor e barra colorida.
 * Usada nos cards do pódio e da grade de ranking.
 */

interface CategoryBarProps {
  label: string;
  value: number;  // 0–100
  color: string;
}

export function CategoryBar({ label, value, color }: CategoryBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 9, letterSpacing: "1.5px", color: "#7a7a7a" }}>{label}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color }}>
          {Math.round(clamped)}
        </span>
      </div>
      <div style={{ height: 3, background: "#1a1a1a", borderRadius: 0 }}>
        <div
          style={{
            height: "100%",
            width: `${clamped}%`,
            background: color,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}
