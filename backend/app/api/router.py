from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.modules.athletes.router import router as athletes_router
from app.modules.auth.router import router as auth_router
from app.modules.injuries.router import router as injuries_router
from app.modules.reports.router import router as reports_router
from app.modules.week_plans.router import router as week_plans_router
from app.modules.workouts.router import router as workouts_router

private_router = APIRouter(dependencies=[Depends(get_current_user)])
for router in (athletes_router, injuries_router, workouts_router, week_plans_router, reports_router):
    private_router.include_router(router)

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(private_router)
