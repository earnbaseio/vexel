"""
Test utilities and helper functions for Vexel AI Agent platform tests
"""

import json
import asyncio
import tempfile
import os
from typing import Dict, Any, List, Optional, Union
from unittest.mock import Mock, AsyncMock, patch
from contextlib import asynccontextmanager, contextmanager

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient


class TestDataGenerator:
    """Generate test data for various components"""
    
    @staticmethod
    def agent_config(
        name: str = "TestAgent",
        model: str = "gemini/gemini-2.5-flash-lite",
        **kwargs
    ) -> Dict[str, Any]:
        """Generate agent configuration"""
        config = {
            "name": name,
            "model": model,
            "instructions": f"You are {name}, a helpful test agent",
            "tools": [],
            "user_id": "test_user",
            "session_id": "test_session"
        }
        config.update(kwargs)
        return config
    
    @staticmethod
    def knowledge_source(
        name: str = "test_knowledge",
        content: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Generate knowledge source data"""
        if content is None:
            content = [
                f"Test knowledge content for {name}",
                "This is sample information for testing",
                "Knowledge retrieval and search functionality"
            ]
        
        return {
            "type": "text",
            "name": name,
            "content": content
        }
    
    @staticmethod
    def team_config(
        team_name: str = "TestTeam",
        mode: str = "coordinate",
        **kwargs
    ) -> Dict[str, Any]:
        """Generate team configuration"""
        config = {
            "team_name": team_name,
            "mode": mode,
            "leader_model": "gemini/gemini-2.5-flash-lite",
            "user_id": "test_user",
            "agents": {
                "researcher": {
                    "name": "Research Agent",
                    "role": "Expert at finding information",
                    "model": "gemini/gemini-2.5-flash-lite",
                    "tools": ["duckduckgo_search"]
                },
                "analyst": {
                    "name": "Analysis Agent",
                    "role": "Expert at analyzing data", 
                    "model": "gemini/gemini-2.5-flash-lite",
                    "tools": ["think", "analyze"]
                }
            }
        }
        config.update(kwargs)
        return config
    
    @staticmethod
    def workflow_config(
        workflow_name: str = "TestWorkflow",
        steps: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Generate workflow configuration"""
        if steps is None:
            steps = [
                {
                    "step_id": "step1",
                    "name": "First Step",
                    "step_type": "agent",
                    "config": {
                        "name": "TestAgent1",
                        "model": "gemini/gemini-2.5-flash-lite"
                    },
                    "next_steps": ["step2"]
                },
                {
                    "step_id": "step2",
                    "name": "Second Step", 
                    "step_type": "agent",
                    "config": {
                        "name": "TestAgent2",
                        "model": "gemini/gemini-2.5-flash-lite"
                    }
                }
            ]
        
        return {
            "workflow_name": workflow_name,
            "workflow_description": f"Test workflow: {workflow_name}",
            "user_id": "test_user",
            "steps": steps
        }


class MockManager:
    """Manage mocks for different components"""
    
    @staticmethod
    def mock_llm_response(content: str = "Mock LLM response") -> Mock:
        """Create mock LLM response"""
        response = Mock()
        response.content = content
        response.text = content
        response.choices = [Mock(message=Mock(content=content))]
        return response
    
    @staticmethod
    def mock_agent_response(content: str = "Mock agent response") -> Mock:
        """Create mock agent response"""
        response = Mock()
        response.content = content
        response.messages = [{"role": "assistant", "content": content}]
        return response
    
    @staticmethod
    def mock_vector_search_results(
        results: Optional[List[Dict[str, Any]]] = None
    ) -> List[Mock]:
        """Create mock vector search results"""
        if results is None:
            results = [
                {"id": 1, "score": 0.9, "text": "Mock search result 1"},
                {"id": 2, "score": 0.8, "text": "Mock search result 2"}
            ]
        
        mock_results = []
        for result in results:
            mock_result = Mock()
            mock_result.id = result.get("id", 1)
            mock_result.score = result.get("score", 0.9)
            mock_result.payload = {"text": result.get("text", "Mock result")}
            mock_results.append(mock_result)
        
        return mock_results
    
    @contextmanager
    def mock_external_apis(self):
        """Context manager to mock all external APIs"""
        with patch('litellm.acompletion') as mock_litellm, \
             patch('qdrant_client.QdrantClient') as mock_qdrant, \
             patch('google.generativeai.GenerativeModel') as mock_gemini:
            
            # Setup LiteLLM mock
            mock_litellm.return_value = self.mock_llm_response()
            
            # Setup Qdrant mock
            mock_qdrant_instance = Mock()
            mock_qdrant_instance.search.return_value = self.mock_vector_search_results()
            mock_qdrant_instance.upsert.return_value = Mock(status="ok")
            mock_qdrant.return_value = mock_qdrant_instance
            
            # Setup Gemini mock
            mock_gemini_instance = Mock()
            mock_gemini_instance.generate_content.return_value = Mock(
                text="Mock Gemini response"
            )
            mock_gemini.return_value = mock_gemini_instance
            
            yield {
                'litellm': mock_litellm,
                'qdrant': mock_qdrant,
                'gemini': mock_gemini
            }


class APITestHelper:
    """Helper for API endpoint testing"""
    
    @staticmethod
    async def post_json(
        client: Union[TestClient, AsyncClient],
        url: str,
        data: Dict[str, Any],
        **kwargs
    ) -> Dict[str, Any]:
        """POST JSON data and return response"""
        if isinstance(client, TestClient):
            response = client.post(url, json=data, **kwargs)
            return response.json()
        else:
            response = await client.post(url, json=data, **kwargs)
            return response.json()
    
    @staticmethod
    async def get_json(
        client: Union[TestClient, AsyncClient],
        url: str,
        **kwargs
    ) -> Dict[str, Any]:
        """GET request and return JSON response"""
        if isinstance(client, TestClient):
            response = client.get(url, **kwargs)
            return response.json()
        else:
            response = await client.get(url, **kwargs)
            return response.json()
    
    @staticmethod
    def assert_success_response(response: Dict[str, Any]):
        """Assert response indicates success"""
        assert "status" in response
        assert response["status"] == "success"
        assert "message" in response
    
    @staticmethod
    def assert_error_response(response: Dict[str, Any]):
        """Assert response indicates error"""
        assert "status" in response
        assert response["status"] == "error"
        assert "error" in response or "message" in response


class DatabaseTestHelper:
    """Helper for database testing"""
    
    @staticmethod
    @contextmanager
    def temp_database():
        """Create temporary database for testing"""
        temp_file = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
        temp_file.close()
        
        try:
            yield temp_file.name
        finally:
            if os.path.exists(temp_file.name):
                os.unlink(temp_file.name)
    
    @staticmethod
    def create_test_tables(engine):
        """Create test database tables"""
        # This would create necessary tables for testing
        # Implementation depends on your database schema
        pass


class PerformanceTestHelper:
    """Helper for performance testing"""
    
    @staticmethod
    async def measure_execution_time(coro):
        """Measure async function execution time"""
        import time
        start_time = time.time()
        result = await coro
        end_time = time.time()
        return result, end_time - start_time
    
    @staticmethod
    def assert_performance_threshold(
        execution_time: float,
        threshold: float,
        operation: str = "operation"
    ):
        """Assert operation completed within time threshold"""
        assert execution_time <= threshold, \
            f"{operation} took {execution_time:.2f}s, expected <= {threshold}s"


class FileTestHelper:
    """Helper for file-based testing"""
    
    @staticmethod
    @contextmanager
    def temp_file(content: str = "", suffix: str = ".txt"):
        """Create temporary file with content"""
        temp_file = tempfile.NamedTemporaryFile(
            mode='w', suffix=suffix, delete=False
        )
        temp_file.write(content)
        temp_file.close()
        
        try:
            yield temp_file.name
        finally:
            if os.path.exists(temp_file.name):
                os.unlink(temp_file.name)
    
    @staticmethod
    @contextmanager
    def temp_directory():
        """Create temporary directory"""
        temp_dir = tempfile.mkdtemp()
        try:
            yield temp_dir
        finally:
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)


# Convenience instances
test_data = TestDataGenerator()
mock_manager = MockManager()
api_helper = APITestHelper()
db_helper = DatabaseTestHelper()
perf_helper = PerformanceTestHelper()
file_helper = FileTestHelper()


# Pytest fixtures using helpers
@pytest.fixture
def test_data_generator():
    """Test data generator fixture"""
    return TestDataGenerator()


@pytest.fixture
def mock_manager_fixture():
    """Mock manager fixture"""
    return MockManager()


@pytest.fixture
def api_test_helper():
    """API test helper fixture"""
    return APITestHelper()


@pytest.fixture
def performance_helper():
    """Performance test helper fixture"""
    return PerformanceTestHelper()
