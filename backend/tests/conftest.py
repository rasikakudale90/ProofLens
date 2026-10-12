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
