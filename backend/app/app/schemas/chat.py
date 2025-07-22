"""
Pydantic schemas for Chat models
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from app.models.chat import MessageRole, MessageType, ConversationStatus
from app.schemas.base_schema import BaseSchema


# Base schemas
class MessageContentSchema(BaseModel):
    """Schema for message content"""
    type: MessageType = Field(MessageType.TEXT, description="Content type")
    text: Optional[str] = Field(None, description="Text content")
    image_url: Optional[str] = Field(None, description="Image URL")
    file_url: Optional[str] = Field(None, description="File URL")
    file_name: Optional[str] = Field(None, description="File name")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class ToolCallSchema(BaseModel):
    """Schema for tool call information"""
    tool_name: str = Field(..., description="Tool name")
    tool_id: str = Field(..., description="Tool ID")
    function_name: str = Field(..., description="Function name")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Function arguments")
    result: Optional[Any] = Field(None, description="Tool execution result")
    error: Optional[str] = Field(None, description="Error message if tool failed")
    execution_time: float = Field(0.0, description="Execution time in seconds")
    timestamp: datetime = Field(default_factory=datetime.now, description="Execution timestamp")


# Chat Conversation schemas
class ChatConversationBase(BaseModel):
    """Base schema for chat conversation"""
    title: str = Field("New Conversation", max_length=200, description="Conversation title")
    description: str = Field("", description="Conversation description")


class ChatConversationCreate(ChatConversationBase):
    """Schema for creating chat conversation"""
    agent_id: str = Field(..., description="Agent configuration ID")
    # conversation_id removed - will be generated server-side
    agent_session_id: Optional[str] = Field(None, description="Agent session ID")
    agent_config_snapshot: Dict[str, Any] = Field(default_factory=dict, description="Agent config snapshot")
    conversation_settings: Dict[str, Any] = Field(default_factory=dict, description="Conversation settings")


class ChatConversationUpdate(BaseModel):
    """Schema for updating chat conversation"""
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    status: Optional[ConversationStatus] = None
    is_pinned: Optional[bool] = None
    is_shared: Optional[bool] = None
    shared_with: Optional[List[str]] = None
    conversation_summary: Optional[str] = None
    key_topics: Optional[List[str]] = None


class ChatConversationResponse(ChatConversationBase):
    """Schema for chat conversation response"""
    id: str = Field(..., description="Conversation ID")
    conversation_id: str = Field(..., description="Unique conversation identifier")
    user_id: str = Field(..., description="User ID")
    agent_id: str = Field(..., description="Agent configuration ID")
    agent_session_id: Optional[str] = Field(None, description="Agent session ID")
    
    # Configuration
    agent_config_snapshot: Dict[str, Any] = Field(default_factory=dict, description="Agent config snapshot")
    conversation_settings: Dict[str, Any] = Field(default_factory=dict, description="Conversation settings")
    
    # State
    status: ConversationStatus = Field(..., description="Conversation status")
    is_pinned: bool = Field(False, description="Whether conversation is pinned")
    is_shared: bool = Field(False, description="Whether conversation is shared")
    shared_with: List[str] = Field(default_factory=list, description="Users with access")
    
    # Statistics
    message_count: int = Field(0, description="Number of messages")
    total_tokens: int = Field(0, description="Total tokens used")
    total_cost: float = Field(0.0, description="Total cost in USD")
    average_response_time: float = Field(0.0, description="Average response time")
    
    # Context
    conversation_context: Dict[str, Any] = Field(default_factory=dict, description="Conversation context")
    conversation_summary: str = Field("", description="Conversation summary")
    key_topics: List[str] = Field(default_factory=list, description="Key topics")
    
    # Timestamps
    created: datetime = Field(..., description="Creation timestamp")
    updated: datetime = Field(..., description="Last update timestamp")
    last_message_at: Optional[datetime] = Field(None, description="Last message timestamp")
    archived_at: Optional[datetime] = Field(None, description="Archive timestamp")
    
    model_config = ConfigDict(from_attributes=True)


# Message schemas
class MessageBase(BaseModel):
    """Base schema for message"""
    role: MessageRole = Field(..., description="Message role")
    content: List[MessageContentSchema] = Field(default_factory=list, description="Message content")
    raw_content: str = Field("", description="Raw text content")


class MessageCreate(MessageBase):
    """Schema for creating message"""
    message_id: str = Field(..., description="Unique message identifier")
    conversation_id: str = Field(..., description="Conversation ID")
    tool_calls: List[ToolCallSchema] = Field(default_factory=list, description="Tool calls")


class MessageUpdate(BaseModel):
    """Schema for updating message"""
    content: Optional[List[MessageContentSchema]] = None
    raw_content: Optional[str] = None
    is_edited: Optional[bool] = None
    edit_history: Optional[List[Dict[str, Any]]] = None
    is_deleted: Optional[bool] = None


class MessageResponse(MessageBase):
    """Schema for message response"""
    id: str = Field(..., description="Message ID")
    message_id: str = Field(..., description="Unique message identifier")
    conversation_id: str = Field(..., description="Conversation ID")
    
    # Tool usage
    tool_calls: List[ToolCallSchema] = Field(default_factory=list, description="Tool calls")
    
    # Metadata
    tokens_used: int = Field(0, description="Tokens used")
    cost: float = Field(0.0, description="Cost in USD")
    response_time: float = Field(0.0, description="Response time in seconds")
    # Model information - using ai_ prefix to avoid Pydantic protected namespace conflicts
    ai_model_used: Optional[str] = Field(None, description="Model used")
    
    # Context and memory
    context_used: Dict[str, Any] = Field(default_factory=dict, description="Context used")
    memory_operations: List[Dict[str, Any]] = Field(default_factory=list, description="Memory operations")
    knowledge_searches: List[Dict[str, Any]] = Field(default_factory=list, description="Knowledge searches")
    
    # Status
    is_edited: bool = Field(False, description="Whether message was edited")
    edit_history: List[Dict[str, Any]] = Field(default_factory=list, description="Edit history")
    is_deleted: bool = Field(False, description="Whether message is deleted")
    
    # Timestamps
    timestamp: datetime = Field(..., description="Message timestamp")
    edited_at: Optional[datetime] = Field(None, description="Edit timestamp")
    
    model_config = ConfigDict(from_attributes=True)


# Conversation Feedback schemas
class ConversationFeedbackBase(BaseModel):
    """Base schema for conversation feedback"""
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    feedback_text: str = Field("", description="Feedback text")
    feedback_type: str = Field(..., description="Feedback type: helpful, unhelpful, inappropriate, error")
    categories: List[str] = Field(default_factory=list, description="Feedback categories")
    suggestions: str = Field("", description="Suggestions for improvement")


class ConversationFeedbackCreate(ConversationFeedbackBase):
    """Schema for creating conversation feedback"""
    conversation_id: str = Field(..., description="Conversation ID")
    message_id: Optional[str] = Field(None, description="Specific message ID")


class ConversationFeedbackResponse(ConversationFeedbackBase):
    """Schema for conversation feedback response"""
    id: str = Field(..., description="Feedback ID")
    conversation_id: str = Field(..., description="Conversation ID")
    message_id: Optional[str] = Field(None, description="Specific message ID")
    user_id: str = Field(..., description="User ID")
    created: datetime = Field(..., description="Creation timestamp")
    
    model_config = ConfigDict(from_attributes=True)


# Conversation Template schemas
class ConversationTemplateBase(BaseModel):
    """Base schema for conversation template"""
    name: str = Field(..., min_length=1, max_length=100, description="Template name")
    description: str = Field("", description="Template description")
    category: str = Field("general", description="Template category")
    initial_prompt: str = Field(..., description="Initial prompt")
    system_instructions: List[str] = Field(default_factory=list, description="System instructions")
    suggested_questions: List[str] = Field(default_factory=list, description="Suggested questions")


class ConversationTemplateCreate(ConversationTemplateBase):
    """Schema for creating conversation template"""
    recommended_agent_level: Optional[str] = Field(None, description="Recommended agent level")
    recommended_tools: List[str] = Field(default_factory=list, description="Recommended tools")
    required_knowledge_sources: List[str] = Field(default_factory=list, description="Required knowledge sources")
    is_public: bool = Field(False, description="Whether template is public")


class ConversationTemplateUpdate(BaseModel):
    """Schema for updating conversation template"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    category: Optional[str] = None
    initial_prompt: Optional[str] = None
    system_instructions: Optional[List[str]] = None
    suggested_questions: Optional[List[str]] = None
    recommended_agent_level: Optional[str] = None
    recommended_tools: Optional[List[str]] = None
    required_knowledge_sources: Optional[List[str]] = None
    is_public: Optional[bool] = None


