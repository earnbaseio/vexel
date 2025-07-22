"""
CRUD operations for Chat models
"""

from typing import Any, Dict, List, Optional
from datetime import datetime
from motor.core import AgnosticDatabase
from odmantic import ObjectId
from pydantic import BaseModel

from app.crud.base import CRUDBase
from app.models.chat import (
    ChatConversation,
    Message,
    ConversationFeedback,
    ConversationTemplate,
    MessageContent,
    ToolCall,
    MessageRole,
    MessageType,
    ConversationStatus
)


# Pydantic schemas for CRUD operations
class ChatConversationCreate(BaseModel):
    conversation_id: str
    title: str = "New Conversation"
    description: str = ""
    user_id: ObjectId
    agent_id: ObjectId
    agent_session_id: Optional[str] = None
    agent_config_snapshot: Dict[str, Any] = {}


class ChatConversationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ConversationStatus] = None
    is_pinned: Optional[bool] = None
    is_shared: Optional[bool] = None
    conversation_summary: Optional[str] = None
    key_topics: Optional[List[str]] = None
    updated: datetime = datetime.now().replace(microsecond=0)


class MessageCreate(BaseModel):
    message_id: str
    conversation_id: ObjectId
    role: MessageRole
    content: List[MessageContent] = []
    raw_content: str = ""
    tool_calls: List[ToolCall] = []


class MessageUpdate(BaseModel):
    content: Optional[List[MessageContent]] = None
    raw_content: Optional[str] = None
    is_edited: Optional[bool] = None
    edit_history: Optional[List[Dict[str, Any]]] = None
    is_deleted: Optional[bool] = None
    edited_at: Optional[datetime] = None


class ConversationFeedbackCreate(BaseModel):
    conversation_id: ObjectId
    message_id: Optional[ObjectId] = None
    user_id: ObjectId
    rating: int
    feedback_text: str = ""
    feedback_type: str
    categories: List[str] = []
    suggestions: str = ""


class ConversationTemplateCreate(BaseModel):
    name: str
    description: str = ""
    category: str = "general"
    initial_prompt: str
    system_instructions: List[str] = []
    suggested_questions: List[str] = []
    user_id: ObjectId
    is_public: bool = False


