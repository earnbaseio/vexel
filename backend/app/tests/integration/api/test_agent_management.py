"""
Integration tests for Agent Management API endpoints
"""

import pytest
import asyncio
from httpx import AsyncClient
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock

from app.main import app
from app.models.agent import AgentType, AgentStatus
from app.schemas.agent import AgentConfigurationCreate, AgentSessionCreate


class TestAgentManagementAPI:
    """Test suite for Agent Management API endpoints"""
    
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
    def sample_agent_data(self):
        """Sample agent configuration data"""
        return {
            "name": "TestAgent",
            "description": "A test agent for testing",
            "agent_type": AgentType.ASSISTANT,
            "level": AgentLevel.LEVEL_1,
            "model_provider": "openai",
            "model_id": "gpt-4",
            "model_parameters": {"temperature": 0.7, "max_tokens": 1000},
            "instructions": ["Be helpful and accurate"],
            "tools": [],
            "knowledge_sources": [],
            "enable_memory": False,
            "enable_knowledge_search": False,
            "is_public": False,
            "tags": ["test", "demo"]
        }
    
    @pytest.fixture
    def sample_session_data(self):
        """Sample agent session data"""
        return {
            "agent_id": "agent123",
            "session_id": "session123",
            "session_name": "Test Session",
            "session_description": "A test session"
        }

    # ========================================================================
    # AGENT CONFIGURATION TESTS
    # ========================================================================
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_agent_configuration.create')
    async def test_create_agent_configuration(
        self, 
        mock_create, 
        mock_get_db, 
        mock_get_user,
        sample_agent_data,
        mock_user,
        mock_database
    ):
        """Test creating a new agent configuration"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock created agent
        created_agent = Mock()
        created_agent.id = "agent123"
        created_agent.user_id = mock_user.id
        created_agent.model_dump.return_value = {
            **sample_agent_data,
            "status": AgentStatus.ACTIVE,
            "version": "1.0.0",
            "created": "2025-01-01T12:00:00",
            "updated": "2025-01-01T12:00:00"
        }
        mock_create.return_value = created_agent
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/agent-management/configurations",
                json=sample_agent_data,
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == sample_agent_data["name"]
        assert data["id"] == "agent123"
        assert data["user_id"] == mock_user.id
        
        # Verify CRUD was called
        mock_create.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_agent_configuration.get_by_user')
    async def test_list_agent_configurations(
        self,
        mock_get_by_user,
        mock_get_db,
        mock_get_user,
        mock_user,
        mock_database
    ):
        """Test listing user's agent configurations"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock agent list
        mock_agents = [
            Mock(
                id="agent1",
                user_id=mock_user.id,
                name="Agent 1",
                shared_with=[],
                model_dump=Mock(return_value={"name": "Agent 1", "level": AgentLevel.LEVEL_1})
            ),
            Mock(
                id="agent2", 
                user_id=mock_user.id,
                name="Agent 2",
                shared_with=[],
                model_dump=Mock(return_value={"name": "Agent 2", "level": AgentLevel.LEVEL_2})
            )
        ]
        mock_get_by_user.return_value = mock_agents
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/agent-management/configurations",
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["agents"]) == 2
        assert data["page"] == 1
        assert data["page_size"] == 20
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_agent_configuration.get')
    async def test_get_agent_configuration(
        self,
        mock_get,
        mock_get_db,
        mock_get_user,
        mock_user,
        mock_database
    ):
        """Test getting a specific agent configuration"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock agent
        mock_agent = Mock()
        mock_agent.id = "agent123"
        mock_agent.user_id = mock_user.id
        mock_agent.shared_with = []
        mock_agent.is_public = False
        mock_agent.model_dump.return_value = {
            "name": "Test Agent",
            "level": AgentLevel.LEVEL_1,
            "status": AgentStatus.ACTIVE
        }
        mock_get.return_value = mock_agent
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/agent-management/configurations/agent123",
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "agent123"
        assert data["user_id"] == mock_user.id
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_agent_configuration.get')
    async def test_get_agent_configuration_not_found(
        self,
        mock_get,
        mock_get_db,
        mock_get_user,
        mock_user,
        mock_database
    ):
        """Test getting non-existent agent configuration"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        mock_get.return_value = None
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/agent-management/configurations/nonexistent",
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_agent_configuration.get')
    async def test_get_agent_configuration_access_denied(
        self,
        mock_get,
        mock_get_db,
        mock_get_user,
        mock_user,
        mock_database
    ):
        """Test access denied for agent configuration"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock agent owned by different user
        mock_agent = Mock()
        mock_agent.user_id = "other_user"
        mock_agent.shared_with = []
        mock_agent.is_public = False
        mock_get.return_value = mock_agent
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/agent-management/configurations/agent123",
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 403
        assert "access denied" in response.json()["detail"].lower()

    # ========================================================================
    # AGENT SESSION TESTS
    # ========================================================================
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_agent_configuration.get')
    @patch('app.crud.crud_agent_session.create')
    async def test_create_agent_session(
        self,
        mock_create_session,
        mock_get_agent,
        mock_get_db,
        mock_get_user,
        sample_session_data,
        mock_user,
        mock_database
    ):
        """Test creating a new agent session"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock agent exists and user has access
        mock_agent = Mock()
        mock_agent.user_id = mock_user.id
        mock_agent.shared_with = []
        mock_agent.is_public = False
        mock_get_agent.return_value = mock_agent
        
        # Mock created session
        created_session = Mock()
        created_session.id = "session123"
        created_session.agent_id = "agent123"
        created_session.user_id = mock_user.id
        created_session.model_dump.return_value = {
            **sample_session_data,
            "is_active": True,
            "started_at": "2025-01-01T12:00:00"
        }
        mock_create_session.return_value = created_session
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/agent-management/sessions",
                json=sample_session_data,
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "session123"
        assert data["agent_id"] == "agent123"
        assert data["user_id"] == mock_user.id
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_agent_session.get_by_user')
    async def test_list_agent_sessions(
        self,
        mock_get_by_user,
        mock_get_db,
        mock_get_user,
        mock_user,
        mock_database
    ):
        """Test listing user's agent sessions"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock session list
        mock_sessions = [
            Mock(
                id="session1",
                agent_id="agent1",
                user_id=mock_user.id,
                model_dump=Mock(return_value={"session_name": "Session 1"})
            ),
            Mock(
                id="session2",
                agent_id="agent2", 
                user_id=mock_user.id,
                model_dump=Mock(return_value={"session_name": "Session 2"})
            )
        ]
        mock_get_by_user.return_value = mock_sessions
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/agent-management/sessions",
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["id"] == "session1"
        assert data[1]["id"] == "session2"

    # ========================================================================
    # ERROR HANDLING TESTS
    # ========================================================================
    
    @pytest.mark.asyncio
    async def test_unauthorized_access(self):
        """Test unauthorized access to endpoints"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/v1/agent-management/configurations")
        
        # Should return 401 or 422 (depending on auth setup)
        assert response.status_code in [401, 422]
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    async def test_invalid_request_data(
        self,
        mock_get_db,
        mock_get_user,
        mock_user,
        mock_database
    ):
        """Test invalid request data validation"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Invalid data (missing required fields)
        invalid_data = {"name": ""}  # Empty name should fail validation
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/agent-management/configurations",
                json=invalid_data,
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Should return 422 for validation error
        assert response.status_code == 422
