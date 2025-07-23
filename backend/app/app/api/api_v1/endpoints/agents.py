"""
Vexel AI Agents API Endpoints
"""

from typing import Any, List, Dict, Optional, Literal
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, UploadFile, File
from pydantic import BaseModel
import asyncio
import os
from io import BytesIO
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

from app.api.deps import get_current_user
from app.models.user import User

from app.agents.unified_agent import VexelAgent
from app.agents.knowledge import VexelKnowledgeManager
from app.agents.cross_file_knowledge import VexelCrossFileKnowledge, knowledge_cache
from agno.knowledge.combined import CombinedKnowledgeBase
from agno.agent import Agent
from app.agents.memory_reasoning import VexelMemoryReasoningAgent
from app.agents.team_collaboration import VexelTeamCollaboration, create_research_team, create_analysis_team, create_routing_team
from app.agents.agentic_workflows import (
    VexelAgenticWorkflow, WorkflowStep, WorkflowStatus,
    create_research_analysis_workflow, create_conditional_workflow,
    create_parallel_processing_workflow, create_external_integration_workflow,
    create_monitoring_workflow
)
# Removed VexelBaseAgent dependency - using VexelAgenticWorkflow instead
from app.agents.anti_hallucination import AntiHallucinationGuard, create_safe_agent_instructions

# Global dictionaries to store active agents and workflows
active_agents: Dict[str, Any] = {}
active_workflows: Dict[str, Any] = {}

router = APIRouter()


# Pydantic models for API
class KnowledgeSource(BaseModel):
    type: Literal["text", "uploaded_files", "url", "pdf", "collection"] = "text"
    name: Optional[str] = None
    content: Optional[List[str]] = None  # For text type
    file_ids: Optional[List[str]] = None  # For uploaded_files
    urls: Optional[List[str]] = None     # For url/pdf types
    collection_id: Optional[str] = None  # For existing collections (preferred)

class AgentConfig(BaseModel):
    name: str = "VexelAgent"
    model: str = "gemini/gemini-2.5-flash-lite"
    knowledge_sources: Optional[List[KnowledgeSource]] = None
    tools: Optional[List[str]] = None
    instructions: Optional[List[str]] = None
    memory_enabled: bool = True
    storage_enabled: bool = True

class UnifiedChatRequest(BaseModel):
    message: str
    agent_id: str  # Required: Reference to existing AgentConfiguration
    conversation_id: Optional[str] = None  # If None, creates new conversation

# AgentRequest removed - use UnifiedChatRequest


class KnowledgeAgentRequest(BaseModel):
    name: str = "VexelKnowledgeAgent"
    model: str = "gemini/gemini-2.5-flash-lite"
    knowledge_sources: Optional[List[KnowledgeSource]] = None
    message: str
    

# AgentResponse removed - use UnifiedChatResponse

class UnifiedChatResponse(BaseModel):
    message_id: str
    conversation_id: str
    response: str
    sources: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    status: str


class WorkflowRequest(BaseModel):
    name: str = "VexelWorkflow"
    task: str


class WorkflowResponse(BaseModel):
    workflow_name: str
    task: str
    plan: str
    research: str
    analysis: str
    execution: str
    status: str


# Legacy active agents removed - using session-based agents only

# Global storage for session-based agents
session_agents: Dict[str, Any] = {}


async def create_combined_knowledge_base_from_sources(sources: List[KnowledgeSource], user_id: str) -> Optional[CombinedKnowledgeBase]:
    """Create combined knowledge base from multiple sources"""
    if not sources:
        return None

    knowledge_bases = []

    for source in sources:
        try:
            if source.type == "collection" and source.collection_id:
                # Use existing knowledge collection by ID
                from motor.motor_asyncio import AsyncIOMotorClient
                from bson import ObjectId
                import os

                # Get collection info from MongoDB
                mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
                client = AsyncIOMotorClient(mongodb_url)
                db = client.vexel

                collection = await db.knowledge_bases.find_one({
                    "_id": ObjectId(source.collection_id),
                    "user_id": ObjectId(user_id)
                })

                if collection:
                    qdrant_collection_name = collection.get("qdrant_collection")
                    knowledge_manager = VexelKnowledgeManager(
                        collection_name=qdrant_collection_name
                    )
                    kb = knowledge_manager.create_unified_knowledge_base()
                    knowledge_bases.append(kb)

            elif source.type == "text" and source.content:
                # Create text knowledge base
                knowledge_manager = VexelKnowledgeManager(user_id=user_id)
                kb = knowledge_manager.create_text_knowledge_base(
                    texts=source.content,
                    collection_suffix=source.name or "text"
                )
                knowledge_bases.append(kb)

            elif source.type == "uploaded_files" and source.file_ids:
                # Create file knowledge base
                cross_file_knowledge = VexelCrossFileKnowledge(user_id)
                kb = cross_file_knowledge.create_user_knowledge_base(file_ids=source.file_ids)
                knowledge_bases.append(kb)

            elif source.type == "url" and source.urls:
                # Create URL knowledge base
                knowledge_manager = VexelKnowledgeManager(user_id=user_id)
                kb = knowledge_manager.create_url_knowledge_base(
                    urls=source.urls,
                    collection_suffix=source.name or "url"
                )
                knowledge_bases.append(kb)

        except Exception as e:
            # Failed to create knowledge base, continuing without it
            continue

    if knowledge_bases:
        return CombinedKnowledgeBase(sources=knowledge_bases)
    return None


