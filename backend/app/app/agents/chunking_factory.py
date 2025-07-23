"""
Vexel Chunking Strategy Factory
Implements intelligent chunking strategy selection and configuration for optimal RAG performance
"""

import logging
from typing import Optional, Dict, Any, Union, List
from enum import Enum

from agno.document.chunking.strategy import ChunkingStrategy
from agno.document.chunking.fixed import FixedSizeChunking
from agno.document.chunking.recursive import RecursiveChunking
from agno.document.chunking.document import DocumentChunking
from agno.document.chunking.semantic import SemanticChunking
from agno.document.chunking.agentic import AgenticChunking
from agno.document.chunking.markdown import MarkdownChunking

from app.agents.gemini_embedder import GeminiEmbedder
from app.core.config import settings

logger = logging.getLogger(__name__)


class UserTier(str, Enum):
    """User tier enumeration for feature gating"""
    FREE = "free"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


class ChunkingStrategyType(str, Enum):
    """Available chunking strategy types"""
    AUTO = "auto"
    FIXED = "fixed"
    RECURSIVE = "recursive"
    DOCUMENT = "document"
    SEMANTIC = "semantic"
    AGENTIC = "agentic"
    MARKDOWN = "markdown"


class VexelChunkingConfig:
    """Configuration class for chunking strategies"""
    
    # File type specific optimal configurations
    OPTIMAL_CONFIGS = {
        "pdf": {
            "strategy": ChunkingStrategyType.RECURSIVE,
            "chunk_size": 3000,
            "overlap": 200,
            "premium_strategy": ChunkingStrategyType.SEMANTIC,
            "rationale": "PDFs often have complex layouts, recursive chunking preserves structure"
        },
        "txt": {
            "strategy": ChunkingStrategyType.FIXED,
            "chunk_size": 5000,
            "overlap": 100,
            "premium_strategy": ChunkingStrategyType.RECURSIVE,
            "rationale": "Plain text benefits from consistent chunking with minimal overlap"
        },
        "csv": {
            "strategy": ChunkingStrategyType.DOCUMENT,
            "chunk_size": 2000,
            "overlap": 0,
            "premium_strategy": ChunkingStrategyType.SEMANTIC,
            "rationale": "Structured data should preserve row/column relationships"
        },
        "markdown": {
            "strategy": ChunkingStrategyType.MARKDOWN,
            "chunk_size": 4000,
            "overlap": 150,
            "premium_strategy": ChunkingStrategyType.AGENTIC,
            "rationale": "Markdown structure (headers, sections) should be preserved"
        },
        "docx": {
            "strategy": ChunkingStrategyType.RECURSIVE,
            "chunk_size": 3500,
            "overlap": 175,
            "premium_strategy": ChunkingStrategyType.SEMANTIC,
            "rationale": "DOCX documents have structured content that benefits from recursive chunking"
        },
        "json": {
            "strategy": ChunkingStrategyType.DOCUMENT,
            "chunk_size": 2500,
            "overlap": 0,
            "premium_strategy": ChunkingStrategyType.SEMANTIC,
            "rationale": "JSON structure should be preserved to maintain data relationships"
        }
    }
    
    # User tier strategy availability
    TIER_STRATEGIES = {
        UserTier.FREE: [
            ChunkingStrategyType.AUTO,
            ChunkingStrategyType.FIXED,
            ChunkingStrategyType.RECURSIVE,
            ChunkingStrategyType.DOCUMENT
        ],
        UserTier.PREMIUM: [
            ChunkingStrategyType.AUTO,
            ChunkingStrategyType.FIXED,
            ChunkingStrategyType.RECURSIVE,
            ChunkingStrategyType.DOCUMENT,
            ChunkingStrategyType.SEMANTIC,
            ChunkingStrategyType.MARKDOWN
        ],
        UserTier.ENTERPRISE: [
            ChunkingStrategyType.AUTO,
            ChunkingStrategyType.FIXED,
            ChunkingStrategyType.RECURSIVE,
            ChunkingStrategyType.DOCUMENT,
            ChunkingStrategyType.SEMANTIC,
            ChunkingStrategyType.AGENTIC,
            ChunkingStrategyType.MARKDOWN
        ]
    }


