import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AbsenceStatus(str, enum.Enum):
    EN_ATTENTE = "EN_ATTENTE"
    ACCEPTEE = "ACCEPTEE"
    REFUSEE = "REFUSEE"


class AbsenceRequest(Base):
    __tablename__ = "absence_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    schedule_id: Mapped[int] = mapped_column(
        ForeignKey("schedules.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    justificatif_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[AbsenceStatus] = mapped_column(
        Enum(AbsenceStatus, name="absence_status"), nullable=False, default=AbsenceStatus.EN_ATTENTE
    )
    reviewed_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    review_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    student: Mapped["User"] = relationship(foreign_keys=[student_id])
    schedule: Mapped["Schedule"] = relationship()
