from datetime import date, time
from typing import Annotated, Self

from pydantic import BaseModel, Field, model_validator

from app.core.schemas import AthleteIds, Name, ORMModel, PatchModel, TimeZoneName

MAX_PLAN_ITEMS = 100

Weekday = Annotated[int, Field(ge=1, le=7, description="1 — понедельник, 7 — воскресенье")]


def check_slot_time(start_time: time, end_time: time) -> None:
    if end_time <= start_time:
        raise ValueError("Время окончания должно быть позже начала")


class WeekPlanItemCreate(BaseModel):
    weekday: Weekday
    start_time: time
    end_time: time
    title: Name

    @model_validator(mode="after")
    def valid_interval(self) -> Self:
        check_slot_time(self.start_time, self.end_time)
        return self


class WeekPlanItemUpdate(PatchModel):
    non_nullable = ("weekday", "start_time", "end_time", "title")

    weekday: Weekday | None = None
    start_time: time | None = None
    end_time: time | None = None
    title: Name | None = None


class WeekPlanItemRead(ORMModel):
    id: int
    weekday: int
    start_time: time
    end_time: time
    title: str


class WeekPlanCreate(BaseModel):
    title: Name
    items: list[WeekPlanItemCreate] = Field(default_factory=list, max_length=MAX_PLAN_ITEMS)


class WeekPlanUpdate(PatchModel):
    non_nullable = ("title",)

    title: Name | None = None


class WeekPlanRead(ORMModel):
    id: int
    title: str
    items: list[WeekPlanItemRead]


class ApplyPlan(BaseModel):
    start_date: date
    weeks: int = Field(ge=1, le=26)
    timezone: TimeZoneName | None = Field(None, description="IANA-зона, например Europe/Berlin; по умолчанию из настроек")
    athlete_ids: AthleteIds = []


class SkippedWorkout(BaseModel):
    date: date
    title: str
    start_time: time
    reason: str


class ApplyResult(BaseModel):
    created_count: int
    created_ids: list[int]
    skipped: list[SkippedWorkout]
