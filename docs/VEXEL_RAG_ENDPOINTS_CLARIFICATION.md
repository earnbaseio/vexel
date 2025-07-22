# Vexel RAG Endpoints - Clarification

## 🎯 Tóm Tắt Endpoints

Vexel có **2 cách chính** để chat với knowledge/RAG:

### **1. Unified Agent Endpoint (Recommended) ✅**
```
POST /api/v1/agents/chat
```

**Đặc điểm:**
- ✅ **Primary endpoint** cho tất cả agent interactions
- ✅ Support knowledge thông qua `knowledge_sources` parameter
- ✅ VexelUnifiedAgent với Level 3 capabilities (L1+L2+L3)
- ✅ Flexible và extensible
- ✅ Recommended approach

**Request Format:**
```json
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

### **2. Knowledge-Specific Endpoint (For Uploaded Files) ⚠️**
```
POST /api/v1/agents/knowledge/chat
```

**Đặc điểm:**
- ⚠️ **Secondary endpoint** specifically cho uploaded files
- ⚠️ VexelKnowledgeAgent với Level 5 capabilities
- ⚠️ Designed cho cross-file search trong uploaded documents
- ⚠️ May be deprecated in favor của unified endpoint

**Request Format:**
```json
{
  "message": "Summarize all my documents",
  "collection_name": null,
  "specific_file_ids": null,
  "include_shared_knowledge": false,
  "model": "gemini/gemini-1.5-flash",
  "agent_name": "VexelKnowledgeAgent"
}
```

## 🔄 Workflow Comparison

### **Unified Endpoint Workflow**
```
1. User Request → 2. VexelUnifiedAgent → 3. Knowledge Sources → 4. Response
```

### **Knowledge-Specific Endpoint Workflow**
```
1. File Upload → 2. Vector Storage → 3. VexelKnowledgeAgent → 4. Cross-File Search → 5. Response
```

## 📋 Use Cases

### **Use Unified Endpoint (`/chat`) When:**
- ✅ Creating agents với custom knowledge sources
- ✅ Providing text-based knowledge inline
- ✅ Building flexible agent interactions
- ✅ Need Level 1+2+3 capabilities trong single agent
- ✅ Want consistent API interface

**Example:**
```bash
curl -X POST "/api/v1/agents/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AIExpert",
    "message": "Explain machine learning",
    "knowledge_sources": [
      {
        "type": "text",
        "name": "ml_basics",
        "content": ["Machine learning is a subset of AI..."]
      }
    ]
  }'
```

### **Use Knowledge Endpoint (`/knowledge/chat`) When:**
- ⚠️ Working với uploaded files (PDF, DOCX, etc.)
- ⚠️ Need cross-file search capabilities
- ⚠️ Want file-specific filtering
- ⚠️ Legacy compatibility với existing uploads

**Example:**
```bash
curl -X POST "/api/v1/agents/knowledge/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the key points in my documents?",
    "collection_name": "uploaded_document_userid"
  }'
```

## 🏗️ Architecture Differences

### **Unified Agent Architecture**
```python
# VexelUnifiedAgent
unified_agent = VexelUnifiedAgent(
    name=request.name,
    model=request.model,
    user_id=current_user.id,
    knowledge_sources=request.knowledge_sources  # Inline knowledge
)

# Level 3 capabilities (L1+L2+L3)
agent = unified_agent.create_agent()
response = unified_agent.chat(request.message)
```

### **Knowledge-Specific Architecture**
```python
# VexelCrossFileKnowledge
cross_file_knowledge = VexelCrossFileKnowledge(str(current_user.id))

# Create knowledge base from uploaded files
knowledge_base = cross_file_knowledge.create_combined_knowledge_base()

# VexelKnowledgeAgent with Level 5 capabilities
agent = Agent(
    model=llm,
    knowledge=knowledge_base,
    search_knowledge=True
)
```

## 🎯 Recommendations

### **For New Development:**
- ✅ **Use `/chat` endpoint** với `knowledge_sources`
- ✅ More flexible và future-proof
- ✅ Consistent với unified agent architecture
- ✅ Better integration với other agent capabilities

### **For File Upload Scenarios:**
- ⚠️ **Use `/knowledge/chat` endpoint** cho uploaded files
- ⚠️ Specialized cho cross-file search
- ⚠️ Better performance cho large document collections
- ⚠️ File-specific metadata và filtering

### **Migration Path:**
```
Current: /knowledge/chat for uploaded files
Future: /chat with file-based knowledge_sources
Goal: Single unified endpoint for all agent interactions
```

## 📊 Feature Comparison

| Feature | `/chat` (Unified) | `/knowledge/chat` (Specific) |
|---------|-------------------|------------------------------|
| **Knowledge Sources** | Inline text, URLs | Uploaded files |
| **Agent Type** | VexelUnifiedAgent | VexelKnowledgeAgent |
| **Level** | Level 3 (L1+L2+L3) | Level 5 |
| **Cross-File Search** | ❌ (planned) | ✅ |
| **File Filtering** | ❌ | ✅ |
| **Flexibility** | ✅ High | ⚠️ Medium |
| **Performance** | ✅ Good | ✅ Optimized for files |
| **Future Support** | ✅ Primary | ⚠️ Legacy |

## 🔮 Future Direction

### **Planned Unification:**
```python
# Future unified approach
POST /api/v1/agents/chat
{
  "name": "VexelAgent",
  "message": "Analyze my documents",
  "knowledge_sources": [
    {
      "type": "uploaded_files",
      "file_ids": ["file_doc1_userid", "file_doc2_userid"]
    },
    {
      "type": "text",
      "name": "additional_context",
      "content": ["Additional context..."]
    }
  ]
}
```

### **Migration Strategy:**
1. **Phase 1**: Both endpoints coexist
2. **Phase 2**: Add file support to unified endpoint
3. **Phase 3**: Deprecate knowledge-specific endpoint
4. **Phase 4**: Single unified endpoint

## ✅ Correct Usage Summary

### **For RAG with Text Knowledge:**
```bash
POST /api/v1/agents/chat
{
  "name": "VexelAgent",
  "message": "Your question",
  "knowledge_sources": [{"type": "text", "content": ["..."]}]
}
```

### **For RAG with Uploaded Files:**
```bash
# Step 1: Upload file
POST /api/v1/agents/knowledge/upload
Content-Type: multipart/form-data

# Step 2: Chat with uploaded file
POST /api/v1/agents/knowledge/chat
{
  "message": "Your question about the file"
}
```

### **For Cross-File Search:**
```bash
POST /api/v1/agents/knowledge/search-all
{
  "query": "search term",
  "limit": 10
}
```

## 🎉 Kết Luận

- ✅ **Primary**: `/chat` cho general agent interactions với inline knowledge
- ⚠️ **Secondary**: `/knowledge/chat` cho uploaded file interactions
- 🔮 **Future**: Unified `/chat` endpoint cho tất cả use cases

Cảm ơn bạn đã chỉ ra sự nhầm lẫn! Documentation đã được cập nhật để reflect đúng architecture. 🚀
