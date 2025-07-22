# Cross-File Knowledge Search Technical Specification

## Executive Summary

This specification outlines the implementation of cross-file knowledge search capabilities for the Vexel AI Agent platform. The current per-file collection architecture is a critical bottleneck that prevents efficient cross-document search. This document provides a comprehensive solution using Agno framework's `CombinedKnowledgeBase` and a unified collection approach.

## Current State Analysis

### Existing Implementation Issues

1. **Per-File Collections**: Each uploaded file creates a separate Qdrant collection (`uploaded_filename_userid`)
2. **Inefficient Cross-File Search**: Current implementation iterates through collections individually
3. **Performance Bottleneck**: Multiple collection queries instead of unified search
4. **Scalability Limitations**: Collection proliferation impacts performance

### Current Architecture
```
User Files → Individual Collections → Sequential Search → Aggregated Results
   ↓              ↓                      ↓                    ↓
File1.txt → collection_1 → search_1 → result_1
File2.pdf → collection_2 → search_2 → result_2  → Combined
File3.doc → collection_3 → search_3 → result_3
```

## Recommended Solution Architecture

### Hybrid Approach: Unified Collection + CombinedKnowledgeBase

The solution combines two strategies:
1. **Unified Collection**: Single multi-tenant Qdrant collection with metadata filtering
2. **CombinedKnowledgeBase**: Agno framework's built-in multi-source knowledge management

### New Architecture
```
User Files → Unified Collection → Single Search → Filtered Results
   ↓              ↓                    ↓              ↓
All Files → vexel_knowledge_base → search(filter: user_id) → Results
```

## Implementation Strategy

### Phase 1: Data Architecture Migration

#### 1.1 Unified Collection Design

**New Collection Structure:**
```python
# Collection Name: vexel_knowledge_base
# Vector Payload Structure:
{
    "user_id": "686e44c3c8eddfcc147cf074",
    "file_id": "file_abc123",
    "filename": "document.pdf", 
    "chunk_id": 1,
    "text_snippet": "Original text for context...",
    "upload_timestamp": "2025-01-20T20:47:17.045053",
    "file_type": "pdf"
}
```

#### 1.2 Enhanced VexelKnowledgeManager

**Updated Knowledge Manager:**
```python
class VexelKnowledgeManager:
    def __init__(self, user_id: str, unified_collection: bool = True):
        self.user_id = user_id
        self.unified_collection = unified_collection
        
        if unified_collection:
            self.collection_name = "vexel_knowledge_base"
        else:
            # Fallback to legacy per-file collections
            self.collection_name = None
            
        self.vector_db = Qdrant(
            collection=self.collection_name,
            url=settings.QDRANT_URL,
            embedder=GeminiEmbedder(model="text-embedding-004")
        )
    
    def create_unified_knowledge_base(self, file_ids: List[str] = None) -> DocumentKnowledgeBase:
        """Create knowledge base with unified collection and user filtering"""
        filters = {"user_id": self.user_id}
        if file_ids:
            filters["file_id"] = {"$in": file_ids}
            
        return DocumentKnowledgeBase(
            documents=[],  # Empty - will search existing vectors
            vector_db=self.vector_db,
            filters=filters
        )
```

### Phase 2: CombinedKnowledgeBase Implementation

#### 2.1 Multi-Source Knowledge Management

**Enhanced Knowledge Base Creation:**
```python
from agno.knowledge.combined import CombinedKnowledgeBase

class VexelCombinedKnowledge:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.knowledge_manager = VexelKnowledgeManager(user_id, unified_collection=True)
    
    def create_combined_knowledge_base(self, 
                                     include_user_files: bool = True,
                                     include_shared_knowledge: bool = False,
                                     specific_files: List[str] = None) -> CombinedKnowledgeBase:
        """Create combined knowledge base from multiple sources"""
        sources = []
        
        # User's personal documents
        if include_user_files:
            user_kb = self.knowledge_manager.create_unified_knowledge_base(
                file_ids=specific_files
            )
            sources.append(user_kb)
        
        # Shared/public knowledge base (future enhancement)
        if include_shared_knowledge:
            shared_kb = self._create_shared_knowledge_base()
            sources.append(shared_kb)
            
        return CombinedKnowledgeBase(sources=sources)
    
    def _create_shared_knowledge_base(self) -> DocumentKnowledgeBase:
        """Create shared knowledge base for public/organizational documents"""
        shared_vector_db = Qdrant(
            collection="vexel_shared_knowledge",
            url=settings.QDRANT_URL,
            embedder=GeminiEmbedder(model="text-embedding-004")
        )
        
        return DocumentKnowledgeBase(
            documents=[],
            vector_db=shared_vector_db
        )
```

### Phase 3: API Endpoint Updates

#### 3.1 Enhanced Chat Endpoint

