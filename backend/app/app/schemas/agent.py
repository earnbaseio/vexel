"""
Pydantic schemas for Agent models
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from odmantic import ObjectId

from app.models.agent_enums import AgentStatus, AgentType
from app.schemas.base_schema import BaseSchema


# Base schemas
class KnowledgeSourceSchema(BaseModel):
    """Schema for knowledge source configuration"""
    type: str = Field(..., description="Type of knowledge source: text, url, pdf")
    name: str = Field(..., description="Name of the knowledge source")
    content: Optional[List[str]] = Field(None, description="Text content for text type")
    urls: Optional[List[str]] = Field(None, description="URLs for url and pdf types")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class ToolConfigurationSchema(BaseModel):
    """Schema for tool configuration"""
    tool_name: str = Field(..., description="Name of the tool")
    tool_type: str = Field(..., description="Type of tool: reasoning, search, calculation, etc.")
    enabled: bool = Field(True, description="Whether the tool is enabled")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Tool parameters")


# Agent Configuration schemas
class AgentConfigurationBase(BaseModel):
    """Base schema for agent configuration"""
    name: str = Field(..., min_length=1, max_length=100, description="Agent name")
    description: str = Field("", max_length=500, description="Agent description")
    agent_type: AgentType = Field(AgentType.ASSISTANT, description="Type of agent")

    # Model configuration - using ai_ prefix to avoid Pydantic protected namespace conflicts
    ai_model_provider: str = Field("gemini", description="Model provider: gemini (default)")
    ai_model_id: str = Field("gemini/gemini-2.5-flash-lite-preview-06-17", description="Model identifier")
    ai_model_parameters: Dict[str, Any] = Field(
        default_factory=lambda: {"temperature": 0.7, "max_tokens": 1000},
        description="Model parameters"
    )

    # API Keys Configuration
    api_keys: Dict[str, str] = Field(default_factory=dict, description="API keys per provider (encrypted)")
    
    # Agent capabilities
    capabilities: List[str] = Field(default_factory=list, description="Agent capabilities")
    instructions: List[str] = Field(
        default_factory=lambda: [
            "You are a helpful AI assistant. Follow these critical guidelines:",
            "1. NEVER fabricate or invent information about specific systems, architectures, or technical details",
            "2. If you don't have access to knowledge sources about a topic, clearly state this limitation",
            "3. Distinguish between general knowledge and specific system knowledge",
            "4. When asked about specific projects or systems, only provide information if you have verified knowledge sources",
            "5. If uncertain about any information, express your uncertainty rather than guessing",
            "6. Always prioritize accuracy over completeness - it's better to say 'I don't know' than to provide incorrect information"
        ],
        description="Agent instructions with anti-hallucination guidelines"
    )
    tools: List[ToolConfigurationSchema] = Field(default_factory=list, description="Available tools")
    knowledge_sources: List[KnowledgeSourceSchema] = Field(default_factory=list, description="Knowledge sources")
    
    # Memory & storage
    enable_memory: bool = Field(False, description="Enable persistent memory")
    enable_knowledge_search: bool = Field(False, description="Enable knowledge search")
    memory_config: Dict[str, Any] = Field(default_factory=dict, description="Memory configuration")
    storage_config: Dict[str, Any] = Field(default_factory=dict, description="Storage configuration")
    
    # Team collaboration (Level 4)
    team_role: Optional[str] = Field(None, description="Role in team: leader, member, specialist")
    collaboration_mode: Optional[str] = Field(None, description="Collaboration mode: route, coordinate, collaborate")
    team_members: List[str] = Field(default_factory=list, description="Team member IDs")

    # Access control
    shared_with: List[str] = Field(default_factory=list, description="Shared with user IDs")
    
    # Workflow configuration (Level 5)
    workflow_config: Dict[str, Any] = Field(default_factory=dict, description="Workflow configuration")
    workflow_steps: List[Dict[str, Any]] = Field(default_factory=list, description="Workflow steps")
    
    # Metadata
    is_public: bool = Field(False, description="Whether agent is publicly accessible")
    tags: List[str] = Field(default_factory=list, description="Agent tags")


class AgentConfigurationCreate(AgentConfigurationBase):
    """Schema for creating agent configuration"""
    user_id: Optional[ObjectId] = Field(None, description="User ID (will be set by API)")


class AgentConfigurationUpdate(BaseModel):
    """Schema for updating agent configuration"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    agent_type: Optional[AgentType] = None

    # Model configuration - using ai_ prefix to avoid Pydantic protected namespace conflicts
    ai_model_provider: Optional[str] = Field(None, description="Model provider")
    ai_model_id: Optional[str] = Field(None, description="Model identifier")
    ai_model_parameters: Optional[Dict[str, Any]] = Field(None, description="Model parameters")
    instructions: Optional[List[str]] = None
    tools: Optional[List[ToolConfigurationSchema]] = None
    knowledge_sources: Optional[List[KnowledgeSourceSchema]] = None
    enable_memory: Optional[bool] = None
    enable_knowledge_search: Optional[bool] = None
    memory_config: Optional[Dict[str, Any]] = None
    storage_config: Optional[Dict[str, Any]] = None
    team_role: Optional[str] = None
    collaboration_mode: Optional[str] = None
    workflow_config: Optional[Dict[str, Any]] = None
    workflow_steps: Optional[List[Dict[str, Any]]] = None
    status: Optional[AgentStatus] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None


