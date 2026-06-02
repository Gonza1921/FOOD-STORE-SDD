"""WebSocket connection manager for in-process pub/sub.

Manages active WebSocket connections and broadcasts events to all connected
clients. Designed for single-instance deployment — does NOT support horizontal
scaling (no Redis, no external bus).

Thread safety: all operations use asyncio.Lock to protect the connection set.
Best-effort delivery: if a connection fails during broadcast, it's removed
silently (client disconnected).

Usage:
    websocket_manager = WebSocketManager()

    # On connect:
    await websocket_manager.connect(websocket)

    # On disconnect:
    await websocket_manager.disconnect(websocket)

    # Broadcast event to all:
    await websocket_manager.broadcast_event("PEDIDO_CONFIRMADO", {...})
"""

import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manages WebSocket connections and provides pub/sub in-process."""

    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()
        self._lock = __import__("asyncio").Lock()

    async def connect(self, websocket: WebSocket) -> None:
        """Register a new WebSocket connection.

        Args:
            websocket: The WebSocket connection to register.
        """
        async with self._lock:
            self._connections.add(websocket)
        logger.info(
            "WebSocket connected. Active connections: %d",
            len(self._connections),
        )

    async def disconnect(self, websocket: WebSocket) -> None:
        """Remove a WebSocket connection.

        Args:
            websocket: The WebSocket connection to remove.
        """
        async with self._lock:
            self._connections.discard(websocket)
        logger.info(
            "WebSocket disconnected. Active connections: %d",
            len(self._connections),
        )

    async def broadcast(self, message: dict[str, Any]) -> None:
        """Send a JSON message to ALL connected clients.

        Best-effort: if a client is disconnected, it's removed silently.
        The message is serialised once and sent to each connection.

        Args:
            message: Dictionary to send as JSON.
        """
        async with self._lock:
            connections = self._connections.copy()

        payload = json.dumps(message, default=str)
        stale = set()

        for ws in connections:
            try:
                await ws.send_text(payload)
            except Exception:
                stale.add(ws)

        if stale:
            async with self._lock:
                self._connections -= stale

    async def broadcast_event(
        self,
        event_type: str,
        payload: dict[str, Any],
    ) -> None:
        """Broadcast a typed event to all connected clients.

        Shorthand for ``broadcast({"tipo": event_type, "payload": ...})``.

        Args:
            event_type: Event type string (e.g. ``"PEDIDO_CONFIRMADO"``).
            payload: Event-specific data.
        """
        await self.broadcast(
            {
                "tipo": event_type,
                "payload": {
                    **payload,
                    "timestamp": __import__("datetime")
                    .datetime.utcnow()
                    .isoformat(),
                },
            }
        )

    @property
    def active_connections(self) -> int:
        """Return the number of active connections."""
        return len(self._connections)


# Module-level singleton — imported by both cocina/router and pedidos/service
websocket_manager = WebSocketManager()
