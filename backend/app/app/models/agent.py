"""
Vexel Agent Configuration Models
ODMantic models for storing agent configurations and metadata
"""

from __future__ import annotations
from typing import TYPE_CHECKING, Any, Optional, List, Dict, Literal
from datetime import datetime
from enum import Enum
from pydantic import validator, ConfigDict
from odmantic import ObjectId, Field, Model

if TYPE_CHECKING:
    from .user import User
    from .chat import ChatSession


def datetime_now_sec():
    return datetime.now().replace(microsecond=0)


class AgentStatus(str, Enum):
    """Agent status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"
    ERROR = "error"


class AgentType(str, Enum):
    """Agent types"""
    ASSISTANT = "assistant"
    RESEARCHER = "researcher"
    ANALYST = "analyst"
    SPECIALIST = "specialist"
    COORDINATOR = "coordinator"
    WORKFLOW = "workflow"


class KnowledgeSource(Model):
    """Knowledge source configuration"""
    type: Literal["text", "url", "pdf"] = Field(...)
    name: str = Field(...)
    content: Optional[List[str]] = Field(default=None)
    urls: Optional[List[str]] = Field(default=None)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created: datetime = Field(default_factory=datetime_now_sec)
    updated: datetime = Field(default_factory=datetime_now_sec)


class ToolConfiguration(Model):
    """Tool configuration for agents"""
    tool_name: str = Field(...)
    tool_type: str = Field(...)
    enabled: bool = Field(default=True)
    parameters: Dict[str, Any] = Field(default_factory=dict)
    created: datetime = Field(default_factory=datetime_now_sec)


class AgentConfiguration(Model):
    """Agent configuration model for storing agent settings and metadata"""
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

    # API Keys Configuration - stored encrypted in database
    api_keys: Optional[Dict[str, str]] = Field(default_factory=dict)
    
    # Available Models per Provider
    available_models: Optional[Dict[str, List[str]]] = Field(default_factory=lambda: {
        "openai": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
        "anthropic": ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307", "claude-3-opus-20240229"],
        "gemini": ["gemini/gemini-2.5-flash-lite-preview-06-17", "gemini/gemini-1.5-pro", "gemini/gemini-1.5-flash"]
    })
    
    # Agent Capabilities
    capabilities: List[str] = Field(default_factory=list)
    instructions: List[str] = Field(
        default_factory=lambda: [
            "You are a helpful AI assistant. Follow these critical guidelines:",
            "1. NEVER fabricate or invent information about specific systems, architectures, or technical details",
            "2. If you don't have access to knowledge sources about a topic, clearly state this limitation",
            "3. Distinguish between general knowledge and specific system knowledge",
            "4. When asked about specific projects or systems, only provide information if you have verified knowledge sources",
            "5. If uncertain about any information, express your uncertainty rather than guessing",
            "6. Always prioritize accuracy over completeness - it's better to say 'I don't know' than to provide incorrect information"
        ]
    )
    tools: List[ToolConfiguration] = Field(default_factory=list)
    knowledge_sources: List[KnowledgeSource] = Field(default_factory=list)
    
    # Memory & Storage Configuration
    enable_memory: bool = Field(default=False)
    enable_knowledge_search: bool = Field(default=False)
    memory_config: Dict[str, Any] = Field(default_factory=dict)
    storage_config: Dict[str, Any] = Field(default_factory=dict)
    
    # Team Collaboration
    team_role: Optional[str] = Field(default=None)
    collaboration_mode: Optional[Literal["route", "coordinate", "collaborate"]] = Field(default=None)
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
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Agent name cannot be empty')
        return v.strip()


    
    @validator('ai_model_parameters')
    def validate_ai_model_parameters(cls, v):
        # Ensure temperature is between 0 and 2
        if 'temperature' in v:
            temp = v['temperature']
            if not isinstance(temp, (int, float)) or temp < 0 or temp > 2:
                raise ValueError('Temperature must be between 0 and 2')
        
        # Ensure max_tokens is positive
        if 'max_tokens' in v:
            tokens = v['max_tokens']
            if not isinstance(tokens, int) or tokens <= 0:
                raise ValueError('max_tokens must be a positive integer')
        
        return v


class AgentSession(Model):
    """Agent session model for tracking agent instances and runtime state"""
    agent_id: ObjectId = Field(...)
    user_id: ObjectId = Field(...)
    session_id: str = Field(...)

    # Session Configuration
    session_name: str = Field(default="")
    session_description: str = Field(default="")

    # Runtime State
    is_active: bool = Field(default=True)
    current_context: Dict[str, Any] = Field(default_factory=dict)
    session_memory: Dict[str, Any] = Field(default_factory=dict)

    # Performance Tracking
    messages_count: int = Field(default=0)
    total_tokens_used: int = Field(default=0)
    total_cost: float = Field(default=0.0)

    # Session Metadata
    started_at: datetime = Field(default_factory=datetime_now_sec)
    last_activity: datetime = Field(default_factory=datetime_now_sec)
    ended_at: Optional[datetime] = Field(default=None)


class AgentMetrics(Model):
    """Agent performance metrics and analytics"""
    agent_id: ObjectId = Field(...)
    user_id: ObjectId = Field(...)

    # Usage Metrics
    daily_conversations: int = Field(default=0)
    daily_messages: int = Field(default=0)
    daily_tokens: int = Field(default=0)
    daily_cost: float = Field(default=0.0)

    # Performance Metrics
    average_response_time: float = Field(default=0.0)
    success_rate: float = Field(default=0.0)
    error_rate: float = Field(default=0.0)
    user_satisfaction: float = Field(default=0.0)

    # Feature Usage
    tools_used: Dict[str, int] = Field(default_factory=dict)
    knowledge_searches: int = Field(default=0)
    memory_operations: int = Field(default=0)

    # Date tracking
    date: datetime = Field(default_factory=lambda: datetime.now().replace(hour=0, minute=0, second=0, microsecond=0))
    created: datetime = Field(default_factory=datetime_now_sec)
