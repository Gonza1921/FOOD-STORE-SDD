"""Debug script to verify SQLModel metadata and table names"""
import sys
sys.path.insert(0, '.')

# Import models first
from backend import models
from sqlmodel import SQLModel

print("=" * 60)
print("SQLModel.metadata.tables keys:")
print("=" * 60)
for key in sorted(SQLModel.metadata.tables.keys()):
    print(f"  - {key}")

print("\n" + "=" * 60)
print("Checking FormaPago specifically:")
print("=" * 60)

from backend.models.pedido import FormaPago, Pedido

# Check FormaPago table name
print(f"FormaPago.__tablename__: {getattr(FormaPago, '__tablename__', 'NOT SET')}")

# Check if it's in metadata
if 'forma_pago' in SQLModel.metadata.tables:
    print("✅ 'forma_pago' IS in metadata.tables")
else:
    print("❌ 'forma_pago' NOT in metadata.tables")

# Check Pedido FK
print(f"\nPedido model fields:")
from sqlmodel import Field
for name, field in Pedido.model_fields.items():
    if hasattr(field, 'field_info') and hasattr(field.field_info, 'foreign_key'):
        fk = field.field_info.foreign_key
        print(f"  - {name}: foreign_key={fk}")