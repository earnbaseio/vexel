# Unified Chat Endpoint Proposal

## 🎯 Concept: Single `/chat` Endpoint với Session-Based Agent Management

Dựa trên phân tích Agno framework và Vexel architecture, đề xuất simplify thành **1 endpoint duy nhất** với session-based approach.

## 🏗️ Architecture Overview

### **Current State (Multiple Endpoints)**
```
/chat                    → Unified agent với inline knowledge
/knowledge/chat          → Knowledge-specific agent
/knowledge/upload        → File upload
/knowledge/search-all    → Direct search
```

### **Proposed State (Single Endpoint)**
```
/chat                    → Universal endpoint với session management
/conversations           → Session/conversation management (existing)
/knowledge/upload        → File upload (keep for convenience)
```

## 🔄 Session-Based Workflow

### **1. Create Conversation/Session**
```bash
POST /api/v1/chat/conversations
{
  "title": "AI Research Discussion",
  "agent_config": {
    "name": "VexelAgent",
    "model": "gemini/gemini-1.5-flash",
    "knowledge_sources": [
      {
        "type": "uploaded_files",
        "file_ids": ["file_doc1_userid", "file_doc2_userid"]
      },
      {
        "type": "text",
        "name": "ai_context",
        "content": ["AI is artificial intelligence..."]
      }
    ],
    "tools": ["web_search", "calculator"],
    "instructions": ["You are an AI research assistant..."],
    "memory_enabled": true,
    "storage_enabled": true
  }
}

# Response
{
  "conversation_id": "conv_123",
  "agent_session_id": "session_456",
  "status": "created"
}
```

### **2. Chat trong Session**
```bash
POST /api/v1/chat
{
  "conversation_id": "conv_123",  # Required: links to session
  "message": "What are the key points in my uploaded documents?"
}

# Response
{
  "message_id": "msg_789",
  "conversation_id": "conv_123",
  "response": "Based on your uploaded documents...",
  "sources": ["file_doc1_userid", "file_doc2_userid"],
  "status": "success"
}
```

### **3. Continue Conversation**
```bash
POST /api/v1/chat
{
  "conversation_id": "conv_123",
  "message": "Can you elaborate on the first point?"
}
# Agent remembers context từ previous messages
```

## 🤖 Agent Configuration at Session Start

### **Agno Agent Initialization**
```python
# When conversation is created
agent = Agent(
    name=agent_config.name,
    model=LiteLLM(id=agent_config.model),
    session_id=conversation.agent_session_id,
    user_id=str(current_user.id),
    
    # Knowledge configuration
    knowledge=create_combined_knowledge_base(agent_config.knowledge_sources),
    search_knowledge=True,
    add_references=True,
    
    # Memory configuration  
    memory=Memory(
        db=SqliteMemoryDb(f"tmp/memory_{user_id}.db"),
        enable_user_memories=True,
        create_session_summary=True
    ),
    
    # Storage configuration
    storage=SqliteStorage(
        table_name=f"agent_sessions_{user_id}",
        db_file=f"tmp/sessions_{user_id}.db"
    ),
    
    # Tools configuration
    tools=load_tools(agent_config.tools),
    
    # Instructions
    instructions=agent_config.instructions,
    
    # Session settings
    add_history_to_messages=True,
    num_history_runs=10,
    search_previous_sessions_history=True
)

# Store agent instance với conversation_id
active_agents[conversation_id] = agent
```

## 📋 Implementation Plan

### **Phase 1: Unified Chat Endpoint**

#### **1. Update Chat Endpoint**
```python
@router.post("/chat", response_model=ChatResponse)
async def unified_chat(
    request: UnifiedChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Universal chat endpoint với session management
    """
    # Get or create conversation
    if request.conversation_id:
        conversation = await get_conversation(request.conversation_id)
        agent = get_or_restore_agent(conversation)
    else:
        # Create new conversation if not provided
        conversation = await create_conversation(request.agent_config)
        agent = create_agent_from_config(conversation.agent_config_snapshot)
    
    # Chat with agent
    response = agent.run(
        request.message,
        user_id=str(current_user.id),
        session_id=conversation.agent_session_id
    )
    
    # Save message to conversation
    await save_message(conversation.id, request.message, response)
    
    return ChatResponse(
        message_id=str(uuid4()),
        conversation_id=conversation.conversation_id,
        response=response.content,
        sources=extract_sources(response),
        status="success"
    )
```

#### **2. Request/Response Models**
```python
class KnowledgeSource(BaseModel):
    type: Literal["text", "uploaded_files", "url", "pdf"]
    name: Optional[str] = None
    content: Optional[List[str]] = None  # For text type
    file_ids: Optional[List[str]] = None  # For uploaded_files
    urls: Optional[List[str]] = None     # For url/pdf types

class AgentConfig(BaseModel):
    name: str = "VexelAgent"
    model: str = "gemini/gemini-1.5-flash"
    knowledge_sources: Optional[List[KnowledgeSource]] = None
    tools: Optional[List[str]] = None
    instructions: Optional[List[str]] = None
    memory_enabled: bool = True
    storage_enabled: bool = True

class UnifiedChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None  # If None, creates new conversation
    agent_config: Optional[AgentConfig] = None  # Only for new conversations

class ChatResponse(BaseModel):
    message_id: str
    conversation_id: str
    response: str
    sources: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    status: str
```

