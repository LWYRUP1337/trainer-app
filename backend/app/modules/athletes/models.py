from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, CheckConstraint, Date, ForeignKey, Index, Numeric, SmallInteger, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, CreatedAtMixin


class Athlete(CreatedAtMixin, Base):
    __tablename__ = "athletes"
    __table_args__ = (
        CheckConstraint("height_cm IS NULL OR height_cm BETWEEN 50 AND 250", name="ck_athletes_height"),
        CheckConstraint("weight_kg IS NULL OR weight_kg BETWEEN 20 AND 300", name="ck_athletes_weight"),
        Index("ix_athletes_coach_active", "coach_id", "is_active"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    coach_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    full_name: Mapped[str] = mapped_column(String(255))
    birth_date: Mapped[date | None] = mapped_column(Date)
    height_cm: Mapped[int | None] = mapped_column(SmallInteger)
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(5, 1))
    phone: Mapped[str | None] = mapped_column(String(32))
    notes: Mapped[str | None] = mapped_column(Text)
    nutrition_plan: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("true"))
