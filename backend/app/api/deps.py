from typing import Annotated

from fastapi import Depends, Path
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.exceptions import UnauthorizedError
from app.core.schemas import MAX_ID
from app.db.session import get_db
from app.modules.auth.models import User
from app.modules.auth.service import get_user_by_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

DbSession = Annotated[Session, Depends(get_db)]
PathId = Annotated[int, Path(ge=1, le=MAX_ID)]


def get_current_user(db: DbSession, token: Annotated[str | None, Depends(oauth2_scheme)]) -> User:
    if not token:
        raise UnauthorizedError("Требуется авторизация")
    return get_user_by_token(db, token)


CurrentUser = Annotated[User, Depends(get_current_user)]
