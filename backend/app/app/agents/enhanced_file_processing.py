"""
Enhanced File Processing with Advanced Chunking
Integrates VexelChunkingFactory and ContentAnalyzer for optimal document processing
"""

import logging
import time
from typing import List, Dict, Any, Optional, Tuple
from agno.document import Document

from app.agents.file_processing import process_uploaded_file as basic_process_file
from app.agents.chunking_factory import VexelChunkingFactory, UserTier, ChunkingStrategyType
from app.services.content_analyzer import VexelContentAnalyzer, ContentAnalysisResult
from app.services.performance_monitor import record_processing_performance

logger = logging.getLogger(__name__)


class EnhancedFileProcessor:
    """
    Enhanced file processor that uses intelligent chunking strategies
    """
    
    def __init__(self, gemini_api_key: Optional[str] = None):
        """Initialize the enhanced file processor"""
        self.chunking_factory = VexelChunkingFactory(gemini_api_key)
        self.content_analyzer = VexelContentAnalyzer()
    
    def process_file_with_chunking(
        self,
        file_content: bytes,
        filename: str,
        file_type: str,
        chunking_strategy: str = "auto",
        chunk_size: Optional[int] = None,
        overlap: Optional[int] = None,
        user_tier: UserTier = UserTier.FREE,
        enable_analysis: bool = False
    ) -> Tuple[List[Document], Dict[str, Any]]:
        """
        Process file with advanced chunking strategies
        
        Args:
            file_content: Raw file content
            filename: Original filename
            file_type: File type/MIME type
            chunking_strategy: Strategy to use
            chunk_size: Override chunk size
            overlap: Override overlap
            user_tier: User's subscription tier
            enable_analysis: Whether to perform content analysis
            
        Returns:
            Tuple of (processed documents, processing metadata)
        """
        start_time = time.time()
        
        try:
            # Step 1: Basic file processing to extract text content
            logger.info(f"Processing file: {filename} ({file_type})")
            basic_documents = basic_process_file(file_content, filename, file_type)
            
            if not basic_documents:
                raise ValueError("No content extracted from file")
            
            # Combine all content for analysis and chunking
            combined_content = "\n\n".join([doc.content for doc in basic_documents])
            content_length = len(combined_content)
            
            # Step 2: Content analysis (if enabled)
            analysis_result = None
            if enable_analysis:
                logger.info("Performing content analysis...")
                analysis_result = self.content_analyzer.analyze_content(
                    combined_content, 
                    self._normalize_file_type(file_type),
                    filename
                )
                
                # Use analysis recommendations if strategy is auto
                if chunking_strategy == "auto":
                    chunking_strategy = analysis_result.recommended_strategy
                    chunk_size = chunk_size or analysis_result.recommended_chunk_size
                    overlap = overlap or analysis_result.recommended_overlap
            
            # Step 3: Create chunking strategy
            logger.info(f"Creating chunking strategy: {chunking_strategy}")
            strategy = self.chunking_factory.create_strategy(
                file_type=self._normalize_file_type(file_type),
                strategy_name=chunking_strategy,
                chunk_size=chunk_size,
                overlap=overlap,
                user_tier=user_tier,
                content_length=content_length
            )
            
            # Step 4: Apply chunking strategy
            logger.info("Applying chunking strategy...")
            
            # Create a single document with all content for chunking
            combined_document = Document(
                content=combined_content,
                meta_data={
                    "filename": filename,
                    "file_type": file_type,
                    "original_document_count": len(basic_documents),
                    "processing_method": "enhanced_chunking"
                }
            )
            
            # Apply chunking
            chunked_documents = strategy.chunk(combined_document)
            
            # Step 5: Enhance metadata
            processing_time = time.time() - start_time
            
            for i, doc in enumerate(chunked_documents):
                if not hasattr(doc, 'meta_data') or doc.meta_data is None:
                    doc.meta_data = {}
                
                # Add chunking metadata
                doc.meta_data.update({
                    "chunking_strategy": chunking_strategy,
                    "chunk_size_used": chunk_size or "auto",
                    "overlap_used": overlap or "auto",
                    "chunk_index": i,
                    "total_chunks": len(chunked_documents),
                    "chunk_length": len(doc.content),
                    "processing_time": processing_time
                })
                
                # Preserve original metadata
                doc.meta_data.update(combined_document.meta_data)
            
            # Step 6: Create processing metadata
            processing_metadata = {
                "chunking_strategy": chunking_strategy,
                "chunk_size": chunk_size,
                "overlap": overlap,
                "chunks_created": len(chunked_documents),
                "processing_time_seconds": round(processing_time, 3),
                "content_length": content_length,
                "user_tier": user_tier,
                "analysis_enabled": enable_analysis
            }
            
            if analysis_result:
                processing_metadata.update({
                    "content_analysis": {
                        "complexity": analysis_result.complexity,
                        "structure": analysis_result.structure,
                        "confidence_score": analysis_result.confidence_score,
                        "performance_estimate": analysis_result.performance_estimate
                    }
                })
            
            logger.info(
                f"File processing completed: {len(chunked_documents)} chunks created "
                f"in {processing_time:.3f}s using {chunking_strategy} strategy"
            )

            # Record performance metrics
            record_processing_performance(
                processing_time=processing_time,
                file_type=self._normalize_file_type(file_type),
                chunking_strategy=chunking_strategy,
                user_tier=str(user_tier),
                file_size_bytes=len(file_content),
                chunk_count=len(chunked_documents),
                success=True,
                additional_metadata={
                    "content_length": content_length,
                    "analysis_enabled": enable_analysis,
                    "filename": filename
                }
            )

            return chunked_documents, processing_metadata
            
        except Exception as e:
            logger.error(f"Enhanced file processing failed: {str(e)}")

            # Record failure metrics
            record_processing_performance(
                processing_time=time.time() - start_time,
                file_type=self._normalize_file_type(file_type),
                chunking_strategy=chunking_strategy,
                user_tier=str(user_tier),
                file_size_bytes=len(file_content),
                chunk_count=0,
                success=False,
                additional_metadata={
                    "error": str(e),
                    "filename": filename
                }
            )

            # Fallback to basic processing
            return self._fallback_processing(file_content, filename, file_type, start_time)
    
    def _normalize_file_type(self, file_type: str) -> str:
        """Normalize file type for processing"""
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
        
        return file_type.lower()
    
    def _fallback_processing(
        self,
        file_content: bytes,
        filename: str,
        file_type: str,
        start_time: float
    ) -> Tuple[List[Document], Dict[str, Any]]:
        """Fallback to fixed chunking when enhanced processing fails"""
        logger.warning("Using fallback fixed chunking")

        try:
            # Use fixed chunking as fallback
            from agno.document.chunking.fixed import FixedSizeChunking
            from agno.document import Document

            # Extract basic content
            documents = basic_process_file(file_content, filename, file_type)
            combined_content = "\n\n".join([doc.content for doc in documents])

            # Apply fixed chunking
            fallback_strategy = FixedSizeChunking(chunk_size=5000, overlap=0)
            combined_document = Document(
                content=combined_content,
                meta_data={"filename": filename, "file_type": file_type}
            )

            chunked_documents = fallback_strategy.chunk(combined_document)
            processing_time = time.time() - start_time

            # Add metadata
            for i, doc in enumerate(chunked_documents):
                if not hasattr(doc, 'meta_data') or doc.meta_data is None:
                    doc.meta_data = {}

                doc.meta_data.update({
                    "chunking_strategy": "fixed_fallback",
                    "chunk_index": i,
                    "total_chunks": len(chunked_documents),
                    "processing_time": processing_time
                })

            processing_metadata = {
                "chunking_strategy": "fixed_fallback",
                "chunks_created": len(chunked_documents),
                "processing_time_seconds": round(processing_time, 3),
                "fallback_used": True,
                "error": "Enhanced processing failed, used fixed chunking fallback"
            }

            return chunked_documents, processing_metadata

        except Exception as e:
            logger.error(f"Fallback processing also failed: {str(e)}")
            raise ValueError(f"File processing failed: {str(e)}")
    
    def analyze_content_only(
        self,
        file_content: bytes,
        filename: str,
        file_type: str
    ) -> ContentAnalysisResult:
        """
        Analyze content without processing the file
        Useful for providing recommendations before upload
        """
        try:
            # Extract text content
            basic_documents = basic_process_file(file_content, filename, file_type)
            combined_content = "\n\n".join([doc.content for doc in basic_documents])
            
            # Perform analysis
            return self.content_analyzer.analyze_content(
                combined_content,
                self._normalize_file_type(file_type),
                filename
            )
            
        except Exception as e:
            logger.error(f"Content analysis failed: {str(e)}")
            raise ValueError(f"Content analysis failed: {str(e)}")
    
    def get_strategy_recommendations(
        self,
        file_type: str,
        user_tier: UserTier,
        content_length: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get strategy recommendations for a file type and user tier"""
        return self.chunking_factory.get_strategy_info(file_type, user_tier)


# Global instance for use in endpoints
enhanced_processor = EnhancedFileProcessor()


def process_file_with_enhanced_chunking(
    file_content: bytes,
    filename: str,
    file_type: str,
    chunking_strategy: str = "auto",
    chunk_size: Optional[int] = None,
    overlap: Optional[int] = None,
    user_tier: UserTier = UserTier.FREE,
    enable_analysis: bool = False
) -> Tuple[List[Document], Dict[str, Any]]:
    """
    Convenience function for enhanced file processing
    """
    return enhanced_processor.process_file_with_chunking(
        file_content=file_content,
        filename=filename,
        file_type=file_type,
        chunking_strategy=chunking_strategy,
        chunk_size=chunk_size,
        overlap=overlap,
        user_tier=user_tier,
        enable_analysis=enable_analysis
    )


def analyze_file_content(
    file_content: bytes,
    filename: str,
    file_type: str
) -> ContentAnalysisResult:
    """
    Convenience function for content analysis
    """
    return enhanced_processor.analyze_content_only(file_content, filename, file_type)


def get_chunking_recommendations(
    file_type: str,
    user_tier: UserTier,
    content_length: Optional[int] = None
) -> Dict[str, Any]:
    """
    Convenience function for getting chunking recommendations
    """
    return enhanced_processor.get_strategy_recommendations(file_type, user_tier, content_length)
