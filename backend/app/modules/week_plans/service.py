from collections.abc import Iterable
from datetime import datetime, time, timedelta
from itertools import pairwise
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import BusinessValidationError, NotFoundError, business_rule
from app.db.transaction import TIME_CONFLICT_MESSAGE, commit, is_overlap_violation
from app.modules.athletes.service import load_athletes
from app.modules.week_plans.models import WeekPlan, WeekPlanItem
from app.modules.week_plans.schemas import (
    MAX_PLAN_ITEMS,
    ApplyPlan,
    ApplyResult,
    SkippedWorkout,
    WeekPlanCreate,
    WeekPlanItemCreate,
    WeekPlanItemUpdate,
    WeekPlanUpdate,
    check_slot_time,
)
from app.modules.workouts.models import Workout, WorkoutParticipant

Slot = tuple[int, time, time]


def get_plan(db: Session, coach_id: int, plan_id: int, *, lock: bool = False) -> WeekPlan:
    stmt = select(WeekPlan).where(WeekPlan.id == plan_id, WeekPlan.coach_id == coach_id)
    plan = db.scalar(stmt.with_for_update() if lock else stmt)
    if plan is None:
        raise NotFoundError("План недели не найден")
    return plan


def list_plans(db: Session, coach_id: int) -> list[WeekPlan]:
    return list(db.scalars(select(WeekPlan).where(WeekPlan.coach_id == coach_id).order_by(WeekPlan.id)))


def _slot(item: WeekPlanItem | WeekPlanItemCreate) -> Slot:
    return item.weekday, item.start_time, item.end_time


def _ensure_no_overlap(slots: Iterable[Slot]) -> None:
    for prev, cur in pairwise(sorted(slots)):
        if prev[0] == cur[0] and cur[1] < prev[2]:
            raise BusinessValidationError("plan_items_overlap", "Тренировки в плане недели пересекаются по времени")


def _get_item(plan: WeekPlan, item_id: int) -> WeekPlanItem:
    item = next((i for i in plan.items if i.id == item_id), None)
    if item is None:
        raise NotFoundError("Элемент плана не найден")
    return item


def create_plan(db: Session, coach_id: int, data: WeekPlanCreate) -> WeekPlan:
    _ensure_no_overlap(_slot(i) for i in data.items)
    plan = WeekPlan(coach_id=coach_id, title=data.title, items=[WeekPlanItem(**i.model_dump()) for i in data.items])
    db.add(plan)
    commit(db)
    return plan


def update_plan(db: Session, coach_id: int, plan_id: int, data: WeekPlanUpdate) -> WeekPlan:
    plan = get_plan(db, coach_id, plan_id)
    data.apply_to(plan)
    commit(db)
    return plan


def delete_plan(db: Session, coach_id: int, plan_id: int) -> None:
    db.delete(get_plan(db, coach_id, plan_id))
    commit(db)


def add_item(db: Session, coach_id: int, plan_id: int, data: WeekPlanItemCreate) -> WeekPlan:
    plan = get_plan(db, coach_id, plan_id, lock=True)
    if len(plan.items) >= MAX_PLAN_ITEMS:
        raise BusinessValidationError("plan_too_large", f"В плане недели не может быть больше {MAX_PLAN_ITEMS} тренировок")
    _ensure_no_overlap([*(_slot(i) for i in plan.items), _slot(data)])
    plan.items.append(WeekPlanItem(**data.model_dump()))
    commit(db)
    return plan


def update_item(db: Session, coach_id: int, plan_id: int, item_id: int, data: WeekPlanItemUpdate) -> WeekPlan:
    plan = get_plan(db, coach_id, plan_id, lock=True)
    item = _get_item(plan, item_id)
    changes = data.changes()
    updated: Slot = (
        changes.get("weekday", item.weekday),
        changes.get("start_time", item.start_time),
        changes.get("end_time", item.end_time),
    )
    with business_rule("invalid_time_range"):
        check_slot_time(updated[1], updated[2])
    _ensure_no_overlap([*(_slot(i) for i in plan.items if i.id != item_id), updated])
    data.apply_to(item)
    commit(db)
    return plan


def delete_item(db: Session, coach_id: int, plan_id: int, item_id: int) -> None:
    plan = get_plan(db, coach_id, plan_id)
    plan.items.remove(_get_item(plan, item_id))
    commit(db)


def apply_plan(db: Session, coach_id: int, plan_id: int, data: ApplyPlan) -> ApplyResult:
    plan = get_plan(db, coach_id, plan_id)
    if not plan.items:
        raise BusinessValidationError("empty_plan", "В плане недели нет тренировок")
    athletes = load_athletes(db, coach_id, data.athlete_ids, active_only=True)
    tz = ZoneInfo(data.timezone) if data.timezone else get_settings().tz

    created_ids: list[int] = []
    skipped: list[SkippedWorkout] = []
    for offset in range(data.weeks * 7):
        day = data.start_date + timedelta(days=offset)
        for item in (i for i in plan.items if i.weekday == day.isoweekday()):
            workout = Workout(
                coach_id=coach_id,
                week_plan_id=plan.id,
                title=item.title,
                starts_at=datetime.combine(day, item.start_time, tzinfo=tz),
                ends_at=datetime.combine(day, item.end_time, tzinfo=tz),
                participants=[WorkoutParticipant(athlete_id=a.id) for a in athletes],
            )
            try:
                with db.begin_nested():
                    db.add(workout)
                    db.flush()
            except IntegrityError as exc:
                if not is_overlap_violation(exc):
                    raise
                skipped.append(SkippedWorkout(date=day, title=item.title, start_time=item.start_time, reason=TIME_CONFLICT_MESSAGE))
            else:
                created_ids.append(workout.id)
    commit(db)
    return ApplyResult(created_count=len(created_ids), created_ids=created_ids, skipped=skipped)
