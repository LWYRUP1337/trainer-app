from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import BusinessValidationError, ConflictError, NotFoundError, business_rule
from app.db.transaction import commit
from app.modules.athletes.service import load_athletes
from app.modules.workouts.models import AttendanceStatus, Workout, WorkoutParticipant
from app.modules.workouts.schemas import AttendanceItem, WorkoutCreate, WorkoutFilters, WorkoutUpdate, check_interval

STATUSES_AFTER_START = {AttendanceStatus.present, AttendanceStatus.absent}


def get_workout(db: Session, coach_id: int, workout_id: int) -> Workout:
    workout = db.scalar(select(Workout).where(Workout.id == workout_id, Workout.coach_id == coach_id))
    if workout is None:
        raise NotFoundError("Тренировка не найдена")
    return workout


def _filter_bounds(filters: WorkoutFilters) -> tuple[datetime | None, datetime | None]:
    if not filters.year:
        return filters.date_from, filters.date_to
    tz = get_settings().tz
    if filters.month:
        start = datetime(filters.year, filters.month, 1, tzinfo=tz)
        end = datetime(filters.year + (filters.month == 12), filters.month % 12 + 1, 1, tzinfo=tz)
    else:
        start, end = datetime(filters.year, 1, 1, tzinfo=tz), datetime(filters.year + 1, 1, 1, tzinfo=tz)
    return start, end


def list_workouts(db: Session, coach_id: int, filters: WorkoutFilters) -> list[Workout]:
    start, end = _filter_bounds(filters)
    stmt = select(Workout).where(Workout.coach_id == coach_id)
    if start:
        stmt = stmt.where(Workout.starts_at >= start)
    if end:
        stmt = stmt.where(Workout.starts_at < end)
    return list(db.scalars(stmt.order_by(Workout.starts_at, Workout.id).limit(filters.limit)))


def ensure_free(db: Session, coach_id: int, start: datetime, end: datetime, exclude_id: int | None = None) -> None:
    stmt = select(Workout).where(Workout.coach_id == coach_id, Workout.starts_at < end, Workout.ends_at > start)
    if exclude_id is not None:
        stmt = stmt.where(Workout.id != exclude_id)
    clash = db.scalars(stmt.order_by(Workout.starts_at).limit(1)).first()
    if clash:
        raise ConflictError(
            "time_conflict",
            f"Время пересекается с тренировкой «{clash.title}»",
            conflicting_workout_id=clash.id,
            conflicting_starts_at=clash.starts_at.isoformat(),
            conflicting_ends_at=clash.ends_at.isoformat(),
        )


def create_workout(db: Session, coach_id: int, data: WorkoutCreate) -> Workout:
    athletes = load_athletes(db, coach_id, data.athlete_ids, active_only=True)
    ensure_free(db, coach_id, data.starts_at, data.ends_at)
    workout = Workout(
        coach_id=coach_id,
        **data.model_dump(exclude={"athlete_ids"}),
        participants=[WorkoutParticipant(athlete_id=a.id) for a in athletes],
    )
    db.add(workout)
    commit(db)
    return workout


def update_workout(db: Session, coach_id: int, workout_id: int, data: WorkoutUpdate) -> Workout:
    workout = get_workout(db, coach_id, workout_id)
    changes = data.changes()
    if changes.keys() & {"starts_at", "ends_at"}:
        start = changes.get("starts_at", workout.starts_at)
        end = changes.get("ends_at", workout.ends_at)
        with business_rule("invalid_time_range"):
            check_interval(start, end)
        ensure_free(db, coach_id, start, end, exclude_id=workout.id)
    data.apply_to(workout)
    commit(db)
    return workout


def delete_workout(db: Session, coach_id: int, workout_id: int) -> None:
    db.delete(get_workout(db, coach_id, workout_id))
    commit(db)


def set_attendance(db: Session, coach_id: int, workout_id: int, items: list[AttendanceItem]) -> Workout:
    workout = get_workout(db, coach_id, workout_id)
    if workout.starts_at > datetime.now(UTC) and any(i.status in STATUSES_AFTER_START for i in items):
        raise BusinessValidationError(
            "workout_not_started", "Отметить присутствие или отсутствие можно только после начала тренировки"
        )
    existing = {p.athlete_id: p for p in workout.participants}
    load_athletes(db, coach_id, [i.athlete_id for i in items if i.athlete_id not in existing], active_only=True)
    for item in items:
        participant = existing.get(item.athlete_id)
        if participant is None:
            workout.participants.append(WorkoutParticipant(**item.model_dump()))
        else:
            participant.status, participant.comment = item.status, item.comment
    commit(db)
    return workout


def remove_participant(db: Session, coach_id: int, workout_id: int, athlete_id: int) -> None:
    workout = get_workout(db, coach_id, workout_id)
    participant = next((p for p in workout.participants if p.athlete_id == athlete_id), None)
    if participant is None:
        raise NotFoundError("Спортсмен не участвует в этой тренировке")
    workout.participants.remove(participant)
    commit(db)