class CRUDChatConversation(CRUDBase[ChatConversation, ChatConversationCreate, ChatConversationUpdate]):
    """CRUD operations for ChatConversation"""
    
    async def get_by_conversation_id(self, db: AgnosticDatabase, conversation_id: str) -> Optional[ChatConversation]:
        """Get conversation by conversation ID"""
        return await self.engine.find_one(ChatConversation, ChatConversation.conversation_id == conversation_id)
    
    async def get_by_user(self, db: AgnosticDatabase, user_id: ObjectId) -> List[ChatConversation]:
        """Get all conversations for a user"""
        return await self.engine.find(
            ChatConversation,
            ChatConversation.user_id == user_id,
            ChatConversation.status != ConversationStatus.ARCHIVED,
            sort=ChatConversation.updated.desc()
        )
    
    async def get_by_agent(self, db: AgnosticDatabase, agent_id: ObjectId) -> List[ChatConversation]:
        """Get all conversations for an agent"""
        return await self.engine.find(
            ChatConversation,
            ChatConversation.agent_id == agent_id,
            sort=ChatConversation.updated.desc()
        )
    
    async def get_active_conversations(self, db: AgnosticDatabase, user_id: ObjectId) -> List[ChatConversation]:
        """Get active conversations for a user"""
        return await self.engine.find(
            ChatConversation,
            ChatConversation.user_id == user_id,
            ChatConversation.status == ConversationStatus.ACTIVE,
            sort=ChatConversation.last_message_at.desc()
        )
    
    async def get_pinned_conversations(self, db: AgnosticDatabase, user_id: ObjectId) -> List[ChatConversation]:
        """Get pinned conversations for a user"""
        return await self.engine.find(
            ChatConversation,
            ChatConversation.user_id == user_id,
            ChatConversation.is_pinned == True,
            sort=ChatConversation.updated.desc()
        )
    
    async def search_conversations(
        self, 
        db: AgnosticDatabase, 
        user_id: ObjectId, 
        query: str
    ) -> List[ChatConversation]:
        """Search conversations by title or summary"""
        # Note: This is a simple search. For production, consider using text search
        return await self.engine.find(
            ChatConversation,
            ChatConversation.user_id == user_id,
            ChatConversation.status != ConversationStatus.ARCHIVED
        )
    
    async def update_conversation_stats(
        self,
        db: AgnosticDatabase,
        conversation_id: ObjectId,
        message_increment: int = 1,
        tokens_increment: int = 0,
        cost_increment: float = 0.0,
        response_time: float = 0.0
    ) -> Optional[ChatConversation]:
        """Update conversation statistics"""
        conversation = await self.get(db, conversation_id)
        if conversation:
            conversation.message_count += message_increment
            conversation.total_tokens += tokens_increment
            conversation.total_cost += cost_increment
            
            # Update average response time
            if response_time > 0:
                total_messages = conversation.message_count
                if total_messages > 1:
                    conversation.average_response_time = (
                        (conversation.average_response_time * (total_messages - 1) + response_time) / total_messages
                    )
                else:
                    conversation.average_response_time = response_time
            
            conversation.last_message_at = datetime.now().replace(microsecond=0)
            conversation.updated = datetime.now().replace(microsecond=0)
            
            return await self.engine.save(conversation)
        return conversation
    
    async def archive_conversation(self, db: AgnosticDatabase, conversation_id: ObjectId) -> Optional[ChatConversation]:
        """Archive a conversation"""
        conversation = await self.get(db, conversation_id)
        if conversation:
            conversation.status = ConversationStatus.ARCHIVED
            conversation.archived_at = datetime.now().replace(microsecond=0)
            conversation.updated = datetime.now().replace(microsecond=0)
            return await self.engine.save(conversation)
        return conversation


class CRUDMessage(CRUDBase[Message, MessageCreate, MessageUpdate]):
    """CRUD operations for Message"""
    
    async def get_by_message_id(self, db: AgnosticDatabase, message_id: str) -> Optional[Message]:
        """Get message by message ID"""
        return await self.engine.find_one(Message, Message.message_id == message_id)
    
    async def get_by_conversation(
        self, 
        db: AgnosticDatabase, 
        conversation_id: ObjectId,
        limit: int = 50,
        skip: int = 0
    ) -> List[Message]:
        """Get messages for a conversation"""
        return await self.engine.find(
            Message,
            Message.conversation_id == conversation_id,
            Message.is_deleted == False,
            sort=Message.timestamp.asc(),
            limit=limit,
            skip=skip
        )
    
    async def get_recent_messages(
        self,
        db: AgnosticDatabase,
        conversation_id: ObjectId,
        limit: int = 10
    ) -> List[Message]:
        """Get recent messages for a conversation"""
        return await self.engine.find(
            Message,
            Message.conversation_id == conversation_id,
            Message.is_deleted == False,
            sort=Message.timestamp.desc(),
            limit=limit
        )
    
    async def search_messages(
        self,
        db: AgnosticDatabase,
        conversation_id: ObjectId,
        query: str
    ) -> List[Message]:
        """Search messages in a conversation"""
        # Note: This is a simple search. For production, consider using text search
        return await self.engine.find(
            Message,
            Message.conversation_id == conversation_id,
            Message.is_deleted == False
        )
    
    async def get_messages_with_tools(
        self,
        db: AgnosticDatabase,
        conversation_id: ObjectId
    ) -> List[Message]:
        """Get messages that used tools"""
        return await self.engine.find(
            Message,
            Message.conversation_id == conversation_id,
            Message.is_deleted == False
        )
    
    async def soft_delete_message(self, db: AgnosticDatabase, message_id: str) -> Optional[Message]:
        """Soft delete a message"""
        message = await self.get_by_message_id(db, message_id)
        if message:
            message.is_deleted = True
            return await self.engine.save(message)
        return message
    
    async def edit_message(
        self,
        db: AgnosticDatabase,
        message_id: str,
        new_content: str,
        editor_info: Dict[str, Any]
    ) -> Optional[Message]:
        """Edit a message and track edit history"""
        message = await self.get_by_message_id(db, message_id)
        if message:
            # Add to edit history
            edit_entry = {
                "previous_content": message.raw_content,
                "edited_at": datetime.now().replace(microsecond=0),
                "editor_info": editor_info
            }
            message.edit_history.append(edit_entry)
            
            # Update content
            message.raw_content = new_content
            message.is_edited = True
            message.edited_at = datetime.now().replace(microsecond=0)
            
            return await self.engine.save(message)
        return message


