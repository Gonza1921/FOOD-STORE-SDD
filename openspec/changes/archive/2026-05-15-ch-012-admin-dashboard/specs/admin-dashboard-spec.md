## ADDED Requirements

### Requirement: Panel de administración accesible solo para ADMIN

El sistema DEBE permitir acceso al panel de administración únicamente a usuarios con rol ADMIN. Cualquier intento de acceso a rutas /admin por usuarios sin rol ADMIN debe ser denegado con redirección a página de acceso denegado.

#### Scenario: ADMIN accede al dashboard
- **WHEN** el usuario con rol ADMIN navega a /admin
- **THEN** el sistema muestra el panel de administración completo

#### Scenario: CLIENT intenta acceder al admin
- **WHEN** el usuario con rol CLIENT navega a /admin
- **THEN** el sistema muestra página de acceso denegado (403)

#### Scenario: Usuario no autenticado intenta acceder al admin
- **WHEN** un usuario sin sesión navega a /admin
- **THEN** el sistema redirige a /login

---

### Requirement: Dashboard muestra KPIs de negocio

El panel de administración DEBE mostrar métricas clave del negocio actualizadas en tiempo real.

#### Scenario: Dashboard muestra total de pedidos
- **WHEN** el ADMIN visualiza el dashboard
- **THEN** se muestra un indicador con el total de pedidos en el sistema

#### Scenario: Dashboard muestra ingresos totales
- **WHEN** el ADMIN visualiza el dashboard
- **THEN** se muestra un indicador con la suma de todos los pedidos en estado ENTREGADO o CONFIRMADO

#### Scenario: Dashboard muestra pedidos pendientes
- **WHEN** el ADMIN visualiza el dashboard
- **THEN** se muestra un indicador con la cantidad de pedidos en estado PENDIENTE

#### Scenario: Dashboard muestra productos con stock bajo
- **WHEN** el ADMIN visualiza el dashboard
- **THEN** se muestra un indicador con productos cuyo stock_cantidad es menor o igual a 10 unidades

---

### Requirement: Dashboard muestra gráficos de tendencias

El panel de administración DEBE incluir visualizaciones gráficas de datos históricos.

#### Scenario: Gráfico de ingresos por período
- **WHEN** el ADMIN visualiza el dashboard
- **THEN** se muestra un gráfico de barras con ingresos diarios de los últimos 30 días

#### Scenario: Gráfico de pedidos por estado
- **WHEN** el ADMIN visualiza el dashboard
- **THEN** se muestra un gráfico de torta con distribución de pedidos por estado

#### Scenario: Gráfico de tendencia de pedidos
- **WHEN** el ADMIN visualiza el dashboard
- **THEN** se muestra un gráfico de línea con cantidad de pedidos por día de los últimos 7 días

---

### Requirement: Gestión de usuarios desde panel admin

El sistema DEBE permitir a los administradores gestionar usuarios del sistema.

#### Scenario: Listar todos los usuarios
- **WHEN** el ADMIN navega a /admin/usuarios
- **THEN** el sistema muestra una tabla con todos los usuarios incluyendo: nombre, email, roles, estado (activo/inactivo), fecha de registro

#### Scenario: Crear nuevo usuario
- **WHEN** el ADMIN hace clic en "Crear Usuario" y completa el formulario
- **THEN** el sistema crea el usuario con el rol especificado y muestra mensaje de éxito

#### Scenario: Editar usuario existente
- **WHEN** el ADMIN selecciona un usuario y modifica sus datos
- **THEN** el sistema actualiza los datos del usuario y muestra mensaje de éxito

#### Scenario: Eliminar usuario (soft delete)
- **WHEN** el ADMIN hace clic en eliminar usuario
- **THEN** el sistema realiza soft delete (marca eliminado_en) y el usuario no aparece en listados activos

#### Scenario: Asignar roles a usuario
- **WHEN** el ADMIN selecciona un usuario y elige roles para asignar
- **THEN** el sistema actualiza los roles del usuario (válidos: ADMIN, STOCK, PEDIDOS, CLIENT)

#### Scenario: ADMIN no puede quitarse rol ADMIN a sí mismo
- **WHEN** el ADMIN intenta quitarse el rol ADMIN
- **THEN** el sistema muestra error indicando que no puede realizarse esta acción

---

### Requirement: Gestión de productos desde panel admin

El sistema DEBE permitir a los administradores gestionar productos del catálogo.

