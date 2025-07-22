from fastapi import APIRouter

from app.api.api_v1.endpoints import (
    login,
    users,
    proxy,
    agents,
    agent_management,
    knowledge,
    auth,
    chat_management,
    workflow_management,
)

api_router = APIRouter()

# New unified auth endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Legacy endpoints (keep for backward compatibility)
api_router.include_router(login.router, prefix="/login", tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(proxy.router, prefix="/proxy", tags=["proxy"])

# Core agents endpoints (includes /chat endpoint)
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])

# New management endpoints
api_router.include_router(agent_management.router, prefix="/agents", tags=["agent-management"])
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])
api_router.include_router(chat_management.router, prefix="/chats", tags=["chats"])
api_router.include_router(workflow_management.router, prefix="/workflows", tags=["workflows"])
