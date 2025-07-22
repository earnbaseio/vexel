"""
CRUD operations for Agent models
"""

from typing import Any, Dict, List, Optional, Literal
from datetime import datetime
from motor.core import AgnosticDatabase
from odmantic import ObjectId, Model, Field
from pydantic import BaseModel, ConfigDict

from app.crud.base import CRUDBase
from app.models.agent_enums import (
    AgentStatus,
    AgentType
)

# Simple model definitions for CRUD operations

def datetime_now_sec():
    return datetime.now().replace(microsecond=0)

class KnowledgeSource(Model):
    """Knowledge source configuration"""
    type: str = "collection"  # Default to collection type
    name: str = ""
    content: Optional[List[str]] = None
    urls: Optional[List[str]] = None
    collection_name: Optional[str] = None
    collection_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created: datetime = Field(default_factory=datetime_now_sec)
    updated: datetime = Field(default_factory=datetime_now_sec)

class AgentConfiguration(Model):
    """Simple agent configuration model"""
    # Basic Information
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)
    agent_type: AgentType = Field(default=AgentType.ASSISTANT)

    # Model Configuration
    ai_model_provider: str = Field(default="gemini")
    ai_model_id: str = Field(default="gemini/gemini-2.5-flash-lite-preview-06-17")
    ai_model_parameters: Dict[str, Any] = Field(default_factory=lambda: {
        "temperature": 0.7,
        "max_tokens": 1000
    })

    # API Keys Configuration
    api_keys: Optional[Dict[str, str]] = Field(default_factory=dict)

    # Available Models per Provider
    available_models: Optional[Dict[str, List[str]]] = Field(default_factory=lambda: {
        "openai": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
        "anthropic": ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307", "claude-3-opus-20240229"],
        "gemini": ["gemini/gemini-2.5-flash-lite-preview-06-17", "gemini/gemini-1.5-pro", "gemini/gemini-1.5-flash"]
    })

    # Agent Capabilities
    capabilities: List[str] = Field(default_factory=list)
    instructions: List[str] = Field(default_factory=list)
    knowledge_sources: List[KnowledgeSource] = Field(default_factory=list)

    # Memory & Storage Configuration
    enable_memory: bool = Field(default=False)
    enable_knowledge_search: bool = Field(default=False)
    memory_config: Dict[str, Any] = Field(default_factory=dict)
    storage_config: Dict[str, Any] = Field(default_factory=dict)

    # Team Collaboration
    team_role: Optional[str] = Field(default=None)
    collaboration_mode: Optional[str] = Field(default=None)
    team_members: List[ObjectId] = Field(default_factory=list)

    # Workflow Configuration
    workflow_config: Dict[str, Any] = Field(default_factory=dict)
    workflow_steps: List[Dict[str, Any]] = Field(default_factory=list)

    # Ownership and Access
    user_id: ObjectId = Field(...)
    shared_with: List[ObjectId] = Field(default_factory=list)
    is_public: bool = Field(default=False)

    # Status and Metadata
    status: AgentStatus = Field(default=AgentStatus.ACTIVE)
    version: str = Field(default="1.0.0")
    tags: List[str] = Field(default_factory=list)

    # Performance Metrics
    total_conversations: int = Field(default=0)
    total_messages: int = Field(default=0)
    average_response_time: float = Field(default=0.0)
    success_rate: float = Field(default=0.0)
    last_used: Optional[datetime] = Field(default=None)

    # Timestamps
    created: datetime = Field(default_factory=datetime_now_sec)
    updated: datetime = Field(default_factory=datetime_now_sec)

class AgentSession(Model):
    """Agent session model"""
    agent_id: ObjectId = Field(...)
    user_id: ObjectId = Field(...)
    session_id: str = Field(...)
    session_name: str = Field(default="")
    session_description: str = Field(default="")
    is_active: bool = Field(default=True)
    current_context: Dict[str, Any] = Field(default_factory=dict)
    session_memory: Dict[str, Any] = Field(default_factory=dict)
    messages_count: int = Field(default=0)
    total_tokens_used: int = Field(default=0)
    total_cost: float = Field(default=0.0)
    started_at: datetime = Field(default_factory=datetime_now_sec)
    last_activity: datetime = Field(default_factory=datetime_now_sec)
    ended_at: Optional[datetime] = Field(default=None)

