from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.modules.reports import service
from app.modules.reports.schemas import AttendanceReport, AttendanceReportFilters, ReportPeriod, SummaryReport

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/attendance")
def attendance(filters: Annotated[AttendanceReportFilters, Query()], db: DbSession, user: CurrentUser) -> AttendanceReport:
    return service.attendance_report(db, user.id, filters)


@router.get("/summary")
def summary(period: Annotated[ReportPeriod, Query()], db: DbSession, user: CurrentUser) -> SummaryReport:
    return service.summary_report(db, user.id, period)
