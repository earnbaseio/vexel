# RAG & Agent Integration Summary

## 🎯 Tổng Quan Ngắn Gọn

Vexel sử dụng hệ thống RAG được tích hợp sâu với Agent API để tạo ra các AI agents có khả năng truy cập và tìm kiếm thông tin từ documents được upload.

## 🔄 Workflow Tổng Thể

```
1. User Upload File → 2. Document Processing → 3. Vector Storage → 4. Agent Chat → 5. Knowledge Search → 6. Response
```

## 📋 Các Thành Phần Chính

### **1. File Upload & Processing**
- **Endpoint**: `POST /api/v1/agents/knowledge/upload`
- **Supported**: PDF, TXT, CSV, JSON, DOCX
- **Processing**: Agno document readers → chunks → embeddings
- **Storage**: Qdrant vector DB + MongoDB metadata

### **2. Knowledge Management**
- **Architecture**: Unified collection `vexel_knowledge_base`
- **Filtering**: User-scoped với `user_id` filtering
- **Cross-File**: CombinedKnowledgeBase cho multi-document search
- **Caching**: In-memory cache với 5-minute TTL

### **3. Agent Integration**
- **Primary Endpoint**: `POST /api/v1/agents/chat` (Unified agent với knowledge_sources)
- **Secondary Endpoint**: `POST /api/v1/agents/knowledge/chat` (Specific cho uploaded files)
- **Agent Type**: VexelUnifiedAgent (Level 3) hoặc VexelKnowledgeAgent (Level 5)
- **Knowledge**: DocumentKnowledgeBase hoặc CombinedKnowledgeBase
- **Search**: Mandatory knowledge base search trước khi response

## 🚀 Cách Sử Dụng

### **Step 1: Upload Documents**
```bash
# Upload file
POST /api/v1/agents/knowledge/upload
Content-Type: multipart/form-data
File: document.pdf

# Response: File processed và stored in vector DB
```

### **Step 2: Chat với Documents**

#### **Option A: Unified Agent Endpoint (Recommended)**
```bash
# Chat with knowledge sources
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

#### **Option B: Knowledge-Specific Endpoint (For uploaded files)**
```bash
# Cross-file chat (default)
POST /api/v1/agents/knowledge/chat
{
  "message": "Summarize all my documents"
}

# Specific file chat
POST /api/v1/agents/knowledge/chat
{
  "message": "What is this document about?",
  "collection_name": "uploaded_document_userid"
}

# Multiple specific files
POST /api/v1/agents/knowledge/chat
{
  "message": "Compare these documents",
  "specific_file_ids": ["file_doc1_userid", "file_doc2_userid"]
}
```

### **Step 3: Direct Search**
```bash
# Cross-file search
POST /api/v1/agents/knowledge/search-all
{
  "query": "machine learning",
  "limit": 10
}
```

## 🔧 Technical Implementation

### **Knowledge Base Creation**
```python
# 1. Cross-file knowledge manager
cross_file_knowledge = VexelCrossFileKnowledge(user_id)

# 2. Create knowledge base based on scope
if specific_file:
    knowledge_base = cross_file_knowledge.get_file_specific_knowledge_base(file_id)
else:
    knowledge_base = cross_file_knowledge.create_combined_knowledge_base()

# 3. Create agent with knowledge
agent = Agent(
    model=llm,
    knowledge=knowledge_base,
    search_knowledge=True,
    add_references=True
)
```

### **Agent Instructions**
```python
instructions = [
    "You MUST ALWAYS call search_knowledge_base function first",
    "NEVER answer from internal knowledge without searching",
    "Prioritize knowledge base results over internal knowledge",
    "Include file references when possible",
    "If multiple files, indicate which files contain information"
]
```

## 📊 Data Flow

### **Upload Flow**
```
File → Reader → Documents → Metadata Enhancement → Vector DB → MongoDB Metadata
```

### **Chat Flow**
```
User Query → Knowledge Base Creation → Agent Creation → Knowledge Search → LLM Response
```

### **Search Flow**
```
Search Query → Vector Search → Filter by User → Group by File → Return Results
```

## 🔒 Security & Isolation

### **User Data Isolation**
- Mandatory `user_id` filtering trong tất cả searches
- Security checks trong API endpoints
- Separate metadata storage per user

### **Access Control**
```python
# Security check
if str(current_user.id) not in request.collection_name:
    raise HTTPException(status_code=403, detail="Access denied")

# Mandatory filtering
filters = {"user_id": authenticated_user_id}
```

## ⚡ Performance Features

### **Unified Collection**
- Single collection thay vì multiple per-file collections
- Efficient filtering và indexing
- Better scalability

### **Caching**
- 5-minute TTL cache cho search results
- Cache key based on query + user_id + file_ids
- Automatic cache invalidation

### **Optimizations**
- Hybrid search (vector + keyword)
- Efficient Qdrant filtering
- Batch processing cho multiple files

## 🎯 Key Benefits

### **For Users**
- ✅ Upload any supported document format
- ✅ Chat với single file hoặc across all files
- ✅ Intelligent search với file references
- ✅ Fast response với caching

### **For Developers**
- ✅ Simple API endpoints
- ✅ Agno framework integration
- ✅ Scalable architecture
- ✅ Security built-in

### **For System**
- ✅ Unified collection architecture
- ✅ Cross-file search capabilities
- ✅ User data isolation
- ✅ Performance optimizations

## 🔮 Advanced Features

### **Cross-File Search**
```python
# Search across all user documents
knowledge_base = cross_file_knowledge.create_combined_knowledge_base(
    include_user_files=True,
    include_shared_knowledge=False
)
```

### **File-Grouped Results**
```python
# Results grouped by source file
{
    "file_doc1_userid": {
        "filename": "research.pdf",
        "results": [{"content": "...", "relevance_score": 0.95}]
    },
    "file_doc2_userid": {
        "filename": "analysis.docx", 
        "results": [{"content": "...", "relevance_score": 0.87}]
    }
}
```

### **Smart Agent Behavior**
- Always search knowledge base first
- Combine results from multiple files
- Provide file references
- Indicate source files in responses

## 📈 Usage Patterns

### **1. Document Analysis**
```bash
# Upload research papers
POST /upload (file: paper1.pdf)
POST /upload (file: paper2.pdf)

# Analyze across papers
POST /chat {"message": "Compare the methodologies in these papers"}
```

### **2. Knowledge Base Q&A**
```bash
# Upload company documents
POST /upload (file: handbook.pdf)
POST /upload (file: policies.docx)

# Ask questions
POST /chat {"message": "What is the vacation policy?"}
```

### **3. Content Summarization**
```bash
# Upload multiple documents
POST /upload (multiple files)

# Get summary
POST /chat {"message": "Summarize the key points from all documents"}
```

## 🎉 Kết Luận

Hệ thống RAG trong Vexel được thiết kế để:

1. **Đơn giản cho Users**: Upload files và chat ngay lập tức
2. **Mạnh mẽ cho Agents**: Cross-file search với intelligent responses  
3. **Bảo mật cho System**: User isolation và access control
4. **Hiệu quả cho Performance**: Unified architecture với caching

Tất cả được tích hợp seamlessly với Agent API để tạo ra trải nghiệm AI assistant thông minh và hữu ích! 🚀
