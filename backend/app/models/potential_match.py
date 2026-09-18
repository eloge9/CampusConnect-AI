import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MatchStatus(str, enum.Enum):
    PROPOSEE = "PROPOSEE"
    CONFIRMEE = "CONFIRMEE"
    REJETEE = "REJETEE"


class PotentialMatch(Base):
    __tablename__ = "potential_matches"
    __table_args__ = (UniqueConstraint("lost_item_id", "found_item_id", name="uq_lost_found_pair"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    lost_item_id: Mapped[int] = mapped_column(
        ForeignKey("lost_found_items.id", ondelete="CASCADE"), nullable=False, index=True
    )
    found_item_id: Mapped[int] = mapped_column(
        ForeignKey("lost_found_items.id", ondelete="CASCADE"), nullable=False, index=True
    )
    similarity_score: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[MatchStatus] = mapped_column(
        Enum(MatchStatus, name="match_status"), nullable=False, default=MatchStatus.PROPOSEE
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    lost_item: Mapped["LostFoundItem"] = relationship(foreign_keys=[lost_item_id])
    found_item: Mapped["LostFoundItem"] = relationship(foreign_keys=[found_item_id])
