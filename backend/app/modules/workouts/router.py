from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession, PathId
from app.modules.workouts import service
from app.modules.workouts.schemas import AttendanceUpdate, WorkoutCreate, WorkoutFilters, WorkoutRead, WorkoutUpdate

router = APIRouter(prefix="/workouts", tags=["workouts"])


@router.get("")
def list_workouts(filters: Annotated[WorkoutFilters, Query()], db: DbSession, user: CurrentUser) -> list[WorkoutRead]:
    return [WorkoutRead.model_validate(w) for w in service.list_workouts(db, user.id, filters)]


@router.post("", status_code=201)
def create_workout(data: WorkoutCreate, db: DbSession, user: CurrentUser) -> WorkoutRead:
    return WorkoutRead.model_validate(service.create_workout(db, user.id, data))


@router.get("/{workout_id}")
def get_workout(workout_id: PathId, db: DbSession, user: CurrentUser) -> WorkoutRead:
    return WorkoutRead.model_validate(service.get_workout(db, user.id, workout_id))


@router.patch("/{workout_id}")
def update_workout(workout_id: PathId, data: WorkoutUpdate, db: DbSession, user: CurrentUser) -> WorkoutRead:
    return WorkoutRead.model_validate(service.update_workout(db, user.id, workout_id, data))


@router.delete("/{workout_id}", status_code=204)
def delete_workout(workout_id: PathId, db: DbSession, user: CurrentUser) -> None:
    service.delete_workout(db, user.id, workout_id)


@router.put("/{workout_id}/attendance")
def set_attendance(workout_id: PathId, data: AttendanceUpdate, db: DbSession, user: CurrentUser) -> WorkoutRead:
    return WorkoutRead.model_validate(service.set_attendance(db, user.id, workout_id, data.items))


@router.delete("/{workout_id}/participants/{athlete_id}", status_code=204)
def remove_participant(workout_id: PathId, athlete_id: PathId, db: DbSession, user: CurrentUser) -> None:
    service.remove_participant(db, user.id, workout_id, athlete_id)
