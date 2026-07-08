import os
import time
from sqlalchemy import text
from app.db.session import engine, Base, SessionLocal
from app.models.models import User
from app.core.security import get_password_hash

def wait_for_db():
    retries = 10
    while retries > 0:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("Database connected")
            return True
        except Exception as e:
            retries -= 1
            print(f"Waiting for database... ({retries} retries left)")
            time.sleep(3)
    return False

def create_tables():
    Base.metadata.create_all(bind=engine)
    print("Tables created")

def seed_admin_users():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "admin@tickettriage.com").first()
        if not existing:
            admin = User(
                email="admin@tickettriage.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Admin User",
                role="admin"
            )
            agent = User(
                email="agent@tickettriage.com",
                hashed_password=get_password_hash("agent123"),
                full_name="Support Agent",
                role="agent",
                team="technical-support"
            )
            db.add(admin)
            db.add(agent)
            db.commit()
            print("Demo users created")
        else:
            print("Users already exist")
    finally:
        db.close()

if __name__ == "__main__":
    if wait_for_db():
        create_tables()
        seed_admin_users()