class AgentMetrics(Model):
    """Agent metrics model"""
    agent_id: ObjectId = Field(...)
    user_id: ObjectId = Field(...)
    daily_conversations: int = Field(default=0)
    daily_messages: int = Field(default=0)
    daily_tokens: int = Field(default=0)
    daily_cost: float = Field(default=0.0)
    average_response_time: float = Field(default=0.0)
    success_rate: float = Field(default=0.0)
    error_rate: float = Field(default=0.0)
    user_satisfaction: float = Field(default=0.0)
    tools_used: Dict[str, int] = Field(default_factory=dict)
    knowledge_searches: int = Field(default=0)
    memory_operations: int = Field(default=0)
    date: datetime = Field(default_factory=lambda: datetime.now().replace(hour=0, minute=0, second=0, microsecond=0))
    created: datetime = Field(default_factory=datetime_now_sec)


# Import schemas from schemas module to avoid duplication
from app.schemas.agent import AgentConfigurationCreate, AgentConfigurationUpdate


class AgentSessionCreate(BaseModel):
    agent_id: ObjectId
    user_id: ObjectId
    session_id: str
    session_name: str = ""
    session_description: str = ""


class AgentSessionUpdate(BaseModel):
    session_name: Optional[str] = None
    session_description: Optional[str] = None
    is_active: Optional[bool] = None
    current_context: Optional[Dict[str, Any]] = None
    messages_count: Optional[int] = None
    total_tokens_used: Optional[int] = None
    total_cost: Optional[float] = None
    last_activity: datetime = datetime.now().replace(microsecond=0)


class CRUDAgentConfiguration(CRUDBase[AgentConfiguration, AgentConfigurationCreate, AgentConfigurationUpdate]):
    """CRUD operations for AgentConfiguration"""
    
    async def get_by_user(self, db: AgnosticDatabase, user_id: ObjectId) -> List[AgentConfiguration]:
        """Get all agent configurations for a user"""
        return await self.engine.find(
            AgentConfiguration,
            AgentConfiguration.user_id == user_id,
            AgentConfiguration.status != AgentStatus.ARCHIVED
        )
    

    
    async def get_by_type(
        self, 
        db: AgnosticDatabase, 
        user_id: ObjectId, 
        agent_type: AgentType
    ) -> List[AgentConfiguration]:
        """Get agent configurations by type"""
        return await self.engine.find(
            AgentConfiguration,
            AgentConfiguration.user_id == user_id,
            AgentConfiguration.agent_type == agent_type,
            AgentConfiguration.status == AgentStatus.ACTIVE
        )
    
    async def search_by_name(
        self, 
        db: AgnosticDatabase, 
        user_id: ObjectId, 
        name_query: str
    ) -> List[AgentConfiguration]:
        """Search agent configurations by name"""
        # Note: This is a simple contains search. For production, consider using text search
        return await self.engine.find(
            AgentConfiguration,
            AgentConfiguration.user_id == user_id,
            AgentConfiguration.status == AgentStatus.ACTIVE
        )
    
    async def get_public_agents(self, db: AgnosticDatabase) -> List[AgentConfiguration]:
        """Get public agent configurations"""
        return await self.engine.find(
            AgentConfiguration,
            AgentConfiguration.is_public == True,
            AgentConfiguration.status == AgentStatus.ACTIVE
        )
    
    async def update_usage_stats(
        self,
        db: AgnosticDatabase,
        agent_id: ObjectId,
        messages_increment: int = 1,
        response_time: float = 0.0
    ) -> AgentConfiguration:
        """Update agent usage statistics"""
        agent = await self.get(db, agent_id)
        if agent:
            agent.total_messages += messages_increment
            agent.total_conversations += 1 if messages_increment > 0 else 0
            
            # Update average response time
            if response_time > 0:
                total_responses = agent.total_messages
                if total_responses > 1:
                    agent.average_response_time = (
                        (agent.average_response_time * (total_responses - 1) + response_time) / total_responses
                    )
                else:
                    agent.average_response_time = response_time
            
            agent.last_used = datetime.now().replace(microsecond=0)
            agent.updated = datetime.now().replace(microsecond=0)
            
            return await self.engine.save(agent)
        return agent
    
    async def archive_agent(self, db: AgnosticDatabase, agent_id: ObjectId) -> AgentConfiguration:
        """Archive an agent configuration"""
        agent = await self.get(db, agent_id)
        if agent:
            agent.status = AgentStatus.ARCHIVED
            agent.updated = datetime.now().replace(microsecond=0)
            return await self.engine.save(agent)
        return agent


