# CH-019: Technical Design — Fix direcciones/checkout

## Resumen de la Solución

Intervención quirúrgica en 4 archivos (2 backend, 2 frontend) para restaurar el CRUD de direcciones y el flujo checkout.

---

## 1. Backend: Missing `__tablename__`

### Problema
```python
class DireccionEntrega(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    # NO __tablename__ → SQLModel infiere "direccionentrega"
```

SQLModel sigue la convención SQLAlchemy: sin `__tablename__`, genera el nombre desde el classname en lowercase. `DireccionEntrega` → `direccionentrega`. Pero Alembic creó `direccion_entrega`.

### Fix
```python
class DireccionEntrega(SQLModel, table=True):
    __tablename__ = "direccion_entrega"  # ← explícito
```

### Rationale
- Siempre usar `__tablename__` explícito en SQLModel cuando el nombre no es trivial
- La convención snake_case del proyecto usa `_` para separar palabras
- `__tablename__` es el estándar SQLAlchemy para controlar el mapping tabla-clase

---

## 2. Backend: Timezone en soft_delete

### Problema
```python
# repository.py
from datetime import datetime, timezone

obj.deleted_at = datetime.now(timezone.utc)  # ← offset-aware
```

La columna en BD es `TIMESTAMP WITHOUT TIME ZONE`. asyncpg rechaza insertar un datetime offset-aware en una columna naive.

### Fix
```python
from datetime import datetime  # sin timezone

obj.deleted_at = datetime.utcnow()  # ← offset-naive UTC
```

### Rationale
- `TIMESTAMP WITHOUT TIME ZONE` almacena valores naive
- `datetime.utcnow()` devuelve naive UTC, compatible con el tipo de columna
- Alternativa: cambiar la columna a `TIMESTAMP WITH TIME ZONE` — mayor impacto, no justificado para este fix

---

## 3. Frontend: Ruta `/mis-direcciones/nueva`

### Problema
`CheckoutPage` renderiza un link a `/mis-direcciones/nueva` cuando el usuario no tiene direcciones. Esa ruta no existía en el Router.

### Fix
```tsx
// Router.tsx
<Route path="/mis-direcciones/nueva" element={
  <ProtectedRoute><DireccionesListPage /></ProtectedRoute>
} />
```

El componente es el mismo, la lógica de "nueva" se maneja internamente.

---

## 4. Frontend: Auto-open modal

### Problema
El modal de creación de dirección no se abría automáticamente al navegar a `/mis-direcciones/nueva`.

### Fix
```tsx
// DireccionesListPage.tsx
const location = useLocation();
const isNuevaRoute = location.pathname.endsWith('/nueva');
const [modalOpen, setModalOpen] = useState(isNuevaRoute);

useEffect(() => {
  if (isNuevaRoute && !modalOpen && !isLoading) {
    setModalOpen(true);
  }
}, [isNuevaRoute, modalOpen, isLoading]);
```

### Rationale
- `useState(isNuevaRoute)` es la inicialización — si ya es `/nueva`, arranca abierto
- `useEffect` cubre el caso donde se navega después de que el componente ya montó
- La dependencia `isLoading` evita abrir el modal antes de que termine la query inicial

---

## Archivos Modificados

| Archivo | Cambio | Impacto |
|---------|--------|---------|
| `backend/models/direccion.py` | +1 línea: `__tablename__` | 🔴 CRÍTICO — todo CRUD direcciones |
| `backend/core/repository.py` | -1 línea `timezone`, +fix naive datetime | 🔴 CRÍTICO — soft delete |
| `frontend/src/app/Router.tsx` | +6 líneas: nueva ruta | 🟢 MEDIO — UX |
| `frontend/src/features/direcciones/components/DireccionesListPage.tsx` | +13 líneas: auto-open modal | 🟢 BAJO — UX |

## Endpoints Involucrados

| Método | Endpoint | Status |
|--------|----------|--------|
| GET | `/api/v1/direcciones/` | ✅ Funcional |
| GET | `/api/v1/direcciones/{id}` | ✅ Funcional |
| POST | `/api/v1/direcciones/` | ✅ Funcional |
| PUT | `/api/v1/direcciones/{id}` | ✅ Funcional |
| PATCH | `/api/v1/direcciones/{id}/principal` | ✅ Funcional |
| DELETE | `/api/v1/direcciones/{id}` | ✅ Funcional (antes roto) |

## Impacto en Checkout y Pedidos

El `CheckoutPage` importa y usa `useDirecciones()` hook, que llama a `GET /api/v1/direcciones/`. Con el fix del `__tablename__`, este endpoint ahora responde correctamente, restaurando el flujo checkout.
