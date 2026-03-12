import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in the environment variables.")

# 1. The Engine: The actual connection pool to Postgres
engine = create_engine(DATABASE_URL)


# 2. The Session: A "unit of work" for each request
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3. The Base: All our tables will inherit from this
Base = declarative_base()

# Dependency: This opens a connection for a request and closes it when done
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()