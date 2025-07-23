# Vexel RAG Optimization - User Guide

## 🎯 Overview

Vexel's RAG (Retrieval-Augmented Generation) optimization system provides intelligent document chunking strategies that significantly improve search accuracy and context preservation. This guide explains how to use the new features effectively.

## 🚀 Quick Start

### Basic Upload with Auto-Optimization

The simplest way to benefit from RAG optimization is to use the automatic strategy selection:

```bash
curl -X POST "http://localhost:8000/api/v1/agents/knowledge/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf" \
  -F "collection_id=YOUR_COLLECTION_ID" \
  -F "chunking_strategy=auto" \
  -F "enable_analysis=true"
```

### Advanced Upload with Custom Parameters

For more control, specify exact chunking parameters:

```bash
curl -X POST "http://localhost:8000/api/v1/agents/knowledge/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf" \
  -F "collection_id=YOUR_COLLECTION_ID" \
  -F "chunking_strategy=recursive" \
  -F "chunk_size=3000" \
  -F "overlap=200" \
  -F "enable_analysis=true"
```

## 📊 Chunking Strategies

### 1. **Auto (Recommended)**
- **Best for**: All users, especially beginners
- **Description**: Automatically selects the optimal strategy based on file type and content analysis
- **Available to**: All tiers

### 2. **Fixed Size Chunking**
- **Best for**: Simple text documents, consistent processing
- **Description**: Splits text into fixed-size chunks with optional overlap
- **Parameters**: `chunk_size` (default: 5000), `overlap` (default: 100)
- **Available to**: All tiers

### 3. **Recursive Chunking**
- **Best for**: Most document types, natural text boundaries
- **Description**: Finds natural breakpoints (sentences, paragraphs) for better context
- **Parameters**: `chunk_size` (default: varies by file type), `overlap` (default: varies)
- **Available to**: All tiers

### 4. **Document Chunking**
- **Best for**: Structured data (CSV, JSON), preserving relationships
- **Description**: Respects document structure and data relationships
- **Parameters**: `chunk_size` (default: varies), `overlap` (usually 0)
- **Available to**: All tiers

### 5. **Semantic Chunking** 🔒 Premium
- **Best for**: Complex documents, academic papers, technical content
- **Description**: Uses AI embeddings to find semantic boundaries
- **Parameters**: `chunk_size`, `similarity_threshold` (default: 0.6)
- **Available to**: Premium and Enterprise tiers

### 6. **Agentic Chunking** 🔒 Enterprise
- **Best for**: Large, complex documents requiring intelligent analysis
- **Description**: Uses LLM to determine optimal chunk boundaries
- **Parameters**: `max_chunk_size` (default: 5000)
- **Available to**: Enterprise tier only

### 7. **Markdown Chunking** 🔒 Premium
- **Best for**: Markdown documents, documentation, structured text
- **Description**: Preserves markdown structure (headers, sections, lists)
- **Parameters**: `chunk_size` (default: 4000), `overlap` (default: 150)
- **Available to**: Premium and Enterprise tiers

## 🎛️ API Reference

### Upload with Chunking Options

**Endpoint**: `POST /api/v1/agents/knowledge/upload`

**Parameters**:
- `file` (required): File to upload
- `collection_id` (required): Target collection ID
- `chunking_strategy` (optional): Strategy to use ("auto", "fixed", "recursive", "document", "semantic", "agentic", "markdown")
- `chunk_size` (optional): Override default chunk size
- `overlap` (optional): Override default overlap size
- `enable_analysis` (optional): Enable content analysis for recommendations

**Response**:
```json
{
  "message": "File 'document.pdf' uploaded successfully with recursive chunking",
  "filename": "document.pdf",
  "file_type": "application/pdf",
  "documents_processed": 15,
  "metadata": {
    "processing": {
      "chunking_strategy": "recursive",
      "chunks_created": 15,
      "processing_time_seconds": 2.3,
      "content_analysis": {
        "complexity": "moderate",
        "structure": "structured",
        "confidence_score": 0.85
      }
    }
  }
}
```

### Content Analysis

**Endpoint**: `POST /api/v1/agents/knowledge/analyze-content`

Analyze file content before upload to get optimization recommendations:

```bash
curl -X POST "http://localhost:8000/api/v1/agents/knowledge/analyze-content" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf"
```

