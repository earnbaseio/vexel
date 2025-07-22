"""
Integration tests for Workflow Management API endpoints
"""

import pytest
import asyncio
from httpx import AsyncClient
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock

from app.main import app
from app.models.workflow import WorkflowStatus, StepType
from app.schemas.workflow import WorkflowTemplateCreate, WorkflowExecuteRequest


class TestWorkflowManagementAPI:
    """Test suite for Workflow Management API endpoints"""
    
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
    def sample_workflow_template_data(self):
        """Sample workflow template data"""
        return {
            "name": "Test Workflow",
            "description": "A test workflow template",
            "category": "test",
            "version": "1.0.0",
            "tags": ["test", "demo"],
            "estimated_duration": 300,
            "complexity_level": "medium",
            "steps": [
                {
                    "step_id": "step1",
                    "name": "First Step",
                    "step_type": StepType.AGENT,
                    "config": {"agent_name": "TestAgent"},
                    "conditions": [],
                    "next_steps": ["step2"],
                    "error_handling": {},
                    "description": "First step description",
                    "timeout_seconds": 60,
                    "retry_count": 0
                },
                {
                    "step_id": "step2",
                    "name": "Second Step", 
                    "step_type": StepType.TEAM,
                    "config": {"team_name": "TestTeam"},
                    "conditions": [],
                    "next_steps": [],
                    "error_handling": {},
                    "description": "Second step description",
                    "timeout_seconds": 120,
                    "retry_count": 1
                }
            ],
            "global_config": {"timeout": 600},
            "input_schema": {"type": "object", "properties": {"task": {"type": "string"}}},
            "output_schema": {"type": "object", "properties": {"result": {"type": "string"}}},
            "is_public": False
        }
    
    @pytest.fixture
    def sample_workflow_execute_data(self):
        """Sample workflow execution data"""
        return {
            "workflow_template_id": "template123",
            "workflow_name": "Test Execution",
            "input_parameters": {"task": "Test task"},
            "session_id": "session123",
            "async_execution": False
        }

    # ========================================================================
    # WORKFLOW TEMPLATE TESTS
    # ========================================================================
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_workflow_template.create')
    async def test_create_workflow_template(
        self,
        mock_create,
        mock_get_db,
        mock_get_user,
        sample_workflow_template_data,
        mock_user,
        mock_database
    ):
        """Test creating a new workflow template"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock created template
        created_template = Mock()
        created_template.id = "template123"
        created_template.user_id = mock_user.id
        created_template.shared_with = []
        created_template.model_dump.return_value = {
            **sample_workflow_template_data,
            "usage_count": 0,
            "success_rate": 0.0,
            "created": "2025-01-01T12:00:00"
        }
        mock_create.return_value = created_template
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/workflow-management/templates",
                json=sample_workflow_template_data,
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == sample_workflow_template_data["name"]
        assert data["id"] == "template123"
        assert data["user_id"] == mock_user.id
        assert len(data["steps"]) == 2
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_workflow_template.get_by_user')
    async def test_list_workflow_templates(
        self,
        mock_get_by_user,
        mock_get_db,
        mock_get_user,
        mock_user,
        mock_database
    ):
        """Test listing user's workflow templates"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock template list
        mock_templates = [
            Mock(
                id="template1",
                user_id=mock_user.id,
                shared_with=[],
                model_dump=Mock(return_value={
                    "name": "Template 1",
                    "category": "test",
                    "steps": []
                })
            ),
            Mock(
                id="template2",
                user_id=mock_user.id,
                shared_with=[],
                model_dump=Mock(return_value={
                    "name": "Template 2",
                    "category": "production",
                    "steps": []
                })
            )
        ]
        mock_get_by_user.return_value = mock_templates
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/workflow-management/templates",
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["templates"]) == 2
        assert data["page"] == 1
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_workflow_template.get')
    async def test_get_workflow_template(
        self,
        mock_get,
        mock_get_db,
        mock_get_user,
        mock_user,
        mock_database
    ):
        """Test getting a specific workflow template"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock template
        mock_template = Mock()
        mock_template.id = "template123"
        mock_template.user_id = mock_user.id
        mock_template.shared_with = []
        mock_template.is_public = False
        mock_template.model_dump.return_value = {
            "name": "Test Template",
            "category": "test",
            "steps": []
        }
        mock_get.return_value = mock_template
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/workflow-management/templates/template123",
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "template123"
        assert data["user_id"] == mock_user.id

    # ========================================================================
    # WORKFLOW EXECUTION TESTS
    # ========================================================================
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_workflow_template.get')
    @patch('app.crud.crud_workflow_template.increment_usage')
    @patch('app.crud.crud_workflow_execution.create')
    @patch('app.crud.crud_workflow_execution.start_execution')
    @patch('app.crud.crud_workflow_execution.complete_execution')
    async def test_execute_workflow_sync(
        self,
        mock_complete,
        mock_start,
        mock_create_execution,
        mock_increment_usage,
        mock_get_template,
        mock_get_db,
        mock_get_user,
        sample_workflow_execute_data,
        mock_user,
        mock_database
    ):
        """Test synchronous workflow execution"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock template exists and user has access
        mock_template = Mock()
        mock_template.id = "template123"
        mock_template.user_id = mock_user.id
        mock_template.shared_with = []
        mock_template.is_public = False
        mock_template.steps = [{"step_id": "step1"}, {"step_id": "step2"}]
        mock_template.global_config = {}
        mock_get_template.return_value = mock_template
        
        # Mock created execution
        mock_execution = Mock()
        mock_execution.created = "2025-01-01T12:00:00"
        mock_create_execution.return_value = mock_execution
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/workflow-management/execute",
                json=sample_workflow_execute_data,
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["workflow_name"] == sample_workflow_execute_data["workflow_name"]
        assert data["status"] == WorkflowStatus.COMPLETED
        assert data["steps_completed"] == 2
        assert data["total_steps"] == 2
        
        # Verify template usage was incremented
        mock_increment_usage.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_workflow_execution.get_by_user')
    async def test_list_workflow_executions(
        self,
        mock_get_by_user,
        mock_get_db,
        mock_get_user,
        mock_user,
        mock_database
    ):
        """Test listing user's workflow executions"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock execution list
        mock_executions = [
            Mock(
                id="exec1",
                workflow_template_id="template1",
                user_id=mock_user.id,
                model_dump=Mock(return_value={
                    "workflow_name": "Execution 1",
                    "status": WorkflowStatus.COMPLETED
                })
            ),
            Mock(
                id="exec2",
                workflow_template_id="template2",
                user_id=mock_user.id,
                model_dump=Mock(return_value={
                    "workflow_name": "Execution 2",
                    "status": WorkflowStatus.RUNNING
                })
            )
        ]
        mock_get_by_user.return_value = mock_executions
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/workflow-management/executions",
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["executions"]) == 2
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_workflow_execution.get_by_execution_id')
    async def test_get_workflow_execution(
        self,
        mock_get_execution,
        mock_get_db,
        mock_get_user,
        mock_user,
        mock_database
    ):
        """Test getting a specific workflow execution"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock execution
        mock_execution = Mock()
        mock_execution.id = "exec123"
        mock_execution.workflow_template_id = "template123"
        mock_execution.user_id = mock_user.id
        mock_execution.model_dump.return_value = {
            "workflow_name": "Test Execution",
            "status": WorkflowStatus.COMPLETED
        }
        mock_get_execution.return_value = mock_execution
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/workflow-management/executions/exec123",
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "exec123"
        assert data["user_id"] == mock_user.id
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_workflow_execution.get_by_execution_id')
    @patch('app.crud.crud_workflow_execution.fail_execution')
    async def test_cancel_workflow_execution(
        self,
        mock_fail_execution,
        mock_get_execution,
        mock_get_db,
        mock_get_user,
        mock_user,
        mock_database
    ):
        """Test cancelling a workflow execution"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock running execution
        mock_execution = Mock()
        mock_execution.user_id = mock_user.id
        mock_execution.status = WorkflowStatus.RUNNING
        mock_get_execution.return_value = mock_execution
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/workflow-management/executions/exec123/cancel",
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert "cancelled" in data["message"].lower()
        
        # Verify execution was failed
        mock_fail_execution.assert_called_once()

    # ========================================================================
    # STEP EXECUTION TESTS
    # ========================================================================
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_workflow_execution.get_by_execution_id')
    @patch('app.crud.crud_workflow_step_execution.get_by_execution')
    async def test_list_workflow_step_executions(
        self,
        mock_get_steps,
        mock_get_execution,
        mock_get_db,
        mock_get_user,
        mock_user,
        mock_database
    ):
        """Test listing step executions for a workflow"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock execution exists and user has access
        mock_execution = Mock()
        mock_execution.id = "exec123"
        mock_execution.user_id = mock_user.id
        mock_get_execution.return_value = mock_execution
        
        # Mock step executions
        mock_steps = [
            Mock(
                id="step_exec1",
                execution_id="exec123",
                agent_id=None,
                model_dump=Mock(return_value={
                    "step_name": "Step 1",
                    "status": WorkflowStatus.COMPLETED
                })
            ),
            Mock(
                id="step_exec2",
                execution_id="exec123",
                agent_id="agent123",
                model_dump=Mock(return_value={
                    "step_name": "Step 2",
                    "status": WorkflowStatus.RUNNING
                })
            )
        ]
        mock_get_steps.return_value = mock_steps
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/workflow-management/executions/exec123/steps",
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["id"] == "step_exec1"
        assert data[1]["agent_id"] == "agent123"

    # ========================================================================
    # ERROR HANDLING TESTS
    # ========================================================================
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_workflow_template.get')
    async def test_template_not_found(
        self,
        mock_get_template,
        mock_get_db,
        mock_get_user,
        mock_user,
        mock_database
    ):
        """Test template not found error"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        mock_get_template.return_value = None
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/workflow-management/templates/nonexistent",
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    @pytest.mark.asyncio
    @patch('app.api.deps.get_current_user')
    @patch('app.api.deps.get_database')
    @patch('app.crud.crud_workflow_execution.get_by_execution_id')
    async def test_cancel_completed_execution_error(
        self,
        mock_get_execution,
        mock_get_db,
        mock_get_user,
        mock_user,
        mock_database
    ):
        """Test error when trying to cancel completed execution"""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_db.return_value = mock_database
        
        # Mock completed execution
        mock_execution = Mock()
        mock_execution.user_id = mock_user.id
        mock_execution.status = WorkflowStatus.COMPLETED
        mock_get_execution.return_value = mock_execution
        
        # Make request
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/workflow-management/executions/exec123/cancel",
                headers={"Authorization": "Bearer test_token"}
            )
        
        # Assertions
        assert response.status_code == 400
        assert "cannot cancel" in response.json()["detail"].lower()
