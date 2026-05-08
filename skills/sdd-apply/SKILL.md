# Skill: sdd-apply

## Propósito

Implementar tareas del desglose, escribiendo código real que sigue exactamente las especificaciones y el diseño. El agente Implementer (Applier) ejecuta tarea por tarea, marca completadas, crea commits convencionales por cada tarea, y se detiene si algo viola las specs.

**Cuándo usar**: Cuando el desglose de tareas está listo y aprobado. Apply es la fase de ejecución pura.

---

## 🎯 Responsabilidades

1. **Lectura de Artefactos**
   - Leer `{change}/tasks.md` → lista de tareas ordenadas
   - Leer `{change}/specs.md` → requirements exactos (RFC 2119)
   - Leer `{change}/design.md` → arquitectura y decisiones
   - Entender: qué se debe hacer, cómo debe verse, qué limita
   - **NO explorar**, **NO diseñar**, **NO decidir** → solo ejecutar

2. **Ejecución Tarea por Tarea**
   - Procesar tareas en orden (respetar dependencias)
   - Completar UNA tarea, luego la siguiente
   - Detenerse si una tarea viola las specs
   - Reportar bloqueadores inmediatamente
   - **NO saltar tareas**, **NO paralelizar** (aplica secuencial)

3. **Código Conforme a Especificación**
   - Implementar **exactamente** lo que specs dice
   - Respetar arquitectura: Router → Service → UoW → Repository → Model (backend)
   - Respetar FSD layers (frontend): app → pages → widgets → features → entities → shared
   - Seguir convenciones: type hints, docstrings, naming (snake_case Python, camelCase TypeScript)
   - Tests incluidos: mínimo cobertura 80%, sin warnings
   - Linter 0 errors, ESLint/pylint/mypy limpio

4. **Commits Convencionales**
   - Un commit por tarea completada
   - Formato: `feat(modulo): descripción` | `fix(modulo)...` | `test(modulo)...`
   - Mensaje conciso, verbo infinitivo, sin mayúscula ni punto
   - Ejemplo: `feat(pedidos): implementar máquina de estados FSM`
   - **NUNCA** "Co-Authored-By" o atribuciones IA

5. **Marca de Progreso**
   - Mantener checklist actualizado
   - Marcar ✅ completada, 🔄 en progreso, ❌ bloqueada
   - Reportar al orchestrator: qué se hizo, qué queda, qué riesgos surgieron
   - Si tareas ajustadas: documentar delta vs. tasks.md original

---

## 📋 Reglas

### Lectura y Ejecución
- ✅ Leer specs **antes** de escribir cualquier código
- ✅ Escribir tests **junto con** el código (TDD recomendado)
- ✅ Ejecutar linter y type-check **dentro** de la tarea
- ✅ Commit **after** cada tarea completada
- ✅ Verificar manualmente: "¿cumple specs? ¿pasa tests? ¿linter limpio?"
- ❌ NO escribir sin leer specs primero
- ❌ NO dejar tests para después
- ❌ NO commitear sin pasar linter/type-check

### Código
- ✅ Type hints obligatorios (Python 3.10+, TypeScript)
- ✅ Docstrings en funciones/clases públicas (Google style)
- ✅ Respetar architecture layers (no saltarse capas)
- ✅ Soft delete para datos críticos (nunca DELETE hard)
- ✅ Unit of Work para transacciones multi-entidad
- ✅ Máquinas de estado para ciclos complejos (pedidos)
- ✅ RBAC explícito: validar roles en routers
- ❌ NO agregar dependencias nuevas sin proposal
- ❌ NO hardcodear valores (config siempre)
- ❌ NO sacrificar readability por concisión

### Testing
- ✅ Tests unitarios: funciones, servicios, repositories
- ✅ Tests integración: flujos end-to-end (si aplica)
- ✅ Fixtures y mocks preparados
- ✅ Cobertura >= 80% (reporte con pytest --cov o nyc)
- ✅ Tests pasan antes de commit
- ❌ NO write tests después (test-last es peor)
- ❌ NO mock excesivamente (mock solo dependencias externas)

### Commits
```
Formato correcto:
  feat(auth): agregar renovación de refresh tokens con rotación
  fix(carrito): resolver race condition en sincronización local
  test(productos): agregar tests para filtrado por categoría
  docs(api): actualizar spec de endpoints de pagos

Formato incorrecto:
  ✗ "Updated auth" (sin modulo, sin verbo infinitivo)
  ✗ "Fix bug in cart" (descripción vaga, sin modulo)
  ✗ "agregar..." (mayúscula inicial)
  ✗ "feat(auth): agregar tokens." (punto final innecesario)
```

### Manejo de Bloqueadores
- ✅ Si tarea requiere clarificación de specs: reportar, NO improvisar
- ✅ Si dependencia no lista: reportar, pausar, esperar
- ✅ Si riesgo no contemplado: escalar a orchestrator
- ✅ Si tests fallan sin razón clara: investigar, no ignorar
- ❌ NO inventar soluciones fuera de specs
- ❌ NO continuar con tareas bloqueadas
- ❌ NO asumir decisiones arquitectónicas nuevas

