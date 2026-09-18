import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AnnouncementCategory(str, enum.Enum):
    COURS = "COURS"
    EXAMENS = "EXAMENS"
    EMPLOI_DU_TEMPS = "EMPLOI_DU_TEMPS"
    ADMINISTRATION = "ADMINISTRATION"
    EVENEMENTS = "EVENEMENTS"
    OBJETS_PERDUS_TROUVES = "OBJETS_PERDUS_TROUVES"


class Announcement(Base):
    __tablename__ = "announcements"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[AnnouncementCategory] = mapped_column(
        Enum(AnnouncementCategory, name="announcement_category"), nullable=False
    )
    author_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    class_id: Mapped[int | None] = mapped_column(
        ForeignKey("classes.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    author: Mapped["User"] = relationship()
    classe: Mapped["Class | None"] = relationship()
