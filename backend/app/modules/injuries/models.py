import enum
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Date, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.modules.athletes.models import Athlete


class Severity(enum.StrEnum):
    light = "light"
    medium = "medium"
    severe = "severe"


class Injury(Base):
    __tablename__ = "injuries"
    __table_args__ = (
        CheckConstraint("recovered_at IS NULL OR recovered_at >= started_at", name="ck_injuries_dates"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    athlete_id: Mapped[int] = mapped_column(ForeignKey("athletes.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    body_part: Mapped[str] = mapped_column(String(100))
    severity: Mapped[Severity] = mapped_column(Enum(Severity, name="severity"))
    started_at: Mapped[date] = mapped_column(Date)
    recovered_at: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text)

    athlete: Mapped["Athlete"] = relationship(back_populates="injuries")
