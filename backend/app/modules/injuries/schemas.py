import enum
from datetime import date
from typing import Self

from pydantic import BaseModel, model_validator

from app.core.schemas import LongText, Name, ORMModel, PatchModel, ShortName
from app.modules.injuries.models import Severity


class InjuryStatus(enum.StrEnum):
    active = "active"
    recovered = "recovered"


def check_dates(started_at: date, recovered_at: date | None) -> None:
    today = date.today()
    if started_at > today:
        raise ValueError("Дата травмы не может быть в будущем")
    if recovered_at is not None and recovered_at < started_at:
        raise ValueError("Дата выздоровления не может быть раньше даты травмы")
    if recovered_at is not None and recovered_at > today:
        raise ValueError("Дата выздоровления не может быть в будущем")


class InjuryCreate(BaseModel):
    title: Name
    body_part: ShortName
    severity: Severity
    started_at: date
    recovered_at: date | None = None
    notes: LongText | None = None

    @model_validator(mode="after")
    def valid_dates(self) -> Self:
        check_dates(self.started_at, self.recovered_at)
        return self


class InjuryUpdate(PatchModel):
    non_nullable = ("title", "body_part", "severity", "started_at")

    title: Name | None = None
    body_part: ShortName | None = None
    severity: Severity | None = None
    started_at: date | None = None
    recovered_at: date | None = None
    notes: LongText | None = None


class InjuryRead(ORMModel):
    id: int
    athlete_id: int
    title: str
    body_part: str
    severity: Severity
    started_at: date
    recovered_at: date | None
    notes: str | None
