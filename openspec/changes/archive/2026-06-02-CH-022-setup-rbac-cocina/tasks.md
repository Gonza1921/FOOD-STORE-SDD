# Tasks: CH-022 — Setup RBAC Cocinero + Seed

## Overview

| Phase | Tasks | Focus | Hours |
|-------|-------|-------|-------|
| 1: Setup | 1.1-1.2 | Database state + migration scaffolding | 1-1.5 |
| 2: Migration | 2.1-2.3 | Alembic migration + seed data | 2-2.5 |
| 3: Testing | 3.1-3.3 | Unit tests for RBAC + JWT | 1.5-2 |
| 4: Verification | 4.1-4.2 | Integration tests + manual verification | 1-1.5 |
| **TOTAL** | **8 tasks** | **RBAC setup for kitchen** | **6-8 hours** |

---

## 1. Database & Environment Setup

- [x] 1.1 Verify existing database schema for `Rol`, `usuario`, `usuario_rol` tables
  - File: `backend/models/` (or existing schema)
  - Check: Ensure `Rol.codigo` is unique constraint or primary key
  - Check: Ensure `usuario_rol` is M:M table with FK to both
  - Expected: Schema already supports new role (no ALTER needed)

- [x] 1.2 Create Alembic migration file scaffolding
  - Run: `cd backend && alembic revision -m "Add COCINA role and seed cocina user"`
  - File created: `backend/alembic/versions/<timestamp>_add_cocina_role.py`
  - Structure: Empty upgrade() + downgrade() functions
  - Expected: File exists and is valid Python

---

## 2. Alembic Migration Implementation

- [x] 2.1 Implement upgrade() function: Insert COCINA role
  - File: `backend/alembic/versions/<timestamp>_add_cocina_role.py`
  - SQL: `INSERT INTO rol (codigo, nombre, descripcion) VALUES ('COCINA', 'Cocinero', 'Prepara y avanza pedidos en la cocina') ON CONFLICT (codigo) DO NOTHING`
  - Verify: Role inserted idempotently (no errors on 2nd run)

- [x] 2.2 Implement upgrade() function: Insert seed user + role assignment
  - File: `backend/alembic/versions/<timestamp>_add_cocina_role.py`
  - SQL part 1: `INSERT INTO usuario (email, nombre, password_hash, activo) VALUES ('cocina@foodstore.com', 'Cocinero', <bcrypt_hash>, true) ON CONFLICT (email) DO NOTHING`
  - SQL part 2: `INSERT INTO usuario_rol (usuario_id, rol_id) SELECT u.id, r.id FROM usuario u, rol r WHERE u.email='cocina@foodstore.com' AND r.codigo='COCINA' AND NOT EXISTS (SELECT 1 FROM usuario_rol WHERE usuario_id=u.id AND rol_id=r.id)`
  - Password: Use bcrypt hash of `Test123456!` (hardcoded for development)
  - Verify: User created idempotently, role assigned without duplicates

- [x] 2.3 Implement downgrade() function: Cleanup
  - File: `backend/alembic/versions/<timestamp>_add_cocina_role.py`
  - SQL: Delete in reverse order: `usuario_rol` → `usuario` → `rol`
  - Verify: `alembic downgrade -1` removes all seed data cleanly

---

## 3. Testing — RBAC + JWT

- [x] 3.1 Unit test: COCINA role exists and is queryable
  - File: `backend/tests/test_rbac_cocina.py` (new file)
  - Test name: `test_cocina_role_exists`
  - Steps:
     - Run migration
     - Query: `SELECT * FROM rol WHERE codigo='COCINA'`
     - Assert: Exactly 1 row returned with name='Cocinero'
  - Expected: Test passes

