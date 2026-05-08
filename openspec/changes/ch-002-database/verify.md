# Verify — ch-002-database

## Validaciones

- [ ] PostgreSQL está corriendo y accesible
- [ ] Alembic configurado correctamente
- [ ] 13 tablas creadas con tipos y constraints correctos
- [ ] 4 roles en tabla `rol`
- [ ] 6 estados de pedido en tabla `estado_pedido`
- [ ] 3 formas de pago en tabla `forma_pago`
- [ ] Usuario admin creado en tabla `usuario`
- [ ] Índices creados para performance
- [ ] Soft delete funcional (consultas filtran deleted_at)
- [ ] CTE recursiva para categorías funcional
- [ ] Snapshot pattern documentado y validado
- [ ] Tests pasando (test_database.py)
- [ ] Migraciones reversibles (alembic downgrade -1)

---

## Resultado

PENDING — Esperando implementación

---

## Notas

- Validar que no haya warnings de deprecación en Alembic
- Confirmar que SQLModel inferencia de tipos es correcta en cada modelo
- Verificar que las relaciones bidireccionales (back_populates) estén correctas
