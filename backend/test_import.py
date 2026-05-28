import sys
sys.path.insert(0, '.')

print("Test 1: Import from backend.models")
try:
    from backend.models import FormaPago
    print("SUCCESS")
    print(f"tablename = {FormaPago.__tablename__}")
except Exception as e:
    print(f"FAILED: {e}")

print("\nTest 2: Import from backend.models.pedido")
try:
    from backend.models.pedido import FormaPago as FP2
    print("SUCCESS")
    print(f"tablename = {FP2.__tablename__}")
except Exception as e:
    print(f"FAILED: {e}")

print("\nTest 3: Import all models via backend.__init__")
try:
    from backend import models
    print("SUCCESS - models imported")
    print(f"models.FormaPago.__tablename__ = {models.FormaPago.__tablename__}")
except Exception as e:
    print(f"FAILED: {e}")