"""PedidoService — business logic and transaction orchestration

Encapsulates:
- Pedido creation with items and automatic total calculation
- FSM state transitions with validation
- Stock control (decrement on confirmation)
- User-specific and admin pedido operations
- Atomicity via UnitOfWork context manager
- Error handling and mapping to HTTP status codes

Architecture: Router → Service → UnitOfWork → Repository → Model
Matches patterns used in: auth, categorias, ingredientes, productos
"""

from decimal import Decimal
from typing import Optional

from sqlmodel import select

from backend.core.exceptions import ConflictError, NotFoundError, ValidationError
from backend.core.unit_of_work import UnitOfWork
from backend.models.pedido import Pedido, DetallePedido, HistorialEstadoPedido
from backend.models.producto import Producto
from .repository import PedidoRepository


# ========================================================================
# FSM Configuration — State Transition Rules
# ========================================================================

class FSMEstados:
    """FSM state definitions matching database seed"""

    PENDIENTE = "PENDIENTE"
    CONFIRMADO = "CONFIRMADO"
    EN_PREP = "EN_PREP"
    EN_CAMINO = "EN_CAMINO"
    ENTREGADO = "ENTREGADO"
    CANCELADO = "CANCELADO"


class FSMTransiciones:
    """Valid state transitions - forward flow only"""

    # Forward transitions: estado_actual -> [estados_permitidos]
    TRANSICIONES = {
        FSMEstados.PENDIENTE: [FSMEstados.CONFIRMADO, FSMEstados.CANCELADO],
        FSMEstados.CONFIRMADO: [FSMEstados.EN_PREP, FSMEstados.CANCELADO],
        FSMEstados.EN_PREP: [FSMEstados.EN_CAMINO, FSMEstados.CANCELADO],
        FSMEstados.EN_CAMINO: [FSMEstados.ENTREGADO],
        FSMEstados.ENTREGADO: [],  # Terminal state
        FSMEstados.CANCELADO: [],  # Terminal state
    }

    @classmethod
    def es_transicion_valida(cls, estado_actual: str, nuevo_estado: str) -> bool:
        """Check if transition from estado_actual to nuevo_estado is valid."""
        estados_permitidos = cls.TRANSICIONES.get(estado_actual, [])
        return nuevo_estado in estados_permitidos

    @classmethod
    def puede_cancelar(cls, estado_actual: str) -> bool:
        """Check if current state allows cancellation."""
        return FSMEstados.CANCELADO in cls.TRANSICIONES.get(estado_actual, [])

    @classmethod
    def es_estado_terminal(cls, estado: str) -> bool:
        """Check if state is terminal (no outgoing transitions)."""
        return len(cls.TRANSICIONES.get(estado, [])) == 0