class CRUDAgentSession(CRUDBase[AgentSession, AgentSessionCreate, AgentSessionUpdate]):
    """CRUD operations for AgentSession"""
    
    async def get_by_session_id(self, db: AgnosticDatabase, session_id: str) -> Optional[AgentSession]:
        """Get agent session by session ID"""
        return await self.engine.find_one(AgentSession, AgentSession.session_id == session_id)
    
    async def get_by_user(self, db: AgnosticDatabase, user_id: ObjectId) -> List[AgentSession]:
        """Get all sessions for a user"""
        return await self.engine.find(
            AgentSession,
            AgentSession.user_id == user_id
        )
    
    async def get_active_sessions(self, db: AgnosticDatabase, user_id: ObjectId) -> List[AgentSession]:
        """Get active sessions for a user"""
        return await self.engine.find(
            AgentSession,
            AgentSession.user_id == user_id,
            AgentSession.is_active == True
        )
    
    async def get_by_agent(self, db: AgnosticDatabase, agent_id: ObjectId) -> List[AgentSession]:
        """Get all sessions for an agent"""
        return await self.engine.find(
            AgentSession,
            AgentSession.agent_id == agent_id
        )
    
    async def end_session(self, db: AgnosticDatabase, session_id: str) -> Optional[AgentSession]:
        """End an agent session"""
        session = await self.get_by_session_id(db, session_id)
        if session:
            session.is_active = False
            session.ended_at = datetime.now().replace(microsecond=0)
            return await self.engine.save(session)
        return session
    
    async def update_activity(self, db: AgnosticDatabase, session_id: str) -> Optional[AgentSession]:
        """Update last activity timestamp"""
        session = await self.get_by_session_id(db, session_id)
        if session:
            session.last_activity = datetime.now().replace(microsecond=0)
            return await self.engine.save(session)
        return session


class CRUDAgentMetrics(CRUDBase[AgentMetrics, BaseModel, BaseModel]):
    """CRUD operations for AgentMetrics"""
    
    async def get_by_agent_and_date(
        self, 
        db: AgnosticDatabase, 
        agent_id: ObjectId, 
        date: datetime
    ) -> Optional[AgentMetrics]:
        """Get metrics for an agent on a specific date"""
        date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        return await self.engine.find_one(
            AgentMetrics,
            AgentMetrics.agent_id == agent_id,
            AgentMetrics.date == date_start
        )
    
    async def get_agent_metrics_range(
        self,
        db: AgnosticDatabase,
        agent_id: ObjectId,
        start_date: datetime,
        end_date: datetime
    ) -> List[AgentMetrics]:
        """Get metrics for an agent within a date range"""
        return await self.engine.find(
            AgentMetrics,
            AgentMetrics.agent_id == agent_id,
            AgentMetrics.date >= start_date,
            AgentMetrics.date <= end_date
        )
    
    async def update_daily_metrics(
        self,
        db: AgnosticDatabase,
        agent_id: ObjectId,
        user_id: ObjectId,
        conversations_increment: int = 0,
        messages_increment: int = 0,
        tokens_increment: int = 0,
        cost_increment: float = 0.0,
        response_time: float = 0.0,
        tool_used: Optional[str] = None
    ) -> AgentMetrics:
        """Update daily metrics for an agent"""
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        metrics = await self.get_by_agent_and_date(db, agent_id, today)
        if not metrics:
            metrics = AgentMetrics(
                agent_id=agent_id,
                user_id=user_id,
                date=today
            )
        
        # Update metrics
        metrics.daily_conversations += conversations_increment
        metrics.daily_messages += messages_increment
        metrics.daily_tokens += tokens_increment
        metrics.daily_cost += cost_increment
        
        # Update average response time
        if response_time > 0 and messages_increment > 0:
            total_messages = metrics.daily_messages
            if total_messages > 1:
                metrics.average_response_time = (
                    (metrics.average_response_time * (total_messages - 1) + response_time) / total_messages
                )
            else:
                metrics.average_response_time = response_time
        
        # Update tool usage
        if tool_used:
            if tool_used not in metrics.tools_used:
                metrics.tools_used[tool_used] = 0
            metrics.tools_used[tool_used] += 1
        
        return await self.engine.save(metrics)


# Create CRUD instances
crud_agent_configuration = CRUDAgentConfiguration(AgentConfiguration)
crud_agent_session = CRUDAgentSession(AgentSession)
crud_agent_metrics = CRUDAgentMetrics(AgentMetrics)
