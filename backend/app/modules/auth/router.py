from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import CurrentUser, DbSession
from app.modules.auth import service
from app.modules.auth.schemas import Token, UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=201)
def register(data: UserCreate, db: DbSession) -> UserRead:
    return UserRead.model_validate(service.create_user(db, data))


@router.post("/login")
def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DbSession) -> Token:
    return Token(access_token=service.login(db, form.username, form.password))


@router.get("/me")
def me(user: CurrentUser) -> UserRead:
    return UserRead.model_validate(user)


@router.patch("/me")
def update_me(data: UserUpdate, db: DbSession, user: CurrentUser) -> UserRead:
    return UserRead.model_validate(service.update_user(db, user, data))
