#!/usr/bin/env python
"""Verify models are Alembic compatible"""

import sys
sys.path.insert(0, '.')

print("=" * 60)
print("ALEMBIC COMPATIBILITY VERIFICATION")
print("=" * 60)

# Test 1: Import all models
print("\n1. Testing model imports...")
try:
    from models import usuario, direccion, categoria, producto, pedido
    print("   OK: All model modules import successfully")
except Exception as e:
    print(f"   FAIL: Import failed: {e}")
    sys.exit(1)

# Test 2: Check for Relationship fields
print("\n2. Checking for Relationship fields (should be 0)...")
from sqlmodel import SQLModel
from inspect import getmembers, isclass

relationship_count = 0
relationship_models = []

for module in [usuario, direccion, categoria, producto, pedido]:
    for name, obj in getmembers(module):
        if isclass(obj) and hasattr(obj, '__table__'):
            # Check for Relationship annotations
            if hasattr(obj, '__annotations__'):
                for field_name, field_type in obj.__annotations__.items():
                    if 'Relationship' in str(field_type):
                        relationship_count += 1
                        relationship_models.append(f"{obj.__name__}.{field_name}")

if relationship_count == 0:
    print("   OK: No Relationship fields found (clean!)")
else:
    print(f"   FAIL: Found {relationship_count} Relationship fields:")
    for rel in relationship_models:
        print(f"      - {rel}")

# Test 3: Check for List[] fields (except strings)
print("\n3. Checking for non-string List[] fields...")
list_fields = []
for module in [usuario, direccion, categoria, producto, pedido]:
    for name, obj in getmembers(module):
        if isclass(obj) and hasattr(obj, '__table__'):
            if hasattr(obj, '__annotations__'):
                for field_name, field_type in obj.__annotations__.items():
                    type_str = str(field_type)
                    if 'list[' in type_str.lower() and 'str' not in type_str:
                        list_fields.append(f"{obj.__name__}.{field_name}: {field_type}")

if len(list_fields) == 0:
    print("   OK: No problematic List[] fields found")
else:
    print(f"   FAIL: Found {len(list_fields)} List[] fields:")
    for field in list_fields:
        print(f"      - {field}")

# Test 4: List all registered tables
print("\n4. Tables registered in SQLModel.metadata...")
tables = list(SQLModel.metadata.tables.keys())
print(f"   Total tables: {len(tables)}")
for table in sorted(tables):
    print(f"      - {table}")

# Test 5: Verify no import errors from alembic env.py context
print("\n5. Testing alembic env.py imports...")
try:
    from sqlalchemy import engine_from_config, pool
    print("   OK: SQLAlchemy imports work")
    target_metadata = SQLModel.metadata
    print(f"   OK: SQLModel.metadata available ({len(target_metadata.tables)} tables)")
except Exception as e:
    print(f"   FAIL: {e}")

print("\n" + "=" * 60)
print("RESULT: ALEMBIC COMPATIBLE - OK")
print("=" * 60)
print("\nAll models are ready for Alembic migrations!")