### **Phase 2: Agent Session Management**

#### **1. Agent Instance Caching**
```python
# Global agent cache
active_agents: Dict[str, Agent] = {}

def get_or_restore_agent(conversation: ChatConversation) -> Agent:
    """Get cached agent or restore from session"""
    if conversation.conversation_id in active_agents:
        return active_agents[conversation.conversation_id]
    
    # Restore agent from session
    agent = create_agent_from_config(conversation.agent_config_snapshot)
    agent.load_session(
        user_id=str(conversation.user_id),
        session_id=conversation.agent_session_id
    )
    
    active_agents[conversation.conversation_id] = agent
    return agent

def create_agent_from_config(config: Dict[str, Any]) -> Agent:
    """Create Agno agent from configuration"""
    knowledge_base = None
    if config.get("knowledge_sources"):
        knowledge_base = create_combined_knowledge_base(config["knowledge_sources"])
    
    return Agent(
        name=config["name"],
        model=LiteLLM(id=config["model"]),
        knowledge=knowledge_base,
        tools=load_tools(config.get("tools", [])),
        instructions=config.get("instructions", []),
        memory=create_memory_instance(config),
        storage=create_storage_instance(config),
        search_knowledge=True,
        add_references=True,
        add_history_to_messages=True
    )
```

#### **2. Knowledge Source Handling**
```python
def create_combined_knowledge_base(sources: List[KnowledgeSource]) -> CombinedKnowledgeBase:
    """Create combined knowledge base from multiple sources"""
    knowledge_bases = []
    
    for source in sources:
        if source.type == "text":
            kb = create_text_knowledge_base(source.content, source.name)
            knowledge_bases.append(kb)
            
        elif source.type == "uploaded_files":
            kb = create_file_knowledge_base(source.file_ids)
            knowledge_bases.append(kb)
            
        elif source.type == "url":
            kb = create_url_knowledge_base(source.urls)
            knowledge_bases.append(kb)
    
    return CombinedKnowledgeBase(sources=knowledge_bases)

def create_file_knowledge_base(file_ids: List[str]) -> DocumentKnowledgeBase:
    """Create knowledge base from uploaded files"""
    cross_file_knowledge = VexelCrossFileKnowledge(user_id)
    return cross_file_knowledge.create_user_knowledge_base(file_ids=file_ids)
```

## 🎯 Benefits của Unified Approach

### **1. Simplicity**
- ✅ **Single endpoint** cho tất cả chat interactions
- ✅ **Session-based** state management
- ✅ **Consistent API** interface

### **2. Agno Framework Alignment**
- ✅ **Full Agno capabilities**: Memory, Storage, Knowledge, Tools
- ✅ **Session persistence** across conversations
- ✅ **Multi-user, multi-session** support

### **3. Flexibility**
- ✅ **Dynamic agent configuration** per conversation
- ✅ **Mixed knowledge sources** trong single session
- ✅ **Tool composition** based on needs

### **4. Performance**
- ✅ **Agent instance caching** cho active conversations
- ✅ **Session state persistence** 
- ✅ **Efficient knowledge retrieval**

## 🔄 Migration Strategy

### **Phase 1: Implement Unified Endpoint**
1. Create new unified `/chat` endpoint
2. Update conversation management
3. Implement agent session caching

### **Phase 2: Deprecate Old Endpoints**
1. Mark `/knowledge/chat` as deprecated
2. Add migration notices
3. Update documentation

### **Phase 3: Remove Legacy Endpoints**
1. Remove deprecated endpoints
2. Clean up unused code
3. Simplify architecture

## 📊 Usage Examples

### **Example 1: Research Assistant với Multiple Knowledge Sources**
```bash
# Create conversation
POST /chat/conversations
{
  "title": "AI Research Session",
  "agent_config": {
    "name": "ResearchAssistant",
    "knowledge_sources": [
      {"type": "uploaded_files", "file_ids": ["paper1", "paper2"]},
      {"type": "text", "name": "context", "content": ["Additional context..."]}
    ],
    "tools": ["web_search", "calculator"],
    "instructions": ["You are a research assistant..."]
  }
}

# Chat
POST /chat
{
  "conversation_id": "conv_123",
  "message": "Compare the methodologies in the uploaded papers"
}

# Continue conversation
POST /chat
{
  "conversation_id": "conv_123", 
  "message": "What are the limitations of the first approach?"
}
```

### **Example 2: Quick Chat với Inline Knowledge**
```bash
# Direct chat (creates conversation automatically)
POST /chat
{
  "message": "Explain machine learning",
  "agent_config": {
    "knowledge_sources": [
      {"type": "text", "content": ["ML is a subset of AI..."]}
    ]
  }
}
```

## 🎉 Conclusion

Unified `/chat` endpoint với session-based approach sẽ:

1. **Simplify API** - Single endpoint cho tất cả use cases
2. **Maximize Agno** - Tận dụng full framework capabilities  
3. **Improve UX** - Consistent và intuitive interface
4. **Enable Advanced Features** - Memory, tools, multi-source knowledge

Đây là approach tối ưu để align với Agno framework design principles! 🚀