def create_agent_from_agent_configuration(agent_config, user_id: str, session_id: str) -> VexelAgent:
    """Create VexelAgent from AgentConfiguration model"""
    logger.info(f"🏗️ DEBUG: create_agent_from_agent_configuration called")
    logger.info(f"🏗️ DEBUG: Agent name: {agent_config.name}")
    logger.info(f"🏗️ DEBUG: User ID: {user_id}")
    logger.info(f"🏗️ DEBUG: Session ID: {session_id}")
    logger.info(f"🏗️ DEBUG: Agent config type: {type(agent_config)}")
    logger.info(f"🏗️ DEBUG: Agent enable_knowledge_search: {getattr(agent_config, 'enable_knowledge_search', 'Not set')}")

    try:
        knowledge_sources_as_dicts = []
        if agent_config.knowledge_sources:
            logger.info(f"🔍 DEBUG: Found {len(agent_config.knowledge_sources)} knowledge sources in config.")
            print(f"🔍 DEBUG: Agent config knowledge sources: {agent_config.knowledge_sources}")
            print(f"🔍 DEBUG: Knowledge sources type: {type(agent_config.knowledge_sources)}")

            for i, ks in enumerate(agent_config.knowledge_sources):
                print(f"🔍 DEBUG: Processing knowledge source {i+1}: {ks}")
                print(f"🔍 DEBUG: Knowledge source type: {type(ks)}")

                if hasattr(ks, 'model_dump'):
                    knowledge_dict = ks.model_dump()
                    knowledge_sources_as_dicts.append(knowledge_dict)
                    print(f"🔍 DEBUG: Added knowledge source (model_dump): {knowledge_dict}")
                elif isinstance(ks, dict):
                    knowledge_sources_as_dicts.append(ks)
                    print(f"🔍 DEBUG: Added knowledge source (dict): {ks}")
                else:
                    print(f"⚠️ DEBUG: Unknown knowledge source format: {type(ks)}")
        else:
            print("⚠️ DEBUG: No knowledge sources found in agent config")

        print(f"🔍 DEBUG: Final knowledge_sources_as_dicts: {knowledge_sources_as_dicts}")
        
        print(f"🏗️ DEBUG: Creating VexelAgent with:")
        print(f"   - name: {agent_config.name}")
        print(f"   - model: {agent_config.ai_model_id}")
        print(f"   - user_id: {user_id}")
        print(f"   - session_id: {session_id}")
        print(f"   - knowledge_sources: {len(knowledge_sources_as_dicts)} sources")

        agent = VexelAgent(
            name=agent_config.name,
            model=agent_config.ai_model_id,
            user_id=user_id,
            session_id=session_id,
            knowledge_sources=knowledge_sources_as_dicts,
            tools=None  # Tools are managed internally by VexelAgent
        )

        print(f"🏗️ DEBUG: VexelAgent instance created: {type(agent)}")
        print(f"🏗️ DEBUG: Agent knowledge_bases: {len(agent.knowledge_bases) if hasattr(agent, 'knowledge_bases') else 'No knowledge_bases attr'}")
        print(f"🏗️ DEBUG: Agent tools: {len(agent.tools) if hasattr(agent, 'tools') else 'No tools attr'}")

        print(f"🏗️ DEBUG: Calling agent.create_agent()...")
        agent.create_agent()  # This finalizes the agent setup

        print(f"🏗️ DEBUG: Agent creation completed")
        print(f"🏗️ DEBUG: Final agent type: {type(agent.agent) if hasattr(agent, 'agent') else 'No agent attr'}")

        logger.info(f"✅ DEBUG: Successfully created and finalized agent '{agent.name}'.")
        return agent

    except Exception as e:
        logger.error(f"CRITICAL FAILURE: Could not create VexelAgent '{agent_config.name}'. Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize agent. This is a critical error. Please check the backend logs for a full traceback. Error summary: {str(e)}"
        )


async def create_agent_from_config(config: AgentConfig, user_id: str, session_id: str) -> Agent:
    """Create Agno agent from configuration"""
    from agno.models.litellm import LiteLLM
    from agno.agent import Agent
    from agno.storage.sqlite import SqliteStorage
    from agno.memory.v2 import Memory

    # Create LLM
    llm = LiteLLM(
        id=config.model,
        api_key=get_api_key_for_model(config.model),
        temperature=0.7
    )

    # Create knowledge base
    knowledge_base = None
    if config.knowledge_sources:
        knowledge_base = await create_combined_knowledge_base_from_sources(config.knowledge_sources, user_id)

    # Create storage
    storage = None
    if config.storage_enabled:
        storage = SqliteStorage(
            table_name=f"agent_sessions_{user_id}",
            db_file=f"tmp/sessions_{user_id}.db"
        )

    # Create memory
    memory = None
    if config.memory_enabled:
        memory = Memory()

    # Create agent
    agent = Agent(
        name=config.name,
        model=llm,
        session_id=session_id,
        user_id=user_id,
        knowledge=knowledge_base,
        search_knowledge=True,
        add_references=True,
        storage=storage,
        memory=memory,
        instructions=config.instructions or [],
        add_history_to_messages=True,
        num_history_runs=10,
        search_previous_sessions_history=True,
        markdown=True,
        show_tool_calls=True
    )

    return agent


def get_api_key_from_config(provider: str, api_keys: Dict[str, str]) -> str:
    """Get API key from agent config first, fallback to environment"""
    # First try to get from agent config
    if api_keys and provider in api_keys and api_keys[provider]:
        return decrypt_api_key(api_keys[provider])  # Decrypt if stored encrypted

    # Fallback to environment variables
    return get_api_key_for_model_from_env(provider)


