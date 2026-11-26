
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.leads import router as leads_router
from app.database.connection import check_database_connection


app = FastAPI(
    title="AI Lead Agent",
    description="An AI-powered lead generation and management system",
    version="1.0.0"
)


# Allow the React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register lead routes
app.include_router(leads_router)


@app.get("/")
async def root():
    return {
        "message": "AI Lead Agent API is running!"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy"
    }


@app.get("/db-health")
async def database_health_check():

    is_connected = check_database_connection()

    if is_connected:
        return {
            "status": "connected",
            "database": "ai_lead_agent"
        }

    return {
        "status": "disconnected",
        "database": "ai_lead_agent"
    }
