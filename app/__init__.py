import sys
from pathlib import Path

# Add backend directory to sys.path so modules inside backend are resolvable
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Add backend/app to __path__ so all submodules (app.core, app.api, app.db, app.services, app.main)
# are discovered directly inside backend/app
backend_app_dir = str(backend_dir / "app")
if backend_app_dir not in __path__:
    __path__.append(backend_app_dir)
