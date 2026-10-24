from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints, field_validator

from app.core.schemas import Name, ORMModel, PageParams, PatchModel

Phone = Annotated[str, StringConstraints(strip_whitespace=True, max_length=32, pattern=r"^\+?[0-9\s\-()]{5,32}$")]


class AthleteFields(BaseModel):
    birth_date: date | None = None
    height_cm: int | None = Field(None, ge=50, le=250)
    weight_kg: float | None = Field(None, ge=20, le=300)
    phone: Phone | None = None
    notes: str | None = Field(None, max_length=5000)
    nutrition_plan: str | None = Field(None, max_length=5000)

    @field_validator("birth_date")
    @classmethod
    def not_future(cls, v: date | None) -> date | None:
        if v and v > date.today():
            raise ValueError("Дата рождения не может быть в будущем")
        return v


class AthleteCreate(AthleteFields):
    full_name: Name
    is_active: bool = True


class AthleteUpdate(AthleteFields, PatchModel):
    non_nullable = ("full_name", "is_active")

    full_name: Name | None = None
    is_active: bool | None = None


class AthleteRead(ORMModel):
    id: int
    full_name: str
    birth_date: date | None
    height_cm: int | None
    weight_kg: float | None
    phone: str | None
    notes: str | None
    nutrition_plan: str | None
    is_active: bool
    created_at: datetime


class AthleteFilters(PageParams):
    search: str | None = Field(None, max_length=100)
    is_active: bool | None = None
    has_active_injury: bool | None = None