def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt API key - for now just return as is, implement encryption later"""
    # TODO: Implement proper encryption/decryption
    return encrypted_key


def get_api_key_for_model_from_env(provider: str) -> str:
    """Get API key from environment variables"""
    provider_lower = provider.lower()
    if provider_lower in ["openai", "gpt"]:
        return os.getenv("OPENAI_API_KEY", "")
    elif provider_lower in ["anthropic", "claude"]:
        return os.getenv("ANTHROPIC_API_KEY", "")
    elif provider_lower in ["gemini", "google"]:
        return os.getenv("GEMINI_API_KEY", "")
    return ""


def get_api_key_for_model(model: str) -> str:
    """Get API key for model (legacy function for backward compatibility)"""
    model_lower = model.lower()
    if any(provider in model_lower for provider in ["gpt", "openai"]):
        return os.getenv("OPENAI_API_KEY", "")
    elif any(provider in model_lower for provider in ["claude", "anthropic"]):
        return os.getenv("ANTHROPIC_API_KEY", "")
    elif any(provider in model_lower for provider in ["gemini", "google"]):
        return os.getenv("GEMINI_API_KEY", "")
    return ""


@router.get("/")
async def get_agents_info(current_user: User = Depends(get_current_user)):
    """Get information about Vexel AI Agents"""
    return {
        "message": "Vexel AI Agents powered by Agno Framework",
        "levels": {
            1: "Tools/Instructions - Basic tool usage and instruction following",
            2: "Knowledge/Storage - Knowledge management and data persistence",
            3: "Memory/Reasoning - Memory systems and reasoning capabilities", 
            4: "Team Collaboration - Multi-agent coordination",
            5: "Agentic Workflows - Complex autonomous workflows"
        },
        "supported_models": {
            "gemini": [
                "gemini/gemini-2.5-flash-lite"
            ],
            "embeddings": ["gemini/gemini-embedding-001"],
            "note": "Vexel uses latest Gemini 2.0 Flash Exp model exclusively"
        },
        "active_agents": len(active_agents),
        "active_workflows": len(active_workflows)
    }


@router.post("/chat", response_model=UnifiedChatResponse)
async def agent_chat(
    request: UnifiedChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Agent chat endpoint with session management
    Requires existing agent_id and supports conversation continuity
    """
    logger.info(f"Starting agent_chat with agent_id: {request.agent_id}")
    try:
        from app.crud.crud_chat import crud_chat_conversation, crud_message
        from app.crud.crud_agent import crud_agent_configuration
        from app.api.deps import get_database
        from uuid import uuid4
        from odmantic import ObjectId

        db = get_database()

        # Validate agent_id and ownership
        try:
            agent_object_id = ObjectId(request.agent_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid agent_id format")

        agent_config = await crud_agent_configuration.get(db, agent_object_id)
        if not agent_config:
            raise HTTPException(status_code=404, detail="Agent not found")

        if agent_config.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied to agent")
        # Agent configuration loaded

        # Get or create conversation
        if request.conversation_id:
            # Continue existing conversation
            conversation = await crud_chat_conversation.get_by_conversation_id(db, request.conversation_id)
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")

            # Check if user owns the conversation
            if conversation.user_id != current_user.id:
                raise HTTPException(status_code=403, detail="Access denied to conversation")

            # Verify conversation uses the same agent
            if str(conversation.agent_id) != request.agent_id:
                raise HTTPException(status_code=400, detail="Conversation agent mismatch")

            # Get or restore agent
            if request.conversation_id in session_agents:
                agent = session_agents[request.conversation_id]
            else:
                # Create agent from AgentConfiguration
                agent = create_agent_from_agent_configuration(
                    agent_config,
                    str(current_user.id),
                    conversation.agent_session_id
                )
                session_agents[request.conversation_id] = agent
        else:
            # Create new conversation
            conversation_id = str(uuid4())
            agent_session_id = str(uuid4())

            # Create conversation in database
            from app.crud.crud_chat import ChatConversationCreate
            conversation_data = ChatConversationCreate(
                conversation_id=conversation_id,
                title="New Chat",
                user_id=current_user.id,  # Keep as ObjectId
                agent_id=agent_object_id,  # Keep as ObjectId
                agent_session_id=agent_session_id,
                agent_config_snapshot=agent_config.model_dump(mode='json')  # Store AgentConfiguration with JSON serialization
            )

            conversation = await crud_chat_conversation.create(db, obj_in=conversation_data)

            # Create agent from AgentConfiguration
            agent = create_agent_from_agent_configuration(
                agent_config,
                str(current_user.id),
                agent_session_id
            )
            session_agents[conversation_id] = agent

        # Chat with agent
        print(f"💬 DEBUG: Starting chat with agent")
        print(f"💬 DEBUG: Agent type: {type(agent)}")
        print(f"💬 DEBUG: Message: '{request.message[:100]}...'")

        response = agent.chat(request.message)

        print(f"💬 DEBUG: Chat response received")
        print(f"💬 DEBUG: Response type: {type(response)}")
        print(f"💬 DEBUG: Response length: {len(str(response)) if response else 0}")

        # Extract response content (VexelAgent.chat returns string)
        response_content = response if isinstance(response, str) else str(response)
        print(f"💬 DEBUG: Final response content length: {len(response_content)}")

        # Validate response for potential hallucination
        has_knowledge_sources = len(agent_config.knowledge_sources) > 0 if agent_config.knowledge_sources else False
        validation_result = AntiHallucinationGuard.validate_agent_response(
            response_content,
            has_knowledge_sources=has_knowledge_sources
        )

        # Log potential hallucination warnings
        if validation_result["has_potential_hallucination"]:
            logger.warning(f"Potential hallucination detected in response: {validation_result['indicators_found']}")
            logger.warning(f"Agent has knowledge sources: {has_knowledge_sources}")

        # Extract sources from response
        sources = []
        if hasattr(response, 'references') and response.references:
            sources = [ref.get('source', '') for ref in response.references if ref.get('source')]

        # Save messages to conversation database
        message_id = str(uuid4())

        try:
            from app.crud.crud_chat import MessageCreate as CRUDMessageCreate
            from app.models.chat import MessageContent, MessageRole

            # Save user message
            user_message_content = MessageContent(
                type="text",
                text=request.message,
                image_url=None,
                file_url=None,
                file_name=None,
                file_size=None,
                metadata={}
            )

            user_message_data = CRUDMessageCreate(
                message_id=f"user_{message_id}",
                conversation_id=conversation.id,
                role=MessageRole.USER,
                content=[user_message_content],
                raw_content=request.message,
                tool_calls=[]
            )

            await crud_message.create(db, obj_in=user_message_data)

            # Save assistant response
            assistant_message_content = MessageContent(
                type="text",
                text=response_content,
                image_url=None,
                file_url=None,
                file_name=None,
                file_size=None,
                metadata={}
            )

            assistant_message_data = CRUDMessageCreate(
                message_id=f"assistant_{message_id}",
                conversation_id=conversation.id,
                role=MessageRole.ASSISTANT,
                content=[assistant_message_content],
                raw_content=response_content,
                tool_calls=[]
            )

            await crud_message.create(db, obj_in=assistant_message_data)

            # Update conversation stats (2 messages: user + assistant)
            await crud_chat_conversation.update_conversation_stats(
                db, conversation.id, message_increment=2
            )

        except Exception as save_error:
            import traceback
            logger.error(f"ERROR: Failed to save messages to database: {save_error}")
            logger.error(f"ERROR: Traceback: {traceback.format_exc()}")
            # Continue with response even if saving fails

        return UnifiedChatResponse(
            message_id=message_id,
            conversation_id=conversation.conversation_id,
            response=response_content,
            sources=sources,
            metadata={
                "agent_id": request.agent_id,
                "agent_name": agent_config.name,
                "model": agent_config.ai_model_id,
                "session_id": conversation.agent_session_id
            },
            status="success"
        )

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        # Chat endpoint error occurred
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}\n\nTraceback: {error_details}")


# Legacy endpoint removed - use unified /chat endpoint


