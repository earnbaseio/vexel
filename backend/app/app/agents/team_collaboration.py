"""
Vexel Team Collaboration System - Level 4
Multi-agent systems, coordination, and task distribution using Agno framework
"""

import os
from typing import List, Dict, Any, Optional, Union, Literal
from datetime import datetime
from uuid import uuid4

from agno.agent.agent import Agent
from agno.team.team import Team
from agno.models.litellm import LiteLLM
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.memory.v2.memory import Memory
from agno.memory.v2.manager import MemoryManager
from agno.memory.v2.summarizer import SessionSummarizer
from agno.storage.sqlite import SqliteStorage
from agno.tools.reasoning import ReasoningTools
from agno.knowledge.text import TextKnowledgeBase
from agno.vectordb.qdrant import Qdrant
from agno.tools.duckduckgo import DuckDuckGoTools

from app.agents.gemini_embedder import GeminiEmbedder


class VexelTeamCollaboration:
    """
    Vexel Level 4: Team Collaboration System
    
    Features:
    - Multi-agent teams with different collaboration modes
    - Agent coordination and communication
    - Task distribution and workflow orchestration
    - Shared memory and context between team members
    - Performance monitoring and success criteria tracking
    """
    
    def __init__(
        self,
        team_name: str = "VexelTeam",
        mode: Literal["route", "coordinate", "collaborate"] = "coordinate",
        leader_model: str = "gemini/gemini-2.5-flash-lite",
        user_id: str = "default_user",
        session_id: Optional[str] = None,
        db_file: str = "tmp/vexel_team_collaboration.db",
        qdrant_url: str = "http://localhost:6333",
        knowledge_sources: Optional[List[Dict[str, Any]]] = None
    ):
        self.team_name = team_name
        self.mode = mode
        self.leader_model = leader_model
        self.user_id = user_id
        self.session_id = session_id or str(uuid4())
        self.db_file = db_file
        self.qdrant_url = qdrant_url
        self.knowledge_sources = knowledge_sources or []
        
        # Initialize components
        self.memory = None
        self.storage = None
        self.knowledge_bases = []
        self.agents = {}
        self.team = None
        
        self._setup_memory()
        self._setup_storage()
        self._setup_knowledge()
        
    def _setup_memory(self):
        """
        Setup shared memory system for team collaboration
        """
        # Memory database
        memory_db = SqliteMemoryDb(
            table_name="vexel_team_memories",
            db_file=self.db_file
        )
        
        # Custom memory manager for team
        memory_manager = MemoryManager(
            model=LiteLLM(
                id="gemini/gemini-2.5-flash-lite",
                api_key=os.getenv("GEMINI_API_KEY"),
                temperature=0.3
            ),
            additional_instructions="""
            You are managing memories for a Vexel Team Collaboration system. Focus on:
            - Store team decisions, task assignments, and collaboration patterns
            - Capture inter-agent communication and coordination insights
            - Remember successful collaboration strategies and workflows
            - Track team performance and optimization opportunities
            - Update memories when team dynamics or strategies change
            """
        )
        
        # Session summarizer for team context
        session_summarizer = SessionSummarizer(
            model=LiteLLM(
                id="gemini/gemini-2.5-flash-lite",
                api_key=os.getenv("GEMINI_API_KEY"),
                temperature=0.2
            ),
            additional_instructions="""
            Create team-focused summaries that capture:
            - Team collaboration patterns and effectiveness
            - Task distribution and completion status
            - Inter-agent communication highlights
            - Decision-making processes and outcomes
            - Areas for team improvement and optimization
            """
        )
        
        # Initialize shared memory system
        self.memory = Memory(
            db=memory_db,
            memory_manager=memory_manager,
            summarizer=session_summarizer,
            debug_mode=True
        )
        
        print(f"✅ Team memory system initialized with database: {self.db_file}")
    
    def _setup_storage(self):
        """
        Setup persistent storage for team sessions
        """
        self.storage = SqliteStorage(
            table_name="vexel_team_sessions",
            db_file=self.db_file
        )
        
        print(f"✅ Team storage system initialized")
    
    def _setup_knowledge(self):
        """
        Setup shared knowledge bases for team members
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
                    
                    temp_files_with_metadata.append({
                        "path": temp_file.name,
                        "metadata": {
                            "source": source["name"],
                            "document_id": i,
                            "content_type": "text",
                            "team": self.team_name
                        }
                    })
                
                # Use Gemini embeddings
                embedder = GeminiEmbedder(
                    id="gemini-embedding-exp-03-07",
                    api_key=os.getenv("GEMINI_API_KEY"),
                    task_type="RETRIEVAL_DOCUMENT",
                    dimensions=3072
                )
                
                # Create Qdrant collection for team knowledge
                vector_db = Qdrant(
                    collection=f"vexel_team_{source['name']}",
                    url=self.qdrant_url,
                    embedder=embedder
                )
                
                # Create knowledge base
                kb = TextKnowledgeBase(
                    path=temp_files_with_metadata,
                    vector_db=vector_db
                )
                
                self.knowledge_bases.append(kb)
                print(f"✅ Team knowledge base created: {source['name']}")
    
    def load_knowledge(self, recreate: bool = False):
        """
        Load all team knowledge bases
        """
        for i, kb in enumerate(self.knowledge_bases):
            try:
                print(f"🔄 Loading team knowledge base {i+1}/{len(self.knowledge_bases)}")
                kb.load(recreate=recreate)
                print(f"✅ Team knowledge base loaded successfully")
                
                # Test search functionality
                if hasattr(kb, 'search') and kb.vector_db:
                    test_results = kb.search("test", num_documents=1)
                    print(f"✅ Search test: Found {len(test_results)} documents")
                    
            except Exception as e:
                print(f"❌ Failed to load team knowledge base: {e}")
                import traceback
                traceback.print_exc()
    
    def create_specialized_agents(self) -> Dict[str, Agent]:
        """
        Create specialized agents for different tasks
        """
        # Get shared knowledge base
        knowledge = self.knowledge_bases[0] if self.knowledge_bases else None
        
        # 1. Research Agent - Web search and information gathering
        research_agent = Agent(
            name="Research Agent",
            role="Expert at finding and analyzing information from various sources",
            model=LiteLLM(
                id="gemini/gemini-2.5-flash-lite",
                api_key=os.getenv("GEMINI_API_KEY"),
                temperature=0.3
            ),
            tools=[DuckDuckGoTools()],
            memory=self.memory,
            storage=self.storage,
            knowledge=knowledge,
            search_knowledge=True,
            instructions=[
                "You are a research specialist focused on gathering accurate, up-to-date information.",
                "Always verify information from multiple sources when possible.",
                "Provide clear citations and sources for all information.",
                "Focus on factual, objective analysis rather than opinions.",
                "Collaborate effectively with other team members by sharing relevant findings."
            ],
            user_id=self.user_id,
            session_id=self.session_id,
            markdown=True,
            show_tool_calls=True
        )
        
        # 2. Analysis Agent - Data analysis and reasoning
        analysis_agent = Agent(
            name="Analysis Agent",
            role="Expert at analyzing data, reasoning through problems, and drawing insights",
            model=LiteLLM(
                id="gemini/gemini-2.5-flash-lite",
                api_key=os.getenv("GEMINI_API_KEY"),
                temperature=0.4
            ),
            tools=[ReasoningTools(think=True, analyze=True, add_instructions=True)],
            memory=self.memory,
            storage=self.storage,
            knowledge=knowledge,
            search_knowledge=True,
            instructions=[
                "You are an analysis specialist focused on reasoning and problem-solving.",
                "Use step-by-step thinking to break down complex problems.",
                "Provide clear reasoning chains and logical conclusions.",
                "Identify patterns, trends, and insights in data and information.",
                "Collaborate with team members to validate and refine analyses."
            ],
            user_id=self.user_id,
            session_id=self.session_id,
            markdown=True,
            show_tool_calls=True
        )
        
        # 3. Communication Agent - Synthesis and presentation
        communication_agent = Agent(
            name="Communication Agent",
            role="Expert at synthesizing information and creating clear, engaging presentations",
            model=LiteLLM(
                id="gemini/gemini-2.5-flash-lite",
                api_key=os.getenv("GEMINI_API_KEY"),
                temperature=0.6
            ),
            memory=self.memory,
            storage=self.storage,
            knowledge=knowledge,
            search_knowledge=True,
            instructions=[
                "You are a communication specialist focused on clear, engaging presentation.",
                "Synthesize complex information into accessible, well-structured content.",
                "Use appropriate formatting, examples, and visual elements when helpful.",
                "Adapt communication style to the intended audience and purpose.",
                "Collaborate with team members to ensure accuracy and completeness."
            ],
            user_id=self.user_id,
            session_id=self.session_id,
            markdown=True,
            show_tool_calls=True
        )
        
        # 4. Coordination Agent - Task management and workflow
        coordination_agent = Agent(
            name="Coordination Agent",
            role="Expert at task management, workflow coordination, and team optimization",
            model=LiteLLM(
                id="gemini/gemini-2.5-flash-lite",
                api_key=os.getenv("GEMINI_API_KEY"),
                temperature=0.3
            ),
            tools=[ReasoningTools(think=True, analyze=True)],
            memory=self.memory,
            storage=self.storage,
            knowledge=knowledge,
            search_knowledge=True,
            instructions=[
                "You are a coordination specialist focused on team efficiency and workflow optimization.",
                "Break down complex tasks into manageable subtasks and assign them appropriately.",
                "Monitor team progress and identify bottlenecks or optimization opportunities.",
                "Facilitate communication and collaboration between team members.",
                "Ensure tasks are completed efficiently and meet quality standards."
            ],
            user_id=self.user_id,
            session_id=self.session_id,
            markdown=True,
            show_tool_calls=True
        )
        
        self.agents = {
            "research": research_agent,
            "analysis": analysis_agent,
            "communication": communication_agent,
            "coordination": coordination_agent
        }
        
        print(f"✅ Created {len(self.agents)} specialized agents")
        return self.agents
    
    def create_team(
        self,
        success_criteria: Optional[str] = None,
        custom_instructions: Optional[List[str]] = None
    ) -> Team:
        """
        Create team with specified collaboration mode and agents
        """
        if not self.agents:
            self.create_specialized_agents()
        
        # Default success criteria based on mode
        if not success_criteria:
            if self.mode == "route":
                success_criteria = "The appropriate specialist agent has successfully handled the task"
            elif self.mode == "coordinate":
                success_criteria = "The team has successfully coordinated to complete the task with high quality"
            elif self.mode == "collaborate":
                success_criteria = "The team has reached consensus and delivered a comprehensive solution"
        
        # Default instructions based on mode
        if not custom_instructions:
            if self.mode == "route":
                custom_instructions = [
                    "You are a routing coordinator that directs tasks to the most appropriate specialist.",
                    "Analyze the request and determine which agent is best suited to handle it.",
                    "Route research tasks to the Research Agent, analysis tasks to the Analysis Agent, etc.",
                    "You can also handle simple tasks directly without routing."
                ]
            elif self.mode == "coordinate":
                custom_instructions = [
                    "You are a team coordinator that orchestrates collaboration between specialists.",
                    "Break down complex tasks and assign subtasks to appropriate team members.",
                    "Coordinate the work flow and ensure all team members contribute effectively.",
                    "Synthesize results from different agents into a cohesive final output.",
                    "Monitor progress and adjust coordination as needed."
                ]
            elif self.mode == "collaborate":
                custom_instructions = [
                    "You are a collaboration facilitator that enables team discussion and consensus.",
                    "Encourage all team members to contribute their expertise to the discussion.",
                    "Guide the team toward reaching consensus on the best approach and solution.",
                    "Ensure all perspectives are considered before making final decisions.",
                    "Stop the collaboration when the team has reached a satisfactory consensus."
                ]
        
        # Create team leader model
        leader_model = LiteLLM(
            id=self.leader_model,
            api_key=self._get_api_key_for_model(self.leader_model),
            temperature=0.5
        )
        
        # Create team
        self.team = Team(
            name=self.team_name,
            mode=self.mode,
            model=leader_model,
            members=list(self.agents.values()),
            
            # Team configuration
            user_id=self.user_id,
            session_id=self.session_id,
            memory=self.memory,
            storage=self.storage,
            
            # Collaboration settings
            success_criteria=success_criteria,
            instructions=custom_instructions,
            
            # Team features
            enable_agentic_memory=True,
            enable_user_memories=True,
            enable_session_summaries=True,
            enable_agentic_context=True,
            
            # Display settings
            markdown=True,
            show_tool_calls=True,
            show_members_responses=True,
            add_datetime_to_instructions=True,
            
            # Debug and monitoring
            debug_mode=True
        )
        
        print(f"✅ Team created with mode: {self.mode}")
        return self.team
    
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

    def run_team_task(self, task: str, stream: bool = False) -> str:
        """
        Execute a task using the team collaboration system
        """
        if not self.team:
            self.create_team()

        try:
            if stream:
                # For streaming, we'll collect the response
                response_parts = []
                for chunk in self.team.run(task, stream=True):
                    if hasattr(chunk, 'content') and chunk.content:
                        response_parts.append(chunk.content)
                return ''.join(response_parts)
            else:
                response = self.team.run(task)
                return response.content if hasattr(response, 'content') else str(response)

        except Exception as e:
            return f"Team collaboration error: {str(e)}"

    async def arun_team_task(self, task: str, stream: bool = False) -> str:
        """
        Execute a task asynchronously using the team collaboration system
        """
        if not self.team:
            self.create_team()

        try:
            if stream:
                # For streaming, we'll collect the response
                response_parts = []
                async for chunk in self.team.arun(task, stream=True):
                    if hasattr(chunk, 'content') and chunk.content:
                        response_parts.append(chunk.content)
                return ''.join(response_parts)
            else:
                response = await self.team.arun(task)
                return response.content if hasattr(response, 'content') else str(response)

        except Exception as e:
            return f"Team collaboration error: {str(e)}"

    def get_team_memories(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get team memories
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
        except Exception as e:
            print(f"Error getting team memories: {e}")
            return []

    def get_team_session_summary(self) -> Optional[str]:
        """
        Get current team session summary
        """
        try:
            if self.session_id and self.memory.summaries:
                user_summaries = self.memory.summaries.get(self.user_id, {})
                session_summary = user_summaries.get(self.session_id)
                return session_summary.summary if session_summary else None
        except Exception as e:
            print(f"Error getting team session summary: {e}")
            return None

    def get_team_info(self) -> Dict[str, Any]:
        """
        Get comprehensive team information
        """
        return {
            "team_name": self.team_name,
            "mode": self.mode,
            "leader_model": self.leader_model,
            "user_id": self.user_id,
            "session_id": self.session_id,
            "agents": {
                name: {
                    "name": agent.name,
                    "role": agent.role,
                    "model": agent.model.id if hasattr(agent.model, 'id') else str(agent.model),
                    "tools": len(agent.tools) if agent.tools else 0
                }
                for name, agent in self.agents.items()
            },
            "knowledge_bases": len(self.knowledge_bases),
            "team_initialized": self.team is not None
        }

    def clear_team_memories(self):
        """
        Clear all team memories (for testing)
        """
        try:
            self.memory.clear()
            print("✅ Team memories cleared")
        except Exception as e:
            print(f"❌ Error clearing team memories: {e}")


# Factory functions for different team types
def create_research_team(
    team_name: str = "VexelResearchTeam",
    user_id: str = "default_user",
    knowledge_sources: Optional[List[Dict[str, Any]]] = None,
    **kwargs
) -> VexelTeamCollaboration:
    """
    Create a research-focused team optimized for information gathering and analysis
    """
    return VexelTeamCollaboration(
        team_name=team_name,
        mode="coordinate",
        leader_model="gemini/gemini-2.5-flash-lite",
        user_id=user_id,
        knowledge_sources=knowledge_sources,
        **kwargs
    )


def create_analysis_team(
    team_name: str = "VexelAnalysisTeam",
    user_id: str = "default_user",
    knowledge_sources: Optional[List[Dict[str, Any]]] = None,
    **kwargs
) -> VexelTeamCollaboration:
    """
    Create an analysis-focused team optimized for problem-solving and reasoning
    """
    return VexelTeamCollaboration(
        team_name=team_name,
        mode="collaborate",
        leader_model="gemini/gemini-2.5-flash-lite",
        user_id=user_id,
        knowledge_sources=knowledge_sources,
        **kwargs
    )


def create_routing_team(
    team_name: str = "VexelRoutingTeam",
    user_id: str = "default_user",
    knowledge_sources: Optional[List[Dict[str, Any]]] = None,
    **kwargs
) -> VexelTeamCollaboration:
    """
    Create a routing team optimized for task delegation to specialists
    """
    return VexelTeamCollaboration(
        team_name=team_name,
        mode="route",
        leader_model="gemini/gemini-2.5-flash-lite",
        user_id=user_id,
        knowledge_sources=knowledge_sources,
        **kwargs
    )