---

## 🔄 Proceso

### Inicio
1. Leer `tasks.md` completo → entender flujo
2. Leer `specs.md` completo → requirements exactos
3. Leer `design.md` completo → arquitectura y decisiones
4. Crear lista local de chequeo basada en tasks.md
5. Reportar: "Ready to apply. Starting with task 1.1."

### Por Cada Tarea
1. **Verificar Prerequisites**
   - ¿Tareas anteriores completadas?
   - ¿Bloqueadores abiertos?
   - Si NO: pausar, reportar

2. **Estudiar Tarea**
   - Leer descripción, dependencias, done criteria
   - Leer specs relevantes para esa tarea
   - Leer design relevante
   - Aclarar: ¿qué archivos toco? ¿qué cambios hace?

3. **Implementar**
   - Escribir código según specs
   - Escribir tests junto con código
   - Ejecutar linter, type-check, tests locales
   - Ajustar si hay errors
   - Repeatear hasta que TODO PASE

4. **Verificación Local**
   ```bash
   # Backend (Python)
   cd backend
   pytest tests/ -v --cov=app --cov-report=term-missing
   mypy app
   pylint app --fail-under=8.0
   black --check app

   # Frontend (TypeScript/React)
   cd frontend
   npm run test -- --coverage
   npm run type-check
   npm run lint
   npm run format:check
   ```

5. **Commit**
   - Mensaje convencional: `feat(modulo): descripción`
   - Tarea específica mencionada si aplica
   - Ejemplo: `feat(pedidos): implementar máquina de estados PENDIENTE→CONFIRMADO→...`

6. **Marca en Checklist**
   - ✅ Marcar tarea completa
   - Reportar: "Tarea 1.1 completada. Avance: X/N."

### Finalmente
- Todas las tareas completadas
- Todos los tests verdes
- Linter limpio
- Reportar: "Apply completado. Listo para verificación."

---

## ✅ Criterios de Éxito

### Por Tarea
- [ ] Código implementado según specs (RFC 2119 requirements)
- [ ] Tests incluidos (unitarios + integración si aplica)
- [ ] Cobertura >= 80%
- [ ] Linter 0 errors (ESLint/pylint)
- [ ] Type-check sin warnings (mypy/tsc)
- [ ] Commit creado con mensaje convencional
- [ ] Done criteria de tasks.md cumplida
- [ ] Checklist marcada ✅

### General
- [ ] Todas las tareas en orden, completadas
- [ ] Sin bloqueadores abiertos
- [ ] Sin deuda técnica introducida
- [ ] Código sigue convenciones del proyecto
- [ ] Tests pasan localmente antes de entregar
- [ ] Cambios mapeados a commits claros

---

## 🚨 Anti-patrones

### NO Hacer
- ❌ **Improvisación arquitectónica**: "Creo que conviene agregar un endpoint aquí" → No, specs/design dictaminan
- ❌ **Saltar fases**: "Los tests los agrego después" → No, escribir conjuntamente
- ❌ **Commits grandes**: Una tarea = múltiples archivos OK, pero NO unir múltiples tareas en 1 commit
- ❌ **Ignorar warnings**: "ESLint tiene 3 warnings pero funciona" → No, 0 warnings
- ❌ **Soft delete inconsistente**: Algunos modelos borran, otros no → Decisión arquitectónica debe ser global
- ❌ **Transacciones débiles**: Operaciones multi-paso sin UoW → Riesgo de inconsistencia
- ❌ **Type `any`**: "No sé el tipo" → Usa `unknown` o investiga, no `any`
- ❌ **Hardcoding**: Constantes en código → Siempre en config (`core/config.py`, `.env`, etc.)
- ❌ **Tests mockeados excesivamente**: Si mockeas todo, no testeas nada → Mock solo external services
- ❌ **Cambios no convencionales**: "feat: agregué auth" (sin modulo) → Siempre `feat(modulo): ...`

---

## 📚 Ejemplos

### Ejemplo 1: Tarea Backend Simple

**Tasks.md**:
```
#### 2.1 Crear endpoint GET /productos?categoria_id=X
**Estimado**: 45 min
**Descripción**: Agregar filtrado por categoría en el endpoint de listado
**Cambios Afectados**: 
- `backend/productos/router.py`
- `backend/productos/service.py`
- `backend/productos/repository.py`
- `backend/productos/test_router.py`
```

**Specs.md**:
```
**Requirement**: El endpoint DEBE aceptar parámetro query `categoria_id` (int, optional)
Si categoria_id presente → retornar solo productos en esa categoría
Si categoria_id ausente → retornar todos los productos
Response: 200 + lista de productos | 400 si categoria_id inválida
```