class ConversationTemplateResponse(ConversationTemplateBase):
    """Schema for conversation template response"""
    id: str = Field(..., description="Template ID")
    user_id: str = Field(..., description="Creator user ID")
    
    # Configuration
    recommended_agent_level: Optional[str] = Field(None, description="Recommended agent level")
    recommended_tools: List[str] = Field(default_factory=list, description="Recommended tools")
    required_knowledge_sources: List[str] = Field(default_factory=list, description="Required knowledge sources")
    
    # Access control
    is_public: bool = Field(False, description="Whether template is public")
    shared_with: List[str] = Field(default_factory=list, description="Users with access")
    
    # Usage statistics
    usage_count: int = Field(0, description="Usage count")
    average_rating: float = Field(0.0, description="Average rating")
    
    # Timestamps
    created: datetime = Field(..., description="Creation timestamp")
    updated: datetime = Field(..., description="Last update timestamp")
    
    model_config = ConfigDict(from_attributes=True)


# Request/Response schemas for API endpoints
class ChatRequest(BaseModel):
    """Schema for chat request"""
    message: str = Field(..., description="User message")
    conversation_id: Optional[str] = Field(None, description="Conversation ID for continuity")
    agent_id: Optional[str] = Field(None, description="Specific agent ID")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    stream: bool = Field(False, description="Whether to stream response")


