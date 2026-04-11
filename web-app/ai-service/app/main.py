from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import asyncio
import os

from app.config import settings
from app.db import connect_to_mongo, close_mongo_connection, db_instance
from app.socket_client import socket_manager
from app.memory_manager import alert_state_manager
from app.database_validator import validate_db_on_startup
from app.routes import router
from app.utils import logger

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting up Driver Safety Microservice...")
    logger.info("📢 Connecting to MongoDB...")
    await connect_to_mongo()
    
    # 🔒 CRITICAL: Validate database before allowing any sessions
    logger.info("")
    try:
        await validate_db_on_startup(db_instance.client, db_instance.db)
    except RuntimeError as validation_error:
        logger.error(f"🛑 {validation_error}")
        logger.error("❌ Application cannot start without a valid database.")
        raise
    
    logger.info("🔗 Connecting to backend Socket.io server...")
    await socket_manager.connect()
    
    # Start alert state cleanup timer
    logger.info("⏰ Starting alert state cleanup timer...")
    cleanup_task = asyncio.create_task(alert_state_manager.start_cleanup_timer(interval_minutes=30))
    
    logger.info("✅ All connections and timers established. Ready to process requests.")
    logger.info("")
    yield
    
    logger.info("🛑 Shutting down microservice...")
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        logger.info("⏹️  Cleanup timer cancelled")
    
    await close_mongo_connection()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Middleware to ensure DB is connected before processing requests
@app.middleware("http")
async def ensure_db_connection(request: Request, call_next):
    """Check DB connection status before processing requests to prevent race conditions."""
    if db_instance.db is None:
        logger.error(f"❌ DB connection not established for {request.url.path}")
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "error": "Service temporarily unavailable - Database connection not ready",
                "message": "DB connection not yet established. Please try again momentarily.",
                "path": str(request.url.path)
            }
        )
    return await call_next(request)

# Apply CORS constraints - Restrict to specific frontend URLs only
# ⚠️  SECURITY: Never use allow_origins=["*"] in production
allowed_origins = [
    # Frontend URLs
    "http://localhost:3000",
    "http://localhost:5173",  # Vite dev server default
    "http://localhost:8081",  # Expo web
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8081",
    # Local network IPs (for mobile testing)
    "http://10.44.202.155:3000",
    "http://10.44.202.155:5173",
    "http://10.44.202.155:8081",
    "http://10.44.202.155:5000",
]

# Add environment-specific origins
if os.getenv("FRONTEND_URL"):
    allowed_origins.append(os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # ✅ Restricted to known origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # ✅ Specific methods
    allow_headers=["*"],
)

# Include modules router
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
