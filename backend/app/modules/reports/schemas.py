from datetime import date, datetime
from typing import Self

from pydantic import BaseModel, model_validator

from app.core.schemas import Id
from app.modules.workouts.models import AttendanceStatus

MAX_PERIOD_DAYS = 366


class ReportPeriod(BaseModel):
    date_from: date
    date_to: date

    @model_validator(mode="after")
    def valid_period(self) -> Self:
        if self.date_to < self.date_from:
            raise ValueError("date_to не может быть раньше date_from")
        if (self.date_to - self.date_from).days >= MAX_PERIOD_DAYS:
            raise ValueError(f"Период отчёта не должен превышать {MAX_PERIOD_DAYS} дней")
        return self


class AttendanceReportFilters(ReportPeriod):
    athlete_id: Id | None = None
    include_inactive: bool = False


class AttendanceRow(BaseModel):
    athlete_id: int
    full_name: str
    present: int
    absent: int
    excused: int
    planned: int
    percent: float


class AttendanceReport(ReportPeriod):
    items: list[AttendanceRow]


class SummaryReport(ReportPeriod):
    workouts_held: int
    attendance_percent: float
    new_injuries: int
    active_injuries: int


class DashboardStats(BaseModel):
    active_athletes: int
    active_injuries: int
    upcoming_workouts: int


class AttendanceHistoryItem(BaseModel):
    workout_id: int
    title: str
    starts_at: datetime
    status: AttendanceStatus


class AthleteAttendance(BaseModel):
    present: int
    total: int
    percent: float
    history: list[AttendanceHistoryItem]