class PedidoService:
    """PedidoService — business logic for Pedido CRUD with FSM and stock.

    All DB operations run inside UnitOfWork for atomicity.
    No direct session access — always through repositories inside UoW.
    """

    # ========================================================================
    # Create operation (create_pedido) — with stock validation
    # ========================================================================

    async def create_pedido(
        self,
        usuario_id: int,
        items: list[dict],
    ) -> Pedido:
        """Create new pedido with items and automatic total calculation.

        Validations:
        - items must not be empty (already validated in schema)
        - Each producto_id must exist and be available
        - cantidad must be >= 1 (already validated in schema)
        - Stock validation (deferred until confirmation)

        Calculation:
        - precio_snapshot = current producto.precio_base (captured at order time)
        - subtotal = cantidad * precio_snapshot
        - total = SUM(subtotal for all items)

        Args:
            usuario_id: ID of the user creating the pedido.
            items: List of dicts with producto_id and cantidad.

        Returns:
            Created Pedido with items.

        Raises:
            ValidationError: If validation fails.
            ConflictError: If producto not found or not available.
        """
        if not items:
            raise ValidationError("El pedido debe tener al menos un artículo")

        async with UnitOfWork() as uow:
            repo = uow.register("pedidos", PedidoRepository, Pedido)

            # ---- Validations ----
            total_pedido = Decimal("0")
            detalles_a_crear = []

            for item in items:
                producto_id = item.get("producto_id")
                cantidad = item.get("cantidad")

                if not isinstance(producto_id, int) or producto_id <= 0:
                    raise ValidationError("ID de producto inválido")
                if not isinstance(cantidad, int) or cantidad < 1:
                    raise ValidationError("Cantidad inválida")

                # Get producto to capture price snapshot
                stmt = select(Producto).where(
                    Producto.id == producto_id,
                    Producto.deleted_at.is_(None),
                    Producto.disponible.is_(True),
                )
                result = await uow.session.execute(stmt)
                producto = result.scalar_one_or_none()

                if not producto:
                    raise ValidationError(f"Producto {producto_id} no encontrado o no disponible")

                # Calculate subtotal (snapshot price at order time)
                precio_snapshot = producto.precio_base
                subtotal = precio_snapshot * cantidad
                total_pedido += subtotal

                # Store for later creation
                detalles_a_crear.append({
                    "producto_id": producto_id,
                    "cantidad": cantidad,
                    "nombre_snapshot": producto.nombre,
                    "precio_snapshot": precio_snapshot,
                })

            # ---- Create Pedido ----
            # Default estado: PENDIENTE (using FK to estado_pedido.codigo)
            pedido = Pedido(
                usuario_id=usuario_id,
                estado_codigo=FSMEstados.PENDIENTE,
                total=total_pedido,
                forma_pago_codigo="EFECTIVO",  # Default payment method
            )
            uow.session.add(pedido)
            await uow.session.flush()

            # ---- Create DetallePedido items ----
            for detalle_data in detalles_a_crear:
                detalle = DetallePedido(
                    pedido_id=pedido.id,
                    producto_id=detalle_data["producto_id"],
                    cantidad=detalle_data["cantidad"],
                    nombre_snapshot=detalle_data["nombre_snapshot"],
                    precio_snapshot=detalle_data["precio_snapshot"],
                )
                uow.session.add(detalle)
            await uow.session.flush()

            # ---- Refresh with items ----
            await uow.session.refresh(pedido)
            # Load items
            stmt = select(DetallePedido).where(DetallePedido.pedido_id == pedido.id)
            result = await uow.session.execute(statement=stmt)
            detalles = list(result.scalars().all())
            # Attach to pedido for response
            pedido.detalles = detalles  # type: ignore[attr-defined]

            return pedido

    # ========================================================================
    # FSM State Transition (for admin)
    # ========================================================================

    async def confirmar_pedido(
        self,
        pedido_id: int,
        usuario_id: int,
        es_admin: bool = False,
    ) -> Pedido:
        """Confirm a pedido and decrement stock.

        This is a special transition: PENDIENTE -> CONFIRMADO
        Also performs stock validation and decrement.

        Args:
            pedido_id: Pedido ID to confirm.
            usuario_id: User requesting the action.
            es_admin: If True, bypass user ownership check.

        Returns:
            Updated Pedido with CONFIRMADO state.

        Raises:
            NotFoundError: If pedido not found.
            ValidationError: If not authorized or invalid transition.
            ConflictError: If stock insufficient.
        """
        return await self._transicionar_estado(
            pedido_id=pedido_id,
            nuevo_estado=FSMEstados.CONFIRMADO,
            usuario_id=usuario_id,
            es_admin=es_admin,
            descontar_stock=True,
        )

    async def transicionar_estado(
        self,
        pedido_id: int,
        nuevo_estado: str,
        usuario_id: int,
        es_admin: bool = False,
    ) -> Pedido:
        """Transition pedido to a new state (admin only).

        Validates FSM rules and permissions.

        Args:
            pedido_id: Pedido ID to transition.
            nuevo_estado: Target state (must be valid FSM transition).
            usuario_id: User requesting the action (must be admin).
            es_admin: If True, allow state transitions.

        Returns:
            Updated Pedido with new state.

        Raises:
            NotFoundError: If pedido not found.
            ValidationError: If not authorized or invalid transition.
        """
        return await self._transicionar_estado(
            pedido_id=pedido_id,
            nuevo_estado=nuevo_estado,
            usuario_id=usuario_id,
            es_admin=es_admin,
            descontar_stock=False,
        )

    async def _transicionar_estado(
        self,
        pedido_id: int,
        nuevo_estado: str,
        usuario_id: int,
        es_admin: bool = False,
        descontar_stock: bool = False,
    ) -> Pedido:
        """Internal method for state transitions with FSM validation.

        Args:
            pedido_id: Pedido ID.
            nuevo_estado: Target state code.
            usuario_id: User requesting.
            es_admin: If True, bypass ownership check.
            descontar_stock: If True, decrement stock on transition.

        Returns:
            Updated Pedido.

        Raises:
            NotFoundError: If pedido not found.
            ValidationError: If not authorized or invalid transition.
            ConflictError: If stock insufficient.
        """
        if not es_admin:
            raise ValidationError("Solo un administrador puede cambiar el estado del pedido")

        if nuevo_estado not in FSMTransiciones.TRANSICIONES:
            raise ValidationError(f"Estado '{nuevo_estado}' no es válido")

        async with UnitOfWork() as uow:
            repo = uow.register("pedidos", PedidoRepository, Pedido)

            # Get pedido with items
            pedido = await repo.get_by_id_con_items(pedido_id)
            if not pedido:
                raise NotFoundError(f"Pedido {pedido_id} no encontrado")

            # Store current state for history
            estado_anterior = pedido.estado_codigo  # type: ignore[arg-type]

            # Validate FSM transition
            if not FSMTransiciones.es_transicion_valida(estado_anterior, nuevo_estado):
                raise ValidationError(
                    f"No se puede cambiar de '{estado_anterior}' a '{nuevo_estado}'. "
                    f"Transiciones válidas desde '{estado_anterior}': "
                    f"{FSMTransiciones.TRANSICIONES.get(estado_anterior, [])}"
                )

            # Validate terminal state (can't transition FROM terminal)
            if FSMTransiciones.es_estado_terminal(estado_anterior):
                raise ValidationError(
                    f"El pedido está en estado terminal '{estado_anterior}' "
                    "y no puede ser modificado"
                )

            # ---- Stock decrement (only on PENDIENTE -> CONFIRMADO) ----
            if descontar_stock:
                for detalle in getattr(pedido, "detalles", []):
                    # Get current stock
                    stmt = select(Producto).where(Producto.id == detalle.producto_id)
                    result = await uow.session.execute(stmt)
                    producto = result.scalar_one_or_none()

                    if not producto:
                        raise ConflictError(
                            f"Producto {detalle.producto_id} no encontrado"
                        )

                    if producto.stock_cantidad < detalle.cantidad:
                        raise ConflictError(
                            f"Stock insuficiente para producto '{producto.nombre}'. "
                            f"Disponible: {producto.stock_cantidad}, "
                            f"Solicitado: {detalle.cantidad}"
                        )

                    # Decrement stock
                    producto.stock_cantidad -= detalle.cantidad
                    uow.session.add(producto)

                await uow.session.flush()

            # ---- Update state ----
            pedido.estado_codigo = nuevo_estado
            uow.session.add(pedido)
            await uow.session.flush()

            # ---- Create history record ----
            historial = HistorialEstadoPedido(
                pedido_id=pedido.id,
                estado_desde=estado_anterior,
                estado_nuevo=nuevo_estado,
                usuario_id=usuario_id,
                motivo=None,
            )
            uow.session.add(historial)
            await uow.session.flush()

            # ---- Refresh ----
            await uow.session.refresh(pedido)
            stmt = select(DetallePedido).where(DetallePedido.pedido_id == pedido.id)
            result = await uow.session.execute(statement=stmt)
            pedido.detalles = list(result.scalars().all())  # type: ignore[attr-defined]

            return pedido

    # ========================================================================
    # Read operations (get_pedido, list_pedidos)
    # ========================================================================

    async def get_pedido(
        self,
        pedido_id: int,
        usuario_id: int,
        es_admin: bool = False,
    ) -> Pedido:
        """Get pedido by ID, checking authorization.

        Args:
            pedido_id: Pedido ID.
            usuario_id: ID of the requesting user.
            es_admin: If True, return any pedido (admin view).

        Returns:
            Pedido with items loaded.

        Raises:
            NotFoundError: If pedido not found.
            ValidationError: If pedido doesn't belong to user (non-admin).
        """
        async with UnitOfWork() as uow:
            repo = uow.register("pedidos", PedidoRepository, Pedido)

            pedido = await repo.get_by_id_con_items(pedido_id)
            if not pedido:
                raise NotFoundError(f"Pedido {pedido_id} no encontrado")

            # Authorization: admin can view any, user only own
            if not es_admin and pedido.usuario_id != usuario_id:
                raise ValidationError("No tienes permiso para ver este pedido")

            return pedido

    async def list_pedidos(
        self,
        usuario_id: int,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Pedido], int]:
        """List pedidos for a specific user with pagination.

        Args:
            usuario_id: User ID to filter by.
            skip: Number of records to skip (offset).
            limit: Maximum number of records to return.

        Returns:
            Tuple of (list of Pedido, total count).
        """
        async with UnitOfWork() as uow:
            repo = uow.register("pedidos", PedidoRepository, Pedido)
            return await repo.get_all_by_usuario(usuario_id, skip, limit)

    # ========================================================================
    # Admin operations
    # ========================================================================

    async def list_all_pedidos(
        self,
        skip: int = 0,
        limit: int = 20,
        estado: Optional[str] = None,
    ) -> tuple[list[Pedido], int]:
        """List all pedidos for admin with optional state filter.

        Args:
            skip: Number of records to skip.
            limit: Maximum number of records.
            estado: Optional state filter.

        Returns:
            Tuple of (list of Pedido, total count).
        """
        async with UnitOfWork() as uow:
            repo = uow.register("pedidos", PedidoRepository, Pedido)
            return await repo.get_all_paginated(skip, limit, estado)

    async def get_pedido_by_id_admin(self, pedido_id: int) -> Optional[Pedido]:
        """Get pedido by ID (admin view, no auth check).

        Args:
            pedido_id: Pedido ID.

        Returns:
            Pedido with items loaded, or None.
        """
        async with UnitOfWork() as uow:
            repo = uow.register("pedidos", PedidoRepository, Pedido)
            return await repo.get_by_id_con_items(pedido_id)

    # ========================================================================
    # Cancel operations (for users and admins)
    # ========================================================================

    async def cancelar_pedido(
        self,
        pedido_id: int,
        observacion: str,
        usuario_id: int,
        es_admin: bool = False,
    ) -> Pedido:
        """Cancel a pedido with observation.

        Validations:
        - User can cancel their own pedidos in PENDIENTE state
        - Admin can cancel pedidos in PENDIENTE, CONFIRMADO, EN_PREP states
        - Cannot cancel from terminal states (ENTREGADO, CANCELADO)
        - Observation is mandatory
        - Stock is restored if pedido was CONFIRMED or EN_PREP

        Args:
            pedido_id: Pedido ID to cancel.
            observacion: Reason for cancellation (mandatory).
            usuario_id: User requesting cancellation.
            es_admin: If True, allow broader cancellation rights.

        Returns:
            Updated Pedido with CANCELADO state.

        Raises:
            NotFoundError: If pedido not found.
            ValidationError: If not authorized or invalid state.
        """
        if not observacion or not observacion.strip():
            raise ValidationError("La observación es obligatoria al cancelar")

        async with UnitOfWork() as uow:
            repo = uow.register("pedidos", PedidoRepository, Pedido)

            # Get pedido with items
            pedido = await repo.get_by_id_con_items(pedido_id)
            if not pedido:
                raise NotFoundError(f"Pedido {pedido_id} no encontrado")

            estado_actual = pedido.estado_codigo  # type: ignore[arg-type]

            # Check authorization
            if not es_admin:
                # Non-admin: can only cancel their own PENDIENTE pedidos
                if pedido.usuario_id != usuario_id:
                    raise ValidationError("No tienes permiso para cancelar este pedido")
                if estado_actual != FSMEstados.PENDIENTE:
                    raise ValidationError(
                        "Solo puedes cancelar tus pedidos en estado PENDIENTE"
                    )
            else:
                # Admin: can cancel from PENDIENTE, CONFIRMADO, EN_PREP
                if not FSMTransiciones.puede_cancelar(estado_actual):
                    if estado_actual in [FSMEstados.ENTREGADO, FSMEstados.CANCELADO]:
                        raise ValidationError(
                            f"No se puede cancelar un pedido en estado '{estado_actual}'"
                        )
                    raise ValidationError(
                        f"No se puede cancelar desde el estado '{estado_actual}'"
                    )

            # Check terminal state
            if FSMTransiciones.es_estado_terminal(estado_actual):
                raise ValidationError(
                    f"El pedido está en estado terminal '{estado_actual}' "
                    "y no puede ser modificado"
                )

            # ---- Restore stock if needed (only for CONFIRMADO or EN_PREP) ----
            if estado_actual in [FSMEstados.CONFIRMADO, FSMEstados.EN_PREP]:
                for detalle in getattr(pedido, "detalles", []):
                    stmt = select(Producto).where(Producto.id == detalle.producto_id)
                    result = await uow.session.execute(stmt)
                    producto = result.scalar_one_or_none()

                    if producto:
                        # Restore stock
                        producto.stock_cantidad += detalle.cantidad
                        uow.session.add(producto)

                await uow.session.flush()

            # ---- Update state to CANCELADO ----
            pedido.estado_codigo = FSMEstados.CANCELADO
            uow.session.add(pedido)
            await uow.session.flush()

            # ---- Create history record with observation ----
            historial = HistorialEstadoPedido(
                pedido_id=pedido.id,
                estado_desde=estado_actual,
                estado_nuevo=FSMEstados.CANCELADO,
                usuario_id=usuario_id,
                motivo=observacion.strip(),
            )
            uow.session.add(historial)
            await uow.session.flush()

            # ---- Refresh ----
            await uow.session.refresh(pedido)
            stmt = select(DetallePedido).where(DetallePedido.pedido_id == pedido.id)
            result = await uow.session.execute(statement=stmt)
            pedido.detalles = list(result.scalars().all())  # type: ignore[attr-defined]

            return pedido

    # ========================================================================
    # History / Audit Trail
    # ========================================================================

    async def obtener_historial(
        self,
        pedido_id: int,
        usuario_id: int,
        es_admin: bool = False,
    ) -> list[HistorialEstadoPedido]:
        """Get state transition history for a pedido.

        Args:
            pedido_id: Pedido ID.
            usuario_id: Requesting user ID.
            es_admin: If True, bypass ownership check.

        Returns:
            List of HistorialEstadoPedido records ordered by created_at.

        Raises:
            NotFoundError: If pedido not found or not owned by user.
        """
        async with UnitOfWork() as uow:
            repo = uow.register("pedidos", PedidoRepository, Pedido)

            # First check if pedido exists and user has access
            pedido = await repo.get_by_id_con_items(pedido_id)
            if not pedido:
                raise NotFoundError(f"Pedido {pedido_id} no encontrado")

            # Authorization check
            if not es_admin and pedido.usuario_id != usuario_id:
                raise ValidationError("No tienes permiso para ver el historial de este pedido")

            # Get history
            stmt = select(HistorialEstadoPedido).where(
                HistorialEstadoPedido.pedido_id == pedido_id
            ).order_by(HistorialEstadoPedido.created_at.asc())

            result = await uow.session.execute(stmt)
            return list(result.scalars().all())