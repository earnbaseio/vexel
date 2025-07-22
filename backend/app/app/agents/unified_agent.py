"""
Vexel Unified Agent - Agno Framework Aligned
Combines Level 1+2+3 capabilities into a single comprehensive agent:
- Level 1: Tools/Instructions
- Level 2: Knowledge/Storage  
- Level 3: Memory/Reasoning
"""

from typing import List, Dict, Any, Optional, Union
from agno.agent import Agent
from agno.models.litellm import LiteLLM
from agno.memory.v2.memory import Memory
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.memory.v2.manager import MemoryManager
from agno.memory.v2.summarizer import SessionSummarizer
from agno.storage.sqlite import SqliteStorage
from agno.tools.reasoning import ReasoningTools
from agno.knowledge.url import UrlKnowledge
from agno.knowledge.pdf_url import PDFUrlKnowledgeBase
from agno.vectordb.qdrant import Qdrant
from app.agents.gemini_embedder import GeminiEmbedder
import os
from uuid import uuid4


class VexelUnifiedAgent:
    """
    Unified Vexel Agent with all L1+L2+L3 capabilities:
    
    Level 1 - Tools/Instructions:
    - Custom tools and reasoning capabilities
    - Instruction following and task execution
    
    Level 2 - Knowledge/Storage:
    - Knowledge base integration (URLs, PDFs, documents)
    - Persistent storage across sessions
    - Vector search and retrieval
    
    Level 3 - Memory/Reasoning:
    - Long-term memory across sessions
    - Step-by-step reasoning with think/analyze
    - Session summaries and context management
    - User-specific memory isolation
    """

    def __init__(
        self,
        name: str = "VexelAgent",
        model: str = "gemini/gemini-2.5-flash-lite-preview-06-17",
        user_id: str = "default",
        session_id: Optional[str] = None,
        knowledge_sources: Optional[List[Dict[str, Any]]] = None,
        tools: Optional[List] = None,
        **kwargs
    ):
        self.name = name
        self.model = model
        self.user_id = user_id
        self.session_id = session_id or str(uuid4())
        
        # Initialize components
        self._setup_llm()
        self._setup_tools(tools)
        self._setup_storage()
        self._setup_memory()
        self._setup_knowledge(knowledge_sources)
        
        # Agent instance (created on demand)
        self.agent = None

    def _setup_llm(self):
        """Setup LiteLLM model"""
        try:
            self.llm = LiteLLM(
                id=self.model,
                api_key=self._get_api_key_for_model(self.model),
                temperature=0.7
            )
        except Exception as e:
            print(f"⚠️ Model setup failed, using fallback: {e}")
            self.llm = LiteLLM(
                id="gemini/gemini-1.5-flash",
                api_key=os.getenv("GEMINI_API_KEY", "test-key"),
                temperature=0.7
            )

    def _get_api_key_for_model(self, model: str) -> str:
        """Get appropriate API key for model"""
        if "gpt" in model or "openai" in model:
            return os.getenv("OPENAI_API_KEY", "")
        elif "claude" in model or "anthropic" in model:
            return os.getenv("ANTHROPIC_API_KEY", "")
        elif "gemini" in model or "google" in model:
            return os.getenv("GEMINI_API_KEY", "")
        else:
            return os.getenv("OPENAI_API_KEY", "")

    def _setup_tools(self, custom_tools: Optional[List] = None):
        """Setup Level 1: Tools/Instructions"""
        self.tools = custom_tools or []
        
        # Add reasoning tools for Level 3 capabilities
        reasoning_tools = ReasoningTools(
            think=True,
            analyze=True,
            add_instructions=True,
            add_few_shot=True
        )
        self.tools.append(reasoning_tools)

    def _setup_storage(self):
        """Setup Level 2: Persistent Storage"""
        self.storage = SqliteStorage(
            table_name=f"unified_agent_{self.name.lower()}",
            db_file="tmp/unified_agents.db"
        )

    def _setup_memory(self):
        """Setup Level 3: Memory/Reasoning"""
        # Memory database
        memory_db = SqliteMemoryDb(
            table_name=f"unified_memory_{self.user_id}",
            db_file=f"tmp/unified_memory_{self.user_id}.db"
        )
        
        # Memory manager with Gemini
        memory_manager = MemoryManager(
            model=LiteLLM(
                id="gemini/gemini-1.5-flash",
                api_key=os.getenv("GEMINI_API_KEY"),
                temperature=0.3
            ),
            additional_instructions="""
            You are managing memories for a Vexel Unified Agent. Focus on:
            - Store important facts, preferences, and insights about the user
            - Capture key decisions and reasoning patterns
            - Remember context and relationships between concepts
            - Update memories when new information contradicts old information
            - Use clear, concise language in memory descriptions
            """
        )
        
        # Session summarizer
        session_summarizer = SessionSummarizer(
            model=LiteLLM(
                id="gemini/gemini-1.5-flash",
                api_key=os.getenv("GEMINI_API_KEY"),
                temperature=0.2
            ),
            additional_instructions="""
            Create concise, structured summaries that capture:
            - Key topics discussed and decisions made
            - Important reasoning steps and conclusions
            - User preferences and behavioral patterns
            - Action items and follow-up tasks
            - Context needed for future conversations
            """
        )
        
        # Initialize memory system
        self.memory = Memory(
            db=memory_db,
            memory_manager=memory_manager,
            summarizer=session_summarizer,
            debug_mode=True
        )

    def _setup_knowledge(self, knowledge_sources: Optional[List[Dict[str, Any]]] = None):
        """Setup Level 2: Knowledge/Storage"""
        self.knowledge_bases = []
        
        if not knowledge_sources:
            return
            
        # Setup Qdrant vector database
        vector_db = Qdrant(
            url=os.getenv("QDRANT_URL", "http://localhost:6333"),
            collection_name=f"vexel_unified_{self.name.lower()}",
            embedder=GeminiEmbedder(
                model="models/text-embedding-004",
                api_key=os.getenv("GEMINI_API_KEY")
            )
        )
        
        for source in knowledge_sources:
            try:
                # Handle both dict and Pydantic model
                if hasattr(source, 'type'):
                    source_type = source.type
                    source_urls = source.urls
                else:
                    source_type = source["type"]
                    source_urls = source["urls"]

                if source_type == "url":
                    knowledge = UrlKnowledge(
                        urls=source_urls,
                        vector_db=vector_db
                    )
                elif source_type == "pdf_url":
                    knowledge = PDFUrlKnowledgeBase(
                        urls=source_urls,
                        vector_db=vector_db
                    )
                else:
                    continue

                self.knowledge_bases.append(knowledge)
                print(f"✅ Knowledge source loaded: {source_type}")

            except Exception as e:
                print(f"⚠️ Failed to load knowledge source {source}: {e}")

    def create_agent(self) -> Agent:
        """Create unified agent with all L1+L2+L3 capabilities"""
        # Use first knowledge base if available
        knowledge = self.knowledge_bases[0] if self.knowledge_bases else None
        
        self.agent = Agent(
            name=self.name,
            model=self.llm,
            user_id=self.user_id,
            session_id=self.session_id,
            
            # Level 1: Tools/Instructions
            tools=self.tools,
            
            # Level 2: Knowledge & Storage
            knowledge=knowledge,
            storage=self.storage,
            search_knowledge=True,
            
            # Level 3: Memory & Reasoning
            memory=self.memory,
            enable_agentic_memory=True,
            enable_user_memories=True,
            enable_session_summaries=True,
            
            # Context Management
            add_history_to_messages=True,
            num_history_runs=5,
            search_previous_sessions_history=True,
            num_history_sessions=3,
            
            # Instructions
            instructions=self._get_unified_instructions(),
            
            # Additional Features
            add_datetime_to_instructions=True,
            markdown=True,
            show_tool_calls=True,
            debug_mode=True
        )
        
        return self.agent

    def _get_unified_instructions(self) -> List[str]:
        """Get comprehensive instructions for unified agent"""
        return [
            f"You are {self.name}, a comprehensive Vexel AI Agent with advanced capabilities.",
            "",
            "CORE CAPABILITIES:",
            "- Level 1: Advanced tool usage and instruction following",
            "- Level 2: Knowledge search and persistent storage",
            "- Level 3: Memory management and step-by-step reasoning",
            "",
            "REASONING PROCESS:",
            "- Use think() tool to break down complex problems",
            "- Use analyze() tool to evaluate results and plan next steps",
            "- Combine reasoning with knowledge search for comprehensive answers",
            "",
            "KNOWLEDGE USAGE:",
            "- Always search your knowledge base for relevant information",
            "- Cite sources and provide accurate, well-researched responses",
            "- Combine knowledge search results with your reasoning process",
            "",
            "MEMORY MANAGEMENT:",
            "- Maintain awareness of conversation history and session context",
            "- Reference previous discussions and build upon past interactions",
            "- Adapt your communication style based on user preferences stored in memory",
            "",
            "RESPONSE STYLE:",
            "- Be helpful, accurate, and comprehensive",
            "- Use markdown formatting for better readability",
            "- Show your reasoning process when solving complex problems",
            "- Provide actionable insights and recommendations"
        ]

    def chat(self, message: str) -> str:
        """Chat with the unified agent"""
        if not self.agent:
            self.create_agent()

        try:
            response = self.agent.run(message)
            if hasattr(response, 'content'):
                return response.content
            elif hasattr(response, 'text'):
                return response.text
            else:
                return str(response) if response else "No response generated"
        except Exception as e:
            return f"Error generating response: {str(e)}"

    def get_agent_info(self) -> Dict[str, Any]:
        """Get information about the agent's capabilities"""
        return {
            "name": self.name,
            "model": self.model,
            "user_id": self.user_id,
            "session_id": self.session_id,
            "capabilities": {
                "tools": len(self.tools),
                "knowledge_bases": len(self.knowledge_bases),
                "memory": bool(self.memory),
                "storage": bool(self.storage)
            },
            "levels": {
                "L1_tools": True,
                "L2_knowledge": len(self.knowledge_bases) > 0,
                "L2_storage": True,
                "L3_memory": True,
                "L3_reasoning": True
            }
        }
