# Vexel RAG System - Comprehensive Guide

## 📋 Tổng Quan Hệ Thống RAG

Vexel sử dụng một hệ thống RAG (Retrieval-Augmented Generation) tiên tiến được xây dựng trên Agno framework, cho phép agents truy cập và tìm kiếm thông tin từ documents được upload bởi users.

## 🏗️ Kiến Trúc Hệ Thống

### **1. Core Components**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   File Upload   │───▶│  Document        │───▶│   Vector        │
│   API Endpoint  │    │  Processing      │    │   Storage       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Agent Chat    │◀───│  Knowledge Base  │◀───│   Qdrant DB     │
│   API Endpoint  │    │  Creation        │    │   Collection    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **2. Technology Stack**

- **Vector Database**: Qdrant (localhost:6333)
- **Embeddings**: Gemini text-embedding-004
- **Document Processing**: Agno framework readers
- **Knowledge Management**: Agno DocumentKnowledgeBase & CombinedKnowledgeBase
- **Metadata Storage**: MongoDB
- **Caching**: In-memory cache với TTL

## 📁 File Upload & Processing Flow

### **1. Upload Endpoint: `/api/v1/agents/knowledge/upload`**

```python
POST /api/v1/agents/knowledge/upload
Content-Type: multipart/form-data

# Supported file types:
- PDF: application/pdf
- TXT: text/plain  
- CSV: text/csv
- JSON: application/json
- DOCX: application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

### **2. Processing Pipeline**

```python
# 1. File Validation
supported_types = {
    "application/pdf": "pdf",
    "text/plain": "txt", 
    "text/csv": "csv",
    "application/json": "json",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx"
}

# 2. File ID Generation
filename_without_ext = file.filename.rsplit('.', 1)[0]
file_id = f"file_{filename_without_ext}_{current_user.id}"

# 3. Document Reading (based on file type)
if file_type == "pdf":
    from agno.document.reader.pdf_reader import PDFReader
    reader = PDFReader()
    documents = reader.read(file_buffer)
elif file_type == "txt":
    from agno.document.reader.text_reader import TextReader
    reader = TextReader()
    documents = reader.read(file_buffer)
# ... other file types

# 4. Metadata Enhancement
for i, doc in enumerate(documents):
    doc.meta_data.update({
        "user_id": str(current_user.id),
        "file_id": file_id,
        "filename": file.filename,
        "file_type": file_type,
        "chunk_id": i,
        "upload_timestamp": datetime.utcnow().isoformat(),
        "text_snippet": doc.content[:200] + "..." if len(doc.content) > 200 else doc.content
    })
```

### **3. Vector Storage**

```python
# Unified Collection Approach
collection_name = "vexel_knowledge_base"

# Knowledge Manager Setup
knowledge_manager = VexelKnowledgeManager(
    collection_name=collection_name,
    user_id=str(current_user.id),
    unified_collection=True
)

# Vector Database Configuration
vector_db = Qdrant(
    collection=collection_name,
    url="http://localhost:6333",
    embedder=GeminiEmbedder(id="text-embedding-004")
)

# Knowledge Base Creation
knowledge_base = DocumentKnowledgeBase(
    documents=documents,
    vector_db=vector_db
)

# Load into vector database
knowledge_base.load(recreate=False, upsert=True)
```

### **4. Metadata Storage**

```python
# MongoDB Metadata
file_metadata = {
    "collection_name": "vexel_knowledge_base",
    "file_id": file_id,
    "filename": file.filename,
    "file_type": file_type,
    "file_size_bytes": len(contents),
    "upload_timestamp": datetime.utcnow().isoformat(),
    "documents_count": len(documents),
    "user_id": str(current_user.id),
    "metadata": {
        "content_type": file.content_type,
        "processing_time": processing_time,
        "embedder": "gemini-text-embedding-004",
        "vector_db": "qdrant",
        "unified_collection": True
    }
}

# Save to MongoDB
await db.file_metadata.insert_one(file_metadata)
```

## 🔍 Knowledge Search & Retrieval

### **1. Unified Collection Architecture**

**Before (Per-File Collections):**
```
uploaded_document1_userid → separate collection
uploaded_document2_userid → separate collection  
uploaded_document3_userid → separate collection
```

**After (Unified Collection):**
```
vexel_knowledge_base → single collection with user_id filtering
├── user_id: userid1
│   ├── file_id: file_doc1_userid1
│   ├── file_id: file_doc2_userid1
│   └── file_id: file_doc3_userid1
└── user_id: userid2
    ├── file_id: file_doc1_userid2
    └── file_id: file_doc2_userid2
