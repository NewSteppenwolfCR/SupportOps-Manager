from getpass import getpass

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Admin
from app.admin_security import hash_password


def create_admin():
    db: Session = SessionLocal()

    try:
        print("\n=== Create SupportOps Administrator ===\n")

        first_name = input("First name: ").strip()
        last_name = input("Last name: ").strip()
        email = input("Email: ").strip().lower()

        password = getpass("Password: ")
        confirm_password = getpass("Confirm password: ")

        if not first_name:
            print("First name is required.")
            return

        if not last_name:
            print("Last name is required.")
            return

        if not email:
            print("Email is required.")
            return

        if len(password) < 10:
            print("Password must contain at least 10 characters.")
            return

        if password != confirm_password:
            print("Passwords do not match.")
            return

        existing_admin = (
            db.query(Admin)
            .filter(Admin.email == email)
            .first()
        )

        if existing_admin:
            print("An administrator with this email already exists.")
            return

        password_hash = hash_password(password)

        admin = Admin(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password_hash=password_hash,
            status="Active",
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("\nAdministrator created successfully.")
        print(f"Admin ID: {admin.id}")
        print(f"Name: {admin.first_name} {admin.last_name}")
        print(f"Email: {admin.email}")

    except Exception as error:
        db.rollback()
        print(f"\nCould not create administrator: {error}")

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()