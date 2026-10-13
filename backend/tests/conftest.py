import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.storage.local import LocalStorageService

from sqlalchemy.pool import StaticPool

# In-memory SQLite engine for fast, isolated unit testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    from app.db.models import User
    from app.core.security import hash_password
    db = TestingSessionLocal()
    u1 = User(name="Rasika Kudale", email="rasika@prooflens.ai", hashed_password=hash_password("password123"), role="Lead Forensic Auditor", avatar_color="#6366f1")
    u2 = User(name="Alex Vance", email="alex@prooflens.ai", hashed_password=hash_password("password123"), role="Senior Research Analyst", avatar_color="#06b6d4")
    u3 = User(name="Devin Hayes", email="devin@prooflens.ai", hashed_password=hash_password("password123"), role="Compliance Officer", avatar_color="#10b981")
    db.add_all([u1, u2, u3])
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()


from app.api.deps import get_database, get_storage


@pytest.fixture
def temp_storage(tmp_path):
    storage_dir = str(tmp_path / "test_storage")
    return LocalStorageService(base_dir=storage_dir)


@pytest.fixture
def client(db_session, temp_storage):
    def override_get_database():
        try:
            yield db_session
        finally:
            pass

    def override_get_storage():
        return temp_storage

    app.dependency_overrides[get_database] = override_get_database
    app.dependency_overrides[get_storage] = override_get_storage
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