- [x] 3.2 Unit test: Seed user created with correct role
  - File: `backend/tests/test_rbac_cocina.py`
  - Test name: `test_cocina_user_seeded_with_role`
  - Steps:
    - Run migration
    - Query: `SELECT u.email, r.codigo FROM usuario u JOIN usuario_rol ur ON u.id=ur.usuario_id JOIN rol r ON ur.rol_id=r.id WHERE u.email='cocina@foodstore.com'`
    - Assert: 1 row with email='cocina@foodstore.com', rol='COCINA'
    - Assert: Password hash is bcrypt (starts with $2a$, $2b$, $2y$)
  - Expected: Test passes

- [x] 3.3 Unit test: JWT token for COCINA user includes role
  - File: `backend/tests/test_rbac_cocina.py`
  - Test name: `test_cocina_jwt_includes_role`
  - Steps:
    - Mock: Database with COCINA role + user
    - Call: `auth_service.login('cocina@foodstore.com', 'Test123456!')` (or similar endpoint)
    - Decode: access_token JWT payload
    - Assert: `roles` array contains `'COCINA'`
    - Assert: `sub` equals `'cocina@foodstore.com'`
  - Expected: Test passes

---

## 4. Verification & Integration

- [x] 4.1 Integration test: Migration applies cleanly
  - File: `backend/tests/test_rbac_cocina.py`
  - Test name: `test_migration_idempotent`
  - Steps:
    - Run: `alembic upgrade head` (twice)
    - Assert: Both runs succeed without errors
    - Assert: COCINA role, user, M:M records exist exactly once
  - Expected: Test passes

- [x] 4.2 Manual verification: Complete flow works end-to-end
  - Steps:
    1. Drop database: `dropdb food_store_test`
    2. Recreate: `createdb food_store_test` (or Docker equivalent)
    3. Run migrations: `cd backend && alembic upgrade head`
    4. Query: `SELECT email, nombre FROM usuario WHERE email='cocina@foodstore.com'`
    5. Login: `curl -X POST http://localhost:8000/api/v1/auth/login -d '{"email":"cocina@foodstore.com", "password":"Test123456!"}'`
    6. Check response: Contains access_token, refresh_token
    7. Decode JWT: Use jwt.io or Python `jwt.decode()` → verify `roles: ["COCINA"]`
  - Expected: All steps succeed, user is fully operational

---

## Implementation Order & Dependencies

```
1.1 (Verify DB) → 1.2 (Scaffold migration) → 2.1 (Upgrade role) → 2.2 (Upgrade user) → 2.3 (Downgrade)
                                                         ↓
                                    3.1, 3.2, 3.3 (Unit tests) → 4.1, 4.2 (Integration)
```

### Critical Path
1. Verify DB schema exists (1.1)
2. Create migration file (1.2)
3. Implement upgrade for role + user (2.1, 2.2)
4. Implement downgrade (2.3)
5. Run tests to verify (3.x, 4.x)

### Parallelizable Tasks
- **3.1, 3.2, 3.3**: Can write tests in parallel after 2.1 (once migration is runnable)
- **4.1, 4.2**: Integration tests depend on 2.1-2.3 being complete

---

## Definition of Done (Overall)

- ✅ All 8 tasks completed and marked as done
- ✅ `alembic upgrade head` succeeds
- ✅ COCINA role exists in `Rol` table
- ✅ User `cocina@foodstore.com` exists with hashed password + COCINA role
- ✅ JWT token for cocinero includes `roles: ["COCINA"]`
- ✅ `alembic downgrade -1` removes role, user, and M:M records cleanly
- ✅ All tests pass: `pytest backend/tests/test_rbac_cocina.py -v`
- ✅ Manual E2E flow works: login → JWT decode → role visible
- ✅ 1 commit pushed with conventional format: `feat(rbac): setup COCINA role and seed user`

---

**Status**: Ready for Implementation  
**Estimated Duration**: 6-8 hours  
**Phases**: 4 (Setup → Migration → Testing → Verification)  
**Task Count**: 8  
**Confidence**: 90% (clear dependencies, database schema known, RBAC already exists)
