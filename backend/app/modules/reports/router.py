from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession, PathId
from app.modules.reports import service
from app.modules.reports.schemas import (
    AthleteAttendance,
    AttendanceReport,
    AttendanceReportFilters,
    DashboardStats,
    ReportPeriod,
    SummaryReport,
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/dashboard")
def dashboard(db: DbSession, user: CurrentUser) -> DashboardStats:
    return service.dashboard(db, user.id)


@router.get("/attendance")
def attendance(filters: Annotated[AttendanceReportFilters, Query()], db: DbSession, user: CurrentUser) -> AttendanceReport:
    return service.attendance_report(db, user.id, filters)


@router.get("/athletes/{athlete_id}/attendance")
def athlete_attendance(athlete_id: PathId, db: DbSession, user: CurrentUser) -> AthleteAttendance:
    return service.athlete_attendance(db, user.id, athlete_id)


@router.get("/summary")
def summary(period: Annotated[ReportPeriod, Query()], db: DbSession, user: CurrentUser) -> SummaryReport:
    return service.summary_report(db, user.id, period)
