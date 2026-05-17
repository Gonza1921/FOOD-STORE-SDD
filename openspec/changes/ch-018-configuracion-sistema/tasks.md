# Tasks: Configuración del Sistema (US-060)

## Fase 1: Setup (30 min)
- [x] 1.1 Crear modelo `Configuracion` en `backend/models/configuracion.py`
- [x] 1.2 Registrar modelo en `__init__.py` y `env.py`

## Fase 2: Backend (45 min)
- [x] 2.1 Crear `backend/admin/config_router.py` con GET/PUT
- [x] 2.2 Registrar router en `main.py`
- [x] 2.3 Crear migración `007_add_configuracion.py` con seed data

## Fase 3: Frontend (45 min)
- [x] 3.1 Agregar constante `API.ADMIN.CONFIGURACION` en endpoints.ts
- [x] 3.2 Crear hook `useAdminConfiguracion` (query + mutation)
- [x] 3.3 Crear componente `ConfigSection` con inline editing
- [x] 3.4 Integrar en `AdminDashboardPage`

## Fase 4: Finalización (15 min)
- [ ] 4.1 Verificar cambios, commit y push
- [ ] 4.2 Archive change
