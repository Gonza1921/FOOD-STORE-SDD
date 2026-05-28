#!/usr/bin/env python
"""Verify that product indexes were created successfully."""

from sqlalchemy import create_engine, text
from backend.core.config import settings

engine = create_engine(settings.DATABASE_URL, echo=False)

with engine.connect() as conn:
    # Check if indexes exist
    result = conn.execute(text(
        "SELECT indexname FROM pg_indexes WHERE tablename = 'producto' AND indexname LIKE 'ix_producto%' ORDER BY indexname"
    ))
    indexes = [row[0] for row in result.fetchall()]
    
    print(f"✅ Found {len(indexes)} product indexes:")
    for idx in indexes:
        print(f"   - {idx}")
    
    # Verify the two expected indexes
    expected = {'ix_producto_categoria_precio', 'ix_producto_creado_en'}
    actual = set(indexes)
    
    if expected == actual:
        print(f"\n✅ Both expected indexes are present!")
    else:
        print(f"\n❌ Missing indexes: {expected - actual}")
