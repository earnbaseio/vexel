"""
Vexel Level 2 Knowledge/Storage System
Implements knowledge management and RAG capabilities using Qdrant vector database
"""

import os
from typing import List, Dict, Any, Optional
from agno.agent import Agent
from agno.knowledge.text import TextKnowledgeBase
from agno.knowledge.pdf_url import PDFUrlKnowledgeBase
from agno.knowledge.url import UrlKnowledge
from agno.knowledge.document import DocumentKnowledgeBase
from app.agents.fixed_document_knowledge import VexelDocumentKnowledgeBase
from agno.vectordb.qdrant import Qdrant
from agno.embedder.openai import OpenAIEmbedder
from app.agents.gemini_embedder import GeminiEmbedder
from agno.storage.sqlite import SqliteStorage
from agno.vectordb.search import SearchType
from app.core.config import settings


class VexelKnowledgeManager:
    """
    Vexel Knowledge Manager for Level 2 agents
    Handles document ingestion, vector storage, and retrieval
    """
    
    def __init__(
        self,
        collection_name: str = None,  # Specific collection name or None for default
        qdrant_url: str = "http://localhost:6333",
        embedder_type: str = "gemini",  # "gemini" (default)
        embedder_model: str = "text-embedding-004",
        user_id: str = None  # For user isolation
    ):
        self.user_id = user_id

        # Set collection name with user isolation
        if collection_name:
            # Use specific collection name (already includes user_id if needed)
            self.collection_name = collection_name
        else:
            # Default collection with user isolation
            if user_id:
                self.collection_name = f"user_{user_id}_vexel_knowledge_base"
            else:
                self.collection_name = "vexel_knowledge_base"

        self.qdrant_url = qdrant_url

        # Initialize embedder - using Gemini exclusively
        gemini_api_key = os.getenv("GEMINI_API_KEY") or getattr(settings, 'GEMINI_API_KEY', None)
        if not gemini_api_key:
            raise ValueError("GEMINI_API_KEY is required for VexelKnowledgeManager")

        self.embedder = GeminiEmbedder(
            id=embedder_model,
            api_key=gemini_api_key,
            task_type="SEMANTIC_SIMILARITY",
            dimensions=768  # text-embedding-004 has 768 dimensions
        )
        
        # Initialize Qdrant vector database
        self.vector_db = Qdrant(
            collection=self.collection_name,
            url=qdrant_url,
            embedder=self.embedder,
            search_type=SearchType.hybrid  # Hybrid search for better results
        )

    def create_unified_knowledge_base(self, file_ids: List[str] = None) -> DocumentKnowledgeBase:
        """
        Create knowledge base with unified collection and user filtering
        For cross-file search capabilities
        """
        print(f"📚 DEBUG: create_unified_knowledge_base called")
        print(f"📚 DEBUG: user_id: {self.user_id}")
        print(f"📚 DEBUG: file_ids: {file_ids}")
        print(f"📚 DEBUG: collection_name: {self.collection_name}")
        print(f"📚 DEBUG: vector_db: {type(self.vector_db)}")

        filters = {}
        if self.user_id:
            filters["meta_data.user_id"] = self.user_id
            print(f"📚 DEBUG: Added user_id filter: {self.user_id}")
        if file_ids:
            filters["meta_data.file_id"] = {"$in": file_ids}
            print(f"📚 DEBUG: Added file_ids filter: {file_ids}")

        print(f"📚 DEBUG: Final filters: {filters}")

        kb = VexelDocumentKnowledgeBase(
            documents=[],  # Empty - will search existing vectors
            vector_db=self.vector_db,
            filters=filters
        )

        print(f"📚 DEBUG: VexelDocumentKnowledgeBase created: {type(kb)}")
        print(f"📚 DEBUG: Knowledge base vector_db: {type(kb.vector_db) if hasattr(kb, 'vector_db') else 'No vector_db'}")

        return kb

    def create_text_knowledge_base(
        self,
        texts: List[str],
        collection_suffix: str = "text"
    ) -> TextKnowledgeBase:
        """
        Create knowledge base from text content
        """
        # Create temporary text files
        import tempfile
        from pathlib import Path
        
        temp_dir = Path(tempfile.mkdtemp())
        
        for i, text in enumerate(texts):
            text_file = temp_dir / f"document_{i}.txt"
            text_file.write_text(text)
        
        # Create vector DB for this specific knowledge base
        vector_db = Qdrant(
            collection=f"{self.collection_name}_{collection_suffix}",
            url=self.qdrant_url,
            embedder=self.embedder,
            search_type=SearchType.hybrid
        )
        
        knowledge_base = TextKnowledgeBase(
            path=temp_dir,
            vector_db=vector_db,
            num_documents=10
        )
        
        return knowledge_base
    
    def create_url_knowledge_base(
        self,
        urls: List[str],
        collection_suffix: str = "url"
    ) -> UrlKnowledge:
        """
        Create knowledge base from URLs
        """
        vector_db = Qdrant(
            collection=f"{self.collection_name}_{collection_suffix}",
            url=self.qdrant_url,
            embedder=self.embedder,
            search_type=SearchType.hybrid
        )
        
        knowledge_base = UrlKnowledge(
            urls=urls,
            vector_db=vector_db
        )
        
        return knowledge_base
    
    def create_pdf_knowledge_base(
        self,
        pdf_urls: List[str],
        collection_suffix: str = "pdf"
    ) -> PDFUrlKnowledgeBase:
        """
        Create knowledge base from PDF URLs
        """
        vector_db = Qdrant(
            collection=f"{self.collection_name}_{collection_suffix}",
            url=self.qdrant_url,
            embedder=self.embedder,
            search_type=SearchType.hybrid
        )
        
        knowledge_base = PDFUrlKnowledgeBase(
            urls=pdf_urls,
            vector_db=vector_db
        )
        
        return knowledge_base
    
    def get_collections_info(self) -> Dict[str, Any]:
        """
        Get information about existing collections
        """
        try:
            # This would require direct Qdrant client access
            from qdrant_client import QdrantClient
            
            client = QdrantClient(url=self.qdrant_url)
            collections = client.get_collections()
            
            return {
                "collections": [col.name for col in collections.collections],
                "total_collections": len(collections.collections)
            }
        except Exception as e:
            return {
                "error": str(e),
                "collections": [],
                "total_collections": 0
            }

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