**Response**:
```json
{
  "file_type": "pdf",
  "content_length": 25000,
  "complexity": "moderate",
  "structure": "structured",
  "recommended_strategy": "recursive",
  "recommended_chunk_size": 3000,
  "recommended_overlap": 200,
  "confidence_score": 0.85,
  "performance_estimate": {
    "estimated_processing_time_seconds": 2.1,
    "estimated_chunk_count": 8,
    "processing_speed_rating": "Fast"
  }
}
```

### Chunking Recommendations

**Endpoint**: `GET /api/v1/agents/knowledge/chunking-recommendations/{file_type}`

Get recommendations for a specific file type:

```bash
curl "http://localhost:8000/api/v1/agents/knowledge/chunking-recommendations/pdf" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Performance Dashboard 🔒 Premium

**Endpoint**: `GET /api/v1/agents/knowledge/performance-dashboard`

View processing performance metrics and insights:

```bash
curl "http://localhost:8000/api/v1/agents/knowledge/performance-dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📈 User Tiers and Features

### Free Tier
- **Strategies**: Fixed, Recursive, Document
- **Monthly uploads**: 50 files
- **Max file size**: 10MB
- **Storage**: 1GB
- **Analytics**: Basic

### Premium Tier 🔒
- **Strategies**: All except Agentic
- **Monthly uploads**: 500 files
- **Max file size**: 50MB
- **Storage**: 10GB
- **Analytics**: Advanced performance dashboard
- **Features**: Semantic chunking, Markdown chunking

### Enterprise Tier 🔒
- **Strategies**: All strategies including Agentic
- **Monthly uploads**: Unlimited
- **Max file size**: 100MB
- **Storage**: 100GB
- **Analytics**: Full performance dashboard with insights
- **Features**: All premium features + Agentic chunking

## 🎯 Best Practices

### File Type Recommendations

| File Type | Recommended Strategy | Reasoning |
|-----------|---------------------|-----------|
| PDF | Recursive → Semantic | Preserves document structure and context |
| Markdown | Markdown → Agentic | Maintains headers and formatting |
| CSV/JSON | Document | Preserves data relationships |
| TXT | Fixed → Recursive | Simple and effective |
| DOCX | Recursive → Semantic | Handles complex formatting |

### Optimization Tips

1. **Use Auto Strategy**: Let the system choose the best strategy for your content
2. **Enable Analysis**: Always use `enable_analysis=true` for optimization insights
3. **Consider Content Type**: Technical documents benefit from semantic chunking
4. **Monitor Performance**: Use the performance dashboard to track improvements
5. **Adjust Parameters**: Fine-tune chunk size and overlap based on your use case

### Common Scenarios

#### Academic Papers
```bash
# Best approach for research papers
-F "chunking_strategy=semantic"
-F "chunk_size=3500"
-F "overlap=300"
-F "enable_analysis=true"
```

#### Technical Documentation
```bash
# Best for API docs, manuals
-F "chunking_strategy=markdown"
-F "chunk_size=4000"
-F "overlap=200"
```

#### Data Files
```bash
# Best for CSV, JSON data
-F "chunking_strategy=document"
-F "chunk_size=2000"
-F "overlap=0"
```

## 🔧 Troubleshooting

### Common Issues

**Error: "Chunking strategy not available for your tier"**
- Solution: Upgrade your tier or use a strategy available to your current tier

**Error: "File size exceeds limit"**
- Solution: Reduce file size or upgrade your tier for higher limits

**Slow processing times**
- Solution: Use simpler strategies (fixed/recursive) for large files
- Consider breaking large files into smaller chunks

**Poor search results**
- Solution: Try semantic chunking for complex content
- Adjust chunk size and overlap parameters
- Enable content analysis for recommendations

### Performance Optimization

1. **Monitor Processing Times**: Use the performance dashboard to identify bottlenecks
2. **Adjust Chunk Sizes**: Smaller chunks for complex content, larger for simple content
3. **Use Appropriate Overlap**: More overlap for better context, less for faster processing
4. **Choose Right Strategy**: Match strategy to content type and complexity

## 📞 Support

For additional help:
- Check the [Technical Documentation](./RAG_OPTIMIZATION_TECHNICAL.md)
- Review [API Examples](./API_EXAMPLES.md)
- Contact support for tier upgrades and advanced features

## 🔄 Breaking Changes Notice

**Important**: This RAG optimization update introduces breaking changes. All existing documents will need to be re-uploaded to benefit from the new chunking strategies. The system no longer maintains backward compatibility with legacy document processing.