class CRUDConversationFeedback(CRUDBase[ConversationFeedback, ConversationFeedbackCreate, BaseModel]):
    """CRUD operations for ConversationFeedback"""
    
    async def get_by_conversation(self, db: AgnosticDatabase, conversation_id: ObjectId) -> List[ConversationFeedback]:
        """Get feedback for a conversation"""
        return await self.engine.find(
            ConversationFeedback,
            ConversationFeedback.conversation_id == conversation_id,
            sort=ConversationFeedback.created.desc()
        )
    
    async def get_by_user(self, db: AgnosticDatabase, user_id: ObjectId) -> List[ConversationFeedback]:
        """Get feedback by user"""
        return await self.engine.find(
            ConversationFeedback,
            ConversationFeedback.user_id == user_id,
            sort=ConversationFeedback.created.desc()
        )
    
    async def get_average_rating(self, db: AgnosticDatabase, conversation_id: ObjectId) -> float:
        """Get average rating for a conversation"""
        feedback_list = await self.get_by_conversation(db, conversation_id)
        if not feedback_list:
            return 0.0
        
        total_rating = sum(feedback.rating for feedback in feedback_list)
        return total_rating / len(feedback_list)


class CRUDConversationTemplate(CRUDBase[ConversationTemplate, ConversationTemplateCreate, BaseModel]):
    """CRUD operations for ConversationTemplate"""
    
    async def get_by_user(self, db: AgnosticDatabase, user_id: ObjectId) -> List[ConversationTemplate]:
        """Get templates by user"""
        return await self.engine.find(
            ConversationTemplate,
            ConversationTemplate.user_id == user_id,
            sort=ConversationTemplate.updated.desc()
        )
    
    async def get_public_templates(self, db: AgnosticDatabase) -> List[ConversationTemplate]:
        """Get public templates"""
        return await self.engine.find(
            ConversationTemplate,
            ConversationTemplate.is_public == True,
            sort=ConversationTemplate.usage_count.desc()
        )
    
    async def get_by_category(self, db: AgnosticDatabase, category: str) -> List[ConversationTemplate]:
        """Get templates by category"""
        return await self.engine.find(
            ConversationTemplate,
            ConversationTemplate.category == category,
            ConversationTemplate.is_public == True,
            sort=ConversationTemplate.average_rating.desc()
        )
    
    async def increment_usage(self, db: AgnosticDatabase, template_id: ObjectId) -> Optional[ConversationTemplate]:
        """Increment template usage count"""
        template = await self.get(db, template_id)
        if template:
            template.usage_count += 1
            return await self.engine.save(template)
        return template


# Create CRUD instances
crud_chat_conversation = CRUDChatConversation(ChatConversation)
crud_message = CRUDMessage(Message)
crud_conversation_feedback = CRUDConversationFeedback(ConversationFeedback)
crud_conversation_template = CRUDConversationTemplate(ConversationTemplate)
