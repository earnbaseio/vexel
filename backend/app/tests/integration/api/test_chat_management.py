"""
Integration tests for Chat Management API endpoints
"""

import pytest
import asyncio
from httpx import AsyncClient
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock

from app.main import app
from app.models.chat import MessageRole, MessageType, ConversationStatus
from app.schemas.chat import ChatConversationCreate, MessageCreate


class TestChatManagementAPI:
    """Test suite for Chat Management API endpoints"""
    
    @pytest.fixture
    def mock_user(self):
        """Mock authenticated user"""
        return Mock(
            id="user123",
            email="test@example.com",
            is_active=True,
            is_superuser=False
        )
    
    @pytest.fixture
    def mock_database(self):
        """Mock database instance"""
        return Mock()
    
    @pytest.fixture
    def sample_conversation_data(self):
        """Sample conversation data"""
        return {
            "conversation_id": "conv123",
            "title": "Test Conversation",
            "description": "A test conversation",
            "agent_id": "agent123",
            "agent_session_id": "session123",
            "agent_config_snapshot": {"model": "gpt-4"},
            "conversation_settings": {"temperature": 0.7}
        }
    
    @pytest.fixture
    def sample_message_data(self):
        """Sample message data"""
        return {
            "message_id": "msg123",
            "conversation_id": "conv123",
            "role": MessageRole.USER,
            "content": [
                {
                    "type": MessageType.TEXT,
                    "text": "Hello, this is a test message"
                }
            ],
            "raw_content": "Hello, this is a test message",
            "tool_calls": []
        }
    
    @pytest.fixture
    def sample_feedback_data(self):
        """Sample feedback data"""
        return {
            "conversation_id": "conv123",
            "message_id": "msg123",
            "rating": 5,
            "feedback_text": "Great response!",
            "feedback_type": "helpful",
            "categories": ["accuracy", "helpfulness"],
            "suggestions": "Keep up the good work"
        }

    # ========================================================================
    # CONVERSATION TESTS
    # ========================================================================
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_chat_conversation.create')
    async def test_create_conversation(
        self,
        mock_create,
        mock_get_db,
        mock_get_user,
        sample_conversation_data,
        mock_user,
        mock_database
    ):
        """Test creating a new conversation"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock created conversation
        created_conversation = Mock()
        created_conversation.id = "conv123"
        created_conversation.user_id = mock_user.id
        created_conversation.agent_id = "agent123"
        created_conversation.shared_with = []
        created_conversation.model_dump.return_value = {
            **sample_conversation_data,
            "status": ConversationStatus.ACTIVE,
            "created": "2025-01-01T12:00:00"
        }
        mock_create.return_value = created_conversation
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/chat-management/conversations",
                json=sample_conversation_data,
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["conversation_id"] == sample_conversation_data["conversation_id"]
        assert data["title"] == sample_conversation_data["title"]
        assert data["user_id"] == mock_user.id
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_chat_conversation.get_by_user')
    async def test_list_conversations(
        self,
        mock_get_by_user,
        mock_get_db,
        mock_get_user,
        mock_user,
        mock_database
    ):
        """Test listing user's conversations"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock conversation list
        mock_conversations = [
            Mock(
                id="conv1",
                user_id=mock_user.id,
                agent_id="agent1",
                shared_with=[],
                model_dump=Mock(return_value={
                    "title": "Conversation 1",
                    "status": ConversationStatus.ACTIVE
                })
            ),
            Mock(
                id="conv2",
                user_id=mock_user.id,
                agent_id="agent2",
                shared_with=[],
                model_dump=Mock(return_value={
                    "title": "Conversation 2", 
                    "status": ConversationStatus.ACTIVE
                })
            )
        ]
        mock_get_by_user.return_value = mock_conversations
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/chat-management/conversations",
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["conversations"]) == 2
        assert data["page"] == 1
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_chat_conversation.get_by_conversation_id')
    async def test_get_conversation(
        self,
        mock_get_by_id,
        mock_get_db,
        mock_get_user,
        mock_user,
        mock_database
    ):
        """Test getting a specific conversation"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock conversation
        mock_conversation = Mock()
        mock_conversation.id = "conv123"
        mock_conversation.user_id = mock_user.id
        mock_conversation.agent_id = "agent123"
        mock_conversation.shared_with = []
        mock_conversation.is_shared = False
        mock_conversation.model_dump.return_value = {
            "title": "Test Conversation",
            "status": ConversationStatus.ACTIVE
        }
        mock_get_by_id.return_value = mock_conversation
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/chat-management/conversations/conv123",
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "conv123"
        assert data["user_id"] == mock_user.id

    # ========================================================================
    # MESSAGE TESTS
    # ========================================================================
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_chat_conversation.get_by_conversation_id')
    @patch('app.crud.crud_message.create')
    @patch('app.crud.crud_chat_conversation.update_conversation_stats')
    async def test_create_message(
        self,
        mock_update_stats,
        mock_create_message,
        mock_get_conversation,
        mock_get_db,
        mock_get_user,
        sample_message_data,
        mock_user,
        mock_database
    ):
        """Test creating a new message"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock conversation exists and user has access
        mock_conversation = Mock()
        mock_conversation.id = "conv123"
        mock_conversation.user_id = mock_user.id
        mock_conversation.shared_with = []
        mock_get_conversation.return_value = mock_conversation
        
        # Mock created message
        created_message = Mock()
        created_message.id = "msg123"
        created_message.conversation_id = "conv123"
        created_message.model_dump.return_value = {
            **sample_message_data,
            "timestamp": "2025-01-01T12:00:00"
        }
        mock_create_message.return_value = created_message
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/chat-management/conversations/conv123/messages",
                json=sample_message_data,
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "msg123"
        assert data["conversation_id"] == "conv123"
        
        # Verify stats were updated
        mock_update_stats.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_chat_conversation.get_by_conversation_id')
    @patch('app.crud.crud_message.get_by_conversation')
    async def test_list_messages(
        self,
        mock_get_messages,
        mock_get_conversation,
        mock_get_db,
        mock_get_user,
        mock_user,
        mock_database
    ):
        """Test listing messages in a conversation"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock conversation exists and user has access
        mock_conversation = Mock()
        mock_conversation.id = "conv123"
        mock_conversation.user_id = mock_user.id
        mock_conversation.shared_with = []
        mock_conversation.is_shared = False
        mock_get_conversation.return_value = mock_conversation
        
        # Mock message list
        mock_messages = [
            Mock(
                id="msg1",
                conversation_id="conv123",
                model_dump=Mock(return_value={
                    "role": MessageRole.USER,
                    "content": [{"type": "text", "text": "Hello"}]
                })
            ),
            Mock(
                id="msg2",
                conversation_id="conv123",
                model_dump=Mock(return_value={
                    "role": MessageRole.ASSISTANT,
                    "content": [{"type": "text", "text": "Hi there!"}]
                })
            )
        ]
        mock_get_messages.return_value = mock_messages
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/chat-management/conversations/conv123/messages",
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert len(data["messages"]) == 2
        assert data["messages"][0]["id"] == "msg1"
        assert data["messages"][1]["id"] == "msg2"
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_message.get_by_message_id')
    @patch('app.crud.crud_chat_conversation.get')
    async def test_get_message(
        self,
        mock_get_conversation,
        mock_get_message,
        mock_get_db,
        mock_get_user,
        mock_user,
        mock_database
    ):
        """Test getting a specific message"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock message exists
        mock_message = Mock()
        mock_message.id = "msg123"
        mock_message.conversation_id = "conv123"
        mock_message.model_dump.return_value = {
            "role": MessageRole.USER,
            "content": [{"type": "text", "text": "Hello"}]
        }
        mock_get_message.return_value = mock_message
        
        # Mock conversation exists and user has access
        mock_conversation = Mock()
        mock_conversation.user_id = mock_user.id
        mock_conversation.shared_with = []
        mock_conversation.is_shared = False
        mock_get_conversation.return_value = mock_conversation
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/chat-management/messages/msg123",
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "msg123"
        assert data["conversation_id"] == "conv123"

    # ========================================================================
    # FEEDBACK TESTS
    # ========================================================================
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_chat_conversation.get')
    @patch('app.crud.crud_conversation_feedback.create')
    async def test_create_feedback(
        self,
        mock_create_feedback,
        mock_get_conversation,
        mock_get_db,
        mock_get_user,
        sample_feedback_data,
        mock_user,
        mock_database
    ):
        """Test creating conversation feedback"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock conversation exists and user has access
        mock_conversation = Mock()
        mock_conversation.user_id = mock_user.id
        mock_conversation.shared_with = []
        mock_get_conversation.return_value = mock_conversation
        
        # Mock created feedback
        created_feedback = Mock()
        created_feedback.id = "feedback123"
        created_feedback.conversation_id = "conv123"
        created_feedback.message_id = "msg123"
        created_feedback.user_id = mock_user.id
        created_feedback.model_dump.return_value = {
            **sample_feedback_data,
            "created": "2025-01-01T12:00:00"
        }
        mock_create_feedback.return_value = created_feedback
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/chat-management/feedback",
                json=sample_feedback_data,
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "feedback123"
        assert data["rating"] == sample_feedback_data["rating"]
        assert data["user_id"] == mock_user.id

    # ========================================================================
    # ERROR HANDLING TESTS
    # ========================================================================
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_chat_conversation.get_by_conversation_id')
    async def test_conversation_not_found(
        self,
        mock_get_conversation,
        mock_get_db,
        mock_get_user,
        mock_user,
        mock_database
    ):
        """Test conversation not found error"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        mock_get_conversation.return_value = None
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/chat-management/conversations/nonexistent",
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_chat_conversation.get_by_conversation_id')
    async def test_conversation_access_denied(
        self,
        mock_get_conversation,
        mock_get_db,
        mock_get_user,
        mock_user,
        mock_database
    ):
        """Test access denied for conversation"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock conversation owned by different user
        mock_conversation = Mock()
        mock_conversation.user_id = "other_user"
        mock_conversation.shared_with = []
        mock_conversation.is_shared = False
        mock_get_conversation.return_value = mock_conversation
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/chat-management/conversations/conv123",
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 403
        assert "access denied" in response.json()["detail"].lower()
