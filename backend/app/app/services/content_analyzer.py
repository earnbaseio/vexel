"""
Vexel Content Analysis Service
Analyzes document content to recommend optimal chunking strategies and configurations
"""

import re
import logging
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class ContentComplexity(str, Enum):
    """Content complexity levels"""
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"
    HIGHLY_COMPLEX = "highly_complex"


class DocumentStructure(str, Enum):
    """Document structure types"""
    UNSTRUCTURED = "unstructured"
    SEMI_STRUCTURED = "semi_structured"
    STRUCTURED = "structured"
    HIGHLY_STRUCTURED = "highly_structured"


@dataclass
class ContentAnalysisResult:
    """Result of content analysis"""
    file_type: str
    content_length: int
    complexity: ContentComplexity
    structure: DocumentStructure
    recommended_strategy: str
    recommended_chunk_size: int
    recommended_overlap: int
    confidence_score: float
    analysis_details: Dict[str, Any]
    performance_estimate: Dict[str, Any]


class VexelContentAnalyzer:
    """
    Service for analyzing document content and recommending optimal chunking strategies
    """
    
    def __init__(self):
        """Initialize the content analyzer"""
        self.structure_patterns = {
            'headers': [
                r'^#{1,6}\s+.+$',  # Markdown headers
                r'^[A-Z][A-Z\s]+$',  # ALL CAPS headers
                r'^\d+\.\s+.+$',  # Numbered sections
                r'^[IVX]+\.\s+.+$',  # Roman numeral sections
            ],
            'lists': [
                r'^\s*[-*+]\s+.+$',  # Bullet lists
                r'^\s*\d+\.\s+.+$',  # Numbered lists
                r'^\s*[a-z]\)\s+.+$',  # Lettered lists
            ],
            'code_blocks': [
                r'```[\s\S]*?```',  # Markdown code blocks
                r'`[^`]+`',  # Inline code
                r'^\s{4,}.+$',  # Indented code
            ],
            'tables': [
                r'\|.*\|',  # Markdown tables
                r'^\s*\+[-+]+\+\s*$',  # ASCII tables
            ],
            'citations': [
                r'\[\d+\]',  # Numbered citations
                r'\([A-Za-z]+\s+\d{4}\)',  # Author year citations
            ]
        }
    
    def analyze_content(
        self, 
        content: str, 
        file_type: str, 
        filename: str = ""
    ) -> ContentAnalysisResult:
        """
        Analyze document content and recommend optimal chunking strategy
        
        Args:
            content: Document content as string
            file_type: File type/extension
            filename: Original filename
            
        Returns:
            ContentAnalysisResult with recommendations
        """
        try:
            # Basic metrics
            content_length = len(content)
            
            # Analyze structure
            structure_analysis = self._analyze_structure(content, file_type)
            
            # Analyze complexity
            complexity_analysis = self._analyze_complexity(content, file_type)
            
            # Determine optimal strategy
            strategy_recommendation = self._recommend_strategy(
                file_type, structure_analysis, complexity_analysis, content_length
            )
            
            # Calculate performance estimates
            performance_estimate = self._estimate_performance(
                content_length, strategy_recommendation['strategy']
            )
            
            return ContentAnalysisResult(
                file_type=file_type,
                content_length=content_length,
                complexity=complexity_analysis['complexity'],
                structure=structure_analysis['structure'],
                recommended_strategy=strategy_recommendation['strategy'],
                recommended_chunk_size=strategy_recommendation['chunk_size'],
                recommended_overlap=strategy_recommendation['overlap'],
                confidence_score=strategy_recommendation['confidence'],
                analysis_details={
                    'structure_analysis': structure_analysis,
                    'complexity_analysis': complexity_analysis,
                    'filename': filename
                },
                performance_estimate=performance_estimate
            )
            
        except Exception as e:
            logger.error(f"Content analysis failed: {str(e)}")
            # Return safe defaults
            return self._get_default_analysis(content, file_type)
    
    def _analyze_structure(self, content: str, file_type: str) -> Dict[str, Any]:
        """Analyze document structure"""
        lines = content.split('\n')
        total_lines = len(lines)
        
        structure_scores = {
            'headers': 0,
            'lists': 0,
            'code_blocks': 0,
            'tables': 0,
            'citations': 0
        }
        
        # Count structural elements
        for line in lines:
            for element_type, patterns in self.structure_patterns.items():
                for pattern in patterns:
                    if re.search(pattern, line, re.MULTILINE):
                        structure_scores[element_type] += 1
                        break
        
        # Calculate structure ratios
        structure_ratios = {
            key: score / max(total_lines, 1) 
            for key, score in structure_scores.items()
        }
        
        # Determine overall structure level
        total_structure_score = sum(structure_ratios.values())
        
        if total_structure_score > 0.3:
            structure_level = DocumentStructure.HIGHLY_STRUCTURED
        elif total_structure_score > 0.15:
            structure_level = DocumentStructure.STRUCTURED
        elif total_structure_score > 0.05:
            structure_level = DocumentStructure.SEMI_STRUCTURED
        else:
            structure_level = DocumentStructure.UNSTRUCTURED
        
        return {
            'structure': structure_level,
            'structure_scores': structure_scores,
            'structure_ratios': structure_ratios,
            'total_structure_score': total_structure_score,
            'total_lines': total_lines
        }
    
    def _analyze_complexity(self, content: str, file_type: str) -> Dict[str, Any]:
        """Analyze content complexity"""
        # Basic text metrics
        words = content.split()
        sentences = re.split(r'[.!?]+', content)
        paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
        
        # Calculate complexity metrics
        avg_words_per_sentence = len(words) / max(len(sentences), 1)
        avg_sentences_per_paragraph = len(sentences) / max(len(paragraphs), 1)
        avg_word_length = sum(len(word) for word in words) / max(len(words), 1)
        
        # Technical content indicators
        technical_patterns = [
            r'\b[A-Z]{2,}\b',  # Acronyms
            r'\b\d+\.\d+\b',  # Numbers with decimals
            r'[a-zA-Z]+\([^)]*\)',  # Function calls
            r'[{}[\]()]',  # Brackets and braces
            r'[<>]',  # Angle brackets
        ]
        
        technical_score = 0
        for pattern in technical_patterns:
            technical_score += len(re.findall(pattern, content))
        
        technical_ratio = technical_score / max(len(content), 1)
        
        # Determine complexity level
        complexity_score = (
            (avg_words_per_sentence / 20) * 0.3 +
            (avg_word_length / 6) * 0.2 +
            (technical_ratio * 1000) * 0.3 +
            (avg_sentences_per_paragraph / 5) * 0.2
        )
        
        if complexity_score > 1.5:
            complexity_level = ContentComplexity.HIGHLY_COMPLEX
        elif complexity_score > 1.0:
            complexity_level = ContentComplexity.COMPLEX
        elif complexity_score > 0.5:
            complexity_level = ContentComplexity.MODERATE
        else:
            complexity_level = ContentComplexity.SIMPLE
        
        return {
            'complexity': complexity_level,
            'complexity_score': complexity_score,
            'avg_words_per_sentence': avg_words_per_sentence,
            'avg_sentences_per_paragraph': avg_sentences_per_paragraph,
            'avg_word_length': avg_word_length,
            'technical_ratio': technical_ratio,
            'word_count': len(words),
            'sentence_count': len(sentences),
            'paragraph_count': len(paragraphs)
        }
    
    def _recommend_strategy(
        self, 
        file_type: str, 
        structure_analysis: Dict[str, Any], 
        complexity_analysis: Dict[str, Any],
        content_length: int
    ) -> Dict[str, Any]:
        """Recommend optimal chunking strategy based on analysis"""
        
        structure = structure_analysis['structure']
        complexity = complexity_analysis['complexity']
        
        # Base recommendations by file type
        base_recommendations = {
            'pdf': {'strategy': 'recursive', 'chunk_size': 3000, 'overlap': 200},
            'txt': {'strategy': 'fixed', 'chunk_size': 5000, 'overlap': 100},
            'markdown': {'strategy': 'markdown', 'chunk_size': 4000, 'overlap': 150},
            'csv': {'strategy': 'document', 'chunk_size': 2000, 'overlap': 0},
            'json': {'strategy': 'document', 'chunk_size': 2500, 'overlap': 0},
            'docx': {'strategy': 'recursive', 'chunk_size': 3500, 'overlap': 175}
        }
        
        base_rec = base_recommendations.get(file_type, base_recommendations['txt'])
        
        # Adjust based on structure
        if structure in [DocumentStructure.HIGHLY_STRUCTURED, DocumentStructure.STRUCTURED]:
            if file_type == 'markdown':
                strategy = 'markdown'
            elif file_type in ['csv', 'json']:
                strategy = 'document'
            else:
                strategy = 'recursive'
            confidence_boost = 0.2
        else:
            strategy = base_rec['strategy']
            confidence_boost = 0.0
        
        # Adjust chunk size based on complexity and content length
        chunk_size = base_rec['chunk_size']
        overlap = base_rec['overlap']
        
        if complexity == ContentComplexity.HIGHLY_COMPLEX:
            chunk_size = int(chunk_size * 0.8)  # Smaller chunks for complex content
            overlap = int(overlap * 1.5)  # More overlap for context
        elif complexity == ContentComplexity.SIMPLE:
            chunk_size = int(chunk_size * 1.2)  # Larger chunks for simple content
            overlap = int(overlap * 0.8)  # Less overlap needed
        
        # Adjust for content length
        if content_length < 5000:
            chunk_size = min(chunk_size, max(1000, content_length // 3))
        elif content_length > 100000:
            chunk_size = int(chunk_size * 1.3)
        
        # Calculate confidence score
        base_confidence = 0.7
        structure_confidence = {
            DocumentStructure.HIGHLY_STRUCTURED: 0.9,
            DocumentStructure.STRUCTURED: 0.8,
            DocumentStructure.SEMI_STRUCTURED: 0.7,
            DocumentStructure.UNSTRUCTURED: 0.6
        }
        
        confidence = min(0.95, base_confidence + confidence_boost + 
                        (structure_confidence[structure] - 0.7))
        
        return {
            'strategy': strategy,
            'chunk_size': chunk_size,
            'overlap': overlap,
            'confidence': confidence,
            'reasoning': self._generate_reasoning(file_type, structure, complexity, strategy)
        }
    
    def _generate_reasoning(
        self, 
        file_type: str, 
        structure: DocumentStructure, 
        complexity: ContentComplexity, 
        strategy: str
    ) -> str:
        """Generate human-readable reasoning for strategy recommendation"""
        reasons = []
        
        if file_type == 'markdown' and strategy == 'markdown':
            reasons.append("Markdown-specific chunking preserves document structure")
        elif file_type in ['csv', 'json'] and strategy == 'document':
            reasons.append("Document chunking maintains data relationships")
        elif strategy == 'recursive':
            reasons.append("Recursive chunking finds natural breakpoints")
        elif strategy == 'fixed':
            reasons.append("Fixed chunking provides consistent chunk sizes")
        
        if structure in [DocumentStructure.HIGHLY_STRUCTURED, DocumentStructure.STRUCTURED]:
            reasons.append("Document has clear structure that should be preserved")
        
        if complexity == ContentComplexity.HIGHLY_COMPLEX:
            reasons.append("Complex content benefits from smaller, overlapping chunks")
        elif complexity == ContentComplexity.SIMPLE:
            reasons.append("Simple content can use larger chunks efficiently")
        
        return "; ".join(reasons)
    
    def _estimate_performance(self, content_length: int, strategy: str) -> Dict[str, Any]:
        """Estimate processing performance for given strategy"""
        
        # Base processing times (seconds per 1000 characters)
        strategy_speeds = {
            'fixed': 0.001,
            'recursive': 0.002,
            'document': 0.003,
            'markdown': 0.004,
            'semantic': 0.050,  # Slower due to embedding calculations
            'agentic': 0.200   # Slowest due to LLM calls
        }
        
        base_time = (content_length / 1000) * strategy_speeds.get(strategy, 0.002)
        
        # Estimate chunk count
        avg_chunk_sizes = {
            'fixed': 5000,
            'recursive': 4500,
            'document': 3000,
            'markdown': 4000,
            'semantic': 4000,
            'agentic': 4500
        }
        
        estimated_chunks = max(1, content_length // avg_chunk_sizes.get(strategy, 4500))
        
        return {
            'estimated_processing_time_seconds': round(base_time, 2),
            'estimated_chunk_count': estimated_chunks,
            'processing_speed_rating': self._get_speed_rating(base_time),
            'memory_usage_estimate': self._estimate_memory_usage(content_length, strategy)
        }
    
    def _get_speed_rating(self, processing_time: float) -> str:
        """Get human-readable speed rating"""
        if processing_time < 1:
            return "Very Fast"
        elif processing_time < 5:
            return "Fast"
        elif processing_time < 15:
            return "Moderate"
        elif processing_time < 30:
            return "Slow"
        else:
            return "Very Slow"
    
    def _estimate_memory_usage(self, content_length: int, strategy: str) -> str:
        """Estimate memory usage"""
        # Rough estimates based on strategy complexity
        multipliers = {
            'fixed': 1.2,
            'recursive': 1.5,
            'document': 2.0,
            'markdown': 2.5,
            'semantic': 4.0,
            'agentic': 6.0
        }
        
        estimated_mb = (content_length * multipliers.get(strategy, 1.5)) / (1024 * 1024)
        
        if estimated_mb < 10:
            return "Low (< 10MB)"
        elif estimated_mb < 50:
            return "Moderate (10-50MB)"
        elif estimated_mb < 200:
            return "High (50-200MB)"
        else:
            return "Very High (> 200MB)"
    
    def _get_default_analysis(self, content: str, file_type: str) -> ContentAnalysisResult:
        """Return safe default analysis when analysis fails"""
        return ContentAnalysisResult(
            file_type=file_type,
            content_length=len(content),
            complexity=ContentComplexity.MODERATE,
            structure=DocumentStructure.UNSTRUCTURED,
            recommended_strategy="fixed",
            recommended_chunk_size=5000,
            recommended_overlap=100,
            confidence_score=0.5,
            analysis_details={"error": "Analysis failed, using defaults"},
            performance_estimate={
                "estimated_processing_time_seconds": 1.0,
                "estimated_chunk_count": max(1, len(content) // 5000),
                "processing_speed_rating": "Fast",
                "memory_usage_estimate": "Low"
            }
        )
