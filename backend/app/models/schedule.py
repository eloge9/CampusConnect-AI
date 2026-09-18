import enum
from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Time, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ScheduleStatus(str, enum.Enum):
    PREVU = "PREVU"
    MODIFIE = "MODIFIE"
    ANNULE = "ANNULE"


class Schedule(Base):
    __tablename__ = "schedules"

    id: Mapped[int] = mapped_column(primary_key=True)
    teacher_assignment_id: Mapped[int] = mapped_column(
        ForeignKey("teacher_assignments.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    room: Mapped[str] = mapped_column(String(50), nullable=False)
    session_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    status: Mapped[ScheduleStatus] = mapped_column(
        Enum(ScheduleStatus, name="schedule_status"), nullable=False, default=ScheduleStatus.PREVU
    )
    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    affectation: Mapped["TeacherAssignment"] = relationship()
