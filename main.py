import sys
from pathlib import Path

# Add backend directory to sys.path so backend/app is importable as app
backend_dir = Path(__file__).resolve().parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Import and expose FastAPI app instance
from app.main import app  # noqa: F401
