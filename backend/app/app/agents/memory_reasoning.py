"""
Vexel Memory/Reasoning Agent - Level 3
Advanced memory and reasoning capabilities using Agno framework
"""

import os
from typing import List, Dict, Any, Optional, Union
from datetime import datetime

from agno.agent.agent import Agent
from agno.models.litellm import LiteLLM
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.memory.v2.memory import Memory
from agno.memory.v2.manager import MemoryManager
from agno.memory.v2.summarizer import SessionSummarizer
from agno.storage.sqlite import SqliteStorage
from agno.tools.reasoning import ReasoningTools
from agno.tools.toolkit import Toolkit
from agno.knowledge.text import TextKnowledgeBase
from agno.vectordb.qdrant import Qdrant

from app.agents.gemini_embedder import GeminiEmbedder


class VexelReasoningTools(Toolkit):
    """
    Custom reasoning tools that provide default values for missing parameters
    """

    def __init__(self, think: bool = True, analyze: bool = True, **kwargs):
        # Extract reasoning-specific parameters
        reasoning_kwargs = {
            'think': think,
            'analyze': analyze,
            'add_instructions': kwargs.pop('add_instructions', True),
            'add_few_shot': kwargs.pop('add_few_shot', True)
        }

        # Initialize the underlying reasoning tools
        self.reasoning_tools = ReasoningTools(**reasoning_kwargs)

        # Initialize parent with remaining kwargs
        super().__init__(
            name="vexel_reasoning_tools",
            tools=[self.think, self.analyze] if think and analyze else ([self.think] if think else [self.analyze] if analyze else []),
            **kwargs
        )

    def think(
        self,
        agent: Union[Agent, Any],
        thought: str,
        title: str = "Reasoning Step",
        action: Optional[str] = None,
        confidence: float = 0.8
    ) -> str:
        """
        Wrapper for think tool that provides default title
        """
        return self.reasoning_tools.think(
            agent=agent,
            title=title,
            thought=thought,
            action=action,
            confidence=confidence
        )

    def analyze(
        self,
        agent: Union[Agent, Any],
        result: str,
        analysis: str,
        title: str = "Analysis Step",
        next_action: str = "continue",
        confidence: float = 0.8
    ) -> str:
        """
        Wrapper for analyze tool
        """
        return self.reasoning_tools.analyze(
            agent=agent,
            title=title,
            result=result,
            analysis=analysis,
            next_action=next_action,
            confidence=confidence
        )


