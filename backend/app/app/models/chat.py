"""
Vexel Chat Models
ODMantic models for storing chat sessions, messages, and conversation history
"""

from __future__ import annotations
from typing import TYPE_CHECKING, Any, Optional, List, Dict, Literal
from datetime import datetime
from enum import Enum
from pydantic import validator, ConfigDict
from odmantic import ObjectId, Field

from app.db.base_class import Base

if TYPE_CHECKING:
    from .user import User
    from .agent import AgentConfiguration


def datetime_now_sec():
    return datetime.now().replace(microsecond=0)


class MessageRole(str, Enum):
    """Message roles in conversation"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"


class MessageType(str, Enum):
    """Message types"""
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    TOOL_CALL = "tool_call"
    TOOL_RESULT = "tool_result"
    ERROR = "error"


class ConversationStatus(str, Enum):
    """Conversation status"""
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"
    ERROR = "error"


class MessageContent(Base):
    """Message content with support for different types"""
    type: MessageType = Field(default=MessageType.TEXT)
    text: Optional[str] = Field(default=None)
    image_url: Optional[str] = Field(default=None)
    file_url: Optional[str] = Field(default=None)
    file_name: Optional[str] = Field(default=None)
    file_size: Optional[int] = Field(default=None)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ToolCall(Base):
    """Tool call information"""
    tool_name: str = Field(...)
    tool_id: str = Field(...)
    function_name: str = Field(...)
    arguments: Dict[str, Any] = Field(default_factory=dict)
    result: Optional[Any] = Field(default=None)
    error: Optional[str] = Field(default=None)
    execution_time: float = Field(default=0.0)  # in seconds
    timestamp: datetime = Field(default_factory=datetime_now_sec)


class Message(Base):
    """
    Individual message in a conversation
    """
    # Message Identity
    message_id: str = Field(...)  # Unique message identifier
    conversation_id: ObjectId = Field(...)  # Reference to ChatConversation

    # Message Content
    role: MessageRole = Field(...)
    content: List[MessageContent] = Field(default_factory=list)
    raw_content: str = Field(default="")  # Original text content

    # Tool Usage
    tool_calls: List[ToolCall] = Field(default_factory=list)

    # Message Metadata
    tokens_used: int = Field(default=0)
    cost: float = Field(default=0.0)  # in USD
    response_time: float = Field(default=0.0)  # in seconds
    # Model information - using ai_ prefix to avoid Pydantic namespace conflicts
    ai_model_used: Optional[str] = Field(default=None)
    
    # Context and Memory
    context_used: Dict[str, Any] = Field(default_factory=dict)
    memory_operations: List[Dict[str, Any]] = Field(default_factory=list)
    knowledge_searches: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Message Status
    is_edited: bool = Field(default=False)
    edit_history: List[Dict[str, Any]] = Field(default_factory=list)
    is_deleted: bool = Field(default=False)
    
    # Timestamps
    timestamp: datetime = Field(default_factory=datetime_now_sec)
    edited_at: Optional[datetime] = Field(default=None)
    
    @validator('raw_content')
    def validate_content(cls, v):
        if len(v) > 50000:  # 50KB limit
            raise ValueError('Message content too long')
        return v
    



class ChatConversation(Base):
    """
    Chat conversation/session between user and agent
    """
    # Conversation Identity
    conversation_id: str = Field(...)  # Unique conversation identifier
    title: str = Field(default="New Conversation")
    description: str = Field(default="")
    
    # Participants
    user_id: ObjectId = Field(...)  # User participating in conversation
    agent_id: ObjectId = Field(...)  # Agent configuration used
    agent_session_id: Optional[str] = Field(default=None)  # Runtime session ID
    
    # Conversation Configuration
    agent_config_snapshot: Dict[str, Any] = Field(default_factory=dict)  # Agent config at conversation start
    conversation_settings: Dict[str, Any] = Field(default_factory=dict)
    
    # Conversation State
    status: ConversationStatus = Field(default=ConversationStatus.ACTIVE)
    is_pinned: bool = Field(default=False)
    is_shared: bool = Field(default=False)
    shared_with: List[ObjectId] = Field(default_factory=list)
    
    # Statistics
    message_count: int = Field(default=0)
    total_tokens: int = Field(default=0)
    total_cost: float = Field(default=0.0)
    average_response_time: float = Field(default=0.0)
    
    # Context and Memory
    conversation_context: Dict[str, Any] = Field(default_factory=dict)
    conversation_summary: str = Field(default="")
    key_topics: List[str] = Field(default_factory=list)
    
    # Timestamps
    created: datetime = Field(default_factory=datetime_now_sec)
    updated: datetime = Field(default_factory=datetime_now_sec)
    last_message_at: Optional[datetime] = Field(default=None)
    archived_at: Optional[datetime] = Field(default=None)
    
    @validator('title')
    def validate_title(cls, v):
        if len(v) > 200:
            raise ValueError('Title too long')
        return v.strip() if v else "New Conversation"
    



class ConversationFeedback(Base):
    """
    User feedback on conversations and agent responses
    """
    conversation_id: ObjectId = Field(...)
    message_id: Optional[ObjectId] = Field(default=None)  # Specific message feedback
    user_id: ObjectId = Field(...)
    
    # Feedback Content
    rating: int = Field(..., ge=1, le=5)  # 1-5 star rating
    feedback_text: str = Field(default="")
    feedback_type: Literal["helpful", "unhelpful", "inappropriate", "error"] = Field(...)
    
    # Feedback Categories
    categories: List[str] = Field(default_factory=list)  # ["accuracy", "helpfulness", "speed", etc.]
    suggestions: str = Field(default="")
    
    # Metadata
    created: datetime = Field(default_factory=datetime_now_sec)
    



class ConversationTemplate(Base):
    """
    Reusable conversation templates and prompts
    """
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(default="")
    category: str = Field(default="general")
    
    # Template Content
    initial_prompt: str = Field(...)
    system_instructions: List[str] = Field(default_factory=list)
    suggested_questions: List[str] = Field(default_factory=list)
    
    # Template Configuration
    recommended_agent_level: Optional[str] = Field(default=None)
    recommended_tools: List[str] = Field(default_factory=list)
    required_knowledge_sources: List[str] = Field(default_factory=list)
    
    # Access Control
    user_id: ObjectId = Field(...)  # Template creator
    is_public: bool = Field(default=False)
    shared_with: List[ObjectId] = Field(default_factory=list)
    
    # Usage Statistics
    usage_count: int = Field(default=0)
    average_rating: float = Field(default=0.0)
    
    # Timestamps
    created: datetime = Field(default_factory=datetime_now_sec)
    updated: datetime = Field(default_factory=datetime_now_sec)
    

