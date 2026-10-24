from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import BusinessValidationError, NotFoundError
from app.db.transaction import commit
from app.modules.athletes.models import Athlete
from app.modules.athletes.service import get_athlete
from app.modules.injuries.models import Injury
from app.modules.injuries.schemas import InjuryCreate, InjuryStatus, InjuryUpdate, check_dates


def get_injury(db: Session, coach_id: int, injury_id: int) -> Injury:
    injury = db.scalar(select(Injury).join(Athlete).where(Injury.id == injury_id, Athlete.coach_id == coach_id))
    if injury is None:
        raise NotFoundError("Травма не найдена")
    return injury


def list_injuries(db: Session, coach_id: int, athlete_id: int, status: InjuryStatus | None) -> list[Injury]:
    get_athlete(db, coach_id, athlete_id)
    stmt = select(Injury).where(Injury.athlete_id == athlete_id)
    if status is InjuryStatus.active:
        stmt = stmt.where(Injury.recovered_at.is_(None))
    elif status is InjuryStatus.recovered:
        stmt = stmt.where(Injury.recovered_at.is_not(None))
    return list(db.scalars(stmt.order_by(Injury.started_at.desc(), Injury.id.desc())).all())


def create_injury(db: Session, coach_id: int, athlete_id: int, data: InjuryCreate) -> Injury:
    get_athlete(db, coach_id, athlete_id)
    injury = Injury(athlete_id=athlete_id, **data.model_dump())
    db.add(injury)
    commit(db)
    db.refresh(injury)
    return injury


def update_injury(db: Session, coach_id: int, injury_id: int, data: InjuryUpdate) -> Injury:
    injury = get_injury(db, coach_id, injury_id)
    changes = data.changes()
    try:
        check_dates(changes.get("started_at", injury.started_at), changes.get("recovered_at", injury.recovered_at))
    except ValueError as exc:
        raise BusinessValidationError("invalid_dates", str(exc)) from exc
    for key, value in changes.items():
        setattr(injury, key, value)
    commit(db)
    db.refresh(injury)
    return injury


def delete_injury(db: Session, coach_id: int, injury_id: int) -> None:
    db.delete(get_injury(db, coach_id, injury_id))
    commit(db)
