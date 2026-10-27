from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, Response
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import CurrentUser, DbSession
from app.core.config import get_settings
from app.modules.auth import service
from app.modules.auth.schemas import Token, UserCreate, UserRead, UserUpdate

PREFIX = "/auth"
REFRESH_COOKIE = "refresh_token"
REFRESH_COOKIE_PATH = f"/api/v1{PREFIX}"

router = APIRouter(prefix=PREFIX, tags=["auth"])
RefreshCookie = Annotated[str | None, Cookie(alias=REFRESH_COOKIE, include_in_schema=False)]


def _token_response(response: Response, tokens: service.TokenPair) -> Token:
    settings = get_settings()
    response.set_cookie(
        REFRESH_COOKIE,
        tokens.refresh_token,
        max_age=settings.refresh_token_expire_days * 24 * 3600,
        path=REFRESH_COOKIE_PATH,
        secure=settings.refresh_cookie_secure,
        httponly=True,
        samesite="strict",
    )
    response.headers["Cache-Control"] = "no-store"
    return Token(access_token=tokens.access_token, expires_in=settings.access_token_expire_minutes * 60)


@router.post("/register", status_code=201)
def register(data: UserCreate, db: DbSession) -> UserRead:
    return UserRead.model_validate(service.create_user(db, data))


@router.post("/login")
def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DbSession, response: Response) -> Token:
    return _token_response(response, service.login(db, form.username, form.password))


@router.post("/refresh")
def refresh(db: DbSession, response: Response, refresh_token: RefreshCookie = None) -> Token:
    return _token_response(response, service.refresh(db, refresh_token))


@router.post("/logout", status_code=204)
def logout(db: DbSession, response: Response, refresh_token: RefreshCookie = None) -> None:
    service.logout(db, refresh_token)
    response.delete_cookie(
        REFRESH_COOKIE,
        path=REFRESH_COOKIE_PATH,
        secure=get_settings().refresh_cookie_secure,
        httponly=True,
        samesite="strict",
    )


@router.get("/me")
def me(user: CurrentUser) -> UserRead:
    return UserRead.model_validate(user)


@router.patch("/me")
def update_me(data: UserUpdate, db: DbSession, user: CurrentUser) -> UserRead:
    return UserRead.model_validate(service.update_user(db, user, data))
