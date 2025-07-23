"""
Tests for VexelContentAnalyzer
"""

import pytest
from app.services.content_analyzer import (
    VexelContentAnalyzer,
    ContentComplexity,
    DocumentStructure,
    ContentAnalysisResult
)


class TestVexelContentAnalyzer:
    """Test cases for VexelContentAnalyzer"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.analyzer = VexelContentAnalyzer()
    
    def test_analyze_simple_text(self):
        """Test analysis of simple text content"""
        content = "This is a simple text document. It has a few sentences. Nothing too complex here."
        
        result = self.analyzer.analyze_content(content, "txt", "simple.txt")
        
        assert isinstance(result, ContentAnalysisResult)
        assert result.file_type == "txt"
        assert result.content_length == len(content)
        assert result.complexity in [ContentComplexity.SIMPLE, ContentComplexity.MODERATE]
        assert result.structure == DocumentStructure.UNSTRUCTURED
        assert result.recommended_strategy in ["fixed", "recursive"]
        assert 0.0 <= result.confidence_score <= 1.0
    
    def test_analyze_structured_markdown(self):
        """Test analysis of structured markdown content"""
        content = """
        # Main Title
        
        This is the introduction paragraph.
        
        ## Section 1
        
        This section contains:
        - Item 1
        - Item 2
        - Item 3
        
        ### Subsection 1.1
        
        More detailed content here.
        
        ## Section 2
        
        Another section with different content.
        
        ```python
        def example_function():
            return "Hello, World!"
        ```
        
        ## Conclusion
        
        Final thoughts and summary.
        """
        
        result = self.analyzer.analyze_content(content, "markdown", "structured.md")
        
        assert result.file_type == "markdown"
        assert result.structure in [DocumentStructure.STRUCTURED, DocumentStructure.HIGHLY_STRUCTURED]
        assert result.recommended_strategy == "markdown"
        assert result.confidence_score > 0.7  # Should be confident about markdown structure
    
    def test_analyze_technical_content(self):
        """Test analysis of technical/complex content"""
        content = """
        The implementation utilizes a RESTful API architecture with OAuth 2.0 authentication.
        The system processes HTTP/HTTPS requests through a load balancer (nginx) that 
        distributes traffic across multiple application servers running Node.js v18.x.
        
        Key components include:
        - Database: PostgreSQL 14.2 with connection pooling
        - Cache: Redis 6.2.7 for session management
        - Message Queue: RabbitMQ 3.9.x for asynchronous processing
        
        Performance metrics show 99.9% uptime with average response times of 150ms.
        The system handles approximately 10,000 requests/second during peak hours.
        
        Configuration parameters:
        - max_connections: 1000
        - timeout: 30000ms
        - retry_attempts: 3
        """
        
        result = self.analyzer.analyze_content(content, "txt", "technical.txt")
        
        assert result.complexity in [ContentComplexity.COMPLEX, ContentComplexity.HIGHLY_COMPLEX]
        assert result.structure in [DocumentStructure.SEMI_STRUCTURED, DocumentStructure.STRUCTURED]
        # Technical content should get smaller chunks with more overlap
        assert result.recommended_chunk_size <= 4000
        assert result.recommended_overlap >= 100
    
    def test_analyze_csv_content(self):
        """Test analysis of CSV-like structured content"""
        content = """
        Name,Age,Department,Salary
        John Doe,30,Engineering,75000
        Jane Smith,25,Marketing,65000
        Bob Johnson,35,Sales,70000
        Alice Brown,28,Engineering,80000
        """
        
        result = self.analyzer.analyze_content(content, "csv", "data.csv")
        
        assert result.file_type == "csv"
        assert result.structure in [DocumentStructure.STRUCTURED, DocumentStructure.HIGHLY_STRUCTURED]
        assert result.recommended_strategy == "document"
        assert result.recommended_overlap == 0  # CSV shouldn't need overlap
    
    def test_analyze_very_short_content(self):
        """Test analysis of very short content"""
        content = "Short text."
        
        result = self.analyzer.analyze_content(content, "txt", "short.txt")
        
        assert result.content_length == len(content)
        assert result.complexity == ContentComplexity.SIMPLE
        assert result.recommended_chunk_size <= len(content)
    
    def test_analyze_very_long_content(self):
        """Test analysis of very long content"""
        content = "This is a long document. " * 5000  # ~125,000 characters
        
        result = self.analyzer.analyze_content(content, "txt", "long.txt")
        
        assert result.content_length == len(content)
        # Long content should get larger chunks
        assert result.recommended_chunk_size >= 5000
    
    def test_structure_analysis_headers(self):
        """Test structure analysis with various header types"""
        content = """
        # Markdown Header
        
        UPPERCASE HEADER
        
        1. Numbered Section
        
        I. Roman Numeral Section
        
        Regular paragraph text here.
        """
        
        structure_analysis = self.analyzer._analyze_structure(content, "markdown")
        
        assert structure_analysis["structure"] in [DocumentStructure.STRUCTURED, DocumentStructure.HIGHLY_STRUCTURED]
        assert structure_analysis["structure_scores"]["headers"] > 0
        assert structure_analysis["total_structure_score"] > 0.1
    
    def test_structure_analysis_lists(self):
        """Test structure analysis with lists"""
        content = """
        Here are some items:
        - Bullet point 1
        - Bullet point 2
        * Another bullet
        
        Numbered list:
        1. First item
        2. Second item
        3. Third item
        
        Lettered list:
        a) Option A
        b) Option B
        """
        
        structure_analysis = self.analyzer._analyze_structure(content, "txt")
        
        assert structure_analysis["structure_scores"]["lists"] > 0
        assert structure_analysis["structure"] != DocumentStructure.UNSTRUCTURED
    
    def test_complexity_analysis_simple(self):
        """Test complexity analysis for simple content"""
        content = "This is simple. Short words. Easy to read."
        
        complexity_analysis = self.analyzer._analyze_complexity(content, "txt")
        
        assert complexity_analysis["complexity"] == ContentComplexity.SIMPLE
        assert complexity_analysis["avg_words_per_sentence"] < 10
        assert complexity_analysis["technical_ratio"] < 0.01
    
    def test_complexity_analysis_technical(self):
        """Test complexity analysis for technical content"""
        content = """
        The implementation leverages microservices architecture with containerization (Docker)
        and orchestration (Kubernetes). API endpoints utilize RESTful conventions with
        JSON payloads. Authentication employs JWT tokens with RSA-256 encryption.
        Database operations use ORM patterns with connection pooling and query optimization.
        """
        
        complexity_analysis = self.analyzer._analyze_complexity(content, "txt")
        
        assert complexity_analysis["complexity"] in [ContentComplexity.COMPLEX, ContentComplexity.HIGHLY_COMPLEX]
        assert complexity_analysis["technical_ratio"] > 0.05
        assert complexity_analysis["avg_word_length"] > 5
    
    def test_performance_estimation(self):
        """Test performance estimation for different strategies"""
        content = "Test content " * 1000  # ~13,000 characters
        
        # Test different strategies
        fixed_perf = self.analyzer._estimate_performance(len(content), "fixed")
        semantic_perf = self.analyzer._estimate_performance(len(content), "semantic")
        agentic_perf = self.analyzer._estimate_performance(len(content), "agentic")
        
        # Semantic should be slower than fixed
        assert semantic_perf["estimated_processing_time_seconds"] > fixed_perf["estimated_processing_time_seconds"]
        
        # Agentic should be slowest
        assert agentic_perf["estimated_processing_time_seconds"] > semantic_perf["estimated_processing_time_seconds"]
        
        # All should have reasonable chunk estimates
        assert fixed_perf["estimated_chunk_count"] > 0
        assert semantic_perf["estimated_chunk_count"] > 0
        assert agentic_perf["estimated_chunk_count"] > 0
    
    def test_strategy_recommendation_pdf(self):
        """Test strategy recommendation for PDF content"""
        content = """
        This is a PDF document with multiple paragraphs.
        
        It has structured content with clear sections.
        
        The content is moderately complex with technical terms.
        """
        
        structure_analysis = self.analyzer._analyze_structure(content, "pdf")
        complexity_analysis = self.analyzer._analyze_complexity(content, "pdf")
        
        recommendation = self.analyzer._recommend_strategy(
            "pdf", structure_analysis, complexity_analysis, len(content)
        )
        
        assert recommendation["strategy"] == "recursive"
        assert recommendation["confidence"] > 0.5
        assert "reasoning" in recommendation
    
    def test_strategy_recommendation_markdown(self):
        """Test strategy recommendation for Markdown content"""
        content = """
        # Title
        
        ## Section
        
        - List item
        - Another item
        
        ### Subsection
        
        Content here.
        """
        
        structure_analysis = self.analyzer._analyze_structure(content, "markdown")
        complexity_analysis = self.analyzer._analyze_complexity(content, "markdown")
        
        recommendation = self.analyzer._recommend_strategy(
            "markdown", structure_analysis, complexity_analysis, len(content)
        )
        
        assert recommendation["strategy"] == "markdown"
        assert recommendation["confidence"] > 0.7
    
    def test_fallback_analysis(self):
        """Test fallback analysis when main analysis fails"""
        # Test with None content to trigger error
        result = self.analyzer._get_default_analysis("", "txt")
        
        assert isinstance(result, ContentAnalysisResult)
        assert result.recommended_strategy == "fixed"
        assert result.confidence_score == 0.5
        assert "error" in result.analysis_details
    
    def test_reasoning_generation(self):
        """Test reasoning generation for recommendations"""
        reasoning = self.analyzer._generate_reasoning(
            "markdown", 
            DocumentStructure.HIGHLY_STRUCTURED,
            ContentComplexity.MODERATE,
            "markdown"
        )
        
        assert isinstance(reasoning, str)
        assert len(reasoning) > 0
        assert "markdown" in reasoning.lower() or "structure" in reasoning.lower()
    
    def test_memory_usage_estimation(self):
        """Test memory usage estimation"""
        # Small content
        small_estimate = self.analyzer._estimate_memory_usage(1000, "fixed")
        assert "Low" in small_estimate
        
        # Large content with complex strategy
        large_estimate = self.analyzer._estimate_memory_usage(100000000, "agentic")  # 100MB
        assert "High" in large_estimate or "Very High" in large_estimate
    
    def test_speed_rating(self):
        """Test speed rating calculation"""
        assert self.analyzer._get_speed_rating(0.5) == "Very Fast"
        assert self.analyzer._get_speed_rating(3.0) == "Fast"
        assert self.analyzer._get_speed_rating(10.0) == "Moderate"
        assert self.analyzer._get_speed_rating(25.0) == "Slow"
        assert self.analyzer._get_speed_rating(35.0) == "Very Slow"


class TestContentAnalysisIntegration:
    """Integration tests for content analysis"""
    
    def test_full_analysis_workflow(self):
        """Test complete analysis workflow"""
        analyzer = VexelContentAnalyzer()
        
        # Test with realistic document
        content = """
        # Project Documentation
        
        ## Overview
        
        This project implements a distributed system for processing large datasets.
        The architecture consists of multiple microservices communicating via REST APIs.
        
        ### Components
        
        1. **Data Ingestion Service**
           - Handles file uploads
           - Validates data formats
           - Queues processing jobs
        
        2. **Processing Engine**
           - Executes data transformations
           - Applies business rules
           - Generates reports
        
        3. **Storage Layer**
           - PostgreSQL for metadata
           - S3 for file storage
           - Redis for caching
        
        ## Configuration
        
        ```yaml
        database:
          host: localhost
          port: 5432
          name: project_db
        
        redis:
          host: localhost
          port: 6379
        ```
        
        ## Performance Metrics
        
        - Throughput: 1000 records/second
        - Latency: < 100ms (p95)
        - Availability: 99.9%
        """
        
        result = analyzer.analyze_content(content, "markdown", "project_docs.md")
        
        # Verify comprehensive analysis
        assert result.file_type == "markdown"
        assert result.content_length > 0
        assert result.complexity in [ContentComplexity.MODERATE, ContentComplexity.COMPLEX]
        assert result.structure in [DocumentStructure.STRUCTURED, DocumentStructure.HIGHLY_STRUCTURED]
        assert result.recommended_strategy == "markdown"
        assert result.confidence_score > 0.7
        
        # Verify analysis details
        assert "structure_analysis" in result.analysis_details
        assert "complexity_analysis" in result.analysis_details
        
        # Verify performance estimate
        assert "estimated_processing_time_seconds" in result.performance_estimate
        assert "estimated_chunk_count" in result.performance_estimate
        assert result.performance_estimate["estimated_chunk_count"] > 0


if __name__ == "__main__":
    pytest.main([__file__])
