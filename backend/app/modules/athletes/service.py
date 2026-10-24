from collections.abc import Collection

from sqlalchemy import exists, func, select
from sqlalchemy.orm import Session

from app.core.exceptions import BusinessValidationError, NotFoundError
from app.db.transaction import commit
from app.modules.athletes.models import Athlete
from app.modules.athletes.schemas import AthleteCreate, AthleteFilters, AthleteUpdate
from app.modules.injuries.models import Injury


def _like_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def get_athlete(db: Session, coach_id: int, athlete_id: int) -> Athlete:
    athlete = db.scalar(select(Athlete).where(Athlete.id == athlete_id, Athlete.coach_id == coach_id))
    if athlete is None:
        raise NotFoundError("Спортсмен не найден")
    return athlete


def load_athletes(db: Session, coach_id: int, athlete_ids: Collection[int], *, active_only: bool = False) -> list[Athlete]:
    if not athlete_ids:
        return []
    found = list(db.scalars(select(Athlete).where(Athlete.coach_id == coach_id, Athlete.id.in_(athlete_ids))))
    missing = sorted(set(athlete_ids) - {a.id for a in found})
    if missing:
        raise BusinessValidationError("athletes_not_found", f"Спортсмены не найдены: {missing}", athlete_ids=missing)
    inactive = sorted(a.id for a in found if not a.is_active) if active_only else []
    if inactive:
        raise BusinessValidationError("athletes_inactive", f"Спортсмены в архиве: {inactive}", athlete_ids=inactive)
    return found


def list_athletes(db: Session, coach_id: int, filters: AthleteFilters) -> tuple[list[Athlete], int]:
    stmt = select(Athlete).where(Athlete.coach_id == coach_id)
    if filters.search:
        stmt = stmt.where(Athlete.full_name.ilike(f"%{_like_escape(filters.search)}%", escape="\\"))
    if filters.is_active is not None:
        stmt = stmt.where(Athlete.is_active.is_(filters.is_active))
    if filters.has_active_injury is not None:
        active = exists().where(Injury.athlete_id == Athlete.id, Injury.recovered_at.is_(None))
        stmt = stmt.where(active if filters.has_active_injury else ~active)
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(stmt.order_by(Athlete.full_name, Athlete.id).limit(filters.limit).offset(filters.offset))
    return list(items), total


def create_athlete(db: Session, coach_id: int, data: AthleteCreate) -> Athlete:
    athlete = Athlete(coach_id=coach_id, **data.model_dump())
    db.add(athlete)
    commit(db)
    return athlete


def update_athlete(db: Session, coach_id: int, athlete_id: int, data: AthleteUpdate) -> Athlete:
    athlete = get_athlete(db, coach_id, athlete_id)
    data.apply_to(athlete)
    commit(db)
    return athlete


def delete_athlete(db: Session, coach_id: int, athlete_id: int) -> None:
    db.delete(get_athlete(db, coach_id, athlete_id))
    commit(db)