@router.get("/info")
async def get_agent_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get information about the unified agent capabilities
    """
    return {
        "agent_type": "unified",
        "capabilities": {
            "L1_tools": "Advanced tool usage and instruction following",
            "L2_knowledge": "Knowledge search and persistent storage",
            "L2_storage": "Session and data persistence",
            "L3_memory": "Long-term memory across sessions",
            "L3_reasoning": "Step-by-step reasoning with think/analyze tools"
        },
        "features": [
            "Unified L1+L2+L3 capabilities in single agent",
            "Knowledge base integration (URLs, PDFs)",
            "Persistent memory and session summaries",
            "Advanced reasoning with think/analyze tools",
            "Multi-model support (OpenAI, Anthropic, Gemini)",
            "User-specific memory isolation",
            "Context-aware conversations"
        ],
        "models_supported": [
            "gpt-4", "gpt-3.5-turbo", "gpt-4-turbo",
            "anthropic/claude-3-sonnet", "anthropic/claude-3-haiku", "anthropic/claude-3-opus",
gemini/gemini-2.5-flash-lite
        ]
    }


@router.post("/workflow", response_model=WorkflowResponse)
async def execute_workflow(
    request: WorkflowRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Execute a complex workflow with multiple agents
    """
    try:
        # Check if API keys are available
        if not os.getenv("OPENAI_API_KEY"):
            raise HTTPException(
                status_code=400,
                detail="OpenAI API key not configured for workflow execution"
            )
        
        # Create advanced agentic workflow (Level 5)
        workflow = VexelAgenticWorkflow(
            workflow_name=request.name,
            user_id=str(current_user.id),
            session_id=f"workflow_{request.name}_{str(current_user.id)}"
        )
        workflow_key = f"{request.name}_{request.task[:50]}"
        active_workflows[workflow_key] = workflow

        # Execute workflow
        result = await workflow.execute_workflow(request.task)
        
        return WorkflowResponse(
            workflow_name=request.name,
            task=request.task,
            plan=result.get("plan", ""),
            research=result.get("research", ""),
            analysis=result.get("analysis", ""),
            execution=result.get("execution", ""),
            status=result.get("status", "completed")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workflow error: {str(e)}")


@router.get("/agents")
async def list_active_agents(current_user: User = Depends(get_current_user)):
    """List all active agents"""
    return {
        "active_agents": [
            {
                "key": key,
                "name": agent.name,
                "level": agent.level,
                "model": type(agent.model).__name__
            }
            for key, agent in active_agents.items()
        ]
    }


@router.get("/workflows")
async def list_active_workflows(current_user: User = Depends(get_current_user)):
    """List all active workflows"""
    return {
        "active_workflows": [
            {
                "key": key,
                "name": workflow.name
            }
            for key, workflow in active_workflows.items()
        ]
    }


@router.delete("/agents/{agent_key}")
async def remove_agent(agent_key: str, current_user: User = Depends(get_current_user)):
    """Remove an active agent"""
    if agent_key in active_agents:
        del active_agents[agent_key]
        return {"message": f"Agent {agent_key} removed"}
    else:
        raise HTTPException(status_code=404, detail="Agent not found")


@router.delete("/workflows/{workflow_key}")
async def remove_workflow(workflow_key: str, current_user: User = Depends(get_current_user)):
    """Remove an active workflow"""
    if workflow_key in active_workflows:
        del active_workflows[workflow_key]
        return {"message": f"Workflow {workflow_key} removed"}
    else:
        raise HTTPException(status_code=404, detail="Workflow not found")


# REMOVED: All test endpoints for security and simplicity


# REMOVED: /test-gemini endpoint - use unified /test endpoint instead


# ============================================================================
# KNOWLEDGE/STORAGE ENDPOINTS (Level 2) - COMMENTED OUT TO AVOID CONFLICTS
# Use /api/v1/knowledge/* endpoints instead
# ============================================================================

# COMMENTED OUT: Duplicate endpoint - use /api/v1/knowledge/collections instead
# @router.get("/knowledge/collections")
# async def get_knowledge_collections_info(current_user: User = Depends(get_current_user)):
    """
    Get user's knowledge collections with IDs
    """
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        from bson import ObjectId
        import os

        # Connect to MongoDB
        mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        client = AsyncIOMotorClient(mongodb_url)
        db = client.vexel

        # Get user's collections from database
        user_collections = await db.knowledge_bases.find({
            "user_id": ObjectId(current_user.id)
        }).to_list(None)

        collections_list = []
        for collection in user_collections:
            collections_list.append({
                "id": str(collection["_id"]),
                "name": collection["name"],
                "type": collection["type"],
                "created_at": collection.get("created_at", "").isoformat() if collection.get("created_at") else None,
                "qdrant_collection": collection.get("qdrant_collection")
            })

        return {
            "message": "User collections retrieved",
            "collections": collections_list,
            "total": len(collections_list),
            "status": "success"
        }

    except Exception as e:
        return {
            "message": "Failed to retrieve collections",
            "error": str(e),
            "status": "error"
        }


@router.get("/knowledge/list")
async def list_knowledge_files(
    page: int = 1,
    per_page: int = 20,
    current_user: User = Depends(get_current_user)
):
    """
    List uploaded knowledge files for the current user
    """
    try:
        from app.api.deps import get_database
        db = get_database()

        # Calculate skip for pagination
        skip = (page - 1) * per_page

        # Get user's uploaded files from MongoDB
        cursor = db.file_metadata.find(
            {"user_id": str(current_user.id)},
            {"_id": 0}
        ).sort("upload_timestamp", -1).skip(skip).limit(per_page)

        files = await cursor.to_list(length=per_page)

        # Get total count
        total_count = await db.file_metadata.count_documents(
            {"user_id": str(current_user.id)}
        )

        # Format response
        formatted_files = []
        for file_meta in files:
            formatted_files.append({
                "id": file_meta.get("file_id", ""),
                "name": file_meta.get("filename", ""),
                "type": file_meta.get("file_type", ""),
                "size": file_meta.get("file_size_bytes", 0),
                "upload_date": file_meta.get("upload_timestamp", ""),
                "collection_name": file_meta.get("collection_name", ""),
                "documents_processed": file_meta.get("documents_count", 0),
                "metadata": file_meta.get("metadata", {})
            })

        return {
            "files": formatted_files,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total_count,
                "pages": (total_count + per_page - 1) // per_page
            },
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list knowledge files: {str(e)}"
        )


# REMOVED: /knowledge/chat endpoint - use unified /chat endpoint instead


class CreateKnowledgeRequest(BaseModel):
    knowledge_type: str  # "text", "url", "pdf"
    name: str
    content: Optional[List[str]] = None  # For text type
    urls: Optional[List[str]] = None     # For url and pdf types