class AgentConfigurationResponse(AgentConfigurationBase):
    """Schema for agent configuration response"""
    id: str = Field(..., description="Agent configuration ID")
    user_id: str = Field(..., description="Owner user ID")
    shared_with: List[str] = Field(default_factory=list, description="Users with access")
    status: AgentStatus = Field(..., description="Agent status")
    version: str = Field(..., description="Agent version")
    
    # Performance metrics
    total_conversations: int = Field(0, description="Total conversations")
    total_messages: int = Field(0, description="Total messages")
    average_response_time: float = Field(0.0, description="Average response time in seconds")
    success_rate: float = Field(0.0, description="Success rate percentage")
    last_used: Optional[datetime] = Field(None, description="Last used timestamp")
    
    # Timestamps
    created: datetime = Field(..., description="Creation timestamp")
    updated: datetime = Field(..., description="Last update timestamp")
    
    model_config = ConfigDict(from_attributes=True)


# Agent Session schemas
class AgentSessionBase(BaseModel):
    """Base schema for agent session"""
    session_name: str = Field("", description="Session name")
    session_description: str = Field("", description="Session description")


class AgentSessionCreate(AgentSessionBase):
    """Schema for creating agent session"""
    agent_id: str = Field(..., description="Agent configuration ID")
    session_id: str = Field(..., description="Unique session identifier")


class AgentSessionUpdate(BaseModel):
    """Schema for updating agent session"""
    session_name: Optional[str] = None
    session_description: Optional[str] = None
    is_active: Optional[bool] = None
    current_context: Optional[Dict[str, Any]] = None
    session_memory: Optional[Dict[str, Any]] = None


class AgentSessionResponse(AgentSessionBase):
    """Schema for agent session response"""
    id: str = Field(..., description="Session ID")
    agent_id: str = Field(..., description="Agent configuration ID")
    user_id: str = Field(..., description="User ID")
    session_id: str = Field(..., description="Unique session identifier")
    
    # Runtime state
    is_active: bool = Field(..., description="Whether session is active")
    current_context: Dict[str, Any] = Field(default_factory=dict, description="Current context")
    session_memory: Dict[str, Any] = Field(default_factory=dict, description="Session memory")
    
    # Performance tracking
    messages_count: int = Field(0, description="Number of messages in session")
    total_tokens_used: int = Field(0, description="Total tokens used")
    total_cost: float = Field(0.0, description="Total cost in USD")
    
    # Timestamps
    started_at: datetime = Field(..., description="Session start time")
    last_activity: datetime = Field(..., description="Last activity time")
    ended_at: Optional[datetime] = Field(None, description="Session end time")
    
    model_config = ConfigDict(from_attributes=True)


# Agent Metrics schemas
class AgentMetricsResponse(BaseModel):
    """Schema for agent metrics response"""
    id: str = Field(..., description="Metrics ID")
    agent_id: str = Field(..., description="Agent configuration ID")
    user_id: str = Field(..., description="User ID")
    date: datetime = Field(..., description="Metrics date")
    
    # Usage metrics
    daily_conversations: int = Field(0, description="Daily conversations count")
    daily_messages: int = Field(0, description="Daily messages count")
    daily_tokens: int = Field(0, description="Daily tokens used")
    daily_cost: float = Field(0.0, description="Daily cost in USD")
    
    # Performance metrics
    average_response_time: float = Field(0.0, description="Average response time")
    success_rate: float = Field(0.0, description="Success rate percentage")
    error_rate: float = Field(0.0, description="Error rate percentage")
    user_satisfaction: float = Field(0.0, description="User satisfaction score (1-5)")
    
    # Feature usage
    tools_used: Dict[str, int] = Field(default_factory=dict, description="Tools usage count")
    knowledge_searches: int = Field(0, description="Knowledge searches count")
    memory_operations: int = Field(0, description="Memory operations count")
    
    created: datetime = Field(..., description="Creation timestamp")
    
    model_config = ConfigDict(from_attributes=True)


# Request/Response schemas for API endpoints
class AgentChatRequest(BaseModel):
    """Schema for agent chat request"""
    message: str = Field(..., description="User message")
    agent_id: Optional[str] = Field(None, description="Specific agent ID to use")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    stream: bool = Field(False, description="Whether to stream response")


class AgentChatResponse(BaseModel):
    """Schema for agent chat response"""
    message: str = Field(..., description="User message")
    response: str = Field(..., description="Agent response")
    agent_id: str = Field(..., description="Agent configuration ID")
    session_id: str = Field(..., description="Session ID")

    # Response metadata
    tokens_used: int = Field(0, description="Tokens used for this response")
    response_time: float = Field(0.0, description="Response time in seconds")
    cost: float = Field(0.0, description="Cost for this response in USD")
    # Model information - using ai_ prefix to avoid Pydantic protected namespace conflicts
    ai_model_used: str = Field(..., description="Model used for response")
    
    # Context information
    tools_used: List[str] = Field(default_factory=list, description="Tools used in response")
    knowledge_searched: bool = Field(False, description="Whether knowledge was searched")
    memory_accessed: bool = Field(False, description="Whether memory was accessed")
    
    status: str = Field("success", description="Response status")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")


class AgentListResponse(BaseModel):
    """Schema for agent list response"""
    agents: List[AgentConfigurationResponse] = Field(..., description="List of agents")
    total: int = Field(..., description="Total number of agents")
    page: int = Field(1, description="Current page")
    page_size: int = Field(20, description="Page size")


class AgentSearchRequest(BaseModel):
    """Schema for agent search request"""
    query: Optional[str] = Field(None, description="Search query")
    agent_type: Optional[AgentType] = Field(None, description="Filter by agent type")
    tags: Optional[List[str]] = Field(None, description="Filter by tags")
    is_public: Optional[bool] = Field(None, description="Filter by public/private")
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Page size")