class ChatResponse(BaseModel):
    """Schema for chat response"""
    message: str = Field(..., description="User message")
    response: str = Field(..., description="Agent response")
    conversation_id: str = Field(..., description="Conversation ID")
    message_id: str = Field(..., description="Message ID")
    
    # Response metadata
    tokens_used: int = Field(0, description="Tokens used")
    response_time: float = Field(0.0, description="Response time in seconds")
    cost: float = Field(0.0, description="Cost in USD")
    
    # Context information
    tools_used: List[str] = Field(default_factory=list, description="Tools used")
    knowledge_searched: bool = Field(False, description="Whether knowledge was searched")
    memory_accessed: bool = Field(False, description="Whether memory was accessed")
    
    status: str = Field("success", description="Response status")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")


class ConversationListResponse(BaseModel):
    """Schema for conversation list response"""
    conversations: List[ChatConversationResponse] = Field(..., description="List of conversations")
    total: int = Field(..., description="Total number of conversations")
    page: int = Field(1, description="Current page")
    page_size: int = Field(20, description="Page size")


class MessageListResponse(BaseModel):
    """Schema for message list response"""
    messages: List[MessageResponse] = Field(..., description="List of messages")
    total: int = Field(..., description="Total number of messages")
    page: int = Field(1, description="Current page")
    page_size: int = Field(20, description="Page size")


class ConversationSearchRequest(BaseModel):
    """Schema for conversation search request"""
    query: Optional[str] = Field(None, description="Search query")
    status: Optional[ConversationStatus] = Field(None, description="Filter by status")
    agent_id: Optional[str] = Field(None, description="Filter by agent")
    is_pinned: Optional[bool] = Field(None, description="Filter by pinned status")
    date_from: Optional[datetime] = Field(None, description="Filter from date")
    date_to: Optional[datetime] = Field(None, description="Filter to date")
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Page size")
