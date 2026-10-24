from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError

EXCLUSION_VIOLATION = "23P01"
TIME_CONFLICT_MESSAGE = "Время пересекается с другой тренировкой"


def is_overlap_violation(exc: IntegrityError) -> bool:
    return getattr(exc.orig, "sqlstate", None) == EXCLUSION_VIOLATION


def integrity_conflict(exc: IntegrityError) -> ConflictError:
    if is_overlap_violation(exc):
        return ConflictError("time_conflict", TIME_CONFLICT_MESSAGE)
    return ConflictError("integrity_error", "Операция нарушает ограничения данных")


def commit(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise integrity_conflict(exc) from exc
