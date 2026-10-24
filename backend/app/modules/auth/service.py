from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import DUMMY_HASH, create_access_token, decode_access_token, hash_password, verify_password
from app.db.transaction import commit
from app.modules.auth.models import User
from app.modules.auth.schemas import UserCreate, UserUpdate


def create_user(db: Session, data: UserCreate) -> User:
    user = User(email=data.email, password_hash=hash_password(data.password), full_name=data.full_name)
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError("email_taken", "Пользователь с таким email уже существует") from exc
    return user


def login(db: Session, email: str, password: str) -> str:
    user = db.scalar(select(User).where(User.email == email.strip().lower()))
    password_ok = verify_password(password, user.password_hash if user else DUMMY_HASH)
    if user is None or not password_ok:
        raise UnauthorizedError("Неверный email или пароль")
    return create_access_token(user.id)


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
