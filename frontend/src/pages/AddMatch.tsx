/**
 * Página /matches/new — formulário para adicionar partida
 *
 * Tabela de entrada: uma linha por jogador, colunas = todas as métricas.
 * O admin seleciona quais jogadores participaram via checkboxes.
 * Validação client-side antes de enviar.
 * Ao salvar: POST /api/matches → redireciona para /matches.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { playersApi, matchesApi, type PlayerResponse, type PlayerStatsCreate } from "../api/client";

const MAPS = ["de_dust2", "de_mirage", "de_inferno", "de_nuke", "de_ancient", "de_anubis", "de_vertigo"];

type StatRow = PlayerStatsCreate & { selected: boolean };

const STAT_COLS: { key: keyof PlayerStatsCreate; label: string; min: number; max: number; step: number }[] = [
  { key: "kills", label: "K", min: 0, max: 60, step: 1 },
  { key: "deaths", label: "D", min: 0, max: 60, step: 1 },
  { key: "assists", label: "A", min: 0, max: 30, step: 1 },
  { key: "damage_total", label: "DMG", min: 0, max: 5000, step: 1 },
  { key: "adr", label: "ADR", min: 0, max: 500, step: 0.1 },
  { key: "adr_difference", label: "ADR+/-", min: -200, max: 200, step: 0.1 },
  { key: "hltv_rating", label: "RATING", min: 0, max: 5, step: 0.001 },
  { key: "kast_percent", label: "KAST%", min: 0, max: 100, step: 0.1 },
  { key: "opening_kills", label: "OPEN K", min: 0, max: 20, step: 1 },
  { key: "trade_kills", label: "TRADE", min: 0, max: 20, step: 1 },
  { key: "time_to_kill_ms", label: "TTK(ms)", min: 0, max: 2000, step: 1 },
  { key: "flash_assists", label: "FA", min: 0, max: 20, step: 1 },
  { key: "grenade_damage", label: "NADE DMG", min: 0, max: 500, step: 1 },
  { key: "he_enemies_hit", label: "HE HIT", min: 0, max: 20, step: 1 },
  { key: "fire_enemies_hit", label: "FIRE HIT", min: 0, max: 20, step: 1 },
];

export function AddMatch() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<PlayerResponse[]>([]);
  const [rows, setRows] = useState<StatRow[]>([]);
  const [playedAt, setPlayedAt] = useState(new Date().toISOString().slice(0, 10));
  const [mapName, setMapName] = useState("");
  const [scopeUrl, setScopeUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    playersApi.list().then(ps => {
      setPlayers(ps);
      setRows(ps.map(p => ({
        player_id: p.id,
        selected: false,
        kills: 0, deaths: 0, assists: 0, damage_total: 0,
        adr: 0, adr_difference: 0, hltv_rating: 0, kast_percent: 0,
        opening_kills: 0, trade_kills: 0, time_to_kill_ms: 0,
        flash_assists: 0, grenade_damage: 0, he_enemies_hit: 0, fire_enemies_hit: 0,
      })));
    });
  }, []);

  function toggleRow(idx: number) {
    setRows(r => r.map((row, i) => i === idx ? { ...row, selected: !row.selected } : row));
  }

  function updateStat(idx: number, key: keyof PlayerStatsCreate, value: number) {
    setRows(r => r.map((row, i) => i === idx ? { ...row, [key]: value } : row));
  }

  async function handleSave() {
    const selected = rows.filter(r => r.selected);
    if (selected.length === 0) { setError("Selecione ao menos 1 jogador"); return; }
    if (!playedAt) { setError("Informe a data da partida"); return; }

    setSaving(true);
    setError("");
    try {
      await matchesApi.create({
        scope_url: scopeUrl || undefined,
        played_at: playedAt,
        map_name: mapName || undefined,
        notes: notes || undefined,
        players: selected.map(({ selected: _s, ...stats }) => stats),
      });
      navigate("/matches");
    } catch (e: any) {
      setError(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const selectedCount = rows.filter(r => r.selected).length;

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#e8e8e8", fontFamily: "'Inter', sans-serif", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <button onClick={() => navigate("/matches")} style={{ background: "transparent", border: "none", color: "#555", fontSize: 12, cursor: "pointer", padding: 0, letterSpacing: 1 }}>
              ← PARTIDAS
            </button>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 700, color: "#f4f4f4", marginTop: 6 }}>
              ADICIONAR PARTIDA
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {error && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#ff5a33" }}>
                // {error}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || selectedCount === 0}
              style={{
                background: selectedCount > 0 ? "#cc2200" : "#2a2a2a",
                border: "none", color: selectedCount > 0 ? "#fff" : "#555",
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                fontSize: 16, letterSpacing: 1.5, padding: "12px 22px", cursor: saving ? "wait" : "pointer",
              }}
            >
              {saving ? "SALVANDO..." : `SALVAR PARTIDA (${selectedCount} players)`}
            </button>
          </div>
        </div>

        {/* Metadados */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "DATA", value: playedAt, onChange: setPlayedAt, type: "date", required: true },
            { label: "URL SCOPE.GG", value: scopeUrl, onChange: setScopeUrl, type: "text", required: false },
            { label: "NOTAS", value: notes, onChange: setNotes, type: "text", required: false },
          ].map(f => (
            <div key={f.label} style={{ flex: 1, minWidth: 160 }}>
              <label style={{ display: "block", fontSize: 9, letterSpacing: "2px", color: "#6a6a6a", marginBottom: 5 }}>{f.label}</label>
              <input
                type={f.type}
                value={f.value}
                onChange={e => f.onChange(e.target.value)}
                style={{ width: "100%", background: "#0e0e0e", border: "1px solid #1f1f1f", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, padding: "8px 10px", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          ))}
          <div style={{ minWidth: 160 }}>
            <label style={{ display: "block", fontSize: 9, letterSpacing: "2px", color: "#6a6a6a", marginBottom: 5 }}>MAPA</label>
            <select
              value={mapName}
              onChange={e => setMapName(e.target.value)}
              style={{ width: "100%", background: "#0e0e0e", border: "1px solid #1f1f1f", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, padding: "8px 10px", outline: "none" }}
            >
              <option value="">—</option>
              {MAPS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Tabela de stats */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
            <thead>
              <tr style={{ background: "#101010", borderBottom: "1px solid #1c1c1c" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 9, letterSpacing: "2px", color: "#5a5a5a", fontWeight: 400 }}>✓</th>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 9, letterSpacing: "2px", color: "#5a5a5a", fontWeight: 400 }}>PLAYER</th>
                {STAT_COLS.map(c => (
                  <th key={c.key} style={{ padding: "8px 8px", textAlign: "center", fontSize: 9, letterSpacing: "1.5px", color: "#5a5a5a", fontWeight: 400 }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const player = players.find(p => p.id === row.player_id);
                return (
                  <tr
                    key={row.player_id}
                    style={{ borderBottom: "1px solid #111", background: row.selected ? "#0d0d0d" : "transparent", opacity: row.selected ? 1 : 0.5 }}
                  >
                    <td style={{ padding: "6px 12px" }}>
                      <input type="checkbox" checked={row.selected} onChange={() => toggleRow(idx)} style={{ accentColor: "#cc2200", cursor: "pointer" }} />
                    </td>
                    <td style={{ padding: "6px 12px" }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 600, color: "#d0d0d0" }}>
                        {player?.nickname}
                      </div>
                    </td>
                    {STAT_COLS.map(c => (
                      <td key={c.key} style={{ padding: "4px 4px" }}>
                        <input
                          type="number"
                          value={row[c.key] as number}
                          min={c.min}
                          max={c.max}
                          step={c.step}
                          disabled={!row.selected}
                          onChange={e => updateStat(idx, c.key, parseFloat(e.target.value) || 0)}
                          style={{
                            width: "100%", background: row.selected ? "#0a0a0a" : "#070707",
                            border: "1px solid #1a1a1a", color: row.selected ? "#e8e8e8" : "#444",
                            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                            padding: "5px 6px", outline: "none", textAlign: "center",
                            minWidth: 60,
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