```

### **2. Cross-File Knowledge Management**

```python
class VexelCrossFileKnowledge:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.unified_vector_db = Qdrant(
            collection="vexel_knowledge_base",
            url=settings.QDRANT_URL,
            embedder=GeminiEmbedder(id="text-embedding-004")
        )
    
    def create_user_knowledge_base(self, file_ids: Optional[List[str]] = None):
        """Create knowledge base for user's documents with optional file filtering"""
        filters = {"user_id": self.user_id}
        if file_ids:
            filters["file_id"] = {"$in": file_ids}
        
        return DocumentKnowledgeBase(
            documents=[],  # Empty - searches existing vectors
            vector_db=self.unified_vector_db,
            filters=filters
        )
    
    def create_combined_knowledge_base(self, 
                                     include_user_files: bool = True,
                                     include_shared_knowledge: bool = False,
                                     specific_file_ids: Optional[List[str]] = None):
        """Create combined knowledge base from multiple sources"""
        sources = []
        
        if include_user_files:
            user_kb = self.create_user_knowledge_base(file_ids=specific_file_ids)
            sources.append(user_kb)
        
        if include_shared_knowledge:
            shared_kb = self.create_shared_knowledge_base()
            sources.append(shared_kb)
        
        return CombinedKnowledgeBase(sources=sources)
```

### **3. Search Capabilities**

```python
# Cross-File Search
def search_across_files(self, query: str, limit: int = 10):
    combined_kb = self.create_combined_knowledge_base()
    results = combined_kb.search(query=query, num_documents=limit)
    return results

# File-Grouped Search Results
def search_with_file_grouping(self, query: str, limit: int = 10):
    results = self.search_across_files(query, limit)
    
    # Group by file
    grouped_results = {}
    for doc in results:
        file_id = doc.meta_data.get("file_id", "unknown")
        filename = doc.meta_data.get("filename", "Unknown File")
        
        if file_id not in grouped_results:
            grouped_results[file_id] = {
                "filename": filename,
                "file_id": file_id,
                "results": []
            }
        
        grouped_results[file_id]["results"].append({
            "content": doc.content,
            "chunk_id": doc.meta_data.get("chunk_id"),
            "relevance_score": getattr(doc, 'score', 0.0),
            "text_snippet": doc.meta_data.get("text_snippet", "")
        })
    
    return grouped_results
```

## 🤖 Agent Integration

### **1. Knowledge-Enhanced Agents**

```python
# Agent Creation with Knowledge Base
def create_knowledge_agent(user_id: str, collection_name: Optional[str] = None):
    # Cross-file knowledge manager
    cross_file_knowledge = VexelCrossFileKnowledge(user_id)
    
    # Determine knowledge scope
    if collection_name and collection_name != "vexel_knowledge_base":
        # Specific file search
        file_id = extract_file_id_from_collection(collection_name)
        knowledge_base = cross_file_knowledge.get_file_specific_knowledge_base(file_id)
    else:
        # Cross-file search (default)
        knowledge_base = cross_file_knowledge.create_combined_knowledge_base()
    
    # Create LLM
    llm = LiteLLM(
        id="gemini/gemini-1.5-flash",
        api_key=get_api_key(),
        temperature=0.7
    )
    
    # Create agent with knowledge
    agent = Agent(
        name="VexelKnowledgeAgent",
        model=llm,
        knowledge=knowledge_base,
        search_knowledge=True,
        add_references=True,
        instructions=[
            "You are an AI assistant with access to uploaded documents.",
            "You can search across multiple documents to provide comprehensive answers.",
            "You MUST ALWAYS call the search_knowledge_base function first before answering.",
            "NEVER answer from internal knowledge without searching the knowledge base.",
            "Always prioritize knowledge base search results over internal knowledge.",
            "Include relevant quotes and file references when possible.",
            "If searching across multiple files, indicate which files contain the information."
        ]
    )
    
    return agent
```

### **2. Agent Instructions & Behavior**

```python
# Enhanced Agent Instructions
instructions = [
    "You are VexelKnowledgeAgent, an AI assistant with access to uploaded documents.",
    "You can search across multiple documents to provide comprehensive answers.",
    "You MUST ALWAYS call the search_knowledge_base function first before answering ANY question.",
    "NEVER answer from your internal knowledge without first searching the knowledge base.",
    "The search_knowledge_base function contains the most up-to-date and accurate information about uploaded files.",
    "Your internal knowledge may be outdated or incorrect - always prioritize the knowledge base search results.",
    "After searching, provide responses based ONLY on the uploaded documents.",
    "If the search returns no results, clearly state that no information was found in the knowledge base.",
    "Include relevant quotes or references from the documents when possible.",
    "If searching across multiple files, indicate which files contain the information.",
    "Format your response in markdown."
]
```

## 🔗 API Endpoints Integration

### **1. Primary Chat Endpoint: `/api/v1/agents/chat` (Unified)**

```python
POST /api/v1/agents/chat
{
    "name": "VexelAgent",
    "message": "What do you know about AI?",
    "model": "gemini/gemini-1.5-flash",
    "knowledge_sources": [
        {
            "type": "text",
            "name": "ai_knowledge",
            "content": ["AI is artificial intelligence..."]
        }
    ]
}
```

### **2. Secondary Chat Endpoint: `/api/v1/agents/knowledge/chat` (Uploaded Files)**

```python
POST /api/v1/agents/knowledge/chat
{
    "message": "What is the main topic of my documents?",
    "collection_name": null,  // Optional: for specific file
    "specific_file_ids": null,  // Optional: for multiple specific files
    "include_shared_knowledge": false,  // Future: shared knowledge
    "model": "gemini/gemini-1.5-flash",
    "agent_name": "VexelKnowledgeAgent"
}

