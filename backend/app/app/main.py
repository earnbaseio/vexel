from fastapi import FastAPI, Request, Response
from starlette.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import time
import logging

from app.api.api_v1.api import api_router
from app.core.config import settings

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("🚀 Starting Vexel RAG Optimization System")

    # Initialize performance monitoring
    if settings.ENABLE_PERFORMANCE_MONITORING:
        logger.info("📊 Performance monitoring enabled")
        # Performance monitor is already initialized as a global instance

    # Initialize other services
    logger.info("✅ Vexel system startup complete")

    yield

    # Shutdown
    logger.info("🛑 Shutting down Vexel system")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Performance monitoring middleware
@app.middleware("http")
async def performance_monitoring_middleware(request: Request, call_next):
    """Middleware to monitor API performance"""
    start_time = time.time()

    # Process request
    response = await call_next(request)

    # Calculate processing time
    process_time = time.time() - start_time

    # Add performance header
    response.headers["X-Process-Time"] = str(process_time)

    # Log performance for knowledge endpoints
    if "/knowledge/" in str(request.url) and settings.ENABLE_PERFORMANCE_MONITORING:
        try:
            from app.services.performance_monitor import performance_monitor

            # Extract relevant information
            method = request.method
            path = str(request.url.path)
            status_code = response.status_code

            # Log API performance (simplified)
            logger.info(
                f"API Performance: {method} {path} - {status_code} - {process_time:.3f}s",
                extra={
                    "method": method,
                    "path": path,
                    "status_code": status_code,
                    "process_time": process_time,
                    "performance_monitoring": True
                }
            )

        except Exception as e:
            logger.warning(f"Performance monitoring failed: {str(e)}")

    return response


# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=False,  # Set to False when using allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "features": {
            "semantic_chunking": settings.ENABLE_SEMANTIC_CHUNKING,
            "agentic_chunking": settings.ENABLE_AGENTIC_CHUNKING,
            "performance_monitoring": settings.ENABLE_PERFORMANCE_MONITORING,
            "content_analysis": settings.ENABLE_CONTENT_ANALYSIS
        }
    }


# System info endpoint
@app.get("/system/info")
async def system_info():
    """System information endpoint"""
    return {
        "project_name": settings.PROJECT_NAME,
        "api_version": "v1",
        "rag_optimization": "enabled",
        "chunking_strategies": [
            "fixed", "recursive", "document",
            "semantic" if settings.ENABLE_SEMANTIC_CHUNKING else None,
            "agentic" if settings.ENABLE_AGENTIC_CHUNKING else None,
            "markdown"
        ],
        "user_tiers": ["free", "premium", "enterprise"],
        "features": {
            "intelligent_chunking": True,
            "content_analysis": settings.ENABLE_CONTENT_ANALYSIS,
            "performance_monitoring": settings.ENABLE_PERFORMANCE_MONITORING,
            "tier_based_features": True
        }
    }

