from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession, PathId
from app.modules.week_plans import service
from app.modules.week_plans.schemas import (
    ApplyPlan,
    ApplyResult,
    WeekPlanCreate,
    WeekPlanItemCreate,
    WeekPlanItemUpdate,
    WeekPlanRead,
    WeekPlanUpdate,
)

router = APIRouter(prefix="/week-plans", tags=["week-plans"])


@router.get("")
def list_plans(db: DbSession, user: CurrentUser) -> list[WeekPlanRead]:
    return [WeekPlanRead.model_validate(p) for p in service.list_plans(db, user.id)]


@router.post("", status_code=201)
def create_plan(data: WeekPlanCreate, db: DbSession, user: CurrentUser) -> WeekPlanRead:
    return WeekPlanRead.model_validate(service.create_plan(db, user.id, data))


@router.get("/{plan_id}")
def get_plan(plan_id: PathId, db: DbSession, user: CurrentUser) -> WeekPlanRead:
    return WeekPlanRead.model_validate(service.get_plan(db, user.id, plan_id))


@router.patch("/{plan_id}")
def update_plan(plan_id: PathId, data: WeekPlanUpdate, db: DbSession, user: CurrentUser) -> WeekPlanRead:
    return WeekPlanRead.model_validate(service.update_plan(db, user.id, plan_id, data))


@router.delete("/{plan_id}", status_code=204)
def delete_plan(plan_id: PathId, db: DbSession, user: CurrentUser) -> None:
    service.delete_plan(db, user.id, plan_id)


@router.post("/{plan_id}/items", status_code=201)
def add_item(plan_id: PathId, data: WeekPlanItemCreate, db: DbSession, user: CurrentUser) -> WeekPlanRead:
    return WeekPlanRead.model_validate(service.add_item(db, user.id, plan_id, data))


@router.patch("/{plan_id}/items/{item_id}")
def update_item(plan_id: PathId, item_id: PathId, data: WeekPlanItemUpdate, db: DbSession, user: CurrentUser) -> WeekPlanRead:
    return WeekPlanRead.model_validate(service.update_item(db, user.id, plan_id, item_id, data))


@router.delete("/{plan_id}/items/{item_id}", status_code=204)
def delete_item(plan_id: PathId, item_id: PathId, db: DbSession, user: CurrentUser) -> None:
    service.delete_item(db, user.id, plan_id, item_id)


@router.post("/{plan_id}/apply", status_code=201)
def apply_plan(plan_id: PathId, data: ApplyPlan, db: DbSession, user: CurrentUser) -> ApplyResult:
    return service.apply_plan(db, user.id, plan_id, data)
