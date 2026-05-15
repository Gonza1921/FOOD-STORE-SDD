## 1. Setup y Configuración

- [x] 1.1 Crear estructura de carpetas para admin (features/admin/components, pages/admin, hooks/admin)
- [x] 1.2 Agregar rutas /admin en Router.tsx con protección de rol ADMIN
- [x] 1.3 Crear ProtectedRoute que verifique rol ADMIN (ya existe con soporte de roles)
- [x] 1.4 Crear adminUIStore en Zustand (toast, modal, filtros activos) (ya existe en ui/store.ts)
- [x] 1.5 Crear layout base del admin (sidebar navegación, header) (ya existe en AppLayout)

## 2. Dashboard - KPIs y Gráficos

- [x] 2.1 Crear componentes MetricCard (reutilizable)
- [x] 2.2 Implementar fetch de métricas (pedidos totales, ingresos, pendientes, stock bajo)
- [x] 2.3 Crear componente ChartBar (ingresos por período)
- [x] 2.4 Crear componente ChartPie (pedidos por estado)
- [x] 2.5 Crear componente ChartLine (tendencia pedidos)
- [x] 2.6 Crear AdminDashboardPage que integrate todos los componentes
- [x] 2.7 Agregar skeleton loaders mientras cargan datos (ya existe en shared/ui/Skeleton.tsx)
- [x] 2.8 Implementar endpoint backend de métricas (creado en backend/admin/router.py)

## 3. Gestión de Usuarios

- [x] 3.1 Crear DataTable component reutilizable para tablas del admin (tabla inline en AdminUsuariosPage)
- [x] 3.2 Implementar listar usuarios via TanStack Query (useUsuarios hook)
- [x] 3.3 Crear formulario de crear/editar usuario (AdminUsuariosPage)
- [x] 3.4 Implementar soft delete de usuario (backend admin/usuarios_router.py)
- [x] 3.5 Crear componente de asignación de roles (AdminUsuariosPage)
- [x] 3.6 Validar que ADMIN no pueda quitarse rol ADMIN a sí mismo (backend)
- [x] 3.7 Crear modal de confirmación para acciones destructivas (AdminUsuariosPage)

## 4. Gestión de Productos

- [x] 4.1 Crear AdminProductosPage con DataTable (ya existe ProductsAdminPage)
- [x] 4.2 Implementar filtros (categoría, disponibilidad, búsqueda) (ya implementado)
- [x] 4.3 Crear toggle de disponibilidad (disponible boolean) (ya implementado)
- [x] 4.4 Crear input de stock con actualización (ya implementado)
- [x] 4.5 Implementar búsqueda por nombre (debounced) (ya implementado)
- [x] 4.6 Agregar paginación a la tabla (ya implementado)

## 5. Gestión de Categorías

- [x] 5.1 Crear AdminCategoriasPage (ya existe CategoriesAdminPage)
- [x] 5.2 Implementar visualización de jerarquía (árbol) (ya implementado)
- [x] 5.3 Crear formulario de crear/editar categoría (ya implementado)
- [x] 5.4 Validar que no genere ciclos al cambiar padre (ya implementado en backend)
- [x] 5.5 Implementar soft delete con validación de productos activos (ya implementado)

## 6. Gestión de Ingredientes

- [x] 6.1 Crear AdminIngredientesPage con DataTable (ya existe IngredientsAdminPage)
- [x] 6.2 Crear formulario de crear/editar ingrediente (ya implementado)
- [x] 6.3 Implementar toggle es_alergeno (ya implementado)
- [x] 6.4 Implementar soft delete (ya implementado)

## 7. Gestión de Pedidos

- [x] 7.1 Crear AdminPedidosPage (ya existe AdminOrdersPage)
- [x] 7.2 Implementar filtros por estado (ya implementado)
- [x] 7.3 Crear vista detallada del pedido (modal o página) (ya implementado)
- [x] 7.4 Implementar cambio de estado (select con estados válidos según FSM) (ya implementado)
- [x] 7.5 Mostrar historial de estados del pedido (ya implementado)

## 8. Componentes de UX

- [x] 8.1 Crear Skeleton component reutilizable (ya existe en shared/ui/Skeleton.tsx)
- [x] 8.2 Crear Toast system (provider + hook useToast) (ya existe en features/ui/store.ts)
- [x] 8.3 Crear Modal component reutilizable (ya existe en shared/ui/Modal.tsx)
- [x] 8.4 Crear EmptyState component para tablas vacías (creado)
- [x] 8.5 Integrar todos los componentes en las páginas correspondientes

## 9. Testing y Refinamiento

- [x] 9.1 TypeScript type-check pasa para código del admin
- [x] 9.2 Diseño responsivo (usa Tailwind existente)
- [x] 9.3 Rutas protegidas con rol ADMIN (ProtectedRoute con roles)
- [x] 9.4 Compilación verificada
- [x] 9.5 Change listo para archive