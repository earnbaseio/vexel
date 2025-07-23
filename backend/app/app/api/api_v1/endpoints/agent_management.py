"""
Agent Management API Endpoints
Endpoints for managing agent configurations, sessions, and metrics
"""

from typing import Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, Path
from motor.core import AgnosticDatabase
from odmantic import ObjectId

from app.api.deps import get_current_user, get_database
from app.models.user import User
from app.crud.crud_agent import AgentConfiguration, AgentSession, AgentMetrics
from app.models.agent_enums import AgentType, AgentStatus
from app.schemas.agent import (
    AgentConfigurationCreate,
    AgentConfigurationUpdate,
    AgentConfigurationResponse,
    AgentSessionCreate,
    AgentSessionUpdate,
    AgentSessionResponse,
    AgentMetricsResponse,
    AgentListResponse,
    AgentSearchRequest,
    AgentChatRequest,
    AgentChatResponse
)
from app.crud import (
    crud_agent_configuration,
    crud_agent_session,
    crud_agent_metrics
)

router = APIRouter()


def validate_object_id(id_str: str) -> ObjectId:
    """Validate and convert string to ObjectId"""
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid ID format"
        )


# ============================================================================
# AGENT CONFIGURATION ENDPOINTS
# ============================================================================

@router.post("/configurations", response_model=AgentConfigurationResponse, status_code=201)
async def create_agent_configuration(
    *,
    db: AgnosticDatabase = Depends(get_database),
    agent_in: AgentConfigurationCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new agent configuration
    """
    try:
        # Add user_id to the agent configuration
        agent_data = agent_in.model_dump()
        agent_data["user_id"] = current_user.id

        # Create agent configuration using the schema with user_id
        from app.schemas.agent import AgentConfigurationCreate
        agent_create = AgentConfigurationCreate(**agent_data)
        agent = await crud_agent_configuration.create(db, obj_in=agent_create)

        return AgentConfigurationResponse(
            id=str(agent.id),
            user_id=str(agent.user_id),
            **agent.model_dump(exclude={"id", "user_id"})
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create agent configuration: {str(e)}")


@router.get("/configurations", response_model=AgentListResponse)
async def list_agent_configurations(
    *,
    db: AgnosticDatabase = Depends(get_database),
    current_user: User = Depends(get_current_user),
    agent_type: Optional[AgentType] = Query(None, description="Filter by agent type"),
    status: Optional[AgentStatus] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size")
):
    """
    List user's agent configurations with optional filtering
    """
    try:
        # Get agents based on filters
        if agent_type:
            agents = await crud_agent_configuration.get_by_type(db, current_user.id, agent_type)
        else:
            agents = await crud_agent_configuration.get_by_user(db, current_user.id)
        
        # Apply status filter if specified
        if status:
            agents = [agent for agent in agents if agent.status == status]
        
        # Apply pagination
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_agents = agents[start_idx:end_idx]
        
        # Convert to response format
        agent_responses = []
        for agent in paginated_agents:
            try:
                # Ensure backward compatibility for missing fields
                agent_data = agent.model_dump(exclude={"id", "user_id", "shared_with"})

                # Handle missing api_keys field
                if 'api_keys' not in agent_data or agent_data['api_keys'] is None:
                    agent_data['api_keys'] = {}

                # Handle missing available_models field
                if 'available_models' not in agent_data or agent_data['available_models'] is None:
                    agent_data['available_models'] = {
                        "openai": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
                        "anthropic": ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307", "claude-3-opus-20240229"],
                        "gemini": ["gemini/gemini-2.5-flash-lite"]
                    }

                agent_response = AgentConfigurationResponse(
                    id=str(agent.id),
                    user_id=str(agent.user_id),
                    shared_with=[str(uid) for uid in agent.shared_with],
                    **agent_data
                )
                agent_responses.append(agent_response)

            except Exception as e:
                print(f"Error processing agent {agent.id}: {str(e)}")
                # Skip this agent if there's an error
                continue
        
        return AgentListResponse(
            agents=agent_responses,
            total=len(agents),
            page=page,
            page_size=page_size
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list agent configurations: {str(e)}")


@router.get("/configurations/{agent_id}", response_model=AgentConfigurationResponse)
async def get_agent_configuration(
    *,
    db: AgnosticDatabase = Depends(get_database),
    agent_id: str = Path(..., description="Agent configuration ID"),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific agent configuration
    """
    try:
        # Validate ObjectId format early
        agent_object_id = validate_object_id(agent_id)

        agent = await crud_agent_configuration.get(db, agent_object_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent configuration not found")

        # Check if user has access to this agent
        if agent.user_id != current_user.id and current_user.id not in agent.shared_with and not agent.is_public:
            raise HTTPException(status_code=403, detail="Access denied")

        # Ensure backward compatibility for missing fields
        agent_data = agent.model_dump(exclude={"id", "user_id", "shared_with"})

        # Handle missing api_keys field
        if 'api_keys' not in agent_data or agent_data['api_keys'] is None:
            agent_data['api_keys'] = {}

        # Handle missing available_models field
        if 'available_models' not in agent_data or agent_data['available_models'] is None:
            agent_data['available_models'] = {
                "openai": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
                "anthropic": ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307", "claude-3-opus-20240229"],
                "gemini": ["gemini/gemini-2.5-flash-lite"]
            }

        return AgentConfigurationResponse(
            id=str(agent.id),
            user_id=str(agent.user_id),
            shared_with=[str(uid) for uid in agent.shared_with],
            **agent_data
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get agent configuration: {str(e)}")


@router.put("/configurations/{agent_id}", response_model=AgentConfigurationResponse)
async def update_agent_configuration(
    *,
    db: AgnosticDatabase = Depends(get_database),
    agent_id: str,
    agent_update: AgentConfigurationUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Update an agent configuration
    """
    try:
        agent = await crud_agent_configuration.get(db, ObjectId(agent_id))
        if not agent:
            raise HTTPException(status_code=404, detail="Agent configuration not found")
        
        # Check if user owns this agent
        if agent.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update agent
        updated_agent = await crud_agent_configuration.update(
            db, db_obj=agent, obj_in=agent_update.model_dump(exclude_unset=True)
        )
        
        return AgentConfigurationResponse(
            id=str(updated_agent.id),
            user_id=str(updated_agent.user_id),
            shared_with=[str(uid) for uid in updated_agent.shared_with],
            **updated_agent.model_dump(exclude={"id", "user_id", "shared_with"})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update agent configuration: {str(e)}")


@router.delete("/configurations/{agent_id}", status_code=204)
async def delete_agent_configuration(
    *,
    db: AgnosticDatabase = Depends(get_database),
    agent_id: str = Path(..., description="Agent configuration ID"),
    current_user: User = Depends(get_current_user)
):
    """
    Delete (archive) an agent configuration
    """
    try:
        # Validate ObjectId format early
        agent_object_id = validate_object_id(agent_id)

        agent = await crud_agent_configuration.get(db, agent_object_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent configuration not found")

        # Check if user owns this agent
        if agent.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Archive the agent instead of deleting
        await crud_agent_configuration.archive_agent(db, agent_object_id)

        return {"message": "Agent configuration archived successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete agent configuration: {str(e)}")


@router.get("/configurations/public", response_model=AgentListResponse)
async def list_public_agent_configurations(
    *,
    db: AgnosticDatabase = Depends(get_database),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size")
):
    """
    List public agent configurations
    """
    try:
        agents = await crud_agent_configuration.get_public_agents(db)
        
        # Apply pagination
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_agents = agents[start_idx:end_idx]
        
        # Convert to response format
        agent_responses = []
        for agent in paginated_agents:
            try:
                # Ensure backward compatibility for missing fields
                agent_data = agent.model_dump(exclude={"id", "user_id", "shared_with"})

                # Handle missing api_keys field
                if 'api_keys' not in agent_data or agent_data['api_keys'] is None:
                    agent_data['api_keys'] = {}

                # Handle missing available_models field
                if 'available_models' not in agent_data or agent_data['available_models'] is None:
                    agent_data['available_models'] = {
                        "openai": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
                        "anthropic": ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307", "claude-3-opus-20240229"],
                        "gemini": ["gemini/gemini-2.5-flash-lite"]
                    }

                agent_response = AgentConfigurationResponse(
                    id=str(agent.id),
                    user_id=str(agent.user_id),
                    shared_with=[str(uid) for uid in agent.shared_with],
                    **agent_data
                )
                agent_responses.append(agent_response)

            except Exception as e:
                print(f"Error processing public agent {agent.id}: {str(e)}")
                # Skip this agent if there's an error
                continue
        
        return AgentListResponse(
            agents=agent_responses,
            total=len(agents),
            page=page,
            page_size=page_size
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list public agent configurations: {str(e)}")


# ============================================================================
# AGENT SESSION ENDPOINTS
# ============================================================================

@router.post("/sessions", response_model=AgentSessionResponse)
async def create_agent_session(
    *,
    db: AgnosticDatabase = Depends(get_database),
    session_in: AgentSessionCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new agent session
    """
    try:
        # Verify agent exists and user has access
        agent = await crud_agent_configuration.get(db, ObjectId(session_in.agent_id))
        if not agent:
            raise HTTPException(status_code=404, detail="Agent configuration not found")
        
        if agent.user_id != current_user.id and current_user.id not in agent.shared_with and not agent.is_public:
            raise HTTPException(status_code=403, detail="Access denied to agent")
        
        # Add user_id to session data
        session_data = session_in.model_dump()
        session_data["user_id"] = current_user.id
        session_data["agent_id"] = ObjectId(session_in.agent_id)
        
        # Create session
        session = await crud_agent_session.create(db, obj_in=session_data)
        
        return AgentSessionResponse(
            id=str(session.id),
            agent_id=str(session.agent_id),
            user_id=str(session.user_id),
            **session.model_dump(exclude={"id", "agent_id", "user_id"})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create agent session: {str(e)}")


@router.get("/sessions", response_model=List[AgentSessionResponse])
async def list_agent_sessions(
    *,
    db: AgnosticDatabase = Depends(get_database),
    current_user: User = Depends(get_current_user),
    agent_id: Optional[str] = Query(None, description="Filter by agent ID"),
    active_only: bool = Query(False, description="Show only active sessions")
):
    """
    List user's agent sessions
    """
    try:
        if agent_id:
            sessions = await crud_agent_session.get_by_agent(db, ObjectId(agent_id))
            # Filter to user's sessions only
            sessions = [s for s in sessions if s.user_id == current_user.id]
        elif active_only:
            sessions = await crud_agent_session.get_active_sessions(db, current_user.id)
        else:
            sessions = await crud_agent_session.get_by_user(db, current_user.id)
        
        return [
            AgentSessionResponse(
                id=str(session.id),
                agent_id=str(session.agent_id),
                user_id=str(session.user_id),
                **session.model_dump(exclude={"id", "agent_id", "user_id"})
            )
            for session in sessions
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list agent sessions: {str(e)}")


@router.get("/sessions/{session_id}", response_model=AgentSessionResponse)
async def get_agent_session(
    *,
    db: AgnosticDatabase = Depends(get_database),
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific agent session
    """
    try:
        session = await crud_agent_session.get_by_session_id(db, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Agent session not found")
        
        # Check if user owns this session
        if session.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return AgentSessionResponse(
            id=str(session.id),
            agent_id=str(session.agent_id),
            user_id=str(session.user_id),
            **session.model_dump(exclude={"id", "agent_id", "user_id"})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get agent session: {str(e)}")


@router.put("/sessions/{session_id}", response_model=AgentSessionResponse)
async def update_agent_session(
    *,
    db: AgnosticDatabase = Depends(get_database),
    session_id: str,
    session_update: AgentSessionUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Update an agent session
    """
    try:
        session = await crud_agent_session.get_by_session_id(db, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Agent session not found")
        
        # Check if user owns this session
        if session.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update session
        updated_session = await crud_agent_session.update(
            db, db_obj=session, obj_in=session_update.model_dump(exclude_unset=True)
        )
        
        return AgentSessionResponse(
            id=str(updated_session.id),
            agent_id=str(updated_session.agent_id),
            user_id=str(updated_session.user_id),
            **updated_session.model_dump(exclude={"id", "agent_id", "user_id"})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update agent session: {str(e)}")


@router.delete("/sessions/{session_id}")
async def end_agent_session(
    *,
    db: AgnosticDatabase = Depends(get_database),
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    End an agent session
    """
    try:
        session = await crud_agent_session.get_by_session_id(db, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Agent session not found")
        
        # Check if user owns this session
        if session.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # End the session
        await crud_agent_session.end_session(db, session_id)
        
        return {"message": "Agent session ended successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to end agent session: {str(e)}")


# ============================================================================
# AGENT METRICS ENDPOINTS
# ============================================================================

@router.get("/metrics/{agent_id}", response_model=List[AgentMetricsResponse])
async def get_agent_metrics(
    *,
    db: AgnosticDatabase = Depends(get_database),
    agent_id: str,
    current_user: User = Depends(get_current_user),
    days: int = Query(30, ge=1, le=365, description="Number of days to retrieve")
):
    """
    Get agent performance metrics
    """
    try:
        # Verify agent exists and user has access
        agent = await crud_agent_configuration.get(db, ObjectId(agent_id))
        if not agent:
            raise HTTPException(status_code=404, detail="Agent configuration not found")
        
        if agent.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get metrics for the specified period
        from datetime import datetime, timedelta
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        metrics = await crud_agent_metrics.get_agent_metrics_range(
            db, ObjectId(agent_id), start_date, end_date
        )
        
        return [
            AgentMetricsResponse(
                id=str(metric.id),
                agent_id=str(metric.agent_id),
                user_id=str(metric.user_id),
                **metric.model_dump(exclude={"id", "agent_id", "user_id"})
            )
            for metric in metrics
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get agent metrics: {str(e)}")
