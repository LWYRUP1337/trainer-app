from fastapi import APIRouter

from app.modules.athletes.router import router as athletes_router
from app.modules.auth.router import router as auth_router
from app.modules.injuries.router import router as injuries_router
from app.modules.reports.router import router as reports_router
from app.modules.week_plans.router import router as week_plans_router
from app.modules.workouts.router import router as workouts_router

api_router = APIRouter()
for router in (auth_router, athletes_router, injuries_router, workouts_router, week_plans_router, reports_router):
    api_router.include_router(router)
