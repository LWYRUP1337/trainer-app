import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import (
    DUMMY_HASH,
    create_access_token,
    decode_access_token,
    hash_password,
    hash_token,
    new_refresh_token,
    verify_password,
)
from app.db.transaction import commit
from app.modules.auth.models import RefreshToken, User
from app.modules.auth.schemas import UserCreate, UserUpdate

INVALID_REFRESH_MESSAGE = "Сессия недействительна или истекла, войдите снова"


@dataclass(frozen=True)
class TokenPair:
    access_token: str
    refresh_token: str


def create_user(db: Session, data: UserCreate) -> User:
    user = User(email=data.email, password_hash=hash_password(data.password), full_name=data.full_name)
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError("email_taken", "Пользователь с таким email уже существует") from exc
    return user


def _issue_tokens(db: Session, user_id: int, session_id: uuid.UUID) -> TokenPair:
    refresh_token = new_refresh_token()
    db.add(
        RefreshToken(
            user_id=user_id,
            session_id=session_id,
            token_hash=hash_token(refresh_token),
            expires_at=datetime.now(UTC) + timedelta(days=get_settings().refresh_token_expire_days),
        )
    )
    commit(db)
    return TokenPair(create_access_token(user_id), refresh_token)


def _revoke_session(db: Session, session_id: uuid.UUID) -> None:
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.session_id == session_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC))
    )


def _find_refresh_token(db: Session, raw_token: str | None) -> RefreshToken | None:
    if not raw_token:
        return None
    return db.scalar(select(RefreshToken).where(RefreshToken.token_hash == hash_token(raw_token)).with_for_update())


def login(db: Session, email: str, password: str) -> TokenPair:
    user = db.scalar(select(User).where(User.email == email.strip().lower()))
    password_ok = verify_password(password, user.password_hash if user else DUMMY_HASH)
    if user is None or not password_ok:
        raise UnauthorizedError("Неверный email или пароль")
    db.execute(delete(RefreshToken).where(RefreshToken.user_id == user.id, RefreshToken.expires_at < datetime.now(UTC)))
    return _issue_tokens(db, user.id, uuid.uuid4())


def refresh(db: Session, raw_token: str | None) -> TokenPair:
    token = _find_refresh_token(db, raw_token)
    if token is None or token.expires_at <= datetime.now(UTC):
        raise UnauthorizedError(INVALID_REFRESH_MESSAGE)
    if token.revoked_at is not None:
        _revoke_session(db, token.session_id)
        commit(db)
        raise UnauthorizedError(INVALID_REFRESH_MESSAGE)
    token.revoked_at = datetime.now(UTC)
    return _issue_tokens(db, token.user_id, token.session_id)


def logout(db: Session, raw_token: str | None) -> None:
    token = _find_refresh_token(db, raw_token)
    if token is not None:
        _revoke_session(db, token.session_id)
        commit(db)


def get_user_by_token(db: Session, token: str) -> User:
    user_id = decode_access_token(token)
    user = db.get(User, user_id) if user_id is not None else None
    if user is None:
        raise UnauthorizedError("Недействительный или просроченный токен")
    return user


def update_user(db: Session, user: User, data: UserUpdate) -> User:
    data.apply_to(user)
    commit(db)
    return user
