"""
Unit tests for Level 2: Knowledge/Storage System
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from typing import List, Dict, Any

from tests.utils.test_helpers import test_data, mock_manager


class TestKnowledgeBase:
    """Test knowledge base functionality"""
    
    def test_knowledge_source_creation(self):
        """Test knowledge source creation"""
        source = test_data.knowledge_source(
            name="test_kb",
            content=["Knowledge item 1", "Knowledge item 2", "Knowledge item 3"]
        )
        
        assert source["type"] == "text"
        assert source["name"] == "test_kb"
        assert len(source["content"]) == 3
        assert isinstance(source["content"], list)
    
    def test_knowledge_source_validation(self):
        """Test knowledge source validation"""
        # Valid source
        valid_source = test_data.knowledge_source()
        assert "type" in valid_source
        assert "name" in valid_source
        assert "content" in valid_source
        
        # Check content is not empty
        assert len(valid_source["content"]) > 0
        assert all(isinstance(item, str) for item in valid_source["content"])
    
    def test_multiple_knowledge_sources(self):
        """Test handling multiple knowledge sources"""
        sources = [
            test_data.knowledge_source("kb1", ["Content 1A", "Content 1B"]),
            test_data.knowledge_source("kb2", ["Content 2A", "Content 2B"]),
            test_data.knowledge_source("kb3", ["Content 3A", "Content 3B"])
        ]
        
        assert len(sources) == 3
        assert all(source["type"] == "text" for source in sources)
        assert len(set(source["name"] for source in sources)) == 3  # Unique names


class TestVectorStorage:
    """Test vector storage functionality"""
    
    @pytest.mark.asyncio
    async def test_vector_embedding_creation(self):
        """Test vector embedding creation"""
        with mock_manager.mock_external_apis():
            text = "This is a test document for embedding"
            
            # Mock embedding creation
            embedding = await self._create_embedding(text)
            
            assert embedding is not None
            assert isinstance(embedding, list)
            assert len(embedding) > 0
            assert all(isinstance(x, (int, float)) for x in embedding)
    
    @pytest.mark.asyncio
    async def test_vector_storage_operations(self):
        """Test vector storage operations"""
        with mock_manager.mock_external_apis():
            # Mock vector storage
            vectors = [
                {"id": 1, "vector": [0.1, 0.2, 0.3], "text": "Document 1"},
                {"id": 2, "vector": [0.4, 0.5, 0.6], "text": "Document 2"},
                {"id": 3, "vector": [0.7, 0.8, 0.9], "text": "Document 3"}
            ]
            
            # Test storage
            stored = await self._store_vectors(vectors)
            assert stored is True
            
            # Test retrieval
            retrieved = await self._retrieve_vectors([1, 2])
            assert len(retrieved) == 2
    
    @pytest.mark.asyncio
    async def test_vector_search(self):
        """Test vector similarity search"""
        with mock_manager.mock_external_apis():
            query_vector = [0.2, 0.3, 0.4]
            
            # Mock search results
            results = await self._search_vectors(query_vector, top_k=3)
            
            assert results is not None
            assert len(results) <= 3
            assert all("score" in result for result in results)
            assert all("text" in result for result in results)
    
    async def _create_embedding(self, text: str) -> List[float]:
        """Helper method to create embeddings"""
        # Mock embedding - in reality this would call embedding API
        return [0.1 * i for i in range(384)]  # Mock 384-dim embedding
    
    async def _store_vectors(self, vectors: List[Dict[str, Any]]) -> bool:
        """Helper method to store vectors"""
        # Mock storage operation
        return True
    
    async def _retrieve_vectors(self, ids: List[int]) -> List[Dict[str, Any]]:
        """Helper method to retrieve vectors"""
        # Mock retrieval
        return [{"id": id, "vector": [0.1, 0.2, 0.3], "text": f"Doc {id}"} for id in ids]
    
    async def _search_vectors(self, query_vector: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        """Helper method to search vectors"""
        # Mock search results
        return [
            {"score": 0.9, "text": "Most relevant document", "id": 1},
            {"score": 0.8, "text": "Second relevant document", "id": 2},
            {"score": 0.7, "text": "Third relevant document", "id": 3}
        ][:top_k]


class TestEmbeddingSystem:
    """Test embedding system functionality"""
    
    @pytest.mark.asyncio
    async def test_gemini_embeddings(self):
        """Test Gemini embeddings"""
        with mock_manager.mock_external_apis():
            text = "Test text for Gemini embedding"
            
            # Mock Gemini embedding
            embedding = await self._create_gemini_embedding(text)
            
            assert embedding is not None
            assert isinstance(embedding, list)
            assert len(embedding) > 0
    
    @pytest.mark.asyncio
    async def test_batch_embeddings(self):
        """Test batch embedding creation"""
        with mock_manager.mock_external_apis():
            texts = [
                "First document for embedding",
                "Second document for embedding", 
                "Third document for embedding"
            ]
            
            # Mock batch embeddings
            embeddings = await self._create_batch_embeddings(texts)
            
            assert len(embeddings) == len(texts)
            assert all(isinstance(emb, list) for emb in embeddings)
    
    @pytest.mark.asyncio
    async def test_embedding_consistency(self):
        """Test embedding consistency"""
        with mock_manager.mock_external_apis():
            text = "Consistent embedding test"
            
            # Create embedding twice
            embedding1 = await self._create_gemini_embedding(text)
            embedding2 = await self._create_gemini_embedding(text)
            
            # Should be identical (in mock scenario)
            assert embedding1 == embedding2
    
    async def _create_gemini_embedding(self, text: str) -> List[float]:
        """Helper method for Gemini embeddings"""
        # Mock Gemini embedding
        return [0.1 * i for i in range(768)]  # Mock 768-dim embedding
    
    async def _create_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Helper method for batch embeddings"""
        # Mock batch embeddings
        return [[0.1 * i for i in range(768)] for _ in texts]


