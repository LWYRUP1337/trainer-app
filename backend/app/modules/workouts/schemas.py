from datetime import datetime, timedelta
from typing import Self

from pydantic import AwareDatetime, BaseModel, Field, field_validator, model_validator

from app.core.schemas import Name, ORMModel, PatchModel, ensure_unique_ids
from app.modules.workouts.models import AttendanceStatus

MAX_DURATION = timedelta(hours=24)


def check_interval(starts_at: datetime, ends_at: datetime) -> None:
    if ends_at <= starts_at:
        raise ValueError("Время окончания должно быть позже начала")
    if ends_at - starts_at > MAX_DURATION:
        raise ValueError("Тренировка не может длиться дольше 24 часов")


class WorkoutCreate(BaseModel):
    title: Name
    description: str | None = Field(None, max_length=5000)
    location: str | None = Field(None, max_length=255)
    starts_at: AwareDatetime
    ends_at: AwareDatetime
    athlete_ids: list[int] = []

    @field_validator("athlete_ids")
    @classmethod
    def unique_athletes(cls, v: list[int]) -> list[int]:
        return ensure_unique_ids(v)

    @model_validator(mode="after")
    def valid_interval(self) -> Self:
        check_interval(self.starts_at, self.ends_at)
        return self


class WorkoutUpdate(PatchModel):
    non_nullable = ("title", "starts_at", "ends_at")

    title: Name | None = None
    description: str | None = Field(None, max_length=5000)
    location: str | None = Field(None, max_length=255)
    starts_at: AwareDatetime | None = None
    ends_at: AwareDatetime | None = None


class ParticipantRead(ORMModel):
    athlete_id: int
    athlete_name: str
    status: AttendanceStatus
    comment: str | None


class WorkoutRead(ORMModel):
    id: int
    title: str
    description: str | None
    location: str | None
    starts_at: datetime
    ends_at: datetime
    week_plan_id: int | None
    created_at: datetime
    participants: list[ParticipantRead]


class AttendanceItem(BaseModel):
    athlete_id: int
    status: AttendanceStatus
    comment: str | None = Field(None, max_length=500)


class AttendanceUpdate(BaseModel):
    items: list[AttendanceItem] = Field(min_length=1)

    @field_validator("items")
    @classmethod
    def unique_athletes(cls, v: list[AttendanceItem]) -> list[AttendanceItem]:
        if len({i.athlete_id for i in v}) != len(v):
            raise ValueError("Один спортсмен указан несколько раз")
        return v


class WorkoutFilters(BaseModel):
    year: int | None = Field(None, ge=2000, le=2100)
    month: int | None = Field(None, ge=1, le=12)
    date_from: AwareDatetime | None = None
    date_to: AwareDatetime | None = None
    limit: int = Field(200, ge=1, le=500)

    @model_validator(mode="after")
    def consistent(self) -> Self:
        if (self.year or self.month) and (self.date_from or self.date_to):
            raise ValueError("Используйте либо year/month, либо date_from/date_to")
        if self.month and not self.year:
            raise ValueError("Для фильтра по месяцу нужен год")
        if self.date_from and self.date_to and self.date_to <= self.date_from:
            raise ValueError("date_to должна быть позже date_from")
        return self
