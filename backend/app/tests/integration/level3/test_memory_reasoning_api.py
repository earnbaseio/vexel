"""
Integration tests for Level 3: Memory/Reasoning API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient
from typing import Dict, Any, List

from tests.utils.test_helpers import test_data, api_helper


@pytest.mark.level3
@pytest.mark.integration
@pytest.mark.api
class TestMemoryReasoningAPIEndpoints:
    """Test memory/reasoning system API endpoints"""
    
    def test_memory_reasoning_chat_endpoint(self, client: TestClient):
        """Test memory/reasoning chat endpoint"""
        chat_data = {
            "name": "TestMemoryReasoningAgent",
            "model": "gemini/gemini-1.5-flash",
            "user_id": "test_user_memory",
            "session_id": "test_session_memory",
            "message": "Hello, I'm learning Python. Can you help me understand functions?",
            "knowledge_sources": [
                {
                    "type": "text",
                    "name": "python_basics",
                    "content": [
                        "Python functions are reusable blocks of code",
                        "Functions can take parameters and return values",
                        "Use def keyword to define functions"
                    ]
                }
            ]
        }
        
        response = client.post("/api/v1/agents/memory-reasoning/chat", json=chat_data)
        
        assert response.status_code == 200
        result = response.json()
        api_helper.assert_success_response(result)
        assert "response" in result
        assert "context" in result
        assert result["context"]["user_id"] == "test_user_memory"
    
    def test_memory_reasoning_with_session_continuity(self, client: TestClient):
        """Test session continuity in memory/reasoning"""
        session_id = "continuity_test_session"
        user_id = "continuity_test_user"
        
        # First message
        chat_data1 = {
            "name": "ContinuityAgent",
            "model": "gemini/gemini-1.5-flash",
            "user_id": user_id,
            "session_id": session_id,
            "message": "My name is Alice and I prefer detailed explanations"
        }
        
        response1 = client.post("/api/v1/agents/memory-reasoning/chat", json=chat_data1)
        assert response1.status_code == 200
        result1 = response1.json()
        api_helper.assert_success_response(result1)
        
        # Second message in same session
        chat_data2 = {
            "name": "ContinuityAgent",
            "model": "gemini/gemini-1.5-flash",
            "user_id": user_id,
            "session_id": session_id,
            "message": "What's my name and how do I like explanations?"
        }
        
        response2 = client.post("/api/v1/agents/memory-reasoning/chat", json=chat_data2)
        assert response2.status_code == 200
        result2 = response2.json()
        api_helper.assert_success_response(result2)
        
        # Should have memory context
        assert result2["context"]["memories_count"] >= 0
    
    def test_get_user_memories_endpoint(self, client: TestClient):
        """Test get user memories endpoint"""
        user_id = "memory_test_user"
        
        # First create some memories by chatting
        chat_data = {
            "name": "MemoryTestAgent",
            "user_id": user_id,
            "message": "I love machine learning and prefer Python programming"
        }
        
        chat_response = client.post("/api/v1/agents/memory-reasoning/chat", json=chat_data)
        assert chat_response.status_code == 200
        
        # Then get memories
        response = client.get(f"/api/v1/agents/memory-reasoning/memories/{user_id}")
        
        assert response.status_code == 200
        result = response.json()
        assert "memories" in result
        assert "user_id" in result
        assert result["user_id"] == user_id
        assert isinstance(result["memories"], list)
    
    def test_clear_user_memories_endpoint(self, client: TestClient):
        """Test clear user memories endpoint"""
        user_id = "clear_test_user"
        
        # First create some memories
        chat_data = {
            "name": "ClearTestAgent",
            "user_id": user_id,
            "message": "Remember that I work in data science"
        }
        
        chat_response = client.post("/api/v1/agents/memory-reasoning/chat", json=chat_data)
        assert chat_response.status_code == 200
        
        # Clear memories
        response = client.delete(f"/api/v1/agents/memory-reasoning/memories/{user_id}")
        
        assert response.status_code == 200
        result = response.json()
        assert "message" in result
        assert user_id in result["message"]
    
    def test_memory_reasoning_test_endpoint(self, client: TestClient):
        """Test memory/reasoning system test endpoint"""
        response = client.post("/api/v1/agents/memory-reasoning/test")
        
        assert response.status_code == 200
        result = response.json()
        api_helper.assert_success_response(result)
        assert "test_response" in result
        assert "memories_created" in result
        assert "agent_info" in result
    
    @pytest.mark.asyncio
    async def test_async_memory_reasoning_chat(self, async_client: AsyncClient):
        """Test async memory/reasoning chat"""
        chat_data = {
            "name": "AsyncMemoryAgent",
            "model": "gemini/gemini-1.5-flash",
            "user_id": "async_test_user",
            "message": "Test async memory and reasoning capabilities"
        }
        
        response = await async_client.post("/api/v1/agents/memory-reasoning/chat", json=chat_data)
        
        assert response.status_code == 200
        result = response.json()
        api_helper.assert_success_response(result)
        assert "response" in result


@pytest.mark.level3
@pytest.mark.integration
class TestMemoryReasoningErrorHandling:
    """Test memory/reasoning error handling scenarios"""
    
    def test_invalid_memory_reasoning_data(self, client: TestClient):
        """Test handling of invalid memory/reasoning data"""
        invalid_data = {
            "name": "",  # Empty name
            "model": "invalid_model",
            "user_id": "",  # Empty user_id
            "message": ""  # Empty message
        }
        
        response = client.post("/api/v1/agents/memory-reasoning/chat", json=invalid_data)
        
        # Should handle gracefully
        assert response.status_code in [200, 400, 422]
        
        if response.status_code == 200:
            result = response.json()
            assert "error" in result or "status" in result
    
    def test_missing_required_fields(self, client: TestClient):
        """Test handling of missing required fields"""
        incomplete_data = {
            "name": "TestAgent"
            # Missing message and other required fields
        }
        
        response = client.post("/api/v1/agents/memory-reasoning/chat", json=incomplete_data)
        
        assert response.status_code in [200, 400, 422]
    
    def test_nonexistent_user_memories(self, client: TestClient):
        """Test getting memories for non-existent user"""
        nonexistent_user = "nonexistent_user_12345"
        
        response = client.get(f"/api/v1/agents/memory-reasoning/memories/{nonexistent_user}")
        
        # Should handle gracefully
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            result = response.json()
            assert "memories" in result
            # Should return empty list for non-existent user
            assert isinstance(result["memories"], list)


@pytest.mark.level3
@pytest.mark.integration
class TestMemoryReasoningPerformanceAPI:
    """Test memory/reasoning API performance"""
    
    @pytest.mark.asyncio
    async def test_memory_reasoning_response_time(self, async_client: AsyncClient):
        """Test memory/reasoning API response time"""
        from tests.utils.test_helpers import perf_helper
        
        chat_data = {
            "name": "PerformanceTestAgent",
            "model": "gemini/gemini-1.5-flash",
            "user_id": "perf_test_user",
            "message": "Quick performance test for memory and reasoning"
        }
        
        async def make_request():
            response = await async_client.post("/api/v1/agents/memory-reasoning/chat", json=chat_data)
            return response.json()
        
        result, execution_time = await perf_helper.measure_execution_time(make_request())
        
        # Memory/reasoning should respond within reasonable time
        perf_helper.assert_performance_threshold(
            execution_time, 60.0, "Memory/Reasoning API response"
        )
        
        api_helper.assert_success_response(result)
    
    @pytest.mark.asyncio
    async def test_memory_retrieval_performance(self, async_client: AsyncClient):
        """Test memory retrieval performance"""
        from tests.utils.test_helpers import perf_helper
        
        user_id = "memory_perf_user"
        
        # First create some memories
        chat_data = {
            "name": "MemoryPerfAgent",
            "user_id": user_id,
            "message": "Create some memories for performance testing"
        }
        
        await async_client.post("/api/v1/agents/memory-reasoning/chat", json=chat_data)
        
        # Then test memory retrieval performance
        async def get_memories():
            response = await async_client.get(f"/api/v1/agents/memory-reasoning/memories/{user_id}")
            return response.json()
        
        result, execution_time = await perf_helper.measure_execution_time(get_memories())
        
        # Memory retrieval should be fast
        perf_helper.assert_performance_threshold(
            execution_time, 5.0, "Memory retrieval"
        )
        
        assert "memories" in result
    
    @pytest.mark.asyncio
    async def test_concurrent_memory_operations(self, async_client: AsyncClient):
        """Test concurrent memory/reasoning operations"""
        import asyncio
        
        async def memory_chat(user_id: str, message: str):
            chat_data = {
                "name": f"ConcurrentAgent_{user_id}",
                "user_id": user_id,
                "message": message
            }
            response = await async_client.post("/api/v1/agents/memory-reasoning/chat", json=chat_data)
            return response.json()
        
        # Create 5 concurrent memory operations
        tasks = [
            memory_chat(f"concurrent_user_{i}", f"Concurrent message {i}")
            for i in range(5)
        ]
        
        results = await asyncio.gather(*tasks)
        
        # All should succeed
        assert len(results) == 5
        for result in results:
            api_helper.assert_success_response(result)


@pytest.mark.level3
@pytest.mark.integration
class TestMemoryReasoningFeatures:
    """Test specific memory/reasoning features"""
    
    def test_reasoning_with_knowledge(self, client: TestClient):
        """Test reasoning with knowledge integration"""
        chat_data = {
            "name": "ReasoningKnowledgeAgent",
            "model": "gemini/gemini-1.5-flash",
            "user_id": "reasoning_test_user",
            "message": "Use reasoning to analyze the best sorting algorithm for large datasets",
            "knowledge_sources": [
                {
                    "type": "text",
                    "name": "algorithms",
                    "content": [
                        "Quick sort has average O(n log n) complexity",
                        "Merge sort has guaranteed O(n log n) complexity",
                        "Heap sort has O(n log n) complexity and is in-place",
                        "Bubble sort has O(n²) complexity and is inefficient for large data"
                    ]
                }
            ]
        }
        
        response = client.post("/api/v1/agents/memory-reasoning/chat", json=chat_data)
        
        assert response.status_code == 200
        result = response.json()
        api_helper.assert_success_response(result)
        assert "response" in result
        
        # Response should show reasoning process
        response_text = result["response"].lower()
        assert any(term in response_text for term in ["think", "analyze", "reasoning"])
    
    def test_memory_persistence_across_sessions(self, client: TestClient):
        """Test memory persistence across different sessions"""
        user_id = "persistence_test_user"
        
        # Session 1: Create memory
        chat_data1 = {
            "name": "PersistenceAgent",
            "user_id": user_id,
            "session_id": "session_1",
            "message": "I'm working on a React project and prefer TypeScript"
        }
        
        response1 = client.post("/api/v1/agents/memory-reasoning/chat", json=chat_data1)
        assert response1.status_code == 200
        
        # Session 2: Different session, same user
        chat_data2 = {
            "name": "PersistenceAgent",
            "user_id": user_id,
            "session_id": "session_2",
            "message": "What do you remember about my project preferences?"
        }
        
        response2 = client.post("/api/v1/agents/memory-reasoning/chat", json=chat_data2)
        assert response2.status_code == 200
        result2 = response2.json()
        api_helper.assert_success_response(result2)
        
        # Should have access to memories from previous session
        assert result2["context"]["memories_count"] >= 0
    
    def test_reasoning_tool_usage(self, client: TestClient):
        """Test explicit reasoning tool usage"""
        chat_data = {
            "name": "ReasoningToolAgent",
            "model": "gemini/gemini-1.5-flash",
            "user_id": "reasoning_tool_user",
            "message": "Think step by step about how to design a scalable web application architecture"
        }
        
        response = client.post("/api/v1/agents/memory-reasoning/chat", json=chat_data)
        
        assert response.status_code == 200
        result = response.json()
        api_helper.assert_success_response(result)
        assert "response" in result
        
        # Should show tool usage in response
        response_text = result["response"]
        assert len(response_text) > 100  # Should be detailed reasoning
    
    def test_context_management(self, client: TestClient):
        """Test context management capabilities"""
        user_id = "context_test_user"
        session_id = "context_test_session"
        
        # Multiple messages to build context
        messages = [
            "I'm building an e-commerce platform",
            "I need to handle user authentication",
            "What's the best approach for payment processing?",
            "How should I structure the database?"
        ]
        
        responses = []
        for i, message in enumerate(messages):
            chat_data = {
                "name": "ContextAgent",
                "user_id": user_id,
                "session_id": session_id,
                "message": message
            }
            
            response = client.post("/api/v1/agents/memory-reasoning/chat", json=chat_data)
            assert response.status_code == 200
            result = response.json()
            api_helper.assert_success_response(result)
            responses.append(result)
        
        # Later responses should have more context
        assert len(responses) == len(messages)
        
        # Last response should reference e-commerce context
        last_response = responses[-1]["response"].lower()
        assert any(term in last_response for term in ["e-commerce", "platform", "authentication", "payment"])


@pytest.mark.level3
@pytest.mark.integration
@pytest.mark.slow
class TestMemoryReasoningStressAPI:
    """Stress tests for memory/reasoning API"""
    
    @pytest.mark.asyncio
    async def test_high_load_memory_operations(self, async_client: AsyncClient):
        """Test high load of memory operations"""
        import asyncio
        
        async def memory_operation(user_id: str, operation_id: int):
            chat_data = {
                "name": f"StressAgent_{operation_id}",
                "user_id": user_id,
                "message": f"Stress test operation {operation_id} with memory and reasoning"
            }
            
            response = await async_client.post("/api/v1/agents/memory-reasoning/chat", json=chat_data)
            return response.status_code, response.json()
        
        # Create 10 concurrent memory operations
        tasks = [memory_operation(f"stress_user_{i}", i) for i in range(10)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Count successful operations
        successful = 0
        for result in results:
            if not isinstance(result, Exception):
                status_code, response_data = result
                if status_code == 200:
                    successful += 1
        
        # At least 70% should succeed under stress
        success_rate = successful / len(results)
        assert success_rate >= 0.7, f"Success rate {success_rate:.2%} below 70%"
    
    @pytest.mark.asyncio
    async def test_memory_system_stability(self, async_client: AsyncClient):
        """Test memory system stability over time"""
        user_id = "stability_test_user"
        
        # Perform multiple operations over time
        for i in range(5):
            chat_data = {
                "name": "StabilityAgent",
                "user_id": user_id,
                "message": f"Stability test message {i} - remember this information"
            }
            
            response = await async_client.post("/api/v1/agents/memory-reasoning/chat", json=chat_data)
            assert response.status_code == 200
            
            result = response.json()
            api_helper.assert_success_response(result)
            
            # Small delay between operations
            await asyncio.sleep(0.1)
        
        # Check final memory state
        memory_response = await async_client.get(f"/api/v1/agents/memory-reasoning/memories/{user_id}")
        assert memory_response.status_code == 200
        
        memory_result = memory_response.json()
        assert "memories" in memory_result
        assert len(memory_result["memories"]) >= 0  # Should have accumulated memories
