"""
Tests for VexelChunkingFactory
"""

import pytest
from unittest.mock import Mock, patch
from app.agents.chunking_factory import (
    VexelChunkingFactory, 
    UserTier, 
    ChunkingStrategyType,
    VexelChunkingConfig
)
from agno.document.chunking.fixed import FixedSizeChunking
from agno.document.chunking.recursive import RecursiveChunking
from agno.document.chunking.document import DocumentChunking


class TestVexelChunkingFactory:
    """Test cases for VexelChunkingFactory"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.factory = VexelChunkingFactory()
    
    def test_normalize_file_type(self):
        """Test file type normalization"""
        # Test MIME types
        assert self.factory._normalize_file_type("application/pdf") == "pdf"
        assert self.factory._normalize_file_type("text/plain") == "txt"
        assert self.factory._normalize_file_type("application/json") == "json"
        
        # Test file extensions
        assert self.factory._normalize_file_type(".pdf") == "pdf"
        assert self.factory._normalize_file_type("pdf") == "pdf"
        assert self.factory._normalize_file_type("md") == "markdown"
        
        # Test unknown types
        assert self.factory._normalize_file_type("unknown") == "txt"
    
    def test_validate_strategy_access_free_tier(self):
        """Test strategy access validation for free tier"""
        # Free tier should have access to basic strategies
        self.factory._validate_strategy_access(ChunkingStrategyType.FIXED, UserTier.FREE)
        self.factory._validate_strategy_access(ChunkingStrategyType.RECURSIVE, UserTier.FREE)
        self.factory._validate_strategy_access(ChunkingStrategyType.DOCUMENT, UserTier.FREE)
        
        # Free tier should NOT have access to premium strategies
        with pytest.raises(ValueError, match="not available for tier"):
            self.factory._validate_strategy_access(ChunkingStrategyType.SEMANTIC, UserTier.FREE)
        
        with pytest.raises(ValueError, match="not available for tier"):
            self.factory._validate_strategy_access(ChunkingStrategyType.AGENTIC, UserTier.FREE)
    
    def test_validate_strategy_access_premium_tier(self):
        """Test strategy access validation for premium tier"""
        # Premium tier should have access to most strategies
        self.factory._validate_strategy_access(ChunkingStrategyType.FIXED, UserTier.PREMIUM)
        self.factory._validate_strategy_access(ChunkingStrategyType.RECURSIVE, UserTier.PREMIUM)
        self.factory._validate_strategy_access(ChunkingStrategyType.SEMANTIC, UserTier.PREMIUM)
        self.factory._validate_strategy_access(ChunkingStrategyType.MARKDOWN, UserTier.PREMIUM)
        
        # Premium tier should NOT have access to enterprise-only strategies
        with pytest.raises(ValueError, match="not available for tier"):
            self.factory._validate_strategy_access(ChunkingStrategyType.AGENTIC, UserTier.PREMIUM)
    
    def test_validate_strategy_access_enterprise_tier(self):
        """Test strategy access validation for enterprise tier"""
        # Enterprise tier should have access to all strategies
        for strategy in ChunkingStrategyType:
            if strategy != ChunkingStrategyType.AUTO:
                self.factory._validate_strategy_access(strategy, UserTier.ENTERPRISE)
    
    def test_select_auto_strategy_free_tier(self):
        """Test automatic strategy selection for free tier"""
        # PDF should use recursive for free tier
        strategy = self.factory._select_auto_strategy("pdf", UserTier.FREE, 10000)
        assert strategy == ChunkingStrategyType.RECURSIVE
        
        # TXT should use fixed for free tier
        strategy = self.factory._select_auto_strategy("txt", UserTier.FREE, 5000)
        assert strategy == ChunkingStrategyType.FIXED
        
        # CSV should use document for free tier
        strategy = self.factory._select_auto_strategy("csv", UserTier.FREE, 3000)
        assert strategy == ChunkingStrategyType.DOCUMENT
    
    def test_select_auto_strategy_premium_tier(self):
        """Test automatic strategy selection for premium tier"""
        # PDF with large content should use premium strategy
        strategy = self.factory._select_auto_strategy("pdf", UserTier.PREMIUM, 15000)
        assert strategy == ChunkingStrategyType.SEMANTIC  # Premium strategy for PDF
        
        # Markdown should use premium strategy
        strategy = self.factory._select_auto_strategy("markdown", UserTier.PREMIUM, 8000)
        assert strategy == ChunkingStrategyType.AGENTIC  # Premium strategy for markdown
    
    def test_get_adaptive_chunk_size(self):
        """Test adaptive chunk size calculation"""
        # Small content should get smaller chunks
        size = self.factory._get_adaptive_chunk_size(2000, 5000)
        assert size < 5000
        
        # Large content should get larger chunks
        size = self.factory._get_adaptive_chunk_size(150000, 5000)
        assert size > 5000
        
        # Normal content should get base size
        size = self.factory._get_adaptive_chunk_size(50000, 5000)
        assert size == 5000
    
    def test_create_strategy_fixed(self):
        """Test creation of fixed chunking strategy"""
        strategy = self.factory.create_strategy(
            file_type="txt",
            strategy_name=ChunkingStrategyType.FIXED,
            chunk_size=3000,
            overlap=100,
            user_tier=UserTier.FREE
        )
        
        assert isinstance(strategy, FixedSizeChunking)
        assert strategy.chunk_size == 3000
        assert strategy.overlap == 100
    
    def test_create_strategy_recursive(self):
        """Test creation of recursive chunking strategy"""
        strategy = self.factory.create_strategy(
            file_type="pdf",
            strategy_name=ChunkingStrategyType.RECURSIVE,
            chunk_size=4000,
            overlap=200,
            user_tier=UserTier.FREE
        )
        
        assert isinstance(strategy, RecursiveChunking)
        assert strategy.chunk_size == 4000
        assert strategy.overlap == 200
    
    def test_create_strategy_document(self):
        """Test creation of document chunking strategy"""
        strategy = self.factory.create_strategy(
            file_type="csv",
            strategy_name=ChunkingStrategyType.DOCUMENT,
            user_tier=UserTier.FREE
        )
        
        assert isinstance(strategy, DocumentChunking)
    
    def test_create_strategy_auto_selection(self):
        """Test automatic strategy selection"""
        # Auto selection for PDF should create recursive strategy for free tier
        strategy = self.factory.create_strategy(
            file_type="pdf",
            strategy_name=ChunkingStrategyType.AUTO,
            user_tier=UserTier.FREE
        )
        
        assert isinstance(strategy, RecursiveChunking)
    
    def test_create_strategy_fallback_on_error(self):
        """Test fallback to basic strategy when creation fails"""
        # Test with invalid parameters that should trigger fallback
        strategy = self.factory.create_strategy(
            file_type="unknown_type",
            strategy_name="invalid_strategy",
            user_tier=UserTier.FREE
        )
        
        # Should fallback to fixed chunking
        assert isinstance(strategy, FixedSizeChunking)
        assert strategy.chunk_size == 5000
        assert strategy.overlap == 0
    
    def test_get_available_strategies(self):
        """Test getting available strategies for different tiers"""
        # Free tier strategies
        free_strategies = self.factory.get_available_strategies(UserTier.FREE)
        assert ChunkingStrategyType.FIXED in free_strategies
        assert ChunkingStrategyType.RECURSIVE in free_strategies
        assert ChunkingStrategyType.SEMANTIC not in free_strategies
        
        # Premium tier strategies
        premium_strategies = self.factory.get_available_strategies(UserTier.PREMIUM)
        assert ChunkingStrategyType.SEMANTIC in premium_strategies
        assert ChunkingStrategyType.AGENTIC not in premium_strategies
        
        # Enterprise tier strategies
        enterprise_strategies = self.factory.get_available_strategies(UserTier.ENTERPRISE)
        assert ChunkingStrategyType.AGENTIC in enterprise_strategies
    
    def test_get_strategy_info(self):
        """Test getting strategy information"""
        info = self.factory.get_strategy_info("pdf", UserTier.FREE)
        
        assert info["file_type"] == "pdf"
        assert info["recommended_strategy"] == ChunkingStrategyType.RECURSIVE
        assert "rationale" in info
        assert "available_strategies" in info
        assert info["default_chunk_size"] == 3000
        assert info["default_overlap"] == 200
    
    def test_strategy_config_completeness(self):
        """Test that all file types have complete configurations"""
        for file_type, config in VexelChunkingConfig.OPTIMAL_CONFIGS.items():
            assert "strategy" in config
            assert "chunk_size" in config
            assert "overlap" in config
            assert "rationale" in config
            
            # Check that strategy is valid
            assert isinstance(config["strategy"], ChunkingStrategyType)
            
            # Check that sizes are reasonable
            assert 1000 <= config["chunk_size"] <= 10000
            assert 0 <= config["overlap"] < config["chunk_size"]
    
    def test_tier_strategy_availability(self):
        """Test that tier strategy mappings are complete"""
        for tier, strategies in VexelChunkingConfig.TIER_STRATEGIES.items():
            assert isinstance(tier, UserTier)
            assert len(strategies) > 0
            
            # All strategies should be valid
            for strategy in strategies:
                assert isinstance(strategy, ChunkingStrategyType)
            
            # Free tier should have basic strategies
            if tier == UserTier.FREE:
                assert ChunkingStrategyType.FIXED in strategies
                assert ChunkingStrategyType.RECURSIVE in strategies
            
            # Enterprise should have all strategies
            if tier == UserTier.ENTERPRISE:
                assert ChunkingStrategyType.AGENTIC in strategies
                assert ChunkingStrategyType.SEMANTIC in strategies
    
    @patch('app.agents.chunking_factory.GeminiEmbedder')
    def test_create_embedder_success(self, mock_embedder):
        """Test successful embedder creation"""
        factory = VexelChunkingFactory(gemini_api_key="test_key")
        embedder = factory._create_embedder()
        
        assert embedder is not None
        mock_embedder.assert_called_once()
    
    def test_create_embedder_no_api_key(self):
        """Test embedder creation without API key"""
        factory = VexelChunkingFactory(gemini_api_key=None)
        embedder = factory._create_embedder()
        
        assert embedder is None
    
    def test_semantic_strategy_fallback(self):
        """Test semantic strategy fallback when embedder unavailable"""
        factory = VexelChunkingFactory(gemini_api_key=None)
        
        # Should fallback to recursive when semantic is requested but embedder unavailable
        strategy = factory.create_strategy(
            file_type="pdf",
            strategy_name=ChunkingStrategyType.SEMANTIC,
            user_tier=UserTier.PREMIUM
        )
        
        # Should fallback to recursive chunking
        assert isinstance(strategy, RecursiveChunking)


class TestChunkingStrategyIntegration:
    """Integration tests for chunking strategies"""
    
    def test_strategy_with_real_document(self):
        """Test strategy with actual document content"""
        from agno.document import Document
        
        factory = VexelChunkingFactory()
        
        # Create a test document
        test_content = "This is a test document. " * 1000  # ~25,000 characters
        document = Document(content=test_content, meta_data={"test": True})
        
        # Test fixed chunking
        fixed_strategy = factory.create_strategy(
            file_type="txt",
            strategy_name=ChunkingStrategyType.FIXED,
            chunk_size=5000,
            overlap=100,
            user_tier=UserTier.FREE
        )
        
        chunks = fixed_strategy.chunk(document)
        assert len(chunks) > 1
        assert all(len(chunk.content) <= 5100 for chunk in chunks)  # Allow for overlap
    
    def test_different_strategies_same_document(self):
        """Test different strategies on the same document"""
        from agno.document import Document
        
        factory = VexelChunkingFactory()
        
        # Create a test document with structure
        test_content = """
        # Introduction
        This is the introduction section.
        
        ## Background
        This section provides background information.
        
        ### Details
        Here are the detailed explanations.
        
        # Conclusion
        This is the conclusion.
        """
        
        document = Document(content=test_content, meta_data={"test": True})
        
        # Test fixed vs recursive
        fixed_strategy = factory.create_strategy("txt", ChunkingStrategyType.FIXED, user_tier=UserTier.FREE)
        recursive_strategy = factory.create_strategy("txt", ChunkingStrategyType.RECURSIVE, user_tier=UserTier.FREE)
        
        fixed_chunks = fixed_strategy.chunk(document)
        recursive_chunks = recursive_strategy.chunk(document)
        
        # Both should produce chunks, but potentially different numbers
        assert len(fixed_chunks) >= 1
        assert len(recursive_chunks) >= 1
        
        # Recursive should respect natural boundaries better
        # (This is a basic test - in practice, you'd check for sentence/paragraph boundaries)
        assert all(chunk.content.strip() for chunk in recursive_chunks)


if __name__ == "__main__":
    pytest.main([__file__])
