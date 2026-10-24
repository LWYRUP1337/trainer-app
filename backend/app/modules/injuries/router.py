from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.modules.injuries import service
from app.modules.injuries.schemas import InjuryCreate, InjuryRead, InjuryStatus, InjuryUpdate

router = APIRouter(tags=["injuries"])


@router.get("/athletes/{athlete_id}/injuries")
def list_injuries(
    athlete_id: int, db: DbSession, user: CurrentUser, status: InjuryStatus | None = None
) -> list[InjuryRead]:
    return [InjuryRead.model_validate(i) for i in service.list_injuries(db, user.id, athlete_id, status)]


@router.post("/athletes/{athlete_id}/injuries", status_code=201)
def create_injury(athlete_id: int, data: InjuryCreate, db: DbSession, user: CurrentUser) -> InjuryRead:
    return InjuryRead.model_validate(service.create_injury(db, user.id, athlete_id, data))


@router.get("/injuries/{injury_id}")
def get_injury(injury_id: int, db: DbSession, user: CurrentUser) -> InjuryRead:
    return InjuryRead.model_validate(service.get_injury(db, user.id, injury_id))


@router.patch("/injuries/{injury_id}")
def update_injury(injury_id: int, data: InjuryUpdate, db: DbSession, user: CurrentUser) -> InjuryRead:
    return InjuryRead.model_validate(service.update_injury(db, user.id, injury_id, data))


@router.delete("/injuries/{injury_id}", status_code=204)
def delete_injury(injury_id: int, db: DbSession, user: CurrentUser) -> None:
    service.delete_injury(db, user.id, injury_id)