# Response
{
    "agent_name": "VexelKnowledgeAgent",
    "level": 5,  // Enhanced with cross-file capabilities
    "model": "gemini/gemini-1.5-flash",
    "message": "What is the main topic of my documents?",
    "response": "Based on my search across your uploaded documents...",
    "status": "success"
}
```

### **3. Search Endpoint: `/api/v1/agents/knowledge/search-all`**

```python
POST /api/v1/agents/knowledge/search-all
{
    "query": "artificial intelligence",
    "limit": 10,
    "include_shared_knowledge": false,
    "specific_file_ids": ["file_doc1_userid", "file_doc2_userid"]
}

# Response
{
    "query": "artificial intelligence",
    "total_results": 15,
    "files_found": 3,
    "results_by_file": {
        "file_doc1_userid": {
            "filename": "ai_research.pdf",
            "file_id": "file_doc1_userid",
            "results": [
                {
                    "content": "Artificial intelligence is...",
                    "chunk_id": 1,
                    "relevance_score": 0.95,
                    "text_snippet": "AI research focuses on..."
                }
            ]
        }
    }
}
```

## ⚡ Performance & Optimization

### **1. Caching Layer**

```python
class VexelKnowledgeCache:
    def __init__(self, ttl: int = 300):  # 5 minutes TTL
        self.cache = {}
        self.ttl = ttl
    
    def get_cache_key(self, query: str, user_id: str, file_ids: Optional[List[str]] = None):
        key_components = [query, user_id]
        if file_ids:
            key_components.extend(sorted(file_ids))
        return hashlib.md5(":".join(key_components).encode()).hexdigest()
    
    def get(self, cache_key: str) -> Optional[List[Document]]:
        if cache_key in self.cache:
            results, timestamp = self.cache[cache_key]
            if time.time() - timestamp < self.ttl:
                return results
        return None
    
    def set(self, cache_key: str, results: List[Document]):
        self.cache[cache_key] = (results, time.time())

# Global cache instance
knowledge_cache = VexelKnowledgeCache()
```

### **2. Query Optimization**

```python
# Efficient Qdrant filtering
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

results = vector_db.search(
    query=query,
    limit=limit,
    filters=filters
)
```

## 🔒 Security & Data Isolation

### **1. User Data Isolation**

```python
# Mandatory user filtering at database level
def secure_search(self, query: str, authenticated_user_id: str):
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

### **2. Access Control**

```python
# Security check in chat endpoint
if str(current_user.id) not in request.collection_name and not request.collection_name.startswith("uploaded_"):
    raise HTTPException(
        status_code=403,
        detail="You can only chat with your own uploaded files"
    )
```

## 📊 Usage Examples

### **1. Upload File**

```bash
curl -X POST "http://localhost:8000/api/v1/agents/knowledge/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.pdf"
```

### **2. Cross-File Chat**

```bash
curl -X POST "http://localhost:8000/api/v1/agents/knowledge/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Summarize all my documents",
    "agent_name": "VexelKnowledgeAgent"
  }'
```

### **3. Specific File Chat**

```bash
curl -X POST "http://localhost:8000/api/v1/agents/knowledge/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is this document about?",
    "collection_name": "uploaded_document_userid",
    "agent_name": "VexelKnowledgeAgent"
  }'
```

### **4. Cross-File Search**

```bash
curl -X POST "http://localhost:8000/api/v1/agents/knowledge/search-all" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning algorithms",
    "limit": 5
  }'
```

## 🎯 Key Benefits

### **Performance**
- ✅ Single query cho cross-file search
- ✅ Unified collection architecture
- ✅ Intelligent caching với TTL
- ✅ Optimized Qdrant filtering

### **Functionality**  
- ✅ Cross-file search capabilities
- ✅ File-grouped search results
- ✅ Backward compatibility
- ✅ Multiple file format support

### **Security**
- ✅ User data isolation
- ✅ Mandatory user filtering
- ✅ Access control checks
- ✅ Secure metadata storage

### **Scalability**
- ✅ Unified collection scales better
- ✅ Efficient vector storage
- ✅ Future-ready architecture
- ✅ Support for shared knowledge

Hệ thống RAG trong Vexel đã được thiết kế để cung cấp khả năng tìm kiếm và truy xuất thông tin mạnh mẽ, bảo mật và có thể mở rộng cho các AI agents. 🚀
