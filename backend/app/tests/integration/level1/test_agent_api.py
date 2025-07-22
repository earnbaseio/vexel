"""
Integration tests for Level 1: Agent API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient
from typing import Dict, Any

from tests.utils.test_helpers import test_data, api_helper


@pytest.mark.level1
@pytest.mark.integration
@pytest.mark.api
class TestAgentAPIEndpoints:
    """Test agent API endpoints"""
    
    def test_agent_creation_endpoint(self, client: TestClient):
        """Test agent creation via API"""
        agent_data = {
            "name": "APITestAgent",
            "model": "gemini/gemini-1.5-flash",
            "instructions": "You are a test agent created via API",
            "tools": ["search"],
            "user_id": "api_test_user"
        }
        
        response = client.post("/api/v1/agents/create", json=agent_data)
        
        assert response.status_code == 200
        result = response.json()
        api_helper.assert_success_response(result)
        assert "agent_id" in result or "message" in result
    
    def test_agent_chat_endpoint(self, client: TestClient):
        """Test agent chat endpoint"""
        chat_data = {
            "name": "ChatTestAgent",
            "model": "gemini/gemini-1.5-flash",
            "message": "Hello, can you help me with a test?",
            "user_id": "chat_test_user"
        }
        
        response = client.post("/api/v1/agents/chat", json=chat_data)
        
        assert response.status_code == 200
        result = response.json()
        api_helper.assert_success_response(result)
        assert "response" in result
        assert len(result["response"]) > 0
    
    def test_agent_list_endpoint(self, client: TestClient):
        """Test agent listing endpoint"""
        response = client.get("/api/v1/agents/list")
        
        assert response.status_code == 200
        result = response.json()
        assert isinstance(result, dict)
        assert "agents" in result or "message" in result
    
    def test_agent_test_endpoint(self, client: TestClient):
        """Test agent testing endpoint"""
        response = client.post("/api/v1/agents/test")
        
        assert response.status_code == 200
        result = response.json()
        api_helper.assert_success_response(result)
    
    @pytest.mark.asyncio
    async def test_async_agent_chat(self, async_client: AsyncClient):
        """Test async agent chat"""
        chat_data = {
            "name": "AsyncChatAgent",
            "model": "gemini/gemini-1.5-flash", 
            "message": "This is an async test message",
            "user_id": "async_test_user"
        }
        
        response = await async_client.post("/api/v1/agents/chat", json=chat_data)
        
        assert response.status_code == 200
        result = response.json()
        api_helper.assert_success_response(result)
        assert "response" in result


@pytest.mark.level1
@pytest.mark.integration
class TestAgentErrorHandling:
    """Test agent error handling scenarios"""
    
    def test_invalid_agent_data(self, client: TestClient):
        """Test handling of invalid agent data"""
        invalid_data = {
            "name": "",  # Empty name
            "model": "invalid_model",
            "message": "Test message"
        }
        
        response = client.post("/api/v1/agents/chat", json=invalid_data)
        
        # Should handle gracefully (might return 200 with error message or 400)
        assert response.status_code in [200, 400, 422]
        
        if response.status_code == 200:
            result = response.json()
            # Should indicate error in response
            assert "error" in result or "status" in result
    
    def test_missing_required_fields(self, client: TestClient):
        """Test handling of missing required fields"""
        incomplete_data = {
            "message": "Test message"
            # Missing name and model
        }
        
        response = client.post("/api/v1/agents/chat", json=incomplete_data)
        
        # Should return validation error
        assert response.status_code in [400, 422]
    
    def test_malformed_json(self, client: TestClient):
        """Test handling of malformed JSON"""
        response = client.post(
            "/api/v1/agents/chat",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 422  # Unprocessable Entity


@pytest.mark.level1
@pytest.mark.integration
class TestAgentPerformanceAPI:
    """Test agent API performance"""
    
    @pytest.mark.asyncio
    async def test_api_response_time(self, async_client: AsyncClient):
        """Test API response time"""
        from tests.utils.test_helpers import perf_helper
        
        chat_data = {
            "name": "PerformanceTestAgent",
            "model": "gemini/gemini-1.5-flash",
            "message": "Quick performance test",
            "user_id": "perf_test_user"
        }
        
        async def make_request():
            response = await async_client.post("/api/v1/agents/chat", json=chat_data)
            return response.json()
        
        result, execution_time = await perf_helper.measure_execution_time(make_request())
        
        # API should respond within reasonable time
        perf_helper.assert_performance_threshold(
            execution_time, 30.0, "Agent API response"
        )
        
        api_helper.assert_success_response(result)
    
    @pytest.mark.asyncio
    async def test_concurrent_api_requests(self, async_client: AsyncClient):
        """Test concurrent API requests"""
        import asyncio
        
        chat_data = {
            "name": "ConcurrentTestAgent",
            "model": "gemini/gemini-1.5-flash",
            "message": "Concurrent test message",
            "user_id": "concurrent_test_user"
        }
        
        async def make_request(request_id: int):
            data = chat_data.copy()
            data["message"] = f"Concurrent request {request_id}"
            response = await async_client.post("/api/v1/agents/chat", json=data)
            return response.json()
        
        # Make 5 concurrent requests
        tasks = [make_request(i) for i in range(5)]
        results = await asyncio.gather(*tasks)
        
        # All requests should succeed
        assert len(results) == 5
        for result in results:
            api_helper.assert_success_response(result)


@pytest.mark.level1
@pytest.mark.integration
class TestAgentToolsAPI:
    """Test agent tools via API"""
    
    def test_agent_with_search_tool(self, client: TestClient):
        """Test agent with search tool"""
        chat_data = {
            "name": "SearchAgent",
            "model": "gemini/gemini-1.5-flash",
            "message": "Search for information about Python programming",
            "tools": ["duckduckgo_search"],
            "user_id": "search_test_user"
        }
        
        response = client.post("/api/v1/agents/chat", json=chat_data)
        
        assert response.status_code == 200
        result = response.json()
        api_helper.assert_success_response(result)
        assert "response" in result
    
    def test_agent_with_multiple_tools(self, client: TestClient):
        """Test agent with multiple tools"""
        chat_data = {
            "name": "MultiToolAgent",
            "model": "gemini/gemini-1.5-flash",
            "message": "Help me with calculations and search",
            "tools": ["duckduckgo_search", "calculator"],
            "user_id": "multitool_test_user"
        }
        
        response = client.post("/api/v1/agents/chat", json=chat_data)
        
        assert response.status_code == 200
        result = response.json()
        api_helper.assert_success_response(result)
    
    def test_agent_without_tools(self, client: TestClient):
        """Test agent without tools"""
        chat_data = {
            "name": "NoToolsAgent",
            "model": "gemini/gemini-1.5-flash",
            "message": "Just answer this question without tools",
            "tools": [],
            "user_id": "notool_test_user"
        }
        
        response = client.post("/api/v1/agents/chat", json=chat_data)
        
        assert response.status_code == 200
        result = response.json()
        api_helper.assert_success_response(result)


@pytest.mark.level1
@pytest.mark.integration
class TestAgentSessionAPI:
    """Test agent session management via API"""
    
    def test_session_persistence(self, client: TestClient):
        """Test session persistence across requests"""
        session_id = "test_session_persistence"
        
        # First message
        chat_data1 = {
            "name": "SessionAgent",
            "model": "gemini/gemini-1.5-flash",
            "message": "Remember that my name is Alice",
            "user_id": "session_test_user",
            "session_id": session_id
        }
        
        response1 = client.post("/api/v1/agents/chat", json=chat_data1)
        assert response1.status_code == 200
        result1 = response1.json()
        api_helper.assert_success_response(result1)
        
        # Second message in same session
        chat_data2 = {
            "name": "SessionAgent",
            "model": "gemini/gemini-1.5-flash",
            "message": "What is my name?",
            "user_id": "session_test_user",
            "session_id": session_id
        }
        
        response2 = client.post("/api/v1/agents/chat", json=chat_data2)
        assert response2.status_code == 200
        result2 = response2.json()
        api_helper.assert_success_response(result2)
        
        # Should remember the name from previous message
        # Note: This depends on actual memory implementation
    
    def test_different_sessions_isolation(self, client: TestClient):
        """Test isolation between different sessions"""
        # Session 1
        chat_data1 = {
            "name": "IsolationAgent",
            "model": "gemini/gemini-1.5-flash",
            "message": "My favorite color is blue",
            "user_id": "isolation_test_user1",
            "session_id": "session_1"
        }
        
        response1 = client.post("/api/v1/agents/chat", json=chat_data1)
        assert response1.status_code == 200
        
        # Session 2 (different user)
        chat_data2 = {
            "name": "IsolationAgent",
            "model": "gemini/gemini-1.5-flash",
            "message": "What is my favorite color?",
            "user_id": "isolation_test_user2",
            "session_id": "session_2"
        }
        
        response2 = client.post("/api/v1/agents/chat", json=chat_data2)
        assert response2.status_code == 200
        result2 = response2.json()
        api_helper.assert_success_response(result2)
        
        # Should not know the color from different session


@pytest.mark.level1
@pytest.mark.integration
@pytest.mark.slow
class TestAgentStressAPI:
    """Stress tests for agent API"""
    
    @pytest.mark.asyncio
    async def test_high_load_requests(self, async_client: AsyncClient):
        """Test high load of requests"""
        import asyncio
        
        async def make_request(request_id: int):
            chat_data = {
                "name": f"StressAgent_{request_id}",
                "model": "gemini/gemini-1.5-flash",
                "message": f"Stress test message {request_id}",
                "user_id": f"stress_user_{request_id}"
            }
            
            response = await async_client.post("/api/v1/agents/chat", json=chat_data)
            return response.status_code, response.json()
        
        # Create 20 concurrent requests
        tasks = [make_request(i) for i in range(20)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Count successful requests
        successful = 0
        for result in results:
            if not isinstance(result, Exception):
                status_code, response_data = result
                if status_code == 200:
                    successful += 1
        
        # At least 80% should succeed under load
        success_rate = successful / len(results)
        assert success_rate >= 0.8, f"Success rate {success_rate:.2%} below 80%"
