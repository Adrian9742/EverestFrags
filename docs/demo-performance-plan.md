# EverestFrags — Plano: Performance no Parse de Demos

Branch: `feat/demo-performance` | Base: `dev`

---

## Problema atual

O upload de `.dem` bloqueia a tela do admin por 10–30s enquanto o parse roda.
O gargalo é o `demoparser2` (Rust+Python) parseando a demo inteira.

---

## 1. Parse Seletivo (maior impacto no tempo real)

Hoje o parser provavelmente lê todos os eventos da demo. O `demoparser2`
permite especificar exatamente quais eventos extrair — o resto é ignorado.

**Antes (lento — parseia tudo):**
```python
# parse genérico sem filtro
df = parser.parse_event("all")
```

**Depois (rápido — só o que precisamos):**
```python
from demoparser2 import DemoParser

parser = DemoParser(path)

# Só os eventos que o sistema usa
kills    = parser.parse_event("player_death",
               player=["kills", "deaths", "assists", "total_damage_given"])
damage   = parser.parse_event("player_hurt",
               player=["dmg_health", "dmg_armor"])
flashes  = parser.parse_event("flashbang_detonate",
               player=["flash_duration"])
grenades = parser.parse_event("he_grenade_detonate",
               player=["dmg_health"])
fires    = parser.parse_event("inferno_startburn",
               player=["dmg_health"])
opening  = parser.parse_event("player_death",        # primeiro abate por round
               player=["round", "tick"])
```

**Ganho estimado:** 40–70% de redução no tempo de parse dependendo do tamanho da demo.

---

## 2. Pré-validação antes de parsear (fail fast)

Rejeitar o arquivo antes de iniciar o parse se não passar nas verificações.
Evita processar por 20s e só então dar erro.

```python
DEMO_MAGIC = b"HL2DEMO\x00"  # CS2 e CS:GO
CS2_MAGIC  = b"PBDEMS2\x00"  # CS2 específico

async def validate_demo(file: UploadFile) -> bytes:
    header = await file.read(16)
    await file.seek(0)

    if not (header.startswith(DEMO_MAGIC) or header.startswith(CS2_MAGIC)):
        raise HTTPException(400, "Arquivo não é uma demo CS2 válida")

    # Limite de tamanho: 200MB
    if file.size and file.size > 200 * 1024 * 1024:
        raise HTTPException(400, "Demo muito grande (máx 200MB)")

    return header
```

Rejeita na hora: arquivo errado, demo de CS:GO (formato diferente), arquivo corrompido.

---

## 3. Processamento Assíncrono (melhora percepção de velocidade)

O endpoint de upload retorna imediatamente com status "processando".
O parse roda em background. A partida aparece automaticamente quando terminar.

**Fluxo atual:**
```
Upload → parse (trava 10-30s) → retorna ok → partida aparece
```

**Fluxo novo:**
```
Upload → retorna "processando" na hora
       → parse roda em background
       → partida aparece na lista automaticamente (polling ou WebSocket)
```

**Implementação com FastAPI BackgroundTasks:**
```python
from fastapi import BackgroundTasks

@router.post("/demo/parse")
async def upload_demo(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    current_player = Depends(get_current_admin)
):
    await validate_demo(file)           # falha rápido se inválido

    demo_id = str(uuid4())
    demo_path = save_temp_file(file, demo_id)

    background_tasks.add_task(parse_and_save, demo_path, demo_id)

    return {"status": "processing", "demo_id": demo_id}


async def parse_and_save(path: str, demo_id: str):
    try:
        stats = parse_demo_selective(path)   # parse seletivo (item 1)
        save_match_to_db(stats)
    finally:
        os.remove(path)                      # limpa arquivo temp
```

**Frontend — polling simples:**
```typescript
// Após upload, poll a cada 3s até a partida aparecer
const pollForMatch = async (demoId: string) => {
  const interval = setInterval(async () => {
    const match = await api.get(`/demo/status/${demoId}`)
    if (match.status === "done") {
      clearInterval(interval)
      navigate(`/matches/${match.match_id}`)
    }
  }, 3000)
}
```

---

## 4. Tabela de status do parse (necessária para o async)

```sql
CREATE TABLE demo_jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status      VARCHAR(20) DEFAULT 'processing',  -- processing | done | error
  match_id    INTEGER REFERENCES matches(id),
  error_msg   TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP
);
```

Novo endpoint: `GET /api/demo/status/{demo_id}` — retorna status do job.

---

## Ordem de implementação sugerida

1. **Pré-validação** — 30min, zero risco, falha mais rápido
2. **Parse seletivo** — 1-2h, maior ganho de performance real
3. **Async + tabela de jobs** — meio dia, melhora UX significativamente
4. **Polling no frontend** — 1h, completa o fluxo async

---

## Ganhos esperados

| Melhoria | Impacto |
|---|---|
| Parse seletivo | 40–70% menos tempo de parse |
| Pré-validação | Falha em < 1s (vs 20s+ hoje) |
| Async | Admin não trava mais esperando |
| Juntos | Demo de 5min hoje → ~1-2min + sem trava |
