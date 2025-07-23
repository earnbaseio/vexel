"""
Vexel Agent - Agno Framework Aligned
Combines Level 1+2+3 capabilities into a single comprehensive agent:
- Level 1: Tools/Instructions
- Level 2: Knowledge/Storage
- Level 3: Memory/Reasoning
"""

from typing import List, Dict, Any, Optional, Union, Iterator, AsyncIterator
from agno.agent import Agent
from agno.run.response import RunResponseEvent
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


class VexelAgent:
    """
    Vexel Agent with all L1+L2+L3 capabilities:
    
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
        model: str = "gemini/gemini-2.5-flash-lite",
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
        self._setup_storage()
        self._setup_memory()
        self._setup_knowledge(knowledge_sources)
        self._setup_tools(tools)  # Setup tools after knowledge so KnowledgeTools can be added
        
        # Agent instance (created on demand)
        self.agent = None

    def _setup_llm(self):
        """Setup LiteLLM model - Gemini 2.0 Flash Exp only"""
        print(f"🤖 DEBUG: Setting up LLM with model: {self.model}")
        self.llm = LiteLLM(
            id=self.model,
            api_key=self._get_api_key_for_model(self.model),
            temperature=0.7
        )
        print(f"✅ DEBUG: LLM setup successful with {self.model}")

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
        print(f"🔧 DEBUG: _setup_tools called with custom_tools: {custom_tools}")
        self.tools = custom_tools or []
        print(f"🔧 DEBUG: Initial tools list: {len(self.tools)} tools")

        # Add reasoning tools for Level 3 capabilities
        print(f"🔧 DEBUG: Adding ReasoningTools...")
        reasoning_tools = ReasoningTools(
            think=True,
            analyze=True,
            add_instructions=True,
            add_few_shot=True
        )
        self.tools.append(reasoning_tools)
        print(f"🔧 DEBUG: ReasoningTools added. Total tools: {len(self.tools)}")

        # Add knowledge tools for Level 2 capabilities
        print(f"🔍 DEBUG: Setting up knowledge tools. Knowledge bases count: {len(self.knowledge_bases) if self.knowledge_bases else 0}")
        print(f"🔍 DEBUG: Knowledge bases: {[type(kb).__name__ for kb in self.knowledge_bases] if self.knowledge_bases else 'None'}")

        if self.knowledge_bases:
            print(f"🔍 DEBUG: Adding KnowledgeTools with knowledge base: {type(self.knowledge_bases[0])}")
            print(f"🔍 DEBUG: Knowledge base details: {self.knowledge_bases[0]}")

            try:
                from agno.tools.knowledge import KnowledgeTools
                knowledge_tools = KnowledgeTools(
                    knowledge=self.knowledge_bases[0],  # Use first knowledge base
                    think=True,
                    search=True,
                    analyze=True,
                    add_instructions=True
                )
                self.tools.append(knowledge_tools)
                print(f"✅ DEBUG: KnowledgeTools added successfully. Total tools: {len(self.tools)}")
                print(f"✅ DEBUG: KnowledgeTools object: {knowledge_tools}")

                # Test if knowledge tools have search method
                if hasattr(knowledge_tools, 'search'):
                    print(f"✅ DEBUG: KnowledgeTools has search method")
                else:
                    print(f"⚠️ DEBUG: KnowledgeTools missing search method")

            except Exception as e:
                print(f"❌ DEBUG: Failed to create KnowledgeTools: {e}")
                import traceback
                traceback.print_exc()
        else:
            print("⚠️ DEBUG: No knowledge bases found, skipping KnowledgeTools setup")

        print(f"🔧 DEBUG: Final tools setup complete. Total tools: {len(self.tools)}")
        for i, tool in enumerate(self.tools):
            print(f"🔧 DEBUG: Tool {i+1}: {type(tool).__name__}")

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
                id="gemini/gemini-2.5-flash-lite",
                api_key=os.getenv("GEMINI_API_KEY"),
                temperature=0.3
            ),
            additional_instructions="""
            You are managing memories for a Vexel Agent. Focus on:
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

    def _setup_knowledge(self, knowledge_sources: Optional[List[Dict[str, Any]]] = None):
        """Setup Level 2: Knowledge/Storage"""
        self.knowledge_bases = []

        print(f"🔍 DEBUG: Setting up knowledge. Sources provided: {knowledge_sources}")
        if not knowledge_sources:
            print("⚠️ DEBUG: No knowledge sources provided")
            return
            
        # Process each knowledge source
        for source in knowledge_sources:
            try:
                print(f"🔍 DEBUG: Processing knowledge source: {source}")

                # Handle both dict and Pydantic model
                if hasattr(source, 'type'):
                    source_type = source.type
                    source_collection_name = getattr(source, 'collection_name', None)
                    source_urls = getattr(source, 'urls', None)
                else:
                    source_type = source.get("type")
                    source_collection_name = source.get("collection_name")
                    source_urls = source.get("urls")

                print(f"🔍 DEBUG: Source type: {source_type}, collection_name: {source_collection_name}")

                if source_type == "collection" and source_collection_name:
                    # Use existing knowledge collection
                    print(f"🔍 DEBUG: Creating knowledge base for collection: {source_collection_name}")
                    from app.agents.knowledge import VexelKnowledgeManager

                    knowledge_manager = VexelKnowledgeManager(
                        collection_name=source_collection_name,
                        user_id=self.user_id,
                        unified_collection=True
                    )
                    kb = knowledge_manager.create_unified_knowledge_base()
                    self.knowledge_bases.append(kb)
                    print(f"✅ Knowledge source loaded: collection '{source_collection_name}'")

                elif source_type == "url" and source_urls:
                    # Setup Qdrant vector database for URL sources
                    vector_db = Qdrant(
                        collection=f"vexel_unified_{self.name.lower()}_url",
                        url=os.getenv("QDRANT_URL", "http://localhost:6333"),
                        embedder=GeminiEmbedder(
                            id="text-embedding-004",
                            api_key=os.getenv("GEMINI_API_KEY")
                        )
                    )

                    knowledge = UrlKnowledge(
                        urls=source_urls,
                        vector_db=vector_db
                    )
                    self.knowledge_bases.append(knowledge)
                    print(f"✅ Knowledge source loaded: {source_type}")

                elif source_type == "pdf_url" and source_urls:
                    # Setup Qdrant vector database for PDF URL sources
                    vector_db = Qdrant(
                        collection=f"vexel_unified_{self.name.lower()}_pdf",
                        url=os.getenv("QDRANT_URL", "http://localhost:6333"),
                        embedder=GeminiEmbedder(
                            id="text-embedding-004",
                            api_key=os.getenv("GEMINI_API_KEY")
                        )
                    )

                    knowledge = PDFUrlKnowledgeBase(
                        urls=source_urls,
                        vector_db=vector_db
                    )
                    self.knowledge_bases.append(knowledge)
                    print(f"✅ Knowledge source loaded: {source_type}")
                else:
                    print(f"⚠️ DEBUG: Unsupported or incomplete knowledge source: type={source_type}")

            except Exception as e:
                print(f"⚠️ Failed to load knowledge source {source}: {e}")
                import traceback
                traceback.print_exc()

    def create_agent(self) -> Agent:
        """Create unified agent with all L1+L2+L3 capabilities"""
        print(f"🚀 DEBUG: create_agent called")
        print(f"🚀 DEBUG: Available knowledge bases: {len(self.knowledge_bases)}")
        print(f"🚀 DEBUG: Available tools: {len(self.tools)}")

        # Use first knowledge base if available
        knowledge = self.knowledge_bases[0] if self.knowledge_bases else None
        print(f"🚀 DEBUG: Selected knowledge base: {type(knowledge).__name__ if knowledge else 'None'}")

        print(f"🚀 DEBUG: Creating Agent with:")
        print(f"   - name: {self.name}")
        print(f"   - model: {self.model}")
        print(f"   - user_id: {self.user_id}")
        print(f"   - session_id: {self.session_id}")
        print(f"   - tools: {len(self.tools)} tools")
        print(f"   - knowledge: {type(knowledge).__name__ if knowledge else 'None'}")

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

        print(f"🚀 DEBUG: Agent created successfully: {type(self.agent)}")
        print(f"🚀 DEBUG: Agent tools: {[tool.__class__.__name__ for tool in self.agent.tools] if hasattr(self.agent, 'tools') and self.agent.tools else 'No tools'}")

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
            "- ALWAYS search your knowledge base first before answering any question",
            "- Use the search() tool to find relevant information in your knowledge base",
            "- Your knowledge base contains information about Vexel AI platform, architecture, and technical details",
            "- Even if you think you know the answer, ALWAYS search to get the most accurate and up-to-date information",
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
        """Chat with the unified agent with retry logic for Gemini errors"""
        print(f"💬 DEBUG: chat() called with message: '{message[:100]}...'")

        if not self.agent:
            print(f"💬 DEBUG: Agent not created yet, creating...")
            self.create_agent()
        else:
            print(f"💬 DEBUG: Using existing agent: {type(self.agent)}")

        # Retry logic for Gemini/VertexAI intermittent errors
        max_retries = 3
        retry_delay = 2  # seconds

        for attempt in range(max_retries):
            try:
                print(f"💬 DEBUG: Attempt {attempt + 1}/{max_retries} - Calling agent.run() with message")
                print(f"💬 DEBUG: Agent has tools: {len(self.agent.tools) if hasattr(self.agent, 'tools') and self.agent.tools else 0}")

                response = self.agent.run(message)

                print(f"💬 DEBUG: Agent response received: {type(response)}")
                print(f"💬 DEBUG: Response success on attempt {attempt + 1}")

                if hasattr(response, 'content'):
                    print(f"💬 DEBUG: Using response.content")
                    return response.content
                elif hasattr(response, 'text'):
                    print(f"💬 DEBUG: Using response.text")
                    return response.text
                else:
                    print(f"💬 DEBUG: Converting response to string")
                    return str(response) if response else "No response generated"

            except Exception as e:
                error_str = str(e)
                print(f"❌ DEBUG: Error in chat() attempt {attempt + 1}: {e}")

                # Check if it's a retryable Gemini/VertexAI error
                retryable_errors = [
                    "VertexAIException InternalServerError",
                    "InternalServerError",
                    "Internal error",
                    "Service temporarily unavailable",
                    "Rate limit exceeded",
                    "Quota exceeded"
                ]

                is_retryable = any(error_pattern in error_str for error_pattern in retryable_errors)

                if is_retryable and attempt < max_retries - 1:  # Not the last attempt
                    print(f"🔄 DEBUG: Retryable Gemini error detected, retrying in {retry_delay}s...")
                    import time
                    time.sleep(retry_delay)
                    retry_delay *= 1.5  # Exponential backoff
                    continue
                else:
                    # Either non-retryable error or max retries reached
                    if attempt == max_retries - 1:
                        print(f"❌ DEBUG: Max retries ({max_retries}) reached for Gemini API")
                        return f"I apologize, but I'm experiencing temporary issues with the AI service. Please try again in a moment. (Gemini API error after {max_retries} attempts)"
                    else:
                        print(f"❌ DEBUG: Non-retryable error encountered")
                        import traceback
                        traceback.print_exc()
                        return f"Error generating response: {str(e)}"

        return "Failed to generate response after multiple attempts"

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

    def chat_stream(
        self,
        message: str,
        stream_intermediate_steps: bool = True
    ) -> Iterator[RunResponseEvent]:
        """
        Stream chat with the unified agent

        Args:
            message: User message
            stream_intermediate_steps: Whether to stream tool calls, reasoning steps, etc.

        Yields:
            RunResponseEvent: Streaming events including:
                - run_started: Run begins
                - reasoning_started/step/completed: Thinking process
                - tool_call_started/completed: Tool execution
                - run_response_content: Content chunks
                - run_completed: Run finished
        """
        print(f"💬 DEBUG: chat_stream() called with message: '{message[:100]}...'")

        if not self.agent:
            print(f"💬 DEBUG: Agent not created yet, creating...")
            self.create_agent()
        else:
            print(f"💬 DEBUG: Using existing agent: {type(self.agent)}")

        # Use Agno's streaming capabilities
        try:
            print(f"💬 DEBUG: Starting agent.run() with streaming")
            response_stream = self.agent.run(
                message=message,
                stream=True,
                stream_intermediate_steps=stream_intermediate_steps
            )

            print(f"💬 DEBUG: Got response stream: {type(response_stream)}")

            for event in response_stream:
                print(f"💬 DEBUG: Yielding event: {event.event}")
                yield event

        except Exception as e:
            print(f"❌ DEBUG: Error in chat_stream(): {e}")
            # Create error event
            from agno.run.response import RunResponseErrorEvent
            yield RunResponseErrorEvent(
                content=f"Streaming error: {str(e)}",
                agent_id=self.agent.agent_id if self.agent else "unknown",
                agent_name=self.name,
                session_id=self.session_id
            )

    async def achat_stream(
        self,
        message: str,
        stream_intermediate_steps: bool = True
    ) -> AsyncIterator[RunResponseEvent]:
        """
        Async stream chat with the unified agent

        Args:
            message: User message
            stream_intermediate_steps: Whether to stream tool calls, reasoning steps, etc.

        Yields:
            RunResponseEvent: Streaming events including:
                - run_started: Run begins
                - reasoning_started/step/completed: Thinking process
                - tool_call_started/completed: Tool execution
                - run_response_content: Content chunks
                - run_completed: Run finished
        """
        print(f"💬 DEBUG: achat_stream() called with message: '{message[:100]}...'")

        if not self.agent:
            print(f"💬 DEBUG: Agent not created yet, creating...")
            self.create_agent()
        else:
            print(f"💬 DEBUG: Using existing agent: {type(self.agent)}")

        # Use Agno's async streaming capabilities
        try:
            print(f"💬 DEBUG: Starting agent.arun() with streaming")
            response_stream = await self.agent.arun(
                message=message,
                stream=True,
                stream_intermediate_steps=stream_intermediate_steps
            )

            print(f"💬 DEBUG: Got async response stream: {type(response_stream)}")

            async for event in response_stream:
                print(f"💬 DEBUG: Yielding async event: {event.event}")
                yield event

        except Exception as e:
            print(f"❌ DEBUG: Error in achat_stream(): {e}")
            # Create error event
            from agno.run.response import RunResponseErrorEvent
            yield RunResponseErrorEvent(
                content=f"Async streaming error: {str(e)}",
                agent_id=self.agent.agent_id if self.agent else "unknown",
                agent_name=self.name,
                session_id=self.session_id
            )
