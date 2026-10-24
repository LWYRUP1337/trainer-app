from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession, PathId
from app.core.schemas import Page
from app.modules.athletes import service
from app.modules.athletes.schemas import AthleteCreate, AthleteFilters, AthleteRead, AthleteUpdate

router = APIRouter(prefix="/athletes", tags=["athletes"])


@router.get("")
def list_athletes(filters: Annotated[AthleteFilters, Query()], db: DbSession, user: CurrentUser) -> Page[AthleteRead]:
    items, total = service.list_athletes(db, user.id, filters)
    return Page[AthleteRead](
        items=[AthleteRead.model_validate(a) for a in items],
        total=total,
        limit=filters.limit,
        offset=filters.offset,
    )


@router.post("", status_code=201)
def create_athlete(data: AthleteCreate, db: DbSession, user: CurrentUser) -> AthleteRead:
    return AthleteRead.model_validate(service.create_athlete(db, user.id, data))


@router.get("/{athlete_id}")
def get_athlete(athlete_id: PathId, db: DbSession, user: CurrentUser) -> AthleteRead:
    return AthleteRead.model_validate(service.get_athlete(db, user.id, athlete_id))


@router.patch("/{athlete_id}")
def update_athlete(athlete_id: PathId, data: AthleteUpdate, db: DbSession, user: CurrentUser) -> AthleteRead:
    return AthleteRead.model_validate(service.update_athlete(db, user.id, athlete_id, data))


@router.delete("/{athlete_id}", status_code=204)
def delete_athlete(athlete_id: PathId, db: DbSession, user: CurrentUser) -> None:
    service.delete_athlete(db, user.id, athlete_id)
