"""
Comprehensive API Testing Infrastructure for Vexel AI Agent Platform
Following VEXEL_API_TESTING_REPORT.md standards and patterns
"""

import time
import json
import asyncio
from typing import Dict, Any, Optional, List, Union, Tuple
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient, Response
from odmantic import ObjectId


class APITestInfrastructure:
    """Comprehensive API testing infrastructure"""
    
    # Test credentials from VEXEL_API_TESTING_REPORT.md
    DEFAULT_TEST_USER = {
        "email": "test@vexel.com",
        "password": "testpassword123"
    }
    
    DEFAULT_ADMIN_USER = {
        "email": "admin@vexel.com", 
        "password": "changethis"
    }
    
    # Performance requirements
    MAX_RESPONSE_TIME_MS = 100.0
    
    # ========================================================================
    # AUTHENTICATION HELPERS
    # ========================================================================
    
    @staticmethod
    async def authenticate_user(
        client: AsyncClient, 
        email: str = None, 
        password: str = None
    ) -> Dict[str, str]:
        """Authenticate user and return auth headers"""
        if email is None:
            email = APITestInfrastructure.DEFAULT_TEST_USER["email"]
        if password is None:
            password = APITestInfrastructure.DEFAULT_TEST_USER["password"]
            
        response = await client.post(
            "/api/v1/login/oauth",
            data={
                "grant_type": "password",
                "username": email,
                "password": password
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            token_data = response.json()
            return {"Authorization": f"Bearer {token_data['access_token']}"}
        else:
            # Return mock headers for testing when auth service is not available
            return {"Authorization": "Bearer mock_token_for_testing"}
    
    @staticmethod
    async def authenticate_admin(client: AsyncClient) -> Dict[str, str]:
        """Authenticate admin user and return auth headers"""
        return await APITestInfrastructure.authenticate_user(
            client,
            APITestInfrastructure.DEFAULT_ADMIN_USER["email"],
            APITestInfrastructure.DEFAULT_ADMIN_USER["password"]
        )
    
    # ========================================================================
    # RESPONSE VALIDATION HELPERS
    # ========================================================================
    
    @staticmethod
    def assert_response_success(response: Response, expected_status: int = 200):
        """Assert response is successful"""
        assert response.status_code == expected_status, \
            f"Expected {expected_status}, got {response.status_code}: {response.text}"
    
    @staticmethod
    def assert_response_error(response: Response, expected_status: int = 400):
        """Assert response is an error"""
        assert response.status_code == expected_status, \
            f"Expected {expected_status}, got {response.status_code}: {response.text}"
    
    @staticmethod
    def assert_response_unauthorized(response: Response):
        """Assert response is unauthorized (401)"""
        APITestInfrastructure.assert_response_error(response, 401)
    
    @staticmethod
    def assert_response_forbidden(response: Response):
        """Assert response is forbidden (403)"""
        APITestInfrastructure.assert_response_error(response, 403)
    
    @staticmethod
    def assert_response_not_found(response: Response):
        """Assert response is not found (404)"""
        APITestInfrastructure.assert_response_error(response, 404)
    
    @staticmethod
    def assert_response_structure(response_data: Dict[str, Any], required_keys: List[str]):
        """Assert response contains required keys"""
        for key in required_keys:
            assert key in response_data, f"Required key '{key}' not found in response"
    
    @staticmethod
    def assert_ai_fields_present(response_data: Dict[str, Any]):
        """Assert AI fields are present and valid"""
        ai_fields = ["ai_model_provider", "ai_model_id", "ai_model_parameters"]
        for field in ai_fields:
            if field in response_data:
                assert response_data[field] is not None, f"AI field '{field}' should not be None"
                if field == "ai_model_parameters":
                    assert isinstance(response_data[field], dict), \
                        f"AI field '{field}' should be a dictionary"
    
    # ========================================================================
    # PERFORMANCE TESTING HELPERS
    # ========================================================================
    
    @staticmethod
    async def measure_response_time(
        client: AsyncClient, 
        method: str, 
        url: str, 
        **kwargs
    ) -> Tuple[Response, float]:
        """Measure API response time in milliseconds"""
        start_time = time.time()
        response = await client.request(method, url, **kwargs)
        end_time = time.time()
        response_time_ms = (end_time - start_time) * 1000
        return response, response_time_ms
    
    @staticmethod
    def assert_performance_requirement(
        response_time_ms: float, 
        max_time_ms: float = None
    ):
        """Assert response time meets performance requirements"""
        if max_time_ms is None:
            max_time_ms = APITestInfrastructure.MAX_RESPONSE_TIME_MS
        
        assert response_time_ms < max_time_ms, \
            f"Response time {response_time_ms:.2f}ms exceeds requirement of {max_time_ms}ms"
    
    # ========================================================================
    # DATA GENERATION HELPERS
    # ========================================================================
    
    @staticmethod
    def create_sample_agent_data(with_ai_fields: bool = True) -> Dict[str, Any]:
        """Create sample agent configuration data"""
        base_data = {
            "name": "Test Agent",
            "description": "A comprehensive test agent for API testing",
            "instructions": "You are a helpful test agent for comprehensive API testing",
            "tools": [],
            "knowledge_sources": [],
            "is_public": False,
            "tags": ["test", "api-testing", "comprehensive"]
        }
        
        if with_ai_fields:
            base_data.update({
                "ai_model_provider": "openai",
                "ai_model_id": "gpt-4",
                "ai_model_parameters": {
                    "temperature": 0.7,
                    "max_tokens": 1500,
                    "top_p": 1.0
                }
            })
        
        return base_data
    
    @staticmethod
    def create_sample_conversation_data() -> Dict[str, Any]:
        """Create sample conversation data"""
        return {
            "title": "Test Conversation",
            "description": "A test conversation for API testing",
            "agent_id": "test_agent_id",
            "metadata": {
                "test_type": "api_testing",
                "created_by": "test_infrastructure"
            }
        }
    
    @staticmethod
    def create_sample_message_data() -> Dict[str, Any]:
        """Create sample message data"""
        return {
            "content": "This is a test message for comprehensive API testing",
            "role": "user",
            "metadata": {
                "test_message": True,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    
    @staticmethod
    def create_sample_workflow_data(with_ai_config: bool = True) -> Dict[str, Any]:
        """Create sample workflow template data"""
        base_data = {
            "name": "Test Workflow",
            "description": "A comprehensive test workflow for API testing",
            "category": "test",
            "steps": [
                {
                    "step_id": "step1",
                    "name": "Test Processing Step",
                    "step_type": "agent",
                    "config": {
                        "name": "TestAgent",
                        "instructions": "Process the test data"
                    }
                }
            ]
        }
        
        if with_ai_config:
            base_data["steps"][0]["config"].update({
                "ai_model_provider": "openai",
                "ai_model_id": "gpt-4",
                "ai_model_parameters": {
                    "temperature": 0.5,
                    "max_tokens": 1000
                }
            })
        
        return base_data
    
    # ========================================================================
    # MOCK HELPERS
    # ========================================================================
    
    @staticmethod
    def create_mock_user(
        user_id: str = "test_user_123",
        email: str = "test@vexel.com",
        is_superuser: bool = False,
        is_active: bool = True
    ) -> Mock:
        """Create mock user for testing"""
        return Mock(
            id=user_id,
            email=email,
            is_active=is_active,
            is_superuser=is_superuser,
            full_name="Test User",
            totp_secret=None,
            totp_counter=0,
            created=datetime.utcnow(),
            updated=datetime.utcnow()
        )
    
    @staticmethod
    def create_mock_database() -> Mock:
        """Create mock database for testing"""
        db = Mock()
        db.get_collection = Mock(return_value=Mock())
        return db
    
    @staticmethod
    def create_mock_object_id(id_str: str = None) -> ObjectId:
        """Create mock ObjectId for testing"""
        if id_str:
            return ObjectId(id_str)
        return ObjectId()


# ============================================================================
# COMPREHENSIVE TEST SCENARIOS
# ============================================================================

class APITestScenarios:
    """Pre-defined test scenarios for comprehensive testing"""
    
    @staticmethod
    def get_crud_test_scenarios() -> List[Dict[str, Any]]:
        """Get CRUD operation test scenarios"""
        return [
            {
                "name": "create_valid_data",
                "description": "Test creating resource with valid data",
                "expected_status": 201
            },
            {
                "name": "create_invalid_data", 
                "description": "Test creating resource with invalid data",
                "expected_status": 422
            },
            {
                "name": "read_existing",
                "description": "Test reading existing resource",
                "expected_status": 200
            },
            {
                "name": "read_non_existing",
                "description": "Test reading non-existing resource", 
                "expected_status": 404
            },
            {
                "name": "update_existing",
                "description": "Test updating existing resource",
                "expected_status": 200
            },
            {
                "name": "update_non_existing",
                "description": "Test updating non-existing resource",
                "expected_status": 404
            },
            {
                "name": "delete_existing",
                "description": "Test deleting existing resource",
                "expected_status": 200
            },
            {
                "name": "delete_non_existing", 
                "description": "Test deleting non-existing resource",
                "expected_status": 404
            }
        ]
    
    @staticmethod
    def get_auth_test_scenarios() -> List[Dict[str, Any]]:
        """Get authentication test scenarios"""
        return [
            {
                "name": "valid_credentials",
                "description": "Test with valid credentials",
                "expected_status": 200
            },
            {
                "name": "invalid_credentials",
                "description": "Test with invalid credentials", 
                "expected_status": 401
            },
            {
                "name": "missing_credentials",
                "description": "Test with missing credentials",
                "expected_status": 401
            },
            {
                "name": "expired_token",
                "description": "Test with expired token",
                "expected_status": 401
            }
        ]


# Convenience instance
api_test_infra = APITestInfrastructure()
api_test_scenarios = APITestScenarios()