@router.post("/knowledge/create")
async def create_knowledge_base(
    request: CreateKnowledgeRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new knowledge base
    """
    try:
        knowledge_manager = VexelKnowledgeManager()

        if request.knowledge_type == "text" and request.content:
            kb = knowledge_manager.create_text_knowledge_base(
                texts=request.content,
                collection_suffix=request.name
            )
        elif request.knowledge_type == "url" and request.urls:
            kb = knowledge_manager.create_url_knowledge_base(
                urls=request.urls,
                collection_suffix=request.name
            )
        elif request.knowledge_type == "pdf" and request.urls:
            kb = knowledge_manager.create_pdf_knowledge_base(
                pdf_urls=request.urls,
                collection_suffix=request.name
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid knowledge type or missing required parameters"
            )

        # Load the knowledge base
        kb.load(recreate=True)

        return {
            "message": f"Knowledge base '{request.name}' created successfully",
            "type": request.knowledge_type,
            "name": request.name,
            "collection": f"vexel_knowledge_{request.name}",
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create knowledge base: {str(e)}"
        )


class FileUploadResponse(BaseModel):
    message: str
    filename: str
    file_type: str
    collection_name: str
    collection_id: str  # Add collection_id
    documents_processed: int
    file_size_bytes: int
    upload_timestamp: str
    metadata: Dict[str, Any]
    status: str


class FileMetadata(BaseModel):
    collection_name: str
    collection_id: str  # Add collection_id
    filename: str
    file_type: str
    file_size_bytes: int
    upload_timestamp: str
    documents_count: int
    vectors_count: int
    user_id: str
    metadata: Dict[str, Any]


class FileSearchRequest(BaseModel):
    query: str
    file_types: Optional[List[str]] = None  # Filter by file types
    limit: int = 10


# REMOVED: Duplicate upload endpoint - use /api/v1/knowledge/upload instead
# This endpoint conflicts with the main knowledge upload endpoint


@router.get("/knowledge/files")
async def list_uploaded_files(current_user: User = Depends(get_current_user)):
    """
    List all uploaded files with metadata for the current user
    """
    try:
        # Get file metadata from MongoDB
        from app.api.deps import get_database
        db = get_database()

        # Query files for current user
        user_files_cursor = db.file_metadata.find(
            {"user_id": str(current_user.id)},
            {"_id": 0}  # Exclude MongoDB _id field
        ).sort("upload_timestamp", -1)  # Sort by newest first

        user_files = await user_files_cursor.to_list(length=None)

        # Get vector counts from Qdrant for each collection
        for file_info in user_files:
            try:
                import qdrant_client
                client = qdrant_client.QdrantClient(url="http://localhost:6333")
                collection_info = client.get_collection(file_info["collection_name"])
                file_info["vectors_count"] = collection_info.vectors_count
                file_info["status"] = "active"
            except Exception as e:
                file_info["vectors_count"] = 0
                file_info["status"] = "error"

        return {
            "message": "User uploaded files retrieved with metadata",
            "user_id": str(current_user.id),
            "files": user_files,
            "total_files": len(user_files),
            "status": "success"
        }

    except Exception as e:
        return {
            "message": "Failed to retrieve uploaded files",
            "error": str(e),
            "status": "error"
        }


@router.post("/knowledge/search")
async def search_uploaded_files(
    request: FileSearchRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Search through uploaded files by filename, content, or metadata
    """
    try:
        from app.api.deps import get_database
        db = get_database()

        # Build MongoDB query
        mongo_query = {"user_id": str(current_user.id)}

        # Add file type filter if specified
        if request.file_types:
            mongo_query["file_type"] = {"$in": request.file_types}

        # Search in filename and metadata
        if request.query:
            mongo_query["$or"] = [
                {"filename": {"$regex": request.query, "$options": "i"}},
                {"metadata.content_type": {"$regex": request.query, "$options": "i"}},
                {"collection_name": {"$regex": request.query, "$options": "i"}}
            ]

        # Execute search
        search_cursor = db.file_metadata.find(
            mongo_query,
            {"_id": 0}
        ).sort("upload_timestamp", -1).limit(request.limit)

        search_results = await search_cursor.to_list(length=None)

        # For each file, also search within document content using vector search
        content_matches = []
        if request.query and search_results:
            for file_info in search_results:
                try:
                    # Create knowledge manager for this collection
                    knowledge_manager = VexelKnowledgeManager(
                        collection_name=file_info["collection_name"]
                    )

                    # Search within document content
                    from agno.knowledge.document import DocumentKnowledgeBase
                    knowledge_base = DocumentKnowledgeBase(
                        documents=[],
                        vector_db=knowledge_manager.vector_db
                    )

                    # Perform vector search
                    search_results_content = knowledge_base.search(
                        query=request.query,
                        num_documents=3
                    )

                    if search_results_content:
                        file_info["content_matches"] = [
                            {
                                "content": doc.content[:200] + "..." if len(doc.content) > 200 else doc.content,
                                "score": getattr(doc, 'score', 0.0)
                            }
                            for doc in search_results_content
                        ]
                    else:
                        file_info["content_matches"] = []

                except Exception as e:
                    file_info["content_matches"] = []
                    file_info["search_error"] = str(e)

                content_matches.append(file_info)

        return {
            "message": f"Search completed for query: '{request.query}'",
            "query": request.query,
            "file_types_filter": request.file_types,
            "results": content_matches if content_matches else search_results,
            "total_results": len(content_matches if content_matches else search_results),
            "status": "success"
        }

    except Exception as e:
        return {
            "message": "Search failed",
            "query": request.query,
            "error": str(e),
            "results": [],
            "total_results": 0,
            "status": "error"
        }


@router.get("/knowledge/files/{collection_name}")
async def get_file_details(
    collection_name: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed information about a specific uploaded file
    """
    try:
        # Security check
        if str(current_user.id) not in collection_name and not collection_name.startswith("uploaded_"):
            raise HTTPException(
                status_code=403,
                detail="You can only access your own uploaded files"
            )

        from app.api.deps import get_database
        db = get_database()

        # Get file metadata
        file_metadata = await db.file_metadata.find_one(
            {
                "collection_name": collection_name,
                "user_id": str(current_user.id)
            },
            {"_id": 0}
        )

        if not file_metadata:
            raise HTTPException(
                status_code=404,
                detail="File not found"
            )

        # Get vector database info
        try:
            import qdrant_client
            client = qdrant_client.QdrantClient(url="http://localhost:6333")
            collection_info = client.get_collection(collection_name)

            file_metadata["vectors_count"] = collection_info.vectors_count
            file_metadata["vector_size"] = collection_info.config.params.vectors.size
            file_metadata["distance_metric"] = collection_info.config.params.vectors.distance.name
            file_metadata["status"] = "active"

            # Get sample documents
            search_result = client.scroll(
                collection_name=collection_name,
                limit=3,
                with_payload=True
            )

            sample_documents = []
            for point in search_result[0]:
                if point.payload:
                    sample_documents.append({
                        "content_preview": point.payload.get("content", "")[:200] + "...",
                        "metadata": {k: v for k, v in point.payload.items() if k != "content"}
                    })

            file_metadata["sample_documents"] = sample_documents

        except Exception as e:
            file_metadata["vectors_count"] = 0
            file_metadata["status"] = "error"
            file_metadata["error"] = str(e)

        return {
            "message": "File details retrieved successfully",
            "file_details": file_metadata,
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get file details: {str(e)}"
        )


@router.delete("/knowledge/files/{collection_name}")
async def delete_uploaded_file(
    collection_name: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete an uploaded file collection
    """
    try:
        # Security check: ensure user can only delete their own collections
        if str(current_user.id) not in collection_name and not collection_name.startswith("uploaded_"):
            raise HTTPException(
                status_code=403,
                detail="You can only delete your own uploaded files"
            )

        # For unified collection, we don't delete the collection, just the file's vectors
        knowledge_manager = VexelKnowledgeManager(
            collection_name="vexel_knowledge_base",
            user_id=str(current_user.id),
            unified_collection=True
        )

        # Delete metadata from MongoDB
        from app.api.deps import get_database
        db = get_database()

        metadata_result = await db.file_metadata.delete_one({
            "collection_name": collection_name,
            "user_id": str(current_user.id)
        })

        # Delete specific file vectors from unified collection
        try:
            # Extract file_id from collection_name for deletion
            file_id = extract_file_id_from_collection(collection_name)

            import qdrant_client
            from qdrant_client.models import Filter, FieldCondition, MatchValue

            client = qdrant_client.QdrantClient(url="http://localhost:6333")

            # Delete vectors for this specific file
            client.delete(
                collection_name="vexel_knowledge_base",
                points_selector=Filter(
                    must=[
                        FieldCondition(key="user_id", match=MatchValue(value=str(current_user.id))),
                        FieldCondition(key="file_id", match=MatchValue(value=file_id))
                    ]
                )
            )

            return {
                "message": f"File '{collection_name}' deleted successfully from unified collection",
                "collection_name": collection_name,
                "file_id": file_id,
                "metadata_deleted": metadata_result.deleted_count > 0,
                "status": "success"
            }

        except Exception as e:
            # Still return success if metadata was deleted
            return {
                "message": f"Metadata deleted, but vector deletion failed: {str(e)}",
                "collection_name": collection_name,
                "metadata_deleted": metadata_result.deleted_count > 0,
                "status": "partial_success"
            }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete collection: {str(e)}"
        )


# ChatWithFileRequest removed - use UnifiedChatRequest


class CrossFileSearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 10
    include_shared_knowledge: bool = False
    specific_file_ids: Optional[List[str]] = None


class FileSearchResult(BaseModel):
    content: str
    chunk_id: Optional[int] = None
    relevance_score: float = 0.0
    text_snippet: str = ""


class FileResults(BaseModel):
    filename: str
    file_id: str
    results: List[FileSearchResult]


class CrossFileSearchResponse(BaseModel):
    query: str
    total_results: int
    files_found: int
    results_by_file: Dict[str, FileResults]


# Removed EnhancedChatRequest - consolidated into ChatWithFileRequest


# /knowledge/chat endpoint removed - use unified /chat endpoint


# REMOVED: /knowledge/test and /knowledge/test-gemini-embeddings endpoints - use unified /test endpoint instead


# ============================================================================
# LEVEL 3: MEMORY/REASONING ENDPOINTS
# ============================================================================

# REMOVED: /memory-reasoning/chat endpoint - use unified /chat endpoint instead


@router.get("/memory-reasoning/memories/{user_id}")
async def get_user_memories(user_id: str, limit: int = 20, current_user: User = Depends(get_current_user)):
    """
    Get user memories from the memory system
    """
    try:
        # Create agent instance to access memory
        agent = VexelMemoryReasoningAgent(user_id=user_id)
        memories = agent.get_memories(limit=limit)

        return {
            "message": f"Retrieved {len(memories)} memories for user {user_id}",
            "user_id": user_id,
            "memories": memories,
            "status": "success"
        }

    except Exception as e:
        return {
            "message": "Failed to retrieve memories",
            "error": str(e),
            "status": "error"
        }


@router.delete("/memory-reasoning/memories/{user_id}")
async def clear_user_memories(user_id: str, current_user: User = Depends(get_current_user)):
    """
    Clear all memories for a user (for testing)
    """
    try:
        # Create agent instance to access memory
        agent = VexelMemoryReasoningAgent(user_id=user_id)
        agent.clear_memories()

        return {
            "message": f"Cleared all memories for user {user_id}",
            "user_id": user_id,
            "status": "success"
        }

    except Exception as e:
        return {
            "message": "Failed to clear memories",
            "error": str(e),
            "status": "error"
        }


# REMOVED: /memory-reasoning/test endpoint - use unified /test endpoint instead


# ============================================================================
# LEVEL 4: TEAM COLLABORATION ENDPOINTS
# ============================================================================

@router.post("/team-collaboration/run")
async def team_collaboration_run(request: dict, current_user: User = Depends(get_current_user)):
    """
    Run a task using Vexel Team Collaboration System (Level 4)

    Features:
    - Multi-agent teams with different collaboration modes
    - Agent coordination and communication
    - Task distribution and workflow orchestration
    - Shared memory and context between team members
    """
    try:
        # Extract request parameters
        team_name = request.get("team_name", "VexelTeam")
        mode = request.get("mode", "coordinate")  # route, coordinate, collaborate
        leader_model = request.get("leader_model", "gemini/gemini-2.5-flash-lite")
        user_id = request.get("user_id", "default_user")
        session_id = request.get("session_id")
        knowledge_sources = request.get("knowledge_sources", [])
        task = request.get("task", "")
        stream = request.get("stream", False)
        success_criteria = request.get("success_criteria")
        custom_instructions = request.get("custom_instructions")

        if not task:
            return {
                "message": "Task is required",
                "status": "error"
            }

        # Validate mode
        if mode not in ["route", "coordinate", "collaborate"]:
            return {
                "message": "Mode must be one of: route, coordinate, collaborate",
                "status": "error"
            }

        # Create team collaboration system
        team_system = VexelTeamCollaboration(
            team_name=team_name,
            mode=mode,
            leader_model=leader_model,
            user_id=user_id,
            session_id=session_id,
            knowledge_sources=knowledge_sources
        )

        # Load knowledge if provided
        if knowledge_sources:
            team_system.load_knowledge(recreate=True)

        # Create team with custom settings
        team_system.create_team(
            success_criteria=success_criteria,
            custom_instructions=custom_instructions
        )

        # Execute task
        response = team_system.run_team_task(task, stream=stream)

        # Get team context
        team_info = team_system.get_team_info()
        memories = team_system.get_team_memories(limit=5)
        session_summary = team_system.get_team_session_summary()

        return {
            "message": "Team collaboration task completed",
            "response": response,
            "team_info": team_info,
            "context": {
                "memories_count": len(memories),
                "recent_memories": memories,
                "session_summary": session_summary
            },
            "status": "success"
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "message": "Team collaboration task failed",
            "error": str(e),
            "status": "error"
        }


@router.post("/team-collaboration/create-research-team")
async def create_research_team_endpoint(request: dict, current_user: User = Depends(get_current_user)):
    """
    Create a specialized research team
    """
    try:
        team_name = request.get("team_name", "VexelResearchTeam")
        user_id = request.get("user_id", "default_user")
        knowledge_sources = request.get("knowledge_sources", [])
        task = request.get("task", "")

        if not task:
            return {
                "message": "Task is required",
                "status": "error"
            }

        # Create research team
        research_team = create_research_team(
            team_name=team_name,
            user_id=user_id,
            knowledge_sources=knowledge_sources
        )

        # Load knowledge if provided
        if knowledge_sources:
            research_team.load_knowledge(recreate=True)

        # Execute research task
        response = research_team.run_team_task(task)

        # Get team context
        team_info = research_team.get_team_info()
        memories = research_team.get_team_memories(limit=5)

        return {
            "message": "Research team task completed",
            "response": response,
            "team_info": team_info,
            "context": {
                "memories_count": len(memories),
                "recent_memories": memories
            },
            "status": "success"
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "message": "Research team task failed",
            "error": str(e),
            "status": "error"
        }


@router.post("/team-collaboration/create-analysis-team")
async def create_analysis_team_endpoint(request: dict, current_user: User = Depends(get_current_user)):
    """
    Create a specialized analysis team
    """
    try:
        team_name = request.get("team_name", "VexelAnalysisTeam")
        user_id = request.get("user_id", "default_user")
        knowledge_sources = request.get("knowledge_sources", [])
        task = request.get("task", "")

        if not task:
            return {
                "message": "Task is required",
                "status": "error"
            }

        # Create analysis team
        analysis_team = create_analysis_team(
            team_name=team_name,
            user_id=user_id,
            knowledge_sources=knowledge_sources
        )

        # Load knowledge if provided
        if knowledge_sources:
            analysis_team.load_knowledge(recreate=True)

        # Execute analysis task
        response = analysis_team.run_team_task(task)

        # Get team context
        team_info = analysis_team.get_team_info()
        memories = analysis_team.get_team_memories(limit=5)

        return {
            "message": "Analysis team task completed",
            "response": response,
            "team_info": team_info,
            "context": {
                "memories_count": len(memories),
                "recent_memories": memories
            },
            "status": "success"
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "message": "Analysis team task failed",
            "error": str(e),
            "status": "error"
        }


@router.post("/team-collaboration/create-routing-team")
async def create_routing_team_endpoint(request: dict, current_user: User = Depends(get_current_user)):
    """
    Create a specialized routing team
    """
    try:
        team_name = request.get("team_name", "VexelRoutingTeam")
        user_id = request.get("user_id", "default_user")
        knowledge_sources = request.get("knowledge_sources", [])
        task = request.get("task", "")

        if not task:
            return {
                "message": "Task is required",
                "status": "error"
            }

        # Create routing team
        routing_team = create_routing_team(
            team_name=team_name,
            user_id=user_id,
            knowledge_sources=knowledge_sources
        )

        # Load knowledge if provided
        if knowledge_sources:
            routing_team.load_knowledge(recreate=True)

        # Execute routing task
        response = routing_team.run_team_task(task)

        # Get team context
        team_info = routing_team.get_team_info()
        memories = routing_team.get_team_memories(limit=5)

        return {
            "message": "Routing team task completed",
            "response": response,
            "team_info": team_info,
            "context": {
                "memories_count": len(memories),
                "recent_memories": memories
            },
            "status": "success"
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "message": "Routing team task failed",
            "error": str(e),
            "status": "error"
        }


@router.get("/team-collaboration/team-info/{team_name}")
async def get_team_info(team_name: str, user_id: str = "default_user", current_user: User = Depends(get_current_user)):
    """
    Get information about a team
    """
    try:
        # Create team instance to get info
        team_system = VexelTeamCollaboration(
            team_name=team_name,
            user_id=user_id
        )

        team_info = team_system.get_team_info()
        memories = team_system.get_team_memories(limit=10)

        return {
            "message": f"Team information retrieved for {team_name}",
            "team_info": team_info,
            "memories": memories,
            "status": "success"
        }

    except Exception as e:
        return {
            "message": "Failed to retrieve team information",
            "error": str(e),
            "status": "error"
        }


@router.delete("/team-collaboration/memories/{team_name}")
async def clear_team_memories(team_name: str, user_id: str = "default_user", current_user: User = Depends(get_current_user)):
    """
    Clear all memories for a team (for testing)
    """
    try:
        # Create team instance to clear memories
        team_system = VexelTeamCollaboration(
            team_name=team_name,
            user_id=user_id
        )

        team_system.clear_team_memories()

        return {
            "message": f"Cleared all memories for team {team_name}",
            "team_name": team_name,
            "user_id": user_id,
            "status": "success"
        }

    except Exception as e:
        return {
            "message": "Failed to clear team memories",
            "error": str(e),
            "status": "error"
        }


# REMOVED: /team-collaboration/test endpoint - use unified /test endpoint instead


# ============================================================================
# LEVEL 5: AGENTIC WORKFLOWS ENDPOINTS
# ============================================================================

@router.post("/agentic-workflows/run")
async def agentic_workflow_run(request: dict, current_user: User = Depends(get_current_user)):
    """
    Run an agentic workflow with autonomous execution and conditional logic

    Features:
    - Autonomous workflow execution with conditional logic
    - Complex multi-step processes with branching
    - External system integrations and monitoring
    - Workflow templates and reusable components
    """
    try:
        # Extract request parameters
        workflow_name = request.get("workflow_name", "VexelWorkflow")
        workflow_description = request.get("workflow_description", "Autonomous Vexel workflow")
        user_id = request.get("user_id", "default_user")
        session_id = request.get("session_id")
        steps = request.get("steps", [])
        global_config = request.get("global_config", {})
        input_params = request.get("input_params", {})

        if not steps:
            return {
                "message": "Workflow steps are required",
                "status": "error"
            }

        # Create workflow
        workflow = VexelAgenticWorkflow(
            workflow_name=workflow_name,
            workflow_description=workflow_description,
            user_id=user_id,
            session_id=session_id,
            global_config=global_config
        )

        # Add steps to workflow
        for step_config in steps:
            step = WorkflowStep(
                step_id=step_config["step_id"],
                name=step_config["name"],
                step_type=step_config["step_type"],
                config=step_config["config"],
                conditions=step_config.get("conditions", []),
                next_steps=step_config.get("next_steps", []),
                error_handling=step_config.get("error_handling", {})
            )
            workflow.add_step(step)

        # Execute workflow
        result = await workflow.arun(**input_params)

        # Get workflow status
        status = workflow.get_workflow_status()

        return {
            "message": "Agentic workflow completed",
            "result": result,
            "workflow_status": status,
            "execution_results": workflow.execution_results,
            "status": "success"
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "message": "Agentic workflow execution failed",
            "error": str(e),
            "status": "error"
        }


@router.post("/agentic-workflows/create-research-analysis")
async def create_research_analysis_workflow_endpoint(request: dict, current_user: User = Depends(get_current_user)):
    """
    Create and run a research and analysis workflow template
    """
    try:
        topic = request.get("topic", "")
        user_id = request.get("user_id", "default_user")

        if not topic:
            return {
                "message": "Topic is required for research analysis workflow",
                "status": "error"
            }

        # Create workflow
        workflow = create_research_analysis_workflow(
            topic=topic,
            user_id=user_id
        )

        # Execute workflow
        result = await workflow.arun(topic=topic)

        # Get workflow status
        status = workflow.get_workflow_status()

        return {
            "message": "Research analysis workflow completed",
            "topic": topic,
            "result": result,
            "workflow_status": status,
            "execution_results": workflow.execution_results,
            "status": "success"
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "message": "Research analysis workflow failed",
            "error": str(e),
            "status": "error"
        }


@router.post("/agentic-workflows/create-conditional")
async def create_conditional_workflow_endpoint(request: dict, current_user: User = Depends(get_current_user)):
    """
    Create and run a conditional workflow with branching logic
    """
    try:
        user_id = request.get("user_id", "default_user")
        task = request.get("task", "Analyze the given problem and determine the best approach")

        # Create workflow
        workflow = create_conditional_workflow(user_id=user_id)

        # Execute workflow
        result = await workflow.arun(task=task)

        # Get workflow status
        status = workflow.get_workflow_status()

        return {
            "message": "Conditional workflow completed",
            "task": task,
            "result": result,
            "workflow_status": status,
            "execution_results": workflow.execution_results,
            "status": "success"
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "message": "Conditional workflow failed",
            "error": str(e),
            "status": "error"
        }


@router.post("/agentic-workflows/create-parallel-processing")
async def create_parallel_processing_workflow_endpoint(request: dict, current_user: User = Depends(get_current_user)):
    """
    Create and run a parallel processing workflow
    """
    try:
        tasks = request.get("tasks", [])
        user_id = request.get("user_id", "default_user")

        if not tasks:
            return {
                "message": "Tasks list is required for parallel processing workflow",
                "status": "error"
            }

        # Create workflow
        workflow = create_parallel_processing_workflow(
            tasks=tasks,
            user_id=user_id
        )

        # Execute workflow
        result = await workflow.arun(tasks=tasks)

        # Get workflow status
        status = workflow.get_workflow_status()

        return {
            "message": "Parallel processing workflow completed",
            "tasks": tasks,
            "result": result,
            "workflow_status": status,
            "execution_results": workflow.execution_results,
            "status": "success"
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "message": "Parallel processing workflow failed",
            "error": str(e),
            "status": "error"
        }


@router.post("/agentic-workflows/create-external-integration")
async def create_external_integration_workflow_endpoint(request: dict, current_user: User = Depends(get_current_user)):
    """
    Create and run an external integration workflow
    """
    try:
        api_endpoints = request.get("api_endpoints", [])
        user_id = request.get("user_id", "default_user")

        if not api_endpoints:
            return {
                "message": "API endpoints list is required for external integration workflow",
                "status": "error"
            }

        # Create workflow
        workflow = create_external_integration_workflow(
            api_endpoints=api_endpoints,
            user_id=user_id
        )

        # Execute workflow
        result = await workflow.arun(api_endpoints=api_endpoints)

        # Get workflow status
        status = workflow.get_workflow_status()

        return {
            "message": "External integration workflow completed",
            "api_endpoints": api_endpoints,
            "result": result,
            "workflow_status": status,
            "execution_results": workflow.execution_results,
            "status": "success"
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "message": "External integration workflow failed",
            "error": str(e),
            "status": "error"
        }


@router.post("/agentic-workflows/create-monitoring")
async def create_monitoring_workflow_endpoint(request: dict, current_user: User = Depends(get_current_user)):
    """
    Create and run a monitoring workflow
    """
    try:
        monitored_systems = request.get("monitored_systems", [])
        user_id = request.get("user_id", "default_user")

        if not monitored_systems:
            return {
                "message": "Monitored systems list is required for monitoring workflow",
                "status": "error"
            }

        # Create workflow
        workflow = create_monitoring_workflow(
            monitored_systems=monitored_systems,
            user_id=user_id
        )

        # Execute workflow
        result = await workflow.arun(monitored_systems=monitored_systems)

        # Get workflow status
        status = workflow.get_workflow_status()

        return {
            "message": "Monitoring workflow completed",
            "monitored_systems": monitored_systems,
            "result": result,
            "workflow_status": status,
            "execution_results": workflow.execution_results,
            "status": "success"
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "message": "Monitoring workflow failed",
            "error": str(e),
            "status": "error"
        }


@router.get("/agentic-workflows/status/{workflow_id}")
async def get_workflow_status(workflow_id: str, current_user: User = Depends(get_current_user)):
    """
    Get workflow execution status and metrics
    """
    try:
        # In a real implementation, you would retrieve workflow from database
        # For now, return a placeholder response
        return {
            "message": f"Workflow status retrieved for {workflow_id}",
            "workflow_id": workflow_id,
            "status": "This endpoint requires workflow persistence implementation",
            "note": "Implement workflow storage and retrieval for production use"
        }

    except Exception as e:
        return {
            "message": "Failed to retrieve workflow status",
            "error": str(e),
            "status": "error"
        }


@router.post("/agentic-workflows/pause/{workflow_id}")
async def pause_workflow(workflow_id: str, current_user: User = Depends(get_current_user)):
    """
    Pause workflow execution
    """
    try:
        # In a real implementation, you would pause the running workflow
        return {
            "message": f"Workflow paused: {workflow_id}",
            "workflow_id": workflow_id,
            "status": "This endpoint requires workflow management implementation",
            "note": "Implement workflow control for production use"
        }

    except Exception as e:
        return {
            "message": "Failed to pause workflow",
            "error": str(e),
            "status": "error"
        }


@router.post("/agentic-workflows/resume/{workflow_id}")
async def resume_workflow(workflow_id: str, current_user: User = Depends(get_current_user)):
    """
    Resume workflow execution
    """
    try:
        # In a real implementation, you would resume the paused workflow
        return {
            "message": f"Workflow resumed: {workflow_id}",
            "workflow_id": workflow_id,
            "status": "This endpoint requires workflow management implementation",
            "note": "Implement workflow control for production use"
        }

    except Exception as e:
        return {
            "message": "Failed to resume workflow",
            "error": str(e),
            "status": "error"
        }


@router.delete("/agentic-workflows/cancel/{workflow_id}")
async def cancel_workflow(workflow_id: str, current_user: User = Depends(get_current_user)):
    """
    Cancel workflow execution
    """
    try:
        # In a real implementation, you would cancel the running workflow
        return {
            "message": f"Workflow cancelled: {workflow_id}",
            "workflow_id": workflow_id,
            "status": "This endpoint requires workflow management implementation",
            "note": "Implement workflow control for production use"
        }

    except Exception as e:
        return {
            "message": "Failed to cancel workflow",
            "error": str(e),
            "status": "error"
        }


# REMOVED: /agentic-workflows/test endpoint - use unified /test endpoint instead


# REMOVED: Duplicate /knowledge/collections endpoint


@router.post("/knowledge/search-all", response_model=CrossFileSearchResponse)
async def search_across_all_files(
    request: CrossFileSearchRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Search across all user's uploaded files using cross-file knowledge search
    """
    try:
        # Create cross-file knowledge manager
        cross_file_knowledge = VexelCrossFileKnowledge(str(current_user.id))

        # Check cache first
        cache_key = knowledge_cache.get_cache_key(
            query=request.query,
            user_id=str(current_user.id),
            file_ids=request.specific_file_ids
        )

        cached_results = knowledge_cache.get(cache_key)
        if cached_results:
            # Convert cached results to grouped format
            grouped_results = cross_file_knowledge.search_with_file_grouping(
                query=request.query,
                limit=request.limit,
                include_shared=request.include_shared_knowledge
            )
            return CrossFileSearchResponse(**grouped_results)

        # Perform cross-file search
        grouped_results = cross_file_knowledge.search_with_file_grouping(
            query=request.query,
            limit=request.limit,
            include_shared=request.include_shared_knowledge
        )

        # Cache results
        results = cross_file_knowledge.search_across_files(
            query=request.query,
            limit=request.limit,
            include_shared=request.include_shared_knowledge,
            specific_file_ids=request.specific_file_ids
        )
        knowledge_cache.set(cache_key, results)

        return CrossFileSearchResponse(**grouped_results)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cross-file search failed: {str(e)}")


# Removed enhanced chat endpoint - functionality consolidated into /knowledge/chat


def extract_file_id_from_collection(collection_name: str) -> str:
    """Extract file ID from collection name for backward compatibility"""
    # Collection name format: uploaded_filename_userid
    if collection_name.startswith("uploaded_"):
        parts = collection_name.split("_")
        if len(parts) >= 3:
            filename = "_".join(parts[1:-1])  # Everything between "uploaded" and userid
            user_id = parts[-1]
            return f"file_{filename}_{user_id}"

    return collection_name  # Fallback


