from datetime import datetime, date, UTC
from functools import partial

from sqlalchemy import Date, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from uuid import uuid4
from sqlalchemy.sql.schema import ForeignKey
from sqlalchemy import String, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship


from src.db.database import Base

utcnow = partial(datetime.now, UTC)


class Puzzle(Base):
    __tablename__ = "puzzles"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    puzzle_date: Mapped[date] = mapped_column(Date, unique=True)
    puzzle_json: Mapped[dict] = mapped_column(JSONB)
    solution_json: Mapped[dict] = mapped_column(JSONB)

    __table_args__ = (Index("ix_puzzles_puzzle_date", puzzle_date),)


class PlayerSession(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    puzzle_id: Mapped[str] = mapped_column(ForeignKey("puzzles.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    last_seen: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    found_words = relationship("FoundWord", back_populates="session", cascade="all, delete-orphan")

    score: Mapped[int] = mapped_column(default=0)
    found_count: Mapped[int] = mapped_column(default=0)
    bonus_score: Mapped[int] = mapped_column(default=0)
    bonus_found_count: Mapped[int] = mapped_column(default=0)

    player_id: Mapped[str | None] = mapped_column(ForeignKey("players.id"), nullable=True)
    player: Mapped["Player | None"] = relationship(back_populates="sessions")

class Player(Base):
    __tablename__ = "players"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    username: Mapped[str] = mapped_column(String, unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    sessions: Mapped[list["PlayerSession"]] = relationship(back_populates="player")
    identities: Mapped[list["PlayerIdentity"]] = relationship(
        back_populates="player",
        cascade="all, delete-orphan"
    )

class PlayerIdentity(Base):
    __tablename__ = "player_identities"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid4())
    )

    provider: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    provider_user_id: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    player_id: Mapped[str] = mapped_column(
        ForeignKey("players.id"),
        nullable=False,
        index=True
    )

    player: Mapped["Player"] = relationship(
        back_populates="identities"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utcnow
    )

    __table_args__ = (
        UniqueConstraint(
            "provider",
            "provider_user_id",
            name="uq_identity_provider_user"
        ),
        Index(
            "ix_identity_provider_user",
            "provider",
            "provider_user_id"
        ),
    )

class FoundWord(Base):
    __tablename__ = "found_words"

    id: Mapped[int] = mapped_column(primary_key=True)

    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"), index=True)
    session = relationship("PlayerSession",back_populates="found_words")

    word: Mapped[str] = mapped_column(String, index=True)
    bonus: Mapped[bool] = mapped_column(default=False)

    found_at: Mapped[datetime]
    score: Mapped[int] = mapped_column(default=1)


    __table_args__ = (
        UniqueConstraint(
            "session_id",
            "word",
            name="uq_session_word"
        ),
    )