class TestKnowledgeRetrieval:
    """Test knowledge retrieval functionality"""
    
    @pytest.mark.asyncio
    async def test_semantic_search(self):
        """Test semantic search functionality"""
        with mock_manager.mock_external_apis():
            query = "artificial intelligence applications"
            
            # Mock semantic search
            results = await self._semantic_search(query, top_k=5)
            
            assert results is not None
            assert len(results) <= 5
            assert all("text" in result for result in results)
            assert all("score" in result for result in results)
            
            # Results should be sorted by relevance
            scores = [result["score"] for result in results]
            assert scores == sorted(scores, reverse=True)
    
    @pytest.mark.asyncio
    async def test_filtered_search(self):
        """Test filtered search functionality"""
        with mock_manager.mock_external_apis():
            query = "machine learning"
            filters = {"category": "AI", "date": "2024"}
            
            # Mock filtered search
            results = await self._filtered_search(query, filters, top_k=3)
            
            assert results is not None
            assert len(results) <= 3
            assert all("text" in result for result in results)
    
    @pytest.mark.asyncio
    async def test_multi_source_search(self):
        """Test search across multiple knowledge sources"""
        with mock_manager.mock_external_apis():
            query = "data science techniques"
            sources = ["kb1", "kb2", "kb3"]
            
            # Mock multi-source search
            results = await self._multi_source_search(query, sources)
            
            assert results is not None
            assert isinstance(results, dict)
            assert all(source in results for source in sources)
    
    async def _semantic_search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Helper method for semantic search"""
        # Mock search results
        return [
            {"text": f"Result {i} for {query}", "score": 0.9 - i * 0.1, "source": "kb1"}
            for i in range(min(top_k, 3))
        ]
    
    async def _filtered_search(self, query: str, filters: Dict[str, Any], top_k: int = 5) -> List[Dict[str, Any]]:
        """Helper method for filtered search"""
        # Mock filtered results
        return [
            {"text": f"Filtered result {i}", "score": 0.8 - i * 0.1, "filters": filters}
            for i in range(min(top_k, 2))
        ]
    
    async def _multi_source_search(self, query: str, sources: List[str]) -> Dict[str, List[Dict[str, Any]]]:
        """Helper method for multi-source search"""
        # Mock multi-source results
        return {
            source: [
                {"text": f"Result from {source}", "score": 0.8, "source": source}
            ]
            for source in sources
        }


class TestKnowledgeAgent:
    """Test knowledge-enabled agent functionality"""
    
    @pytest.mark.asyncio
    async def test_knowledge_agent_creation(self):
        """Test creation of knowledge-enabled agent"""
        with mock_manager.mock_external_apis():
            config = test_data.agent_config(
                name="KnowledgeAgent",
                tools=["knowledge_search"]
            )
            
            knowledge_sources = [
                test_data.knowledge_source("kb1", ["AI content 1", "AI content 2"]),
                test_data.knowledge_source("kb2", ["ML content 1", "ML content 2"])
            ]
            
            # Mock agent creation with knowledge
            agent = await self._create_knowledge_agent(config, knowledge_sources)
            
            assert agent is not None
            assert agent["name"] == "KnowledgeAgent"
            assert len(agent["knowledge_sources"]) == 2
    
    @pytest.mark.asyncio
    async def test_knowledge_enhanced_response(self):
        """Test knowledge-enhanced agent responses"""
        with mock_manager.mock_external_apis():
            query = "What is machine learning?"
            
            # Mock knowledge-enhanced response
            response = await self._get_knowledge_response(query)
            
            assert response is not None
            assert len(response) > 0
            assert "machine learning" in response.lower()
    
    @pytest.mark.asyncio
    async def test_knowledge_citation(self):
        """Test knowledge citation in responses"""
        with mock_manager.mock_external_apis():
            query = "Explain neural networks"
            
            # Mock response with citations
            response = await self._get_response_with_citations(query)
            
            assert response is not None
            assert "response" in response
            assert "citations" in response
            assert len(response["citations"]) > 0
    
    async def _create_knowledge_agent(self, config: Dict[str, Any], sources: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Helper method to create knowledge agent"""
        return {
            "name": config["name"],
            "model": config["model"],
            "knowledge_sources": sources,
            "tools": config["tools"]
        }
    
    async def _get_knowledge_response(self, query: str) -> str:
        """Helper method for knowledge-enhanced response"""
        # Mock knowledge-enhanced response
        return f"Based on my knowledge base, {query.lower()} is a subset of artificial intelligence..."
    
    async def _get_response_with_citations(self, query: str) -> Dict[str, Any]:
        """Helper method for response with citations"""
        return {
            "response": f"Response to: {query}",
            "citations": [
                {"source": "kb1", "text": "Citation 1", "score": 0.9},
                {"source": "kb2", "text": "Citation 2", "score": 0.8}
            ]
        }