**Updated Chat Implementation:**
```python
@router.post("/knowledge/chat", response_model=AgentChatResponse)
async def chat_with_knowledge(
    request: AgentKnowledgeChatRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Enhanced chat endpoint with cross-file search capabilities"""
    
    # Create combined knowledge base
    combined_knowledge = VexelCombinedKnowledge(str(current_user.id))
    
    # Determine search scope
    if request.collection_name:
        # Search specific file
        file_id = extract_file_id_from_collection(request.collection_name)
        knowledge_base = combined_knowledge.create_combined_knowledge_base(
            specific_files=[file_id]
        )
    else:
        # Cross-file search across all user documents
        knowledge_base = combined_knowledge.create_combined_knowledge_base(
            include_user_files=True,
            include_shared_knowledge=request.include_shared_knowledge
        )
    
    # Create agent with enhanced knowledge
    agent = Agent(
        name=request.agent_name,
        model=llm,
        knowledge=knowledge_base,
        search_knowledge=True,
        add_references=True,
        instructions=[
            f"You are {request.agent_name}, an AI assistant with access to uploaded documents.",
            "You can search across multiple documents to provide comprehensive answers.",
            "Always search your knowledge base before answering questions.",
            "Provide accurate responses based on the uploaded documents.",
            "Include relevant quotes and file references when possible.",
            "If searching across multiple files, indicate which files contain the information."
        ],
        markdown=True,
        show_tool_calls=True,
        debug_mode=True
    )
    
    response = agent.run(request.message)
    return AgentChatResponse(response=response.content)
```

#### 3.2 New Cross-File Search Endpoint

**Dedicated Cross-File Search API:**
```python
@router.post("/knowledge/search-all", response_model=CrossFileSearchResponse)
async def search_across_all_files(
    request: CrossFileSearchRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Search across all user's uploaded files"""
    
    combined_knowledge = VexelCombinedKnowledge(str(current_user.id))
    knowledge_base = combined_knowledge.create_combined_knowledge_base(
        include_user_files=True,
        include_shared_knowledge=request.include_shared_knowledge
    )
    
    # Perform search
    results = knowledge_base.search(
        query=request.query,
        num_documents=request.limit or 10
    )
    
    # Group results by file
    grouped_results = {}
    for doc in results:
        file_id = doc.meta_data.get("file_id")
        filename = doc.meta_data.get("filename", "Unknown")
        
        if file_id not in grouped_results:
            grouped_results[file_id] = {
                "filename": filename,
                "results": []
            }
        
        grouped_results[file_id]["results"].append({
            "content": doc.content,
            "chunk_id": doc.meta_data.get("chunk_id"),
            "relevance_score": getattr(doc, 'score', 0.0)
        })
    
    return CrossFileSearchResponse(
        query=request.query,
        total_results=len(results),
        files_found=len(grouped_results),
        results_by_file=grouped_results
    )
```

## Migration Strategy

### Step 1: Data Migration Script

**Collection Migration Implementation:**
```python
async def migrate_to_unified_collection():
    """Migrate from per-file collections to unified collection"""
    
    # Get all existing collections for all users
    existing_collections = await get_all_user_collections()
    
    # Create unified collection
    unified_vector_db = Qdrant(
        collection="vexel_knowledge_base",
        url=settings.QDRANT_URL,
        embedder=GeminiEmbedder(model="text-embedding-004")
    )
    unified_vector_db.create()
    
    for collection_info in existing_collections:
        user_id = collection_info["user_id"]
        file_id = collection_info["file_id"]
        collection_name = collection_info["collection_name"]
        
        # Read from old collection
        old_vector_db = Qdrant(collection=collection_name, url=settings.QDRANT_URL)
        
        # Get all points from old collection
        points = old_vector_db.client.scroll(
            collection_name=collection_name,
            limit=10000  # Adjust based on collection size
        )
        
        # Transform and insert into unified collection
        for point in points[0]:
            # Update payload with user and file info
            point.payload.update({
                "user_id": user_id,
                "file_id": file_id,
                "migrated_from": collection_name
            })
            
            # Insert into unified collection
            unified_vector_db.client.upsert(
                collection_name="vexel_knowledge_base",
                points=[point]
            )
        
        print(f"Migrated {len(points[0])} points from {collection_name}")
    
    print("Migration completed successfully!")
```

### Step 2: Backward Compatibility

**Legacy Support During Transition:**
```python
class BackwardCompatibleKnowledgeManager(VexelKnowledgeManager):
    """Supports both unified and legacy collection approaches"""
    
    def create_knowledge_base(self, collection_name: str = None) -> DocumentKnowledgeBase:
        if collection_name and collection_name.startswith("uploaded_"):
            # Legacy per-file collection
            return self._create_legacy_knowledge_base(collection_name)
        else:
            # New unified collection
            return self.create_unified_knowledge_base()
    
    def _create_legacy_knowledge_base(self, collection_name: str) -> DocumentKnowledgeBase:
        """Support legacy per-file collections during migration"""
        legacy_vector_db = Qdrant(
            collection=collection_name,
            url=settings.QDRANT_URL,
            embedder=GeminiEmbedder(model="text-embedding-004")
        )
        
        return DocumentKnowledgeBase(
            documents=[],
            vector_db=legacy_vector_db
        )
```