**Implementación**:
```python
# backend/productos/router.py
@router.get("/productos")
async def list_productos(
    categoria_id: Optional[int] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    """List productos, optionally filtered by categoria_id."""
    async with UnitOfWork(session) as uow:
        productos = await uow.productos.list_by_categoria(categoria_id)
        return [ProductResponse.from_orm(p) for p in productos]

# backend/productos/repository.py
async def list_by_categoria(self, categoria_id: Optional[int]) -> List[Producto]:
    query = select(Producto).where(Producto.eliminado_en.is_(None))
    if categoria_id is not None:
        query = query.where(Producto.categoria_id == categoria_id)
    result = await self.session.execute(query)
    return result.scalars().all()

# backend/productos/test_router.py
@pytest.mark.asyncio
async def test_list_productos_filter_by_categoria(client, db_session):
    """Test that categoria_id filter works."""
    # Setup: crear productos en categorías diferentes
    cat1 = await create_categoria(db_session, "Bebidas")
    cat2 = await create_categoria(db_session, "Alimentos")
    prod1 = await create_producto(db_session, cat1.id, "Leche")
    prod2 = await create_producto(db_session, cat2.id, "Pan")
    
    # Fetch con filtro
    response = client.get("/productos?categoria_id={}".format(cat1.id))
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["nombre"] == "Leche"
```

**Commit**:
```
feat(productos): agregar filtrado por categoria_id en endpoint GET /productos
```

---

### Ejemplo 2: Tarea Frontend con Estado

**Tasks.md**:
```
#### 3.2 Agregar contador visual del carrito en header
**Estimado**: 1 hora
**Descripción**: Mostrar badge con cantidad total de items en carrito, actualizar en tiempo real
**Cambios Afectados**: 
- `frontend/src/widgets/Header.tsx`
- `frontend/src/features/cart/cartStore.ts`
- `frontend/src/features/cart/cartStore.test.ts`
```

**Specs.md**:
```
**Requirement**: El header DEBE mostrar un badge rojo con el total de items del carrito
Badge DEBE actualizar cuando se agrega/quita items
Si carrito vacío, NO mostrar badge
Carrito es cliente-side (Zustand), NO requiere backend
```

**Implementación**:
```typescript
// frontend/src/features/cart/cartStore.ts
import { create } from 'zustand';

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  getTotalItems: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) => {
    set((state) => ({ items: [...state.items, item] }));
  },
  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    }));
  },
  getTotalItems: () => get().items.length,
}));

// frontend/src/widgets/Header.tsx
import { useCartStore } from '@/features/cart/cartStore';

export const Header: React.FC = () => {
  const totalItems = useCartStore((state) => state.getTotalItems());

  return (
    <header className="flex justify-between items-center p-4">
      <h1>Food Store</h1>
      <button className="relative">
        🛒
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
            {totalItems}
          </span>
        )}
      </button>
    </header>
  );
};

// frontend/src/features/cart/cartStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCartStore } from './cartStore';

describe('cartStore', () => {
  it('should return 0 items for empty cart', () => {
    const { result } = renderHook(() => useCartStore());
    expect(result.current.getTotalItems()).toBe(0);
  });

  it('should increment total items on addItem', () => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.addItem({ id: '1', name: 'Leche' });
      result.current.addItem({ id: '2', name: 'Pan' });
    });
    expect(result.current.getTotalItems()).toBe(2);
  });

  it('should decrement total items on removeItem', () => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.addItem({ id: '1', name: 'Leche' });
    });
    act(() => {
      result.current.removeItem('1');
    });
    expect(result.current.getTotalItems()).toBe(0);
  });
});
```

**Commit**:
```
feat(carrito): agregar badge visual con contador de items en header
```

---

## 📖 Referencias

- **Spec-Driven Development**: `openspec/CONVENTIONS.md`
- **Arquitectura Backend**: `AGENTS.md` → "Reglas de Arquitectura"
- **Convenciones Código**: `AGENTS.md` → "Nomenclatura" + "Formato Código"
- **Commits Convencionales**: https://www.conventionalcommits.org/
- **TypeScript Best Practices**: https://www.typescriptlang.org/docs/handbook/
- **Python Type Hints**: https://docs.python.org/3/library/typing.html
- **FastAPI**: https://fastapi.tiangolo.com/
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro/
- **pytest**: https://docs.pytest.org/

---

## 🎬 Checklista de Inicio

Antes de empezar, verificar:
- [ ] Tengo acceso a `tasks.md` con desglose claro
- [ ] Tengo acceso a `specs.md` con requirements RFC 2119
- [ ] Tengo acceso a `design.md` con arquitectura
- [ ] Entiendo order de tareas y dependencias
- [ ] Tengo ambiente local corriendo (npm dev, uvicorn, DB)
- [ ] Conocimiento de convenciones del proyecto
- [ ] Linter/formatter configurado y funcionando

**GO**: Comenzar con tarea 1.1, marcar 🔄, reportar progreso.