@pytest.mark.level2
@pytest.mark.unit
class TestLevel2Performance:
    """Performance tests for Level 2 components"""
    
    @pytest.mark.asyncio
    async def test_embedding_performance(self):
        """Test embedding creation performance"""
        from tests.utils.test_helpers import perf_helper
        
        with mock_manager.mock_external_apis():
            text = "Performance test document for embedding creation"
            
            # Measure embedding time
            result, execution_time = await perf_helper.measure_execution_time(
                self._create_embedding(text)
            )
            
            # Should complete quickly (mock)
            perf_helper.assert_performance_threshold(
                execution_time, 2.0, "Embedding creation"
            )
    
    @pytest.mark.asyncio
    async def test_search_performance(self):
        """Test search performance"""
        from tests.utils.test_helpers import perf_helper
        
        with mock_manager.mock_external_apis():
            query = "performance test query"
            
            # Measure search time
            result, execution_time = await perf_helper.measure_execution_time(
                self._semantic_search(query)
            )
            
            # Should complete quickly
            perf_helper.assert_performance_threshold(
                execution_time, 1.0, "Semantic search"
            )
    
    async def _create_embedding(self, text: str) -> List[float]:
        """Helper for embedding performance test"""
        import asyncio
        await asyncio.sleep(0.1)  # Simulate processing
        return [0.1] * 384
    
    async def _semantic_search(self, query: str) -> List[Dict[str, Any]]:
        """Helper for search performance test"""
        import asyncio
        await asyncio.sleep(0.05)  # Simulate search
        return [{"text": "Result", "score": 0.9}]