class VexelKnowledgeAgent:
    """
    Vexel Knowledge Agent with Knowledge/Storage capabilities
    """

    def __init__(
        self,
        name: str = "VexelKnowledgeAgent",
        model: str = "gpt-4",
        knowledge_sources: Optional[List[Dict[str, Any]]] = None,
        **kwargs
    ):
        self.name = name
        self.model = model
        self.knowledge_manager = VexelKnowledgeManager()
        
        # Initialize storage
        self.storage = SqliteStorage(
            table_name=f"knowledge_agent_{name.lower()}",
            db_file="tmp/knowledge_agents.db"
        )
        
        # Initialize knowledge bases
        self.knowledge_bases = []
        if knowledge_sources:
            self._setup_knowledge_sources(knowledge_sources)
        
        # Create the agent (will be initialized when knowledge is loaded)
        self.agent = None
    
    def _setup_knowledge_sources(self, sources: List[Dict[str, Any]]):
        """
        Setup knowledge sources from configuration
        """
        for source in sources:
            source_type = source.get("type")
            
            if source_type == "text":
                kb = self.knowledge_manager.create_text_knowledge_base(
                    texts=source.get("content", []),
                    collection_suffix=source.get("name", "text")
                )
                self.knowledge_bases.append(kb)
            
            elif source_type == "url":
                kb = self.knowledge_manager.create_url_knowledge_base(
                    urls=source.get("urls", []),
                    collection_suffix=source.get("name", "url")
                )
                self.knowledge_bases.append(kb)
            
            elif source_type == "pdf":
                kb = self.knowledge_manager.create_pdf_knowledge_base(
                    pdf_urls=source.get("urls", []),
                    collection_suffix=source.get("name", "pdf")
                )
                self.knowledge_bases.append(kb)
    
    def load_knowledge(self, recreate: bool = False):
        """
        Load all knowledge bases
        """
        for i, kb in enumerate(self.knowledge_bases):
            try:
                print(f"🔄 Loading knowledge base {i+1}/{len(self.knowledge_bases)}: {type(kb).__name__}")
                kb.load(recreate=recreate)
                print(f"✅ Successfully loaded knowledge base: {type(kb).__name__}")

                # Test search functionality with detailed debugging
                if hasattr(kb, 'search') and kb.vector_db:
                    print(f"🔍 Testing search with query: 'test'")
                    test_results = kb.search("test", num_documents=1)
                    print(f"✅ Search test: Found {len(test_results)} documents")

                    # Test with actual content
                    print(f"🔍 Testing search with query: 'Vexel'")
                    vexel_results = kb.search("Vexel", num_documents=5)
                    print(f"✅ Vexel search: Found {len(vexel_results)} documents")

                    # Test with platform query
                    print(f"🔍 Testing search with query: 'AI Agent platform'")
                    platform_results = kb.search("AI Agent platform", num_documents=5)
                    print(f"✅ Platform search: Found {len(platform_results)} documents")

                    if len(vexel_results) > 0:
                        print(f"📄 Sample result: {vexel_results[0].content[:100]}...")
                else:
                    print("⚠️ Knowledge base missing search capability")

            except Exception as e:
                print(f"❌ Failed to load knowledge base {type(kb).__name__}: {e}")
                import traceback
                traceback.print_exc()
    
    def create_agent(self) -> Agent:
        """
        Create the Agno agent with knowledge and storage
        """
        from agno.models.litellm import LiteLLM

        # Initialize LLM
        llm = LiteLLM(
            id=self.model,
            api_key=self._get_api_key_for_model(self.model),
            temperature=0.7
        )

        # Use first knowledge base if available
        knowledge = self.knowledge_bases[0] if self.knowledge_bases else None

        # Debug knowledge base
        if knowledge:
            print(f"✅ Knowledge base available: {type(knowledge).__name__}")
            print(f"✅ Vector DB: {type(knowledge.vector_db).__name__ if knowledge.vector_db else 'None'}")
        else:
            print("⚠️ No knowledge base available")

        self.agent = Agent(
            name=self.name,
            model=llm,
            knowledge=knowledge,
            storage=self.storage,
            instructions=[
                "You are a Vexel AI Agent with knowledge and storage capabilities.",
                "ALWAYS use the search_knowledge_base function to search your knowledge base before answering any question.",
                "You MUST call search_knowledge_base function for every user query.",
                "After searching, provide accurate responses based on the search results.",
                "Include relevant information from your knowledge base in your responses.",
                "If search returns no results, clearly state that no information was found in your knowledge base."
            ],
            search_knowledge=True,  # This is critical!
            add_history_to_messages=True,
            num_history_runs=5,
            markdown=True,
            show_tool_calls=True,  # Debug tool calls
            debug_mode=True,  # Enable debug mode
            tool_choice="auto"  # Ensure tools can be called
        )

        return self.agent
    
    def _get_api_key_for_model(self, model: str) -> Optional[str]:
        """
        Get appropriate API key based on model name
        """
        model_lower = model.lower()
        
        if any(provider in model_lower for provider in ["gpt", "openai"]):
            return os.getenv("OPENAI_API_KEY")
        elif any(provider in model_lower for provider in ["claude", "anthropic"]):
            return os.getenv("ANTHROPIC_API_KEY")
        elif any(provider in model_lower for provider in ["gemini", "google"]):
            return os.getenv("GEMINI_API_KEY")
        
        return os.getenv("OPENAI_API_KEY")
    
    def chat(self, message: str) -> str:
        """
        Chat with the agent
        """
        if not self.agent:
            self.create_agent()
        
        response = self.agent.run(message)
        return response.content if hasattr(response, 'content') else str(response)
    
    def get_knowledge_info(self) -> Dict[str, Any]:
        """
        Get information about loaded knowledge
        """
        return {
            "knowledge_bases": len(self.knowledge_bases),
            "collections_info": self.knowledge_manager.get_collections_info(),
            "storage_table": self.storage.table_name if self.storage else None
        }
