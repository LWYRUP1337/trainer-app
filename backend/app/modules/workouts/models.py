import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Index, String, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import ExcludeConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, CreatedAtMixin

if TYPE_CHECKING:
    from app.modules.athletes.models import Athlete


class AttendanceStatus(enum.StrEnum):
    planned = "planned"
    present = "present"
    absent = "absent"
    excused = "excused"


class Workout(CreatedAtMixin, Base):
    __tablename__ = "workouts"
    __table_args__ = (
        CheckConstraint("ends_at > starts_at", name="ck_workouts_time_order"),
        ExcludeConstraint(
            ("coach_id", "="),
            (text("tstzrange(starts_at, ends_at)"), "&&"),
            using="gist",
            name="ex_workouts_coach_no_overlap",
        ),
        Index("ix_workouts_coach_starts", "coach_id", "starts_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    coach_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    week_plan_id: Mapped[int | None] = mapped_column(ForeignKey("week_plans.id", ondelete="SET NULL"))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(String(255))
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    participants: Mapped[list["WorkoutParticipant"]] = relationship(
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="WorkoutParticipant.id",
        lazy="selectin",
    )


class WorkoutParticipant(Base):
    __tablename__ = "workout_participants"
    __table_args__ = (UniqueConstraint("workout_id", "athlete_id", name="uq_participant_workout_athlete"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    workout_id: Mapped[int] = mapped_column(ForeignKey("workouts.id", ondelete="CASCADE"), index=True)
    athlete_id: Mapped[int] = mapped_column(ForeignKey("athletes.id", ondelete="CASCADE"), index=True)
    status: Mapped[AttendanceStatus] = mapped_column(
        Enum(AttendanceStatus, name="attendance_status"),
        default=AttendanceStatus.planned,
        server_default=AttendanceStatus.planned.value,
    )
    comment: Mapped[str | None] = mapped_column(String(500))

    athlete: Mapped["Athlete"] = relationship(lazy="joined")

    @property
    def athlete_name(self) -> str:
        return self.athlete.full_name
