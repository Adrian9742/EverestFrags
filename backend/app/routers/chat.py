"""
Router — chat em tempo real via WebSocket

Endpoint:
  WS /api/chat/ws?token=<JWT>  → conexão WebSocket autenticada

Mensagens são broadcast para todos os clientes conectados.
Formato de mensagem (JSON):
  Entrada:  { "text": "mensagem" }
  Saída:    { "player_id": 1, "nickname": "GodBR", "avatar_initials": "GB", "text": "mensagem", "timestamp": "..." }

Sem persistência — mensagens existem apenas em memória enquanto o servidor está no ar.
"""

import json
from datetime import datetime, timezone
from typing import Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError, jwt

import os

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Mapa de conexões ativas: player_id → (WebSocket, nickname, avatar_initials)
_connections: Dict[int, tuple] = {}


def _decode_token(token: str) -> dict | None:
    secret = os.getenv("SECRET_KEY", "")
    algo = os.getenv("ALGORITHM", "HS256")
    try:
        return jwt.decode(token, secret, algorithms=[algo])
    except JWTError:
        return None


async def _broadcast(message: dict):
    payload = json.dumps(message, ensure_ascii=False)
    dead = []
    for pid, (ws, _, _) in list(_connections.items()):
        try:
            await ws.send_text(payload)
        except Exception:
            dead.append(pid)
    for pid in dead:
        _connections.pop(pid, None)


@router.websocket("/ws")
async def chat_ws(websocket: WebSocket, token: str = Query(...)):
    payload = _decode_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    # Importa aqui para evitar import circular
    from app.database import SessionLocal
    from app.models.player import Player

    db = SessionLocal()
    try:
        player_id = int(payload.get("sub", 0))
        player = db.query(Player).filter(Player.id == player_id, Player.is_active == True).first()
        if not player:
            await websocket.close(code=4003)
            return
    finally:
        db.close()

    await websocket.accept()
    _connections[player_id] = (websocket, player.nickname, player.avatar_initials)

    # Avisa que o player entrou
    await _broadcast({
        "type": "join",
        "player_id": player_id,
        "nickname": player.nickname,
        "avatar_initials": player.avatar_initials,
        "text": f"{player.nickname} entrou no chat",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
                text = str(data.get("text", "")).strip()[:500]
            except Exception:
                continue

            if not text:
                continue

            await _broadcast({
                "type": "message",
                "player_id": player_id,
                "nickname": player.nickname,
                "avatar_initials": player.avatar_initials,
                "text": text,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

    except WebSocketDisconnect:
        _connections.pop(player_id, None)
        await _broadcast({
            "type": "leave",
            "player_id": player_id,
            "nickname": player.nickname,
            "avatar_initials": player.avatar_initials,
            "text": f"{player.nickname} saiu do chat",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
