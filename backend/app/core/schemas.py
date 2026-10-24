from typing import Annotated, Any, ClassVar, Generic, Self, TypeVar
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, StringConstraints, model_validator

T = TypeVar("T")

MAX_ID = 2**31 - 1
MAX_IDS_PER_REQUEST = 100


def _unique(ids: list[int]) -> list[int]:
    if len(set(ids)) != len(ids):
        raise ValueError("Список спортсменов содержит повторы")
    return ids


def _known_timezone(name: str) -> str:
    try:
        ZoneInfo(name)
    except (ZoneInfoNotFoundError, ValueError):
        raise ValueError(f"Неизвестный часовой пояс: {name}") from None
    return name


Id = Annotated[int, Field(ge=1, le=MAX_ID)]
AthleteIds = Annotated[list[Id], Field(max_length=MAX_IDS_PER_REQUEST), AfterValidator(_unique)]
Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]
ShortName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
LongText = Annotated[str, StringConstraints(max_length=5000)]
TimeZoneName = Annotated[str, AfterValidator(_known_timezone)]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PatchModel(BaseModel):
    non_nullable: ClassVar[tuple[str, ...]] = ()

    @model_validator(mode="after")
    def reject_nulls(self) -> Self:
        for name in self.non_nullable:
            if name in self.model_fields_set and getattr(self, name) is None:
                raise ValueError(f"Поле «{name}» не может быть null")
        return self

    def changes(self) -> dict[str, Any]:
        return self.model_dump(exclude_unset=True)

    def apply_to(self, obj: object) -> None:
        for key, value in self.changes().items():
            setattr(obj, key, value)


class PageParams(BaseModel):
    limit: int = Field(50, ge=1, le=100)
    offset: int = Field(0, ge=0, le=100_000)


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    limit: int
    offset: int
