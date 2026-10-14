from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from app.db.session import check_db_health
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "environment": settings.APP_ENV,
    }


@router.get("/ready", status_code=status.HTTP_200_OK)
def readiness_check():
    db_healthy, db_detail = check_db_health()
    is_ready = db_healthy

    response_data = {
        "status": "ready" if is_ready else "degraded",
        "dependencies": {
            "database": "connected" if db_healthy else "disconnected",
            "database_detail": db_detail,
            "storage_backend": settings.STORAGE_BACKEND,
        },
    }

    if not is_ready:
        return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content=response_data)
    return response_data

