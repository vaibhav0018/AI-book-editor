"""Pytest fixtures — in-memory DB, test client."""

import sys
from pathlib import Path

# Ensure backend root is on path when running pytest
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from database import Base, get_db
from app import create_app

# Import models so Base.metadata has all tables before create_all
import features.book.models  # noqa: F401
import features.chapter.models  # noqa: F401
import features.ai.models  # noqa: F401

TEST_DB_URL = "sqlite:///:memory:"


@pytest.fixture
def db_engine():
    # StaticPool forces a single connection so :memory: is shared (needed for TestClient threads)
    engine = create_engine(
        TEST_DB_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db(db_engine) -> Session:
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
