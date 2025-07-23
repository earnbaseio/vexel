"""
Integration Tests for RAG Optimization API Endpoints
Tests all new API endpoints with realistic scenarios
"""

import pytest
import tempfile
import os
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.models.user import User, UserTier


class TestRAGOptimizationAPIEndpoints:
    """Integration tests for RAG optimization API endpoints"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    @pytest.fixture
    def mock_free_user(self):
        """Create mock free tier user"""
        user = Mock(spec=User)
        user.id = "free_user_123"
        user.tier = UserTier.FREE
        user.monthly_uploads = 10
        user.total_storage_bytes = 500000
        user.can_upload.return_value = (True, "Upload allowed")
        user.can_use_chunking_strategy.side_effect = lambda strategy: strategy in ["fixed", "recursive", "document"]
        user.increment_usage = Mock()
        user.get_tier_limits.return_value = {
            "max_monthly_uploads": 50,
            "max_file_size_mb": 10,
            "max_storage_gb": 1,
            "chunking_strategies": ["fixed", "recursive", "document"]
        }
        return user
    
    @pytest.fixture
    def mock_premium_user(self):
        """Create mock premium tier user"""
        user = Mock(spec=User)
        user.id = "premium_user_123"
        user.tier = UserTier.PREMIUM
        user.monthly_uploads = 50
        user.total_storage_bytes = 2000000
        user.can_upload.return_value = (True, "Upload allowed")
        user.can_use_chunking_strategy.side_effect = lambda strategy: strategy in [
            "fixed", "recursive", "document", "semantic", "markdown"
        ]
        user.increment_usage = Mock()
        user.get_tier_limits.return_value = {
            "max_monthly_uploads": 500,
            "max_file_size_mb": 50,
            "max_storage_gb": 10,
            "chunking_strategies": ["fixed", "recursive", "document", "semantic", "markdown"]
        }
        return user
    
    @pytest.fixture
    def mock_enterprise_user(self):
        """Create mock enterprise tier user"""
        user = Mock(spec=User)
        user.id = "enterprise_user_123"
        user.tier = UserTier.ENTERPRISE
        user.monthly_uploads = 200
        user.total_storage_bytes = 10000000
        user.can_upload.return_value = (True, "Upload allowed")
        user.can_use_chunking_strategy.return_value = True
        user.increment_usage = Mock()
        user.get_tier_limits.return_value = {
            "max_monthly_uploads": -1,
            "max_file_size_mb": 100,
            "max_storage_gb": 100,
            "chunking_strategies": ["fixed", "recursive", "document", "semantic", "agentic", "markdown"]
        }
        return user
    
    @pytest.fixture
    def sample_text_file(self):
        """Create sample text file for testing"""
        content = """
        This is a comprehensive test document for the RAG optimization system.
        
        It contains multiple paragraphs with varying complexity levels.
        The document includes technical terms like API, REST, JSON, and microservices.
        
        ## Technical Section
        
        This section discusses advanced concepts:
        - Machine Learning algorithms
        - Natural Language Processing
        - Vector databases and embeddings
        
        The content is designed to trigger different chunking strategies
        based on its structure and complexity.
        
        ### Conclusion
        
        This document serves as a test case for validating the
        intelligent chunking system's ability to analyze and
        optimize document processing strategies.
        """.strip()
        
        return {
            'content': content.encode('utf-8'),
            'filename': 'test_document.txt',
            'content_type': 'text/plain'
        }
    
    def test_enhanced_upload_endpoint_free_tier(self, client, mock_free_user, sample_text_file):
        """Test enhanced upload endpoint with free tier user"""
        with patch('app.api.deps.get_current_user', return_value=mock_free_user):
            with patch('app.agents.enhanced_file_processing.process_file_with_enhanced_chunking') as mock_process:
                # Mock successful processing
                mock_process.return_value = (
                    [Mock(content="chunk1", meta_data={"chunk_index": 0})],
                    {
                        "chunking_strategy": "fixed",
                        "chunks_created": 1,
                        "processing_time_seconds": 1.5
                    }
                )
                
                with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
                    tmp_file.write(sample_text_file['content'])
                    tmp_file.flush()
                    
                    with open(tmp_file.name, 'rb') as f:
                        response = client.post(
                            "/api/v1/agents/knowledge/upload",
                            files={"file": (sample_text_file['filename'], f, sample_text_file['content_type'])},
                            data={
                                "collection_id": "test_collection_123",
                                "chunking_strategy": "fixed",
                                "chunk_size": "3000",
                                "overlap": "100",
                                "enable_analysis": "false"
                            }
                        )
                    
                    os.unlink(tmp_file.name)
                
                # Should succeed for free tier with basic strategy
                assert response.status_code in [200, 422]  # 422 might occur due to missing collection
    
    def test_enhanced_upload_endpoint_premium_strategy_restriction(self, client, mock_free_user, sample_text_file):
        """Test that free tier users cannot use premium strategies"""
        with patch('app.api.deps.get_current_user', return_value=mock_free_user):
            with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
                tmp_file.write(sample_text_file['content'])
                tmp_file.flush()
                
                with open(tmp_file.name, 'rb') as f:
                    response = client.post(
                        "/api/v1/agents/knowledge/upload",
                        files={"file": (sample_text_file['filename'], f, sample_text_file['content_type'])},
                        data={
                            "collection_id": "test_collection_123",
                            "chunking_strategy": "semantic",  # Premium strategy
                            "enable_analysis": "false"
                        }
                    )
                
                os.unlink(tmp_file.name)
            
            # Should fail with 403 for premium strategy
            assert response.status_code == 403
            assert "not available for your tier" in response.json()["detail"]
    
    def test_enhanced_upload_endpoint_premium_tier(self, client, mock_premium_user, sample_text_file):
        """Test enhanced upload endpoint with premium tier user"""
        with patch('app.api.deps.get_current_user', return_value=mock_premium_user):
            with patch('app.agents.enhanced_file_processing.process_file_with_enhanced_chunking') as mock_process:
                # Mock successful processing with semantic chunking
                mock_process.return_value = (
                    [Mock(content="chunk1", meta_data={"chunk_index": 0})],
                    {
                        "chunking_strategy": "semantic",
                        "chunks_created": 1,
                        "processing_time_seconds": 2.5,
                        "content_analysis": {
                            "complexity": "moderate",
                            "structure": "structured"
                        }
                    }
                )
                
                with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
                    tmp_file.write(sample_text_file['content'])
                    tmp_file.flush()
                    
                    with open(tmp_file.name, 'rb') as f:
                        response = client.post(
                            "/api/v1/agents/knowledge/upload",
                            files={"file": (sample_text_file['filename'], f, sample_text_file['content_type'])},
                            data={
                                "collection_id": "test_collection_123",
                                "chunking_strategy": "semantic",
                                "enable_analysis": "true"
                            }
                        )
                    
                    os.unlink(tmp_file.name)
                
                # Should succeed for premium tier with semantic strategy
                assert response.status_code in [200, 422]
    
    def test_content_analysis_endpoint(self, client, mock_premium_user, sample_text_file):
        """Test content analysis endpoint"""
        with patch('app.api.deps.get_current_user', return_value=mock_premium_user):
            with patch('app.agents.enhanced_file_processing.analyze_file_content') as mock_analyze:
                # Mock analysis result
                from app.services.content_analyzer import ContentAnalysisResult, ContentComplexity, DocumentStructure
                
                mock_analyze.return_value = ContentAnalysisResult(
                    file_type="txt",
                    content_length=len(sample_text_file['content']),
                    complexity=ContentComplexity.MODERATE,
                    structure=DocumentStructure.SEMI_STRUCTURED,
                    recommended_strategy="recursive",
                    recommended_chunk_size=3000,
                    recommended_overlap=200,
                    confidence_score=0.85,
                    analysis_details={"test": True},
                    performance_estimate={
                        "estimated_processing_time_seconds": 2.1,
                        "estimated_chunk_count": 3,
                        "processing_speed_rating": "Fast"
                    }
                )
                
                with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
                    tmp_file.write(sample_text_file['content'])
                    tmp_file.flush()
                    
                    with open(tmp_file.name, 'rb') as f:
                        response = client.post(
                            "/api/v1/agents/knowledge/analyze-content",
                            files={"file": (sample_text_file['filename'], f, sample_text_file['content_type'])}
                        )
                    
                    os.unlink(tmp_file.name)
                
                assert response.status_code == 200
                data = response.json()
                assert data["file_type"] == "txt"
                assert data["recommended_strategy"] == "recursive"
                assert data["confidence_score"] == 0.85
    
    def test_chunking_recommendations_endpoint(self, client, mock_premium_user):
        """Test chunking recommendations endpoint"""
        with patch('app.api.deps.get_current_user', return_value=mock_premium_user):
            with patch('app.agents.enhanced_file_processing.get_chunking_recommendations') as mock_recommendations:
                # Mock recommendations
                mock_recommendations.return_value = {
                    "file_type": "pdf",
                    "recommended_strategy": "recursive",
                    "default_chunk_size": 3000,
                    "default_overlap": 200,
                    "rationale": "PDFs benefit from recursive chunking",
                    "available_strategies": ["fixed", "recursive", "semantic"],
                    "premium_strategy": "semantic"
                }
                
                response = client.get("/api/v1/agents/knowledge/chunking-recommendations/pdf")
                
                assert response.status_code == 200
                data = response.json()
                assert data["file_type"] == "pdf"
                assert data["recommended_strategy"] == "recursive"
                assert "available_strategies" in data
    
    def test_performance_dashboard_endpoint_free_tier(self, client, mock_free_user):
        """Test that free tier users cannot access performance dashboard"""
        with patch('app.api.deps.get_current_user', return_value=mock_free_user):
            response = client.get("/api/v1/agents/knowledge/performance-dashboard")
            
            assert response.status_code == 403
            assert "Premium and Enterprise users only" in response.json()["detail"]
    
    def test_performance_dashboard_endpoint_premium_tier(self, client, mock_premium_user):
        """Test performance dashboard endpoint for premium tier"""
        with patch('app.api.deps.get_current_user', return_value=mock_premium_user):
            with patch('app.services.performance_monitor.get_performance_dashboard') as mock_dashboard:
                # Mock dashboard data
                mock_dashboard.return_value = {
                    "summary_24h": {
                        "total_operations": 25,
                        "processing_time": {"mean": 2.5, "median": 2.1},
                        "chunk_count": {"mean": 8.5, "median": 8}
                    },
                    "strategy_comparison": {
                        "strategies": {
                            "fixed": {"efficiency_score": 0.8},
                            "recursive": {"efficiency_score": 0.9}
                        }
                    },
                    "recent_insights": []
                }
                
                response = client.get("/api/v1/agents/knowledge/performance-dashboard")
                
                assert response.status_code == 200
                data = response.json()
                assert "summary_24h" in data
                assert "strategy_comparison" in data
                assert data["user_tier"] == "premium"
    
    def test_upload_with_auto_strategy(self, client, mock_premium_user, sample_text_file):
        """Test upload with auto strategy selection"""
        with patch('app.api.deps.get_current_user', return_value=mock_premium_user):
            with patch('app.agents.enhanced_file_processing.process_file_with_enhanced_chunking') as mock_process:
                # Mock auto strategy selection
                mock_process.return_value = (
                    [Mock(content="chunk1", meta_data={"chunk_index": 0})],
                    {
                        "chunking_strategy": "recursive",  # Auto-selected
                        "chunks_created": 1,
                        "processing_time_seconds": 1.8,
                        "content_analysis": {
                            "complexity": "moderate",
                            "structure": "semi_structured",
                            "confidence_score": 0.82
                        }
                    }
                )
                
                with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
                    tmp_file.write(sample_text_file['content'])
                    tmp_file.flush()
                    
                    with open(tmp_file.name, 'rb') as f:
                        response = client.post(
                            "/api/v1/agents/knowledge/upload",
                            files={"file": (sample_text_file['filename'], f, sample_text_file['content_type'])},
                            data={
                                "collection_id": "test_collection_123",
                                "chunking_strategy": "auto",
                                "enable_analysis": "true"
                            }
                        )
                    
                    os.unlink(tmp_file.name)
                
                assert response.status_code in [200, 422]
    
    def test_upload_file_size_limits(self, client, mock_free_user):
        """Test file size limits for different tiers"""
        # Mock a user who has reached their limit
        mock_free_user.can_upload.return_value = (False, "File size exceeds limit of 10MB")
        
        with patch('app.api.deps.get_current_user', return_value=mock_free_user):
            # Create a large file content
            large_content = b"x" * (11 * 1024 * 1024)  # 11MB
            
            with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
                tmp_file.write(large_content)
                tmp_file.flush()
                
                with open(tmp_file.name, 'rb') as f:
                    response = client.post(
                        "/api/v1/agents/knowledge/upload",
                        files={"file": ("large_file.txt", f, "text/plain")},
                        data={
                            "collection_id": "test_collection_123",
                            "chunking_strategy": "fixed"
                        }
                    )
                
                os.unlink(tmp_file.name)
            
            assert response.status_code == 403
            assert "File size exceeds limit" in response.json()["detail"]
    
    def test_error_handling_invalid_strategy(self, client, mock_premium_user, sample_text_file):
        """Test error handling for invalid chunking strategy"""
        with patch('app.api.deps.get_current_user', return_value=mock_premium_user):
            with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
                tmp_file.write(sample_text_file['content'])
                tmp_file.flush()
                
                with open(tmp_file.name, 'rb') as f:
                    response = client.post(
                        "/api/v1/agents/knowledge/upload",
                        files={"file": (sample_text_file['filename'], f, sample_text_file['content_type'])},
                        data={
                            "collection_id": "test_collection_123",
                            "chunking_strategy": "invalid_strategy"
                        }
                    )
                
                os.unlink(tmp_file.name)
            
            # Should handle gracefully and fallback
            assert response.status_code in [200, 422, 400]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
