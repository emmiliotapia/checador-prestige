import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

raw_url = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/dbname")
if raw_url.startswith("postgresql://"):
    DATABASE_URL = raw_url.replace("postgresql://", "postgresql+psycopg2://", 1)
else:
    DATABASE_URL = raw_url

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
