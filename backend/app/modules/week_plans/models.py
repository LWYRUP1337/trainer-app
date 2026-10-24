from datetime import time

from sqlalchemy import CheckConstraint, ForeignKey, SmallInteger, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class WeekPlan(Base):
    __tablename__ = "week_plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    coach_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255))

    items: Mapped[list["WeekPlanItem"]] = relationship(
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="(WeekPlanItem.weekday, WeekPlanItem.start_time)",
        lazy="selectin",
    )


class WeekPlanItem(Base):
    __tablename__ = "week_plan_items"
    __table_args__ = (
        CheckConstraint("weekday BETWEEN 1 AND 7", name="ck_plan_items_weekday"),
        CheckConstraint("end_time > start_time", name="ck_plan_items_time_order"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    week_plan_id: Mapped[int] = mapped_column(ForeignKey("week_plans.id", ondelete="CASCADE"), index=True)
    weekday: Mapped[int] = mapped_column(SmallInteger)
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    title: Mapped[str] = mapped_column(String(255))
