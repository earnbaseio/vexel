"""
Integration tests for Level 2: Knowledge/Storage API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient
from typing import Dict, Any, List

from tests.utils.test_helpers import test_data, api_helper


@pytest.mark.level2
@pytest.mark.integration
@pytest.mark.api
class TestKnowledgeAPIEndpoints:
    """Test knowledge system API endpoints"""
    
    def test_knowledge_creation_endpoint(self, client: TestClient):
        """Test knowledge base creation via API"""
        knowledge_data = {
            "knowledge_type": "text",
            "name": "test_knowledge_api",
            "content": [
                "This is test knowledge content for API testing",
                "It contains information about AI and machine learning",
                "Used for testing knowledge retrieval functionality"
            ]
        }
        
        response = client.post("/api/v1/agents/knowledge/create", json=knowledge_data)
        
        assert response.status_code == 200
        result = response.json()
        api_helper.assert_success_response(result)
        assert "knowledge_base_id" in result or "message" in result
    
    def test_knowledge_search_endpoint(self, client: TestClient):
        """Test knowledge search via API"""
        # First create knowledge base
        knowledge_data = {
            "knowledge_type": "text",
            "name": "search_test_kb",
            "content": [
                "Artificial intelligence is transforming industries",
                "Machine learning algorithms learn from data",
                "Deep learning uses neural networks"
            ]
        }
        
        create_response = client.post("/api/v1/agents/knowledge/create", json=knowledge_data)
        assert create_response.status_code == 200
        
        # Then search
        search_data = {
            "query": "artificial intelligence",
            "knowledge_base": "search_test_kb",
            "top_k": 3
        }
        
        response = client.post("/api/v1/agents/knowledge/search", json=search_data)
        
        assert response.status_code == 200
        result = response.json()
        api_helper.assert_success_response(result)
        assert "results" in result
        assert isinstance(result["results"], list)
    
    def test_knowledge_list_endpoint(self, client: TestClient):
        """Test knowledge base listing"""
        response = client.get("/api/v1/agents/knowledge/collections")
        
        assert response.status_code == 200
        result = response.json()
        assert "collections" in result or "message" in result
    
    def test_knowledge_agent_chat_endpoint(self, client: TestClient):
        """Test knowledge-enabled agent chat"""
        chat_data = {
            "name": "KnowledgeTestAgent",
            "model": "gemini/gemini-2.5-flash-lite",
            "message": "What do you know about artificial intelligence?",
            "knowledge_sources": [
                {
                    "type": "text",
                    "name": "ai_knowledge",
                    "content": [
                        "Artificial intelligence (AI) is intelligence demonstrated by machines",
                        "AI applications include expert systems, natural language processing",
                        "Machine learning is a subset of AI"
                    ]
                }
            ],
            "user_id": "knowledge_chat_test"
        }
        
        response = client.post("/api/v1/agents/knowledge/chat", json=chat_data)
        
        assert response.status_code == 200
        result = response.json()
        api_helper.assert_success_response(result)
        assert "response" in result
    
    def test_knowledge_test_endpoint(self, client: TestClient):
        """Test knowledge system testing endpoint"""
        response = client.post("/api/v1/agents/knowledge/test")
        
        assert response.status_code == 200
        result = response.json()
        api_helper.assert_success_response(result)


@pytest.mark.level2
@pytest.mark.integration
class TestKnowledgeErrorHandling:
    """Test knowledge system error handling"""
    
    def test_invalid_knowledge_data(self, client: TestClient):
        """Test handling of invalid knowledge data"""
        invalid_data = {
            "knowledge_type": "invalid_type",
            "name": "",  # Empty name
            "content": []  # Empty content
        }
        
        response = client.post("/api/v1/agents/knowledge/create", json=invalid_data)
        
        # Should handle gracefully
        assert response.status_code in [200, 400, 422]
        
        if response.status_code == 200:
            result = response.json()
            assert "error" in result or "status" in result
    
    def test_missing_knowledge_fields(self, client: TestClient):
        """Test handling of missing required fields"""
        incomplete_data = {
            "content": ["Some content"]
            # Missing knowledge_type and name
        }
        
        response = client.post("/api/v1/agents/knowledge/create", json=incomplete_data)
        
        assert response.status_code in [400, 422]
    
    def test_search_nonexistent_knowledge(self, client: TestClient):
        """Test searching non-existent knowledge base"""
        search_data = {
            "query": "test query",
            "knowledge_base": "nonexistent_kb",
            "top_k": 5
        }
        
        response = client.post("/api/v1/agents/knowledge/search", json=search_data)
        
        # Should handle gracefully
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            result = response.json()
            # Should indicate no results or error
            assert "results" in result or "error" in result


@pytest.mark.level2
@pytest.mark.integration
class TestKnowledgePerformanceAPI:
    """Test knowledge API performance"""
    
    @pytest.mark.asyncio
    async def test_knowledge_creation_performance(self, async_client: AsyncClient):
        """Test knowledge creation performance"""
        from tests.utils.test_helpers import perf_helper
        
        knowledge_data = {
            "knowledge_type": "text",
            "name": "performance_test_kb",
            "content": [f"Performance test content {i}" for i in range(100)]
        }
        
        async def create_knowledge():
            response = await async_client.post("/api/v1/agents/knowledge/create", json=knowledge_data)
            return response.json()
        
        result, execution_time = await perf_helper.measure_execution_time(create_knowledge())
        
        # Should complete within reasonable time
        perf_helper.assert_performance_threshold(
            execution_time, 30.0, "Knowledge creation"
        )
        
        api_helper.assert_success_response(result)
    
    @pytest.mark.asyncio
    async def test_knowledge_search_performance(self, async_client: AsyncClient):
        """Test knowledge search performance"""
        from tests.utils.test_helpers import perf_helper
        
        # First create knowledge base
        knowledge_data = {
            "knowledge_type": "text",
            "name": "search_perf_kb",
            "content": [f"Search performance content {i}" for i in range(50)]
        }
        
        await async_client.post("/api/v1/agents/knowledge/create", json=knowledge_data)
        
        # Then test search performance
        search_data = {
            "query": "performance content",
            "knowledge_base": "search_perf_kb",
            "top_k": 10
        }
        
        async def search_knowledge():
            response = await async_client.post("/api/v1/agents/knowledge/search", json=search_data)
            return response.json()
        
        result, execution_time = await perf_helper.measure_execution_time(search_knowledge())
        
        # Search should be fast
        perf_helper.assert_performance_threshold(
            execution_time, 10.0, "Knowledge search"
        )
        
        api_helper.assert_success_response(result)
    
    @pytest.mark.asyncio
    async def test_concurrent_knowledge_operations(self, async_client: AsyncClient):
        """Test concurrent knowledge operations"""
        import asyncio
        
        async def create_knowledge(kb_id: int):
            knowledge_data = {
                "knowledge_type": "text",
                "name": f"concurrent_kb_{kb_id}",
                "content": [f"Concurrent content {kb_id}_{i}" for i in range(10)]
            }
            response = await async_client.post("/api/v1/agents/knowledge/create", json=knowledge_data)
            return response.json()
        
        # Create 5 knowledge bases concurrently
        tasks = [create_knowledge(i) for i in range(5)]
        results = await asyncio.gather(*tasks)
        
        # All should succeed
        assert len(results) == 5
        for result in results:
            api_helper.assert_success_response(result)


@pytest.mark.level2
@pytest.mark.integration
class TestKnowledgeEmbeddingsAPI:
    """Test knowledge embeddings via API"""
    
    def test_gemini_embeddings_endpoint(self, client: TestClient):
        """Test Gemini embeddings endpoint"""
        response = client.post("/api/v1/agents/knowledge/test-gemini-embeddings")
        
        assert response.status_code == 200
        result = response.json()
        api_helper.assert_success_response(result)
        
        # Should contain embedding information
        assert "embeddings" in result or "test_results" in result
    
    @pytest.mark.asyncio
    async def test_embedding_consistency(self, async_client: AsyncClient):
        """Test embedding consistency across requests"""
        # Create knowledge with same content twice
        knowledge_data = {
            "knowledge_type": "text",
            "name": "consistency_test_kb",
            "content": ["Consistent embedding test content"]
        }
        
        # First creation
        response1 = await async_client.post("/api/v1/agents/knowledge/create", json=knowledge_data)
        result1 = response1.json()
        api_helper.assert_success_response(result1)
        
        # Second creation (different name)
        knowledge_data["name"] = "consistency_test_kb_2"
        response2 = await async_client.post("/api/v1/agents/knowledge/create", json=knowledge_data)
        result2 = response2.json()
        api_helper.assert_success_response(result2)
        
        # Both should succeed
        assert result1["status"] == "success"
        assert result2["status"] == "success"


@pytest.mark.level2
@pytest.mark.integration
class TestKnowledgeAgentAPI:
    """Test knowledge-enabled agents via API"""
    
    def test_agent_with_single_knowledge_source(self, client: TestClient):
        """Test agent with single knowledge source"""
        chat_data = {
            "name": "SingleKnowledgeAgent",
            "model": "gemini/gemini-2.5-flash-lite",
            "message": "What information do you have?",
            "knowledge_sources": [
                {
                    "type": "text",
                    "name": "single_kb",
                    "content": [
                        "This is specialized knowledge about quantum computing",
                        "Quantum computers use quantum bits or qubits",
                        "Quantum algorithms can solve certain problems faster"
                    ]
                }
            ],
            "user_id": "single_kb_test"
        }
        
        response = client.post("/api/v1/agents/knowledge/chat", json=chat_data)
        
        assert response.status_code == 200
        result = response.json()
        api_helper.assert_success_response(result)
        assert "response" in result
    
    def test_agent_with_multiple_knowledge_sources(self, client: TestClient):
        """Test agent with multiple knowledge sources"""
        chat_data = {
            "name": "MultiKnowledgeAgent",
            "model": "gemini/gemini-2.5-flash-lite",
            "message": "Tell me about AI and quantum computing",
            "knowledge_sources": [
                {
                    "type": "text",
                    "name": "ai_kb",
                    "content": [
                        "Artificial intelligence mimics human intelligence",
                        "AI includes machine learning and deep learning"
                    ]
                },
                {
                    "type": "text",
                    "name": "quantum_kb",
                    "content": [
                        "Quantum computing uses quantum mechanics",
                        "Quantum computers can solve complex problems"
                    ]
                }
            ],
            "user_id": "multi_kb_test"
        }
        
        response = client.post("/api/v1/agents/knowledge/chat", json=chat_data)
        
        assert response.status_code == 200
        result = response.json()
        api_helper.assert_success_response(result)
        assert "response" in result
    
    def test_knowledge_agent_search_integration(self, client: TestClient):
        """Test knowledge agent with search integration"""
        chat_data = {
            "name": "SearchKnowledgeAgent",
            "model": "gemini/gemini-2.5-flash-lite",
            "message": "Search for information about machine learning",
            "knowledge_sources": [
                {
                    "type": "text",
                    "name": "ml_kb",
                    "content": [
                        "Machine learning is a method of data analysis",
                        "ML algorithms build models based on training data",
                        "Supervised learning uses labeled examples"
                    ]
                }
            ],
            "user_id": "search_kb_test"
        }
        
        response = client.post("/api/v1/agents/knowledge/chat", json=chat_data)
        
        assert response.status_code == 200
        result = response.json()
        api_helper.assert_success_response(result)
        assert "response" in result
        
        # Response should incorporate knowledge
        response_text = result["response"].lower()
        assert any(term in response_text for term in ["machine learning", "data", "algorithm"])
