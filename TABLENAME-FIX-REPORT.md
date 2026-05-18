# 🎯 TABLENAME MISMATCH FIX — FINAL REPORT

**Date**: 2026-05-18  
**Status**: ✅ **FIXED AND COMMITTED**

---

## 🔴 ERROR ORIGINAL

```
sqlalchemy.exc.NoReferencedTableError:
Foreign key associated with column 'pedido.forma_pago_codigo'
could not find table 'forma_pago'
```

---

## 🔍 INVESTIGACIÓN EXHAUSTIVA

### Paso 1: Verificar modelo
```python
# backend/models/pedido.py
class FormaPago(SQLModel, table=True):
    # NO __tablename__ defined!
    codigo: str = Field(primary_key=True, max_length=20)
```

### Paso 2: Verificar FK
```python
# Pedido model
forma_pago_codigo: str = Field(foreign_key="forma_pago.codigo")
```

### Paso 3: Verificar migración
```python
# migrations/versions/001_initial_schema.py:185
op.create_table(
    'forma_pago',  # ← Tabla se llama "forma_pago"
    ...
)
```

### Paso 4: Testear generación automática
```python
# SQLModel convierte: FormaPago → formapago (SIN underscore)
# Pero la tabla REAL es: forma_pago (CON underscore)
```

---

## 🎯 CAUSA RAÍZ ENCONTRADA

| Componente | Nombre Generado | Nombre Real | Estado |
|------------|-----------------|-------------|--------|
| Modelo `FormaPago` | `formapago` | `forma_pago` | ❌ MISMATCH |
| FK en Pedido | - | `forma_pago.codigo` | Espera `forma_pago` |
| Migración crea | - | `forma_pago` | ✅ |

**El modelo NO definía `__tablename__` explícitamente.**

SQLModel por defecto convierte el nombre de clase a snake_case:
- `FormaPago` → `formapago` (sin underscore)
- `EstadoPedido` → `estadopedido` (sin underscore)

Pero la migración crea las tablas con underscore:
- `forma_pago`
- `estado_pedido`

---

## ✅ SOLUCIÓN IMPLEMENTADA

### backend/models/pedido.py

```diff
 class FormaPago(SQLModel, table=True):
     """Payment method catalog - fixed values"""
+    __tablename__ = "forma_pago"  # Must match migration table name
     __table_args__ = {"extend_existing": True}


 class EstadoPedido(SQLModel, table=True):
     """Order state catalog - FSM states"""
+    __tablename__ = "estado_pedido"  # Must match migration table name
     __table_args__ = {"extend_existing": True}
```

---

## 📝 COMMITS REALIZADOS

```
2d670a3 fix(models): add explicit __tablename__ to FormaPago and EstadoPedido
```

---

## ✅ VERIFICACIÓN

```bash
$ python -m backend.test_import

Test 1: Import from backend.models
SUCCESS
tablename = forma_pago

Test 2: Import from backend.models.pedido
SUCCESS
tablename = forma_pago

Test 3: Import all models via backend.__init__
SUCCESS - models imported
models.FormaPago.__tablename__ = forma_pago
models.EstadoPedido.__tablename__ = estado_pedido
```

---

## 📋 Resumen de Cambios

| Modelo | Antes | Después |
|--------|-------|---------|
| FormaPago | `formapago` (auto) | `forma_pago` (explicit) |
| EstadoPedido | `estadopedido` (auto) | `estado_pedido` (explicit) |

---

## 🧪 CÓMO TESTEAR

```bash
# Terminal 1: Backend
cd backend
uvicorn main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev

# Browser: http://localhost:5173
# 1. Login
# 2. Agregar items al carrito
# 3. Checkout → Confirmar compra
# 4. DevTools Network debería mostrar:
#    - POST /api/v1/pedidos → 201 Created ✅
```

---

## 🎯 FLUJO COMPLETO (ahora debería funcionar)

```
login → AuthProvider valida token (/auth/me) ✅
→ carrito → checkout → crear pedido (/pedidos) ✅
→ crear preferencia MP → redirect a MP ✅
```

---

**Status**: ✅ **FIXED, COMMITTED, READY FOR TESTING**

**Lección aprendida**: Cuando hay discrepancia entre FK y tabla, verificar SIEMPRE el `__tablename__` generado por SQLModel vs el nombre real de la tabla en la migración.