## Performance Optimizations

### 1. Query Optimization

**Efficient Filtering:**
```python
# Optimized search with proper indexing
def optimized_search(self, query: str, user_id: str, file_ids: List[str] = None):
    filters = {
        "must": [
            {"key": "user_id", "match": {"value": user_id}}
        ]
    }
    
    if file_ids:
        filters["must"].append({
            "key": "file_id", 
            "match": {"any": file_ids}
        })
    
    return self.vector_db.search(
        query=query,
        limit=10,
        filters=filters
    )
```

### 2. Caching Strategy

**Result Caching:**
```python
from functools import lru_cache
import hashlib

class CachedKnowledgeSearch:
    def __init__(self):
        self.cache = {}
    
    def search_with_cache(self, query: str, user_id: str, ttl: int = 300):
        cache_key = hashlib.md5(f"{query}:{user_id}".encode()).hexdigest()
        
        if cache_key in self.cache:
            cached_result, timestamp = self.cache[cache_key]
            if time.time() - timestamp < ttl:
                return cached_result
        
        # Perform actual search
        results = self.knowledge_base.search(query)
        
        # Cache results
        self.cache[cache_key] = (results, time.time())
        return results
```

## Security Considerations

### 1. User Data Isolation

**Mandatory User Filtering:**
```python
def secure_search(self, query: str, authenticated_user_id: str):
    """Ensure all searches are filtered by authenticated user"""
    
    # CRITICAL: Always include user_id filter
    mandatory_filters = {
        "must": [
            {"key": "user_id", "match": {"value": authenticated_user_id}}
        ]
    }
    
    return self.vector_db.search(
        query=query,
        filters=mandatory_filters
    )
```

### 2. Access Control

**Role-Based Knowledge Access:**
```python
class SecureKnowledgeManager:
    def __init__(self, user: User):
        self.user = user
        self.permissions = self._get_user_permissions()
    
    def can_access_shared_knowledge(self) -> bool:
        return "shared_knowledge" in self.permissions
    
    def can_access_file(self, file_id: str) -> bool:
        # Check if user owns the file or has shared access
        return (
            self._user_owns_file(file_id) or 
            self._has_shared_access(file_id)
        )
```

## Testing Strategy

### 1. Unit Tests

**Knowledge Base Testing:**
```python
import pytest
from unittest.mock import Mock

class TestCrossFileKnowledgeSearch:
    def test_unified_collection_search(self):
        # Test unified collection search functionality
        pass
    
    def test_combined_knowledge_base(self):
        # Test CombinedKnowledgeBase integration
        pass
    
    def test_user_data_isolation(self):
        # Test security filtering
        pass
```

### 2. Integration Tests

**End-to-End Testing:**
```python
async def test_cross_file_search_api():
    # Upload multiple files
    # Perform cross-file search
    # Verify results contain data from multiple files
    # Verify user isolation
    pass
```

## Monitoring and Observability

### 1. Performance Metrics

**Key Metrics to Track:**
- Search latency (target: <100ms)
- Cross-file search accuracy
- Collection size and growth
- User query patterns

### 2. Logging Strategy

**Enhanced Logging:**
```python
import structlog

logger = structlog.get_logger()

def log_search_performance(query: str, user_id: str, results_count: int, duration: float):
    logger.info(
        "knowledge_search_performed",
        query_hash=hashlib.md5(query.encode()).hexdigest()[:8],
        user_id=user_id,
        results_count=results_count,
        duration_ms=duration * 1000,
        search_type="cross_file"
    )
```

## Deployment Considerations

### 1. Rollout Strategy

**Phased Deployment:**
1. **Phase 1**: Deploy unified collection alongside existing per-file collections
2. **Phase 2**: Migrate data to unified collection
3. **Phase 3**: Update APIs to use unified collection
4. **Phase 4**: Remove legacy per-file collection support

### 2. Rollback Plan

**Safe Rollback Strategy:**
- Keep legacy collections during migration period
- Feature flags to switch between old and new implementations
- Monitoring to detect issues early

## Conclusion

This specification provides a comprehensive solution for implementing cross-file knowledge search in the Vexel platform. The hybrid approach leverages Agno framework's built-in capabilities while addressing performance, security, and scalability requirements.

**Key Benefits:**
- ✅ Unified search across all user documents
- ✅ Improved performance with single collection architecture
- ✅ Enhanced security with mandatory user filtering
- ✅ Scalable architecture supporting future growth
- ✅ Backward compatibility during migration
- ✅ Leverages Agno framework's CombinedKnowledgeBase

**Next Steps:**
1. Review and approve this specification
2. Begin Phase 1 implementation (unified collection)
3. Develop migration scripts
4. Implement enhanced API endpoints
5. Conduct thorough testing
6. Deploy with phased rollout strategy
