"""
Chat Management API Endpoints
Endpoints for managing chat conversations, messages, and feedback
"""

from typing import Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from motor.core import AgnosticDatabase
from odmantic import ObjectId
from uuid import uuid4

from app.api.deps import get_current_user, get_database
from app.models.user import User
from app.models.chat import ChatConversation, Message, ConversationFeedback, ConversationTemplate, ConversationStatus
from app.schemas.chat import (
    ChatConversationCreate,
    ChatConversationUpdate,
    ChatConversationResponse,
    MessageCreate,
    MessageUpdate,
    MessageResponse,
    ConversationFeedbackCreate,
    ConversationFeedbackResponse,
    ConversationTemplateCreate,
    ConversationTemplateUpdate,
    ConversationTemplateResponse,
    ChatRequest,
    ChatResponse,
    ConversationListResponse,
    MessageListResponse,
    ConversationSearchRequest
)
from app.crud import (
    crud_chat_conversation,
    crud_message,
    crud_conversation_feedback,
    crud_conversation_template
)

router = APIRouter()


# ============================================================================
# CHAT CONVERSATION ENDPOINTS
# ============================================================================

@router.post("/conversations", response_model=ChatConversationResponse, status_code=201)
async def create_conversation(
    *,
    db: AgnosticDatabase = Depends(get_database),
    conversation_in: ChatConversationCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new chat conversation
    """
    try:
        # Validate and convert agent_id to ObjectId
        try:
            agent_object_id = ObjectId(conversation_in.agent_id)
        except Exception as oid_error:
            raise HTTPException(status_code=400, detail=f"Invalid agent_id format: {str(oid_error)}")

        # Generate server-side conversation ID
        conversation_id = str(uuid4())

        # Create conversation data using CRUD schema
        from app.crud.crud_chat import ChatConversationCreate

        conversation_data = ChatConversationCreate(
            conversation_id=conversation_id,  # Server-generated UUID
            title=conversation_in.title,
            description=conversation_in.description or "",
            user_id=current_user.id,
            agent_id=agent_object_id,
            agent_session_id=getattr(conversation_in, 'agent_session_id', None),
            agent_config_snapshot=getattr(conversation_in, 'agent_config_snapshot', {}),
        )

        # Create conversation
        conversation = await crud_chat_conversation.create(db, obj_in=conversation_data)
        
        return ChatConversationResponse(
            id=str(conversation.id),
            user_id=str(conversation.user_id),
            agent_id=str(conversation.agent_id),
            shared_with=[str(uid) for uid in conversation.shared_with],
            **conversation.model_dump(exclude={"id", "user_id", "agent_id", "shared_with"})
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create conversation: {str(e)}")


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    *,
    db: AgnosticDatabase = Depends(get_database),
    current_user: User = Depends(get_current_user),
    status: Optional[ConversationStatus] = Query(None, description="Filter by status"),
    agent_id: Optional[str] = Query(None, description="Filter by agent"),
    pinned_only: bool = Query(False, description="Show only pinned conversations"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size")
):
    """
    List user's conversations with optional filtering
    """
    try:
        # Get conversations based on filters
        if pinned_only:
            conversations = await crud_chat_conversation.get_pinned_conversations(db, current_user.id)
        elif status == ConversationStatus.ACTIVE:
            conversations = await crud_chat_conversation.get_active_conversations(db, current_user.id)
        elif agent_id:
            all_conversations = await crud_chat_conversation.get_by_agent(db, ObjectId(agent_id))
            conversations = [c for c in all_conversations if c.user_id == current_user.id]
        else:
            conversations = await crud_chat_conversation.get_by_user(db, current_user.id)
        
        # Apply status filter if specified and not already filtered
        if status and not pinned_only and status != ConversationStatus.ACTIVE:
            conversations = [c for c in conversations if c.status == status]
        
        # Apply pagination
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_conversations = conversations[start_idx:end_idx]
        
        # Convert to response format
        conversation_responses = [
            ChatConversationResponse(
                id=str(conv.id),
                user_id=str(conv.user_id),
                agent_id=str(conv.agent_id),
                shared_with=[str(uid) for uid in conv.shared_with],
                **conv.model_dump(exclude={"id", "user_id", "agent_id", "shared_with"})
            )
            for conv in paginated_conversations
        ]
        
        return ConversationListResponse(
            conversations=conversation_responses,
            total=len(conversations),
            page=page,
            page_size=page_size
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list conversations: {str(e)}")


@router.get("/conversations/{conversation_id}", response_model=ChatConversationResponse)
async def get_conversation(
    *,
    db: AgnosticDatabase = Depends(get_database),
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific conversation
    """
    try:
        conversation = await crud_chat_conversation.get_by_conversation_id(db, conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Check if user has access
        if (conversation.user_id != current_user.id and 
            current_user.id not in conversation.shared_with and 
            not conversation.is_shared):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return ChatConversationResponse(
            id=str(conversation.id),
            user_id=str(conversation.user_id),
            agent_id=str(conversation.agent_id),
            shared_with=[str(uid) for uid in conversation.shared_with],
            **conversation.model_dump(exclude={"id", "user_id", "agent_id", "shared_with"})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get conversation: {str(e)}")


@router.put("/conversations/{conversation_id}", response_model=ChatConversationResponse)
async def update_conversation(
    *,
    db: AgnosticDatabase = Depends(get_database),
    conversation_id: str,
    conversation_update: ChatConversationUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Update a conversation
    """
    try:
        conversation = await crud_chat_conversation.get_by_conversation_id(db, conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Check if user owns this conversation
        if conversation.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update conversation
        updated_conversation = await crud_chat_conversation.update(
            db, db_obj=conversation, obj_in=conversation_update.model_dump(exclude_unset=True)
        )
        
        return ChatConversationResponse(
            id=str(updated_conversation.id),
            user_id=str(updated_conversation.user_id),
            agent_id=str(updated_conversation.agent_id),
            shared_with=[str(uid) for uid in updated_conversation.shared_with],
            **updated_conversation.model_dump(exclude={"id", "user_id", "agent_id", "shared_with"})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update conversation: {str(e)}")


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    *,
    db: AgnosticDatabase = Depends(get_database),
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete (archive) a conversation
    """
    try:
        conversation = await crud_chat_conversation.get_by_conversation_id(db, conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Check if user owns this conversation
        if conversation.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Archive the conversation
        await crud_chat_conversation.archive_conversation(db, conversation.id)
        
        return {"message": "Conversation archived successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete conversation: {str(e)}")


# ============================================================================
# MESSAGE ENDPOINTS
# ============================================================================

@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def create_message(
    *,
    db: AgnosticDatabase = Depends(get_database),
    conversation_id: str,
    message_in: MessageCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new message in a conversation
    """
    try:
        # Verify conversation exists and user has access
        conversation = await crud_chat_conversation.get_by_conversation_id(db, conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if (conversation.user_id != current_user.id and 
            current_user.id not in conversation.shared_with):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Create message directly using CRUD schema
        from app.crud.crud_chat import MessageCreate as CRUDMessageCreate
        from app.models.chat import MessageContent

        # Convert MessageContentSchema to MessageContent ODMantic models
        content_models = []
        for content_item in message_in.content:
            content_model = MessageContent(
                type=content_item.type,
                text=content_item.text,
                image_url=content_item.image_url,
                file_url=content_item.file_url,
                file_name=content_item.file_name,
                file_size=content_item.file_size,
                metadata=content_item.metadata
            )
            content_models.append(content_model)

        # Create CRUD schema with proper ObjectId and converted content
        crud_message_data = CRUDMessageCreate(
            message_id=message_in.message_id,
            conversation_id=conversation.id,  # Use ObjectId from database
            role=message_in.role,
            content=content_models,
            raw_content=message_in.raw_content,
            tool_calls=message_in.tool_calls
        )

        print(f"DEBUG: CRUD message data: {crud_message_data}")

        # Create message
        message = await crud_message.create(db, obj_in=crud_message_data)
        
        # Update conversation stats
        await crud_chat_conversation.update_conversation_stats(
            db, conversation.id, message_increment=1
        )
        
        return MessageResponse(
            id=str(message.id),
            conversation_id=str(message.conversation_id),
            **message.model_dump(exclude={"id", "conversation_id"})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create message: {str(e)}")


@router.get("/conversations/{conversation_id}/messages", response_model=MessageListResponse)
async def list_messages(
    *,
    db: AgnosticDatabase = Depends(get_database),
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Page size"),
    recent_only: bool = Query(False, description="Get only recent messages")
):
    """
    List messages in a conversation
    """
    try:
        # Verify conversation exists and user has access
        conversation = await crud_chat_conversation.get_by_conversation_id(db, conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if (conversation.user_id != current_user.id and 
            current_user.id not in conversation.shared_with and 
            not conversation.is_shared):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get messages
        if recent_only:
            messages = await crud_message.get_recent_messages(db, conversation.id, limit=page_size)
            total = len(messages)
        else:
            skip = (page - 1) * page_size
            messages = await crud_message.get_by_conversation(
                db, conversation.id, limit=page_size, skip=skip
            )
            # For total count, we'd need a separate count query in production
            total = len(messages) + skip  # Approximation
        
        # Convert to response format
        message_responses = [
            MessageResponse(
                id=str(msg.id),
                conversation_id=str(msg.conversation_id),
                **msg.model_dump(exclude={"id", "conversation_id"})
            )
            for msg in messages
        ]
        
        return MessageListResponse(
            messages=message_responses,
            total=total,
            page=page,
            page_size=page_size
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list messages: {str(e)}")


@router.get("/messages/{message_id}", response_model=MessageResponse)
async def get_message(
    *,
    db: AgnosticDatabase = Depends(get_database),
    message_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific message
    """
    try:
        message = await crud_message.get_by_message_id(db, message_id)
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Verify user has access to the conversation
        conversation = await crud_chat_conversation.get(db, message.conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if (conversation.user_id != current_user.id and 
            current_user.id not in conversation.shared_with and 
            not conversation.is_shared):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return MessageResponse(
            id=str(message.id),
            conversation_id=str(message.conversation_id),
            **message.model_dump(exclude={"id", "conversation_id"})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get message: {str(e)}")


@router.put("/messages/{message_id}", response_model=MessageResponse)
async def update_message(
    *,
    db: AgnosticDatabase = Depends(get_database),
    message_id: str,
    message_update: MessageUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Update a message
    """
    try:
        message = await crud_message.get_by_message_id(db, message_id)
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Verify user has access to the conversation
        conversation = await crud_chat_conversation.get(db, message.conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if conversation.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update message
        updated_message = await crud_message.update(
            db, db_obj=message, obj_in=message_update.model_dump(exclude_unset=True)
        )
        
        return MessageResponse(
            id=str(updated_message.id),
            conversation_id=str(updated_message.conversation_id),
            **updated_message.model_dump(exclude={"id", "conversation_id"})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update message: {str(e)}")


@router.delete("/messages/{message_id}")
async def delete_message(
    *,
    db: AgnosticDatabase = Depends(get_database),
    message_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete (soft delete) a message
    """
    try:
        message = await crud_message.get_by_message_id(db, message_id)
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Verify user has access to the conversation
        conversation = await crud_chat_conversation.get(db, message.conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if conversation.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Soft delete the message
        await crud_message.soft_delete_message(db, message_id)
        
        return {"message": "Message deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete message: {str(e)}")


# ============================================================================
# CONVERSATION FEEDBACK ENDPOINTS
# ============================================================================

@router.post("/feedback", response_model=ConversationFeedbackResponse)
async def create_feedback(
    *,
    db: AgnosticDatabase = Depends(get_database),
    feedback_in: ConversationFeedbackCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create feedback for a conversation or message
    """
    try:
        # Verify conversation exists and user has access
        conversation = await crud_chat_conversation.get(db, ObjectId(feedback_in.conversation_id))
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if (conversation.user_id != current_user.id and 
            current_user.id not in conversation.shared_with):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Add user_id to feedback data
        feedback_data = feedback_in.model_dump()
        feedback_data["user_id"] = current_user.id
        feedback_data["conversation_id"] = ObjectId(feedback_in.conversation_id)
        if feedback_in.message_id:
            feedback_data["message_id"] = ObjectId(feedback_in.message_id)
        
        # Create feedback
        feedback = await crud_conversation_feedback.create(db, obj_in=feedback_data)
        
        return ConversationFeedbackResponse(
            id=str(feedback.id),
            conversation_id=str(feedback.conversation_id),
            message_id=str(feedback.message_id) if feedback.message_id else None,
            user_id=str(feedback.user_id),
            **feedback.model_dump(exclude={"id", "conversation_id", "message_id", "user_id"})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create feedback: {str(e)}")


@router.get("/conversations/{conversation_id}/feedback", response_model=List[ConversationFeedbackResponse])
async def list_conversation_feedback(
    *,
    db: AgnosticDatabase = Depends(get_database),
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    List feedback for a conversation
    """
    try:
        # Verify conversation exists and user has access
        conversation = await crud_chat_conversation.get(db, ObjectId(conversation_id))
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if (conversation.user_id != current_user.id and 
            current_user.id not in conversation.shared_with and 
            not conversation.is_shared):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get feedback
        feedback_list = await crud_conversation_feedback.get_by_conversation(db, ObjectId(conversation_id))
        
        return [
            ConversationFeedbackResponse(
                id=str(feedback.id),
                conversation_id=str(feedback.conversation_id),
                message_id=str(feedback.message_id) if feedback.message_id else None,
                user_id=str(feedback.user_id),
                **feedback.model_dump(exclude={"id", "conversation_id", "message_id", "user_id"})
            )
            for feedback in feedback_list
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list feedback: {str(e)}")
