"""Script to create or update the local admin user for development.

Usage:
    cd backend
    .venv\Scripts\python.exe scripts\seed_admin_user.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, create_engine, select
from models.usuario import Usuario, Rol, UsuarioRol
from core.security import get_password_hash
from core.config import settings


def main():
    engine = create_engine(settings.database_url)

    admin_email = "lisandro@admin.com"
    admin_password = "admin123"
    admin_nombre = "Lisandro"
    admin_apellido = "Admin"

    with Session(engine) as session:
        # 1. Generate the bcrypt hash
        password_hash = get_password_hash(admin_password)
        print(f"[OK] Generated bcrypt hash for '{admin_password}': {password_hash}")
        print(f"  Hash length: {len(password_hash)} chars")

        # 2. Check if user already exists
        existing = session.exec(
            select(Usuario).where(Usuario.email == admin_email)
        ).first()

        if existing:
            print(f"[INFO] User '{admin_email}' already exists (id={existing.id})")
            print(f"   Current name: {existing.nombre} {existing.apellido}")
            # Update password and name
            existing.password_hash = password_hash
            existing.nombre = admin_nombre
            existing.apellido = admin_apellido
            session.add(existing)
            print(f"   Password updated [OK]")
        else:
            # 3. Create the user
            user = Usuario(
                email=admin_email,
                password_hash=password_hash,
                nombre=admin_nombre,
                apellido=admin_apellido,
            )
            session.add(user)
            session.flush()  # get the user ID
            print(f"[OK] Created user '{admin_email}' (id={user.id})")

            # 4. Assign ADMIN role
            admin_role = session.exec(
                select(Rol).where(Rol.codigo == "ADMIN")
            ).first()
            if not admin_role:
                print("[ERROR] ADMIN role not found! Run migrations first.")
                sys.exit(1)

            user_role = UsuarioRol(
                usuario_id=user.id,
                rol_codigo="ADMIN",
            )
            session.add(user_role)
            print(f"[OK] Assigned ADMIN role to user {user.id}")

        session.commit()
        print(f"\n[SUCCESS] Admin user created/updated successfully!")
        print(f"   Email:    {admin_email}")
        print(f"   Password: {admin_password}")
        print(f"   Role:     ADMIN")

        # 5. Verify we can read it back
        user = session.exec(
            select(Usuario).where(Usuario.email == admin_email)
        ).first()
        if user:
            print(f"\n[INFO] User details:")
            print(f"   ID:       {user.id}")
            print(f"   Name:     {user.nombre} {user.apellido}")
            print(f"   Email:    {user.email}")
            print(f"   Hash:     {user.password_hash[:20]}...")
            print(f"   Roles:    {[r.codigo for r in user.roles]}")


if __name__ == "__main__":
    main()
