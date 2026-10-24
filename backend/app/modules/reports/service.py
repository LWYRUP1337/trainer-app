from datetime import UTC, datetime, time, timedelta

from sqlalchemy import ColumnElement, and_, func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.modules.athletes.models import Athlete
from app.modules.athletes.service import get_athlete
from app.modules.injuries.models import Injury
from app.modules.reports.schemas import AttendanceReport, AttendanceReportFilters, AttendanceRow, ReportPeriod, SummaryReport
from app.modules.workouts.models import AttendanceStatus, Workout, WorkoutParticipant


def _bounds(period: ReportPeriod) -> tuple[datetime, datetime]:
    tz = get_settings().tz
    return (
        datetime.combine(period.date_from, time.min, tzinfo=tz),
        datetime.combine(period.date_to + timedelta(days=1), time.min, tzinfo=tz),
    )


def _percent(present: int, absent: int, excused: int) -> float:
    counted = present + absent + excused
    return round(present * 100 / counted, 1) if counted else 0.0


def _count(status: AttendanceStatus, *extra: ColumnElement[bool]) -> ColumnElement[int]:
    return func.count(WorkoutParticipant.id).filter(and_(WorkoutParticipant.status == status, *extra))


def attendance_report(db: Session, coach_id: int, filters: AttendanceReportFilters) -> AttendanceReport:
    start, end = _bounds(filters)
    in_period = Workout.id.is_not(None)
    stmt = (
        select(
            Athlete.id,
            Athlete.full_name,
            _count(AttendanceStatus.present, in_period),
            _count(AttendanceStatus.absent, in_period),
            _count(AttendanceStatus.excused, in_period),
            _count(AttendanceStatus.planned, in_period),
        )
        .select_from(Athlete)
        .outerjoin(WorkoutParticipant, WorkoutParticipant.athlete_id == Athlete.id)
        .outerjoin(
            Workout,
            and_(Workout.id == WorkoutParticipant.workout_id, Workout.starts_at >= start, Workout.starts_at < end),
        )
        .where(Athlete.coach_id == coach_id)
        .group_by(Athlete.id, Athlete.full_name)
        .order_by(Athlete.full_name, Athlete.id)
    )
    if filters.athlete_id is not None:
        get_athlete(db, coach_id, filters.athlete_id)
        stmt = stmt.where(Athlete.id == filters.athlete_id)
    elif not filters.include_inactive:
        stmt = stmt.where(Athlete.is_active.is_(True))

    rows = [
        AttendanceRow(
            athlete_id=athlete_id,
            full_name=name,
            present=present,
            absent=absent,
            excused=excused,
            planned=planned,
            percent=_percent(present, absent, excused),
        )
        for athlete_id, name, present, absent, excused, planned in db.execute(stmt).all()
    ]
    return AttendanceReport(date_from=filters.date_from, date_to=filters.date_to, items=rows)


def summary_report(db: Session, coach_id: int, period: ReportPeriod) -> SummaryReport:
    start, end = _bounds(period)
    in_period = (Workout.coach_id == coach_id, Workout.starts_at >= start, Workout.starts_at < end)

    held = db.scalar(select(func.count(Workout.id)).where(*in_period, Workout.ends_at <= datetime.now(UTC)))
    present, absent, excused = db.execute(
        select(_count(AttendanceStatus.present), _count(AttendanceStatus.absent), _count(AttendanceStatus.excused))
        .select_from(WorkoutParticipant)
        .join(Workout, Workout.id == WorkoutParticipant.workout_id)
        .where(*in_period)
    ).one()
    injuries = select(func.count(Injury.id)).join(Athlete).where(Athlete.coach_id == coach_id)
    new_injuries = db.scalar(injuries.where(Injury.started_at.between(period.date_from, period.date_to)))
    active_injuries = db.scalar(injuries.where(Injury.recovered_at.is_(None)))

    return SummaryReport(
        date_from=period.date_from,
        date_to=period.date_to,
        workouts_held=held or 0,
        attendance_percent=_percent(present, absent, excused),
        new_injuries=new_injuries or 0,
        active_injuries=active_injuries or 0,
    )