class VexelChunkingFactory:
    """
    Factory class for creating optimal chunking strategies based on file type,
    user preferences, and tier-based feature availability
    """
    
    def __init__(self, gemini_api_key: Optional[str] = None):
        """Initialize the chunking factory"""
        self.gemini_api_key = gemini_api_key or getattr(settings, 'GEMINI_API_KEY', None)
        if not self.gemini_api_key:
            logger.warning("GEMINI_API_KEY not available - semantic chunking will be limited")
    
    def create_strategy(
        self,
        file_type: str,
        strategy_name: str = ChunkingStrategyType.AUTO,
        chunk_size: Optional[int] = None,
        overlap: Optional[int] = None,
        user_tier: UserTier = UserTier.FREE,
        content_length: Optional[int] = None,
        user_preferences: Optional[Dict[str, Any]] = None
    ) -> ChunkingStrategy:
        """
        Create optimal chunking strategy based on parameters
        
        Args:
            file_type: File extension or MIME type
            strategy_name: Requested strategy name or 'auto' for intelligent selection
            chunk_size: Override chunk size
            overlap: Override overlap size
            user_tier: User's subscription tier
            content_length: Length of content for adaptive sizing
            user_preferences: User-specific preferences
            
        Returns:
            Configured ChunkingStrategy instance
            
        Raises:
            ValueError: If strategy is not available for user tier
            RuntimeError: If strategy creation fails
        """
        try:
            # Normalize file type
            normalized_file_type = self._normalize_file_type(file_type)
            
            # Determine strategy
            if strategy_name == ChunkingStrategyType.AUTO:
                strategy_type = self._select_auto_strategy(
                    normalized_file_type, user_tier, content_length
                )
            else:
                strategy_type = ChunkingStrategyType(strategy_name)
                
            # Validate strategy availability for user tier
            self._validate_strategy_access(strategy_type, user_tier)
            
            # Get configuration
            config = self._get_strategy_config(
                normalized_file_type, strategy_type, chunk_size, overlap, content_length
            )
            
            # Create strategy instance
            strategy = self._create_strategy_instance(strategy_type, config)
            
            logger.info(
                f"Created {strategy_type} strategy for {normalized_file_type} "
                f"(user_tier={user_tier}, chunk_size={config['chunk_size']}, "
                f"overlap={config['overlap']})"
            )
            
            return strategy
            
        except Exception as e:
            logger.error(f"Failed to create chunking strategy: {str(e)}")
            # Fallback to basic fixed chunking
            return self._create_fallback_strategy()
    
    def _normalize_file_type(self, file_type: str) -> str:
        """Normalize file type to standard format"""
        # Handle MIME types
        mime_type_mapping = {
            "application/pdf": "pdf",
            "text/plain": "txt",
            "text/csv": "csv",
            "application/json": "json",
            "text/markdown": "markdown",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx"
        }
        
        if file_type in mime_type_mapping:
            return mime_type_mapping[file_type]
        
        # Handle file extensions
        if file_type.startswith('.'):
            file_type = file_type[1:]
        
        # Normalize common variations
        file_type = file_type.lower()
        if file_type in ['md']:
            return 'markdown'
        elif file_type in ['text', 'txt']:
            return 'txt'
        
        return file_type if file_type in VexelChunkingConfig.OPTIMAL_CONFIGS else 'txt'
    
    def _select_auto_strategy(
        self, 
        file_type: str, 
        user_tier: UserTier, 
        content_length: Optional[int]
    ) -> ChunkingStrategyType:
        """Intelligently select optimal strategy"""
        config = VexelChunkingConfig.OPTIMAL_CONFIGS.get(file_type, 
                                                        VexelChunkingConfig.OPTIMAL_CONFIGS['txt'])
        
        # Check if premium strategy is available and beneficial
        if (user_tier in [UserTier.PREMIUM, UserTier.ENTERPRISE] and 
            'premium_strategy' in config):
            premium_strategy = config['premium_strategy']
            
            # Use premium strategy for larger documents or specific conditions
            if content_length and content_length > 10000:
                return premium_strategy
            elif file_type in ['pdf', 'markdown', 'docx']:
                return premium_strategy
        
        return config['strategy']
    
    def _validate_strategy_access(self, strategy_type: ChunkingStrategyType, user_tier: UserTier):
        """Validate if user has access to requested strategy"""
        available_strategies = VexelChunkingConfig.TIER_STRATEGIES.get(user_tier, [])
        
        if strategy_type not in available_strategies:
            raise ValueError(
                f"Strategy '{strategy_type}' not available for tier '{user_tier}'. "
                f"Available strategies: {available_strategies}"
            )
    
    def _get_strategy_config(
        self,
        file_type: str,
        strategy_type: ChunkingStrategyType,
        chunk_size: Optional[int],
        overlap: Optional[int],
        content_length: Optional[int]
    ) -> Dict[str, Any]:
        """Get configuration for strategy"""
        base_config = VexelChunkingConfig.OPTIMAL_CONFIGS.get(
            file_type, VexelChunkingConfig.OPTIMAL_CONFIGS['txt']
        )
        
        # Start with base configuration
        config = {
            'chunk_size': chunk_size or base_config['chunk_size'],
            'overlap': overlap or base_config['overlap']
        }
        
        # Adaptive sizing based on content length
        if content_length:
            config['chunk_size'] = self._get_adaptive_chunk_size(
                content_length, config['chunk_size']
            )
        
        # Strategy-specific configurations
        if strategy_type == ChunkingStrategyType.SEMANTIC:
            config.update({
                'similarity_threshold': 0.6,
                'embedder': self._create_embedder()
            })
        elif strategy_type == ChunkingStrategyType.AGENTIC:
            config.update({
                'max_chunk_size': config['chunk_size'],
                'model': None  # Will use default OpenAI model
            })
        
        return config
    
    def _get_adaptive_chunk_size(self, content_length: int, base_size: int) -> int:
        """Adapt chunk size based on content length"""
        if content_length < 5000:
            return min(base_size, max(1000, content_length // 3))
        elif content_length > 100000:
            return int(base_size * 1.5)
        else:
            return base_size
    
    def _create_embedder(self) -> Optional[GeminiEmbedder]:
        """Create Gemini embedder for semantic chunking"""
        if not self.gemini_api_key:
            logger.warning("Cannot create Gemini embedder - API key not available")
            return None
            
        try:
            return GeminiEmbedder(
                id="text-embedding-004",
                api_key=self.gemini_api_key,
                task_type="SEMANTIC_SIMILARITY",
                dimensions=768
            )
        except Exception as e:
            logger.error(f"Failed to create Gemini embedder: {str(e)}")
            return None
    
    def _create_strategy_instance(
        self, 
        strategy_type: ChunkingStrategyType, 
        config: Dict[str, Any]
    ) -> ChunkingStrategy:
        """Create strategy instance based on type and configuration"""
        
        if strategy_type == ChunkingStrategyType.FIXED:
            return FixedSizeChunking(
                chunk_size=config['chunk_size'],
                overlap=config['overlap']
            )
        
        elif strategy_type == ChunkingStrategyType.RECURSIVE:
            return RecursiveChunking(
                chunk_size=config['chunk_size'],
                overlap=config['overlap']
            )
        
        elif strategy_type == ChunkingStrategyType.DOCUMENT:
            return DocumentChunking(
                chunk_size=config['chunk_size'],
                overlap=config['overlap']
            )
        
        elif strategy_type == ChunkingStrategyType.SEMANTIC:
            embedder = config.get('embedder')
            if not embedder:
                logger.warning("Semantic chunking requested but no embedder available, falling back to recursive")
                return RecursiveChunking(
                    chunk_size=config['chunk_size'],
                    overlap=config['overlap']
                )
            
            return SemanticChunking(
                embedder=embedder,
                chunk_size=config['chunk_size'],
                similarity_threshold=config.get('similarity_threshold', 0.6)
            )
        
        elif strategy_type == ChunkingStrategyType.AGENTIC:
            return AgenticChunking(
                model=config.get('model'),
                max_chunk_size=config['max_chunk_size']
            )
        
        elif strategy_type == ChunkingStrategyType.MARKDOWN:
            return MarkdownChunking(
                chunk_size=config['chunk_size'],
                overlap=config['overlap']
            )
        
        else:
            raise ValueError(f"Unknown strategy type: {strategy_type}")
    
    def _create_fallback_strategy(self) -> ChunkingStrategy:
        """Create fallback strategy when primary strategy fails"""
        logger.warning("Using fallback fixed chunking strategy")
        return FixedSizeChunking(chunk_size=5000, overlap=0)
    
    def get_available_strategies(self, user_tier: UserTier) -> List[ChunkingStrategyType]:
        """Get list of available strategies for user tier"""
        return VexelChunkingConfig.TIER_STRATEGIES.get(user_tier, [])
    
    def get_strategy_info(self, file_type: str, user_tier: UserTier) -> Dict[str, Any]:
        """Get information about optimal strategy for file type and user tier"""
        normalized_file_type = self._normalize_file_type(file_type)
        config = VexelChunkingConfig.OPTIMAL_CONFIGS.get(
            normalized_file_type, VexelChunkingConfig.OPTIMAL_CONFIGS['txt']
        )
        
        recommended_strategy = self._select_auto_strategy(normalized_file_type, user_tier, None)
        
        return {
            "file_type": normalized_file_type,
            "recommended_strategy": recommended_strategy,
            "default_chunk_size": config['chunk_size'],
            "default_overlap": config['overlap'],
            "rationale": config['rationale'],
            "available_strategies": self.get_available_strategies(user_tier),
            "premium_strategy": config.get('premium_strategy') if user_tier != UserTier.FREE else None
        }
