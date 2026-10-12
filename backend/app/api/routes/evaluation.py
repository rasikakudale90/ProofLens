from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_database, get_storage
from app.storage.base import StorageService
from app.schemas.evaluation import EvaluationSummaryResponse
from app.services.evaluation import run_evaluation_suite, get_latest_evaluation_summary
from app.core.errors import AppError

router = APIRouter(prefix="/evaluation", tags=["Trust & Evaluation"])


@router.post("/run", response_model=EvaluationSummaryResponse, status_code=status.HTTP_200_OK)
def trigger_evaluation_run(
    db: Session = Depends(get_database),
    storage: StorageService = Depends(get_storage),
):
    return run_evaluation_suite(db=db, storage=storage)


@router.get("/summary", status_code=status.HTTP_200_OK)
def get_evaluation_summary(db: Session = Depends(get_database)):
    summary = get_latest_evaluation_summary(db=db)
    if not summary:
        raise AppError(
            code="RESOURCE_NOT_FOUND",
            message="No evaluation runs have been recorded yet. Trigger a run at POST /api/v1/evaluation/run.",
            status_code=404,
        )
    return summary