#### Scenario: Listar productos con filtros
- **WHEN** el ADMIN navega a /admin/productos
- **THEN** el sistema muestra tabla de productos con filtros por categoría, disponibilidad y búsqueda por nombre

#### Scenario: Cambiar disponibilidad de producto
- **WHEN** el ADMIN togglea el switch de disponibilidad de un producto
- **THEN** el sistema actualiza el campo disponible y muestra mensaje de éxito

#### Scenario: Actualizar stock de producto
- **WHEN** el ADMIN ingresa nueva cantidad de stock
- **THEN** el sistema actualiza stock_cantidad y muestra mensaje de éxito

#### Scenario: Buscar productos por nombre
- **WHEN** el ADMIN escribe en el campo de búsqueda
- **THEN** el sistema filtra productos cuyo nombre contiene el texto buscado (case-insensitive)

---

### Requirement: Gestión de categorías desde panel admin

El sistema DEBE permitir a los administradores gestionar categorías.

#### Scenario: Listar categorías con jerarquía
- **WHEN** el ADMIN navega a /admin/categorias
- **THEN** el sistema muestra árbol de categorías con indicating relaciones padre-hijo

#### Scenario: Crear categoría
- **WHEN** el ADMIN completa formulario de nueva categoría (nombre, padre opcional)
- **THEN** el sistema crea la categoría y la muestra en el listado

#### Scenario: Editar categoría
- **WHEN** el ADMIN modifica nombre o padre de una categoría
- **THEN** el sistema actualiza y valida que no genere ciclos en la jerarquía

#### Scenario: Eliminar categoría con productos activos
- **WHEN** el ADMIN intenta eliminar categoría que tiene productos asociados activos
- **THEN** el sistema muestra error indicando que primero debe reassignar o eliminar los productos

---

### Requirement: Gestión de ingredientes desde panel admin

El sistema DEBE permitir a los administradores gestionar ingredientes y alérgenos.

#### Scenario: Listar ingredientes
- **WHEN** el ADMIN navega a /admin/ingredientes
- **THEN** el sistema muestra tabla de ingredientes con nombre y flag es_alergeno

#### Scenario: Crear ingrediente
- **WHEN** el ADMIN crea ingrediente con nombre y toggle de alérgeno
- **THEN** el sistema crea el ingrediente y lo muestra en el listado

#### Scenario: Toggle alérgeno
- **WHEN** el ADMIN togglea el flag es_alergeno de un ingrediente
- **THEN** el sistema actualiza el campo y muestra mensaje de éxito

---

### Requirement: Gestión de pedidos desde panel admin

El sistema DEBE permitir a los administradores gestionar pedidos de todos los usuarios.

#### Scenario: Listar pedidos con filtros
- **WHEN** el ADMIN navega a /admin/pedidos
- **THEN** el sistema muestra tabla de pedidos con filtros por estado, fecha y búsqueda por ID

#### Scenario: Ver detalle de pedido
- **WHEN** el ADMIN hace clic en un pedido
- **THEN** el sistema muestra modal o página con: items, dirección, totales, historial de estados

#### Scenario: Cambiar estado de pedido manualmente
- **WHEN** el ADMIN selecciona nuevo estado para un pedido
- **THEN** el sistema valida la transición según FSM y actualiza si es válida

#### Scenario: Filtrar pedidos por estado
- **WHEN** el ADMIN selecciona un estado en el filtro
- **THEN** el sistema muestra solo pedidos en ese estado

---

### Requirement: Interfaz responsiva y componentes de UX

El panel de administración DEBE ser usable en dispositivos móviles y proporcionar feedback adecuado al usuario.

#### Scenario: Diseño mobile-first
- **WHEN** el ADMIN accede desde un dispositivo móvil
- **THEN** la interfaz se adapta correctamente, tablas se vuelven scrollables, navegación es accesible

#### Scenario: Skeleton loader durante carga
- **WHEN** los datos están cargando
- **THEN** el sistema muestra skeleton placeholders en lugar de espacio en blanco

#### Scenario: Toast de confirmación
- **WHEN** el ADMIN completa una acción exitosamente
- **THEN** el sistema muestra toast flotante con mensaje de éxito que desaparece automáticamente

#### Scenario: Modal de confirmación para acciones destructivas
- **WHEN** el ADMIN intenta eliminar usuario/producto/categoría
- **THEN** el sistema muestra modal de confirmación antes de ejecutar la acción

#### Scenario: Estado vacío informativo
- **WHEN** no hay datos para mostrar (ej: sin usuarios, sin productos)
- **THEN** el sistema muestra mensaje y sugerencia de acción