"""Per-order WebSocket pub/sub for customer order tracking.

Maps pedido_id -> set[WebSocket] for targeted event delivery.
Thread-safe using asyncio.Lock.
"""

import json
import logging
from datetime import datetime
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class OrderTracker:
    """Manages per-order WebSocket connections for customer tracking."""

    def __init__(self) -> None:
        self._orders: dict[int, set[WebSocket]] = {}
        self._lock = __import__("asyncio").Lock()

    async def connect(self, pedido_id: int, websocket: WebSocket) -> None:
        """Register a WebSocket for a specific order."""
        async with self._lock:
            if pedido_id not in self._orders:
                self._orders[pedido_id] = set()
            self._orders[pedido_id].add(websocket)
        logger.info(
            "OrderTracker: client connected to pedido %d. Active: %d",
            pedido_id, len(self._orders.get(pedido_id, set())),
        )

    async def disconnect(self, pedido_id: int, websocket: WebSocket) -> None:
        """Remove a WebSocket from an order's subscribers."""
        async with self._lock:
            conns = self._orders.get(pedido_id, set())
            conns.discard(websocket)
            if not conns:
                self._orders.pop(pedido_id, None)
        logger.info(
            "OrderTracker: client disconnected from pedido %d",
            pedido_id,
        )

    async def send_to_order(
        self, pedido_id: int, event_type: str, payload: dict[str, Any]
    ) -> None:
        """Send an event to all clients tracking a specific order.

        Best-effort: disconnected clients are removed silently.
        """
        async with self._lock:
            connections = self._orders.get(pedido_id, set()).copy()

        if not connections:
            return

        message = json.dumps(
            {
                "tipo": event_type,
                "pedido": payload,
                "timestamp": datetime.utcnow().isoformat(),
            },
            default=str,
        )
        stale = set()

        for ws in connections:
            try:
                await ws.send_text(message)
            except Exception:
                stale.add(ws)

        if stale:
            async with self._lock:
                conns = self._orders.get(pedido_id, set())
                conns -= stale
                if not conns:
                    self._orders.pop(pedido_id, None)

    @property
    def active_orders(self) -> int:
        """Return the number of orders being tracked."""
        return len(self._orders)


# Module-level singleton
order_tracker = OrderTracker()
