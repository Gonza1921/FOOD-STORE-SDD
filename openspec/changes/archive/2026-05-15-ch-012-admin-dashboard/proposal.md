## Why

El proyecto Food Store necesita un panel de administración completo para que los administradores puedan gestionar usuarios, productos, categorías, ingredientes y pedidos, además de visualizar métricas del negocio en tiempo real. Actualmente no existe una interfaz de administración, lo que limita la capacidad de gestionar el e-commerce de manera eficiente.

## What Changes

- **Dashboard con KPIs**: Total de pedidos, ingresos totales, pedidos pendientes, productos con stock bajo
- **Gráficos interactivos**: Ingresos por período (barras), pedidos por estado (torta), tendencia de pedidos (línea) usando Recharts
- **Gestión de usuarios**: Listar, crear, editar, eliminar usuarios; asignación de roles (ADMIN, STOCK, PEDIDOS, CLIENT)
- **Gestión de productos**: Listar productos, cambiar disponibilidad, actualizar stock, búsqueda y filtrado
- **Gestión de categorías**: CRUD con validación de jerarquía (evitar ciclos)
- **Gestión de ingredientes**: CRUD con toggle de alérgenos
- **Gestión de pedidos**: Lista con filtro por estado, vista detallada, avance manual de estado
- **Acceso restringido**: Solo ADMIN puede acceder al panel
- **Componentes reutilizables**: Skeleton loaders, toasts de confirmación, modales, estados vacíos
- **Diseño responsive**: Mobile-first con Tailwind CSS

## Capabilities

### New Capabilities

- `admin-dashboard`: Panel principal con métricas y gráficos de negocio
- `admin-usuarios`: Gestión CRUD de usuarios y asignación de roles
- `admin-productos`: Gestión de productos (stock, disponibilidad)
- `admin-categorias`: CRUD de categorías desde panel admin
- `admin-ingredientes`: CRUD de ingredientes con flag de alérgenos
- `admin-pedidos`: Gestión de pedidos con filtros y cambio manual de estado

### Modified Capabilities

- Ninguno. El panel admin es una interfaz que consume los endpoints existentes sin modificar sus requisitos.

## Impact

**Backend**:
- Ningún router nuevo necesario (ya existen endpoints para usuarios, productos, categorías, ingredientes, pedidos)
- Posible agregar endpoints de agregación para métricas (opcional)

**Frontend**:
- Nueva ruta `/admin` (protegida, solo ADMIN)
- Nuevas pages: AdminDashboardPage, AdminUsuariosPage, AdminProductosPage, AdminCategoriasPage, AdminIngredientesPage, AdminPedidosPage
- Nuevos componentes: MetricCard, ChartBar, ChartLine, ChartPie, DataTable, Modal, Toast
- Integración con endpoints existentes via TanStack Query

**Dependencias**:
- `recharts` ya está en package.json (usado en otros lugares)

**Acceso**:
- Ruta protegida exclusivamente para rol ADMIN