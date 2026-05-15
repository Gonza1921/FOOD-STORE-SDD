# Tasks: CH-010 FSM Pedidos

## 1. Preparation

- [x] 1.1 Verificar que backend/pedidos/models.py tenga el enum EstadoPedido correcto
- [x] 1.2 Revisar repository.py actual de pedidos para entender métodos existentes
- [x] 1.3 Verificar que existe la tabla HistorialEstadoPedido o si hay que crearla

## 2. Backend - Service Layer

- [x] 2.1 Agregar método `validar_transicion(estado_actual, nuevo_estado)` en service.py
- [x] 2.2 Agregar método `avanzar_estado(pedido_id, nuevo_estado, usuario_id)` con validación de permisos
- [x] 2.3 Agregar método `decrementar_stock(items)` con validación pesimista
- [x] 2.4 Agregar método `restaurar_stock(items)` para cancelaciones
- [x] 2.5 Agregar método `cancelar_pedido(pedido_id, observacion, usuario_id)` con validaciones
- [x] 2.6 Agregar método `registrar_historial(pedido_id, estado_desde, estado_hacia, usuario_id, observacion)`
- [x] 2.7 Agregar método `obtener_historial(pedido_id)` para consultar audit trail
- [x] 2.8 Implementar lógica de transiciones FSM en avanzar_estado

## 3. Backend - Router Endpoints

- [x] 3.1 Agregar endpoint PATCH `/pedidos/{id}/estado` con validación de roles ADMIN/PEDIDOS
- [x] 3.2 Agregar endpoint PATCH `/pedidos/{id}/cancelar` con observación obligatoria
- [x] 3.3 Agregar endpoint GET `/pedidos/{id}/historial` con verificación de ownership
- [x] 3.4 Crear schemas Pydantic para request/response de los nuevos endpoints

## 4. Backend - Tests

- [x] 4.1 Crear test para transición válida PENDIENTE -> CONFIRMADO (ya existente en test_pedido_service.py)
- [x] 4.2 Crear test para transición inválida (rechazo de FSM) (ya existente)
- [x] 4.3 Crear test para decremento de stock al confirmar (ya existente)
- [x] 4.4 Crear test para restauración de stock al cancelar (añadido en TestNewEndpoints)
- [x] 4.5 Crear test para cancelación con observación obligatoria (TestCancelSchemaValidation)
- [x] 4.6 Crear test para permisos RBAC (admin vs cliente) (ya existente)
- [x] 4.7 Crear test para obtener historial de pedido (TestNewEndpoints)
- [x] 4.8 Crear test para estados terminales (no permiten más cambios) (ya existente)

## 5. Verification

- [ ] 5.1 Ejecutar todos los tests del módulo pedidos
- [ ] 5.2 Verificar con curl que los endpoints funcionan correctamente
- [ ] 5.3 Validar que el historial se registra correctamente en la base de datos
- [ ] 5.4 Probar escenarios de error (transición inválida, permisos denegados, etc.)

## 6. Documentation

- [ ] 6.1 Actualizar README del módulo pedidos con los nuevos endpoints
- [ ] 6.2 Documentar las transiciones FSM permitidas
- [ ] 6.3 Commit conventional: `feat(pedidos): implementar transiciones FSM con control de stock`