# Vexel Technical Architecture

**Project**: Vexel AI Agent System  
**Document**: Technical Architecture Specification  
**Date**: 2025-07-08  
**Version**: 1.0  

## 🏗️ **SYSTEM ARCHITECTURE OVERVIEW**

### **High-Level Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   FastAPI       │    │   MongoDB       │
│   Frontend      │◄──►│   Backend       │◄──►│   Database      │
│   (Port 3000)   │    │   (Port 8000)   │    │   (Port 27017)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Agno Agent    │              │
         └──────────────►│   Framework     │◄─────────────┘
                        │   (In-Process)  │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │   OpenAI/Claude │
                        │   API Services  │
                        └─────────────────┘
```

### **Technology Stack**
- **Frontend**: Next.js 14 + React + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python 3.11 + Pydantic V2
- **Database**: MongoDB + ODMantic ODM
- **AI Framework**: Agno (Level 1 - Agents with Tools)
- **Authentication**: JWT + OAuth2 + TOTP
- **Infrastructure**: Docker Compose + Traefik Proxy
- **Testing**: Pytest + Jest + Cypress

## 🔧 **BACKEND ARCHITECTURE**

### **FastAPI Application Structure**
```
backend/app/app/
├── main.py                 # FastAPI application entry
├── api/
│   └── api_v1/
│       ├── api.py         # API router aggregation
│       └── endpoints/
│           ├── auth.py    # Authentication endpoints
│           ├── users.py   # User management
│           ├── agents.py  # Agent management (NEW)
│           ├── chat.py    # Chat endpoints (NEW)
│           └── tools.py   # Tool management (NEW)
├── agents/                # Agno agent implementations (NEW)
│   ├── __init__.py
│   ├── base.py           # Base agent classes
│   ├── factory.py        # Agent factory
│   ├── assistant.py      # Assistant agent
│   ├── analyst.py        # Data analyst agent
│   └── specialist.py     # Domain specialist agents
├── tools/                 # Custom tool implementations (NEW)
│   ├── __init__.py
│   ├── base.py           # Base tool classes
│   ├── calculator.py     # Math calculations
│   ├── web_search.py     # Web search tool
│   ├── file_handler.py   # File operations
│   └── database.py       # Database queries
├── models/
│   ├── user.py           # User model (existing)
│   ├── agent.py          # Agent configuration model (NEW)
│   ├── chat.py           # Chat session model (NEW)
│   └── tool.py           # Tool configuration model (NEW)
├── core/
│   ├── config.py         # Application configuration
│   ├── security.py       # Security utilities
│   └── agno_setup.py     # Agno configuration (NEW)
└── db/
    ├── base_class.py     # ODMantic base classes
    └── session.py        # Database session management
```

### **Agno Integration Layer**
```python
# core/agno_setup.py
from agno import Agent
from agno.storage.mongodb import MongoDbStorage
from agno.memory.v2.db.mongodb import MongoMemoryDb
from agno.model.openai import OpenAIChat

class AgnoConfig:
    def __init__(self, settings: Settings):
        self.storage = MongoDbStorage(
            collection_name="agno_sessions",
            db_url=settings.MONGO_DATABASE_URI,
            db_name=settings.MONGO_DATABASE
        )
        
        self.memory_db = MongoMemoryDb(
            collection_name="agno_memories",
            db_url=settings.MONGO_DATABASE_URI,
            db_name=settings.MONGO_DATABASE
        )
    
    def create_agent(self, config: AgentConfig) -> Agent:
        return Agent(
            name=config.name,
            model=OpenAIChat(id=config.model_id),
            storage=self.storage,
            memory=Memory(db=self.memory_db),
            tools=self.load_tools(config.tools),
            instructions=config.instructions
        )
```

## 🗄️ **DATABASE SCHEMA**

### **Existing Collections** (from template)
```python
# User collection (existing)
class User(BaseModel):
    email: EmailStr
    hashed_password: str
    full_name: str
    is_active: bool = True
    is_superuser: bool = False
    totp_secret: Optional[str] = None
    totp_counter: Optional[int] = None
```

### **New Collections** (for Agno integration)
```python
# Agent configuration collection
class AgentConfig(BaseModel):
    name: str
    description: str
    agent_type: str  # "assistant", "analyst", "specialist"
    model_id: str = "gpt-4o"
    instructions: List[str] = []
    tools: List[str] = []
    user_id: ObjectId
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

# Chat session collection
class ChatSession(BaseModel):
    agent_id: ObjectId
    user_id: ObjectId
    session_id: str
    messages: List[dict] = []
    metadata: dict = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

# Tool configuration collection
class ToolConfig(BaseModel):
    name: str
    description: str
    tool_type: str
    parameters: dict = {}
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Agno-specific collections (managed by Agno)
# - agno_sessions: Agent session data
# - agno_memories: Agent memory storage
```

## 🔌 **API ENDPOINTS SPECIFICATION**

### **Agent Management API**
```python
# Agent CRUD operations
POST   /api/v1/agents                    # Create new agent
GET    /api/v1/agents                    # List user's agents
GET    /api/v1/agents/{agent_id}         # Get agent details
PUT    /api/v1/agents/{agent_id}         # Update agent configuration
DELETE /api/v1/agents/{agent_id}         # Delete agent
POST   /api/v1/agents/{agent_id}/clone   # Clone existing agent

# Agent interaction
POST   /api/v1/agents/{agent_id}/chat    # Send message to agent
GET    /api/v1/agents/{agent_id}/history # Get conversation history
POST   /api/v1/agents/{agent_id}/stream  # Streaming chat
DELETE /api/v1/agents/{agent_id}/history # Clear conversation history

# Tool management
GET    /api/v1/tools                     # List available tools
POST   /api/v1/agents/{agent_id}/tools   # Add tool to agent
DELETE /api/v1/agents/{agent_id}/tools/{tool_id} # Remove tool from agent
GET    /api/v1/agents/{agent_id}/tools   # List agent's tools
```

### **Request/Response Models**
```python
# Agent creation request
class AgentCreate(BaseModel):
    name: str
    description: str
    agent_type: str
    model_id: str = "gpt-4o"
    instructions: List[str] = []
    tools: List[str] = []

# Chat message request
class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None
    stream: bool = False

# Chat response
class ChatResponse(BaseModel):
    response: str
    session_id: str
    agent_id: str
    timestamp: datetime
    metadata: dict = {}
```

## 🎨 **FRONTEND ARCHITECTURE**

### **Next.js Application Structure**
```
frontend/app/
├── layout.tsx              # Root layout
├── page.tsx               # Home page
├── agents/                # Agent management pages (NEW)
│   ├── page.tsx          # Agent list
│   ├── create/
│   │   └── page.tsx      # Create agent
│   ├── [id]/
│   │   ├── page.tsx      # Agent details
│   │   ├── chat/
│   │   │   └── page.tsx  # Chat interface
│   │   └── settings/
│   │       └── page.tsx  # Agent settings
├── components/
│   ├── agents/           # Agent-related components (NEW)
│   │   ├── AgentCard.tsx
│   │   ├── AgentForm.tsx
│   │   ├── ChatInterface.tsx
│   │   └── ToolSelector.tsx
│   ├── ui/               # Reusable UI components
│   └── layout/           # Layout components
├── lib/
│   ├── api/
│   │   ├── agents.ts     # Agent API client (NEW)
│   │   ├── chat.ts       # Chat API client (NEW)
│   │   └── tools.ts      # Tools API client (NEW)
│   ├── hooks/
│   │   ├── useAgents.ts  # Agent management hooks (NEW)
│   │   ├── useChat.ts    # Chat functionality hooks (NEW)
│   │   └── useTools.ts   # Tool management hooks (NEW)
│   └── types/
│       ├── agent.ts      # Agent type definitions (NEW)
│       ├── chat.ts       # Chat type definitions (NEW)
│       └── tool.ts       # Tool type definitions (NEW)
```

### **State Management**
```typescript
// Redux store structure
interface RootState {
  auth: AuthState;           // Existing authentication state
  agents: AgentsState;       // Agent management state (NEW)
  chat: ChatState;          // Chat sessions state (NEW)
  tools: ToolsState;        // Available tools state (NEW)
}

// Agent state slice
interface AgentsState {
  agents: Agent[];
  currentAgent: Agent | null;
  loading: boolean;
  error: string | null;
}

// Chat state slice
interface ChatState {
  sessions: { [agentId: string]: ChatSession };
  activeSession: string | null;
  streaming: boolean;
  error: string | null;
}
```

## 🔒 **SECURITY ARCHITECTURE**

### **Authentication Flow**
1. **User Login**: JWT token generation with refresh token
2. **API Access**: Bearer token validation on all protected endpoints
3. **Agent Access**: User can only access their own agents
4. **Session Management**: Secure session handling with TOTP support

### **Authorization Matrix**
```
Resource        | Owner | Admin | Public
----------------|-------|-------|--------
User Profile    | RW    | RW    | -
Own Agents      | RW    | R     | -
Others' Agents  | -     | R     | -
Chat Sessions   | RW    | R     | -
System Tools    | R     | RW    | -
```

## 📊 **PERFORMANCE CONSIDERATIONS**

### **Database Optimization**
- **Indexes**: User ID, Agent ID, Session ID, timestamps
- **Connection Pooling**: Motor async connection pool
- **Query Optimization**: Aggregation pipelines for complex queries

### **API Performance**
- **Response Caching**: Redis for frequently accessed data
- **Streaming**: Server-sent events for real-time chat
- **Rate Limiting**: Per-user API rate limits
- **Pagination**: Cursor-based pagination for large datasets

### **Frontend Optimization**
- **Code Splitting**: Route-based code splitting
- **State Management**: Optimized Redux selectors
- **Caching**: React Query for API response caching
- **Lazy Loading**: Component and image lazy loading

## 🚀 **DEPLOYMENT ARCHITECTURE**

### **Development Environment**
```yaml
# docker-compose.yml structure
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      - MONGO_DATABASE_URI=mongodb://mongo:27017
    depends_on: [mongo]
  
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: [backend]
  
  mongo:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: ["mongo_data:/data/db"]
  
  proxy:
    image: traefik:v2.2
    ports: ["80:80", "443:443"]
```

### **Production Considerations**
- **Load Balancing**: Multiple backend instances
- **Database Clustering**: MongoDB replica set
- **CDN**: Static asset delivery
- **Monitoring**: Application and infrastructure monitoring
- **Backup**: Automated database backups

---

**Architecture Version**: 1.0  
**Last Updated**: 2025-07-08  
**Next Review**: 2025-07-10  
**Status**: Draft - Ready for Implementation
