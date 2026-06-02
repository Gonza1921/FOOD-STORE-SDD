"""Verify the admin user was created correctly and password works."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, create_engine, select
from models.usuario import Usuario
from core.security import verify_password, get_password_hash
from core.config import settings


def main():
    engine = create_engine(settings.database_url)

    with Session(engine) as session:
        user = session.exec(
            select(Usuario).where(Usuario.email == "lisandro@admin.com")
        ).first()

        if not user:
            print("[FAIL] User not found in database!")
            return

        print(f"[OK] User found: id={user.id}, email={user.email}")
        print(f"    Name: {user.nombre} {user.apellido}")
        print(f"    Hash: {user.password_hash}")
        print(f"    Roles: {[r.codigo for r in user.roles]}")

        # Test password verification
        assert verify_password("admin123", user.password_hash), "Password verification FAILED"
        print("[OK] Password 'admin123' verifies correctly")

        assert not verify_password("wrongpass", user.password_hash), "Wrong password should fail"
        print("[OK] Wrong password correctly rejected")

        # Prove it's the same hash function
        fresh_hash = get_password_hash("admin123")
        assert verify_password("admin123", fresh_hash), "Fresh hash verification FAILED"
        print(f"[OK] Fresh bcrypt hash also works: {fresh_hash[:30]}...")

        print("\n[SUCCESS] All password checks passed! Login with:")
        print(f"    POST /api/v1/auth/login")
        print(f"    {{ \"email\": \"lisandro@admin.com\", \"password\": \"admin123\" }}")


if __name__ == "__main__":
    main()