class VexelMemoryReasoningAgent:
    """
    Vexel Level 3: Memory/Reasoning Agent
    
    Features:
    - Long-term persistent memory across sessions
    - Step-by-step reasoning with think/analyze tools
    - Smart context management and compression
    - Session summaries and memory retrieval
    - Multi-user support with isolated memories
    """
    
    def __init__(
        self,
        name: str = "VexelMemoryReasoningAgent",
        model: str = "gemini/gemini-2.5-flash-lite",
        user_id: str = "default_user",
        session_id: Optional[str] = None,
        db_file: str = "tmp/vexel_memory_reasoning.db",
        qdrant_url: str = "http://localhost:6333",
        knowledge_sources: Optional[List[Dict[str, Any]]] = None
    ):
        self.name = name
        self.model = model
        self.user_id = user_id
        self.session_id = session_id
        self.db_file = db_file
        self.qdrant_url = qdrant_url
        self.knowledge_sources = knowledge_sources or []
        
        # Initialize components
        self.memory = None
        self.storage = None
        self.knowledge_bases = []
        self.agent = None
        
        self._setup_memory()
        self._setup_storage()
        self._setup_knowledge()
        
    def _setup_memory(self):
        """
        Setup advanced memory system with:
        - Persistent SQLite storage
        - Custom memory manager for agentic memory
        - Session summarizer for context compression
        """
        # Memory database
        memory_db = SqliteMemoryDb(
            table_name="vexel_memories",
            db_file=self.db_file
        )
        
        # Custom memory manager with Gemini
        memory_manager = MemoryManager(
            model=LiteLLM(
                id="gemini/gemini-2.5-flash-lite",
                api_key=os.getenv("GEMINI_API_KEY"),
                temperature=0.3
            ),
            additional_instructions="""
            You are managing memories for a Vexel AI Agent. Focus on:
            - Store important facts, preferences, and insights about the user
            - Capture key decisions and reasoning patterns
            - Remember context and relationships between concepts
            - Update memories when new information contradicts old information
            - Use clear, concise language in memory descriptions
            """
        )
        
        # Session summarizer for context compression
        session_summarizer = SessionSummarizer(
            model=LiteLLM(
                id="gemini/gemini-2.5-flash-lite",
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
        
        # Memory system initialized successfully
    
    def _setup_storage(self):
        """
        Setup persistent storage for agent sessions
        """
        self.storage = SqliteStorage(
            table_name="vexel_agent_sessions",
            db_file=self.db_file
        )
        
        # Storage system initialized successfully
    
    def _setup_knowledge(self):
        """
        Setup knowledge bases from provided sources
        """
        for source in self.knowledge_sources:
            if source["type"] == "text":
                # Create temporary files for text content
                import tempfile
                temp_files_with_metadata = []

                for i, content in enumerate(source["content"]):
                    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False)
                    temp_file.write(content)
                    temp_file.close()

                    # Create path with metadata format expected by TextKnowledgeBase
                    temp_files_with_metadata.append({
                        "path": temp_file.name,
                        "metadata": {
                            "source": source["name"],
                            "document_id": i,
                            "content_type": "text"
                        }
                    })

                # Use Gemini embeddings
                embedder = GeminiEmbedder(
                    id="gemini-embedding-exp-03-07",
                    api_key=os.getenv("GEMINI_API_KEY"),
                    task_type="RETRIEVAL_DOCUMENT",
                    dimensions=3072
                )

                # Create Qdrant collection for this knowledge source
                vector_db = Qdrant(
                    collection=f"vexel_memory_{source['name']}",
                    url=self.qdrant_url,
                    embedder=embedder  # Pass embedder to Qdrant
                )

                # Create knowledge base with file paths and metadata
                kb = TextKnowledgeBase(
                    path=temp_files_with_metadata,
                    vector_db=vector_db
                    # embedder is already set in vector_db
                )

                self.knowledge_bases.append(kb)
                # Knowledge base created successfully
    
    def load_knowledge(self, recreate: bool = False):
        """
        Load all knowledge bases
        """
        for kb in self.knowledge_bases:
            try:
                # Loading knowledge base
                kb.load(recreate=recreate)
                # Knowledge base loaded successfully

                # Test search functionality
                if hasattr(kb, 'search') and kb.vector_db:
                    kb.search("test", num_documents=1)
                    # Search test completed

            except Exception:
                # Failed to load knowledge base
                import traceback
                traceback.print_exc()
    
    def create_agent(self) -> Agent:
        """
        Create advanced memory/reasoning agent with:
        - Persistent memory and storage
        - Reasoning tools for step-by-step thinking
        - Knowledge search capabilities
        - Smart context management
        """
        # Initialize LLM
        llm = LiteLLM(
            id=self.model,
            api_key=self._get_api_key_for_model(self.model),
            temperature=0.7
        )
        
        # Use first knowledge base if available
        knowledge = self.knowledge_bases[0] if self.knowledge_bases else None
        
        # Create custom reasoning tools with default values
        reasoning_tools = VexelReasoningTools(
            think=True,
            analyze=True,
            add_instructions=True,
            add_few_shot=True
        )
        
        self.agent = Agent(
            name=self.name,
            model=llm,
            user_id=self.user_id,
            session_id=self.session_id,
            
            # Memory & Storage
            memory=self.memory,
            storage=self.storage,
            
            # Knowledge
            knowledge=knowledge,
            search_knowledge=True,
            
            # Reasoning
            tools=[reasoning_tools],
            
            # Memory Features
            enable_agentic_memory=True,  # Agent can create/update memories
            enable_user_memories=True,   # Store user-specific memories
            enable_session_summaries=True,  # Auto-create session summaries
            
            # Context Management
            add_history_to_messages=True,  # Include chat history
            num_history_runs=5,  # Last 5 exchanges
            search_previous_sessions_history=True,  # Search across sessions
            num_history_sessions=3,  # Search last 3 sessions
            
            # Enhanced Instructions
            instructions=[
                "You are Vexel, an advanced AI Agent with memory, reasoning, and knowledge capabilities.",
                "",
                "MEMORY MANAGEMENT:",
                "- Always create and update user memories based on conversations",
                "- Remember user preferences, decisions, and important context",
                "- Use your memory to personalize responses and maintain continuity",
                "",
                "REASONING PROCESS:",
                "- For complex questions, use the 'think' tool to break down problems step-by-step",
                "- Use the 'analyze' tool to evaluate results and determine next actions",
                "- Show your reasoning process to help users understand your thinking",
                "",
                "KNOWLEDGE SEARCH:",
                "- Always search your knowledge base for relevant information",
                "- Combine knowledge search results with your reasoning process",
                "- Cite sources and provide accurate, well-researched responses",
                "",
                "CONTEXT AWARENESS:",
                "- Maintain awareness of conversation history and session context",
                "- Reference previous discussions and build upon past interactions",
                "- Adapt your communication style based on user preferences stored in memory"
            ],
            
            # Additional Features
            add_datetime_to_instructions=True,  # Time awareness
            markdown=True,  # Rich formatting
            show_tool_calls=True,  # Debug tool usage
            debug_mode=True  # Enhanced debugging
        )
        
        return self.agent
    
    def _get_api_key_for_model(self, model: str) -> str:
        """Get appropriate API key for the model"""
        if model.startswith("gemini/"):
            return os.getenv("GEMINI_API_KEY")
        elif model.startswith("openai/") or model.startswith("gpt-"):
            return os.getenv("OPENAI_API_KEY")
        elif model.startswith("anthropic/") or model.startswith("claude-"):
            return os.getenv("ANTHROPIC_API_KEY")
        else:
            return os.getenv("OPENAI_API_KEY")  # Default fallback
    
    def chat(self, message: str) -> str:
        """
        Chat with the memory/reasoning agent
        """
        if not self.agent:
            self.create_agent()
        
        try:
            response = self.agent.run(message)
            return response.content or "No response generated"
        except Exception as e:
            return f"Error: {str(e)}"
    
    def get_memories(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get user memories
        """
        try:
            memories = self.memory.search_user_memories(
                user_id=self.user_id,
                limit=limit
            )
            return [
                {
                    "memory": mem.memory,
                    "topics": mem.topics,
                    "created_at": mem.created_at.isoformat() if mem.created_at else None
                }
                for mem in memories
            ]
        except Exception:
            # Error getting memories
            return []
    
    def get_session_summary(self) -> Optional[str]:
        """
        Get current session summary
        """
        try:
            if self.session_id and self.memory.summaries:
                user_summaries = self.memory.summaries.get(self.user_id, {})
                session_summary = user_summaries.get(self.session_id)
                return session_summary.summary if session_summary else None
        except Exception:
            # Error getting session summary
            return None
    
    def clear_memories(self):
        """
        Clear all memories (for testing)
        """
        try:
            self.memory.clear()
            # Memories cleared successfully
        except Exception:
            # Error clearing memories
            pass


# Factory function for easy creation
def create_memory_reasoning_agent(
    name: str = "VexelMemoryReasoningAgent",
    model: str = "gemini/gemini-2.5-flash-lite",
    user_id: str = "default_user",
    session_id: Optional[str] = None,
    knowledge_sources: Optional[List[Dict[str, Any]]] = None,
    **kwargs
) -> VexelMemoryReasoningAgent:
    """
    Factory function to create memory/reasoning agent instances
    """
    return VexelMemoryReasoningAgent(
        name=name,
        model=model,
        user_id=user_id,
        session_id=session_id,
        knowledge_sources=knowledge_sources,
        **kwargs
    )
