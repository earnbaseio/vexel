from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

from app.api.deps import get_current_user
from app.models.user import User, UserTier
from app.agents.knowledge import VexelKnowledgeManager
from app.agents.cross_file_knowledge import VexelCrossFileKnowledge

router = APIRouter()


# Pydantic models
class CreateKnowledgeRequest(BaseModel):
    knowledge_type: str  # "text", "url", "pdf"
    name: str
    content: Optional[List[str]] = None  # For text type
    urls: Optional[List[str]] = None     # For url and pdf types


class FileUploadResponse(BaseModel):
    message: str
    filename: str
    file_type: str
    collection_name: str
    collection_id: str  # Add collection_id to response
    documents_processed: int
    file_size_bytes: int
    upload_timestamp: str
    metadata: Dict[str, Any]
    status: str


class KnowledgeListResponse(BaseModel):
    items: List[Dict[str, Any]]
    total: int
    page: int
    per_page: int
    status: str


@router.get("/collections")
async def get_knowledge_collections_info(current_user: User = Depends(get_current_user)):
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
                "qdrant_collection": f"vexel_knowledge_base_{collection['name']}"
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


@router.get("/collections/available")
async def get_available_collections_for_agents(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get available knowledge collections that can be linked to agents
    """
    try:
        # Create cross-file knowledge manager
        cross_file_knowledge = VexelCrossFileKnowledge(str(current_user.id))

        # Get user's collections with metadata
        collections_info = cross_file_knowledge.get_user_collections_info()

        # Format for agent selection
        available_collections = []
        for collection_name in collections_info.get("collections", []):
            # Get collection stats
            try:
                stats = cross_file_knowledge.get_collection_stats(collection_name)
                available_collections.append({
                    "collection_name": collection_name,
                    "display_name": collection_name.replace("_", " ").title(),
                    "document_count": stats.get("document_count", 0),
                    "type": "user" if "uploaded_" in collection_name else "knowledge",
                    "description": f"Collection with {stats.get('document_count', 0)} documents"
                })
            except Exception as e:
                # If stats fail, still include the collection
                available_collections.append({
                    "collection_name": collection_name,
                    "display_name": collection_name.replace("_", " ").title(),
                    "document_count": 0,
                    "type": "user" if "uploaded_" in collection_name else "knowledge",
                    "description": "Collection available for linking"
                })

        return {
            "available_collections": available_collections,
            "total_available": len(available_collections),
            "user_id": str(current_user.id)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching available collections: {str(e)}")


@router.post("/create")
async def create_knowledge_base(
    request: CreateKnowledgeRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new knowledge base
    """
    try:
        # Create knowledge manager with user-specific default collection
        knowledge_manager = VexelKnowledgeManager(
            user_id=str(current_user.id)
        )

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

        # Get the actual collection name from the knowledge manager (already includes user_id)
        actual_collection_name = f"{knowledge_manager.collection_name}_{request.name}"

        print(f"DEBUG: knowledge_manager.collection_name = {knowledge_manager.collection_name}")
        print(f"DEBUG: request.name = {request.name}")
        print(f"DEBUG: actual_collection_name = {actual_collection_name}")

        # Save collection metadata to MongoDB
        from motor.motor_asyncio import AsyncIOMotorClient
        from bson import ObjectId
        from datetime import datetime
        import os

        mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        client = AsyncIOMotorClient(mongodb_url)
        db = client.vexel

        # actual_collection_name already includes user_id from knowledge_manager
        collection_doc = {
            "name": request.name,
            "type": request.knowledge_type,
            "user_id": ObjectId(current_user.id),
            "content": request.content,
            "urls": request.urls,
            "qdrant_collection": actual_collection_name,  # Already user-specific
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = await db.knowledge_bases.insert_one(collection_doc)
        collection_id = str(result.inserted_id)

        return {
            "message": f"Knowledge base '{request.name}' created successfully",
            "type": request.knowledge_type,
            "name": request.name,
            "collection": actual_collection_name,
            "collection_id": collection_id,
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create knowledge base: {str(e)}"
        )


@router.get("/list")
async def get_knowledge_list(
    page: int = 1,
    per_page: int = 20,
    current_user: User = Depends(get_current_user)
) -> KnowledgeListResponse:
    """
    Get list of knowledge items with pagination
    """
    try:
        print(f"🔍 Knowledge list request: user_id={current_user.id}, page={page}, per_page={per_page}")

        # For now, return mock data since we need to implement proper knowledge item listing
        # This would typically query the vector database for user's knowledge items

        print("🔧 Creating VexelKnowledgeManager...")
        knowledge_manager = VexelKnowledgeManager(
            user_id=str(current_user.id),
            unified_collection=True
        )
        print("✅ VexelKnowledgeManager created successfully")

        # Get collections info to show available knowledge
        print("📊 Getting collections info...")
        collections_info = knowledge_manager.get_collections_info()
        print(f"📊 Collections info retrieved: {collections_info}")

        # Extract collections list from the response
        collections_list = collections_info.get('collections', [])
        print(f"📊 Collections list: {len(collections_list)} collections")

        # Mock knowledge items based on collections
        items = []
        for i, collection_name in enumerate(collections_list):
            print(f"🔄 Processing collection {i+1}: {collection_name}")
            try:
                items.append({
                    "id": str(uuid.uuid4()),
                    "title": f"Knowledge from {collection_name}",
                    "description": f"Vector collection: {collection_name}",
                    "type": "collection",
                    "collection_name": collection_name,
                    "vector_count": 0,  # We don't have individual collection stats yet
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat(),
                    "metadata": {
                        "collection_name": collection_name
                    }
                })
                print(f"✅ Collection {i+1} processed successfully")
            except Exception as collection_error:
                print(f"❌ Error processing collection {i+1}: {collection_error}")
                print(f"❌ Collection data: {collection_name}")
                continue

        print(f"📝 Total items created: {len(items)}")

        # Apply pagination
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_items = items[start_idx:end_idx]

        print(f"📄 Pagination: start={start_idx}, end={end_idx}, paginated_count={len(paginated_items)}")

        return KnowledgeListResponse(
            items=paginated_items,
            total=len(items),
            page=page,
            per_page=per_page,
            status="success"
        )

    except Exception as e:
        print(f"❌ Knowledge list error: {e}")
        print(f"❌ Error type: {type(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch knowledge list: {str(e)}"
        )


@router.post("/upload")
async def upload_knowledge_file(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form("general"),
    tags: Optional[str] = Form(None),
    collection_id: str = Form(...),  # Required collection ID selection
    # New chunking parameters
    chunking_strategy: str = Form("auto"),
    chunk_size: Optional[int] = Form(None),
    overlap: Optional[int] = Form(None),
    enable_analysis: bool = Form(False),
    current_user: User = Depends(get_current_user)
) -> FileUploadResponse:
    """
    Upload a file to knowledge base with advanced chunking options

    New Parameters:
    - chunking_strategy: Strategy to use ("auto", "fixed", "recursive", "document", "semantic", "agentic", "markdown")
    - chunk_size: Override default chunk size
    - overlap: Override default overlap size
    - enable_analysis: Enable content analysis for optimization recommendations
    """
    try:
        # Generate unique file ID
        file_id = str(uuid.uuid4())

        # Read file content
        file_content = await file.read()
        file_size = len(file_content)

        # Check user tier and upload limits
        can_upload, upload_message = current_user.can_upload(file_size)
        if not can_upload:
            raise HTTPException(status_code=403, detail=upload_message)

        # Validate chunking strategy access
        if not current_user.can_use_chunking_strategy(chunking_strategy):
            available_strategies = current_user.get_tier_limits()["chunking_strategies"]
            raise HTTPException(
                status_code=403,
                detail=f"Chunking strategy '{chunking_strategy}' not available for your tier. "
                       f"Available strategies: {available_strategies}"
            )

        # FIRST: Validate collection exists and user has access (before any file processing)
        from motor.motor_asyncio import AsyncIOMotorClient
        from bson import ObjectId
        import os

        try:
            # Validate collection_id format
            collection_object_id = ObjectId(collection_id)
        except Exception:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid collection ID format: {collection_id}"
            )

        # Connect to MongoDB and check collection
        mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        client = AsyncIOMotorClient(mongodb_url)
        db = client.vexel

        collection = await db.knowledge_bases.find_one({
            "_id": collection_object_id,
            "user_id": ObjectId(current_user.id)
        })

        if not collection:
            raise HTTPException(
                status_code=404,
                detail=f"Collection not found or you don't have access to it. Collection ID: {collection_id}"
            )

        collection_name = collection["name"]  # Get actual collection name for processing
        qdrant_collection_name = collection.get("qdrant_collection", f"vexel_knowledge_base_{collection_name}")
        print(f"📤 DEBUG: Collection validation passed for: {collection_name} (ID: {collection_id})")
        print(f"📤 DEBUG: Qdrant collection from DB: {qdrant_collection_name}")
        print(f"📤 DEBUG: Collection document: {collection}")

        # Determine file type
        file_type = file.content_type or "application/octet-stream"

        # Process file with enhanced chunking
        from app.agents.enhanced_file_processing import process_file_with_enhanced_chunking
        from app.models.user import UserTier

        # Convert user tier (for now, use FREE as default since tier system is new)
        user_tier = getattr(current_user, 'tier', UserTier.FREE)

        documents, processing_metadata = process_file_with_enhanced_chunking(
            file_content=file_content,
            filename=file.filename,
            file_type=file_type,
            chunking_strategy=chunking_strategy,
            chunk_size=chunk_size,
            overlap=overlap,
            user_tier=user_tier,
            enable_analysis=enable_analysis
        )

        print(f"📤 DEBUG: Uploading to collection: {collection_name}")
        print(f"📤 DEBUG: Using Qdrant collection: {qdrant_collection_name}")

        # Create knowledge manager with specified Qdrant collection
        # Note: qdrant_collection_name already includes user_id
        knowledge_manager = VexelKnowledgeManager(
            collection_name=qdrant_collection_name
        )

        # Create knowledge base from documents with enhanced metadata
        from app.agents.fixed_document_knowledge import VexelDocumentKnowledgeBase

        # Add user and file metadata to each document
        for i, doc in enumerate(documents):
            if not hasattr(doc, 'meta_data') or doc.meta_data is None:
                doc.meta_data = {}

            doc.meta_data.update({
                "user_id": str(current_user.id),
                "file_id": file_id,
                "filename": file.filename,
                "file_type": file_type,
                "chunk_id": i,
                "upload_timestamp": datetime.utcnow().isoformat(),
                "text_snippet": doc.content[:200] + "..." if len(doc.content) > 200 else doc.content,
                "title": title or file.filename,
                "description": description or f"Uploaded file: {file.filename}",
                "category": category,
                "tags": tags.split(",") if tags else []
            })

        # Update user usage statistics
        current_user.increment_usage(file_size)

        # Create document knowledge base
        kb = VexelDocumentKnowledgeBase(
            documents=documents,
            vector_db=knowledge_manager.vector_db
        )

        # Load knowledge base (this will store vectors)
        kb.load(recreate=False)  # Don't recreate, just add to existing

        return FileUploadResponse(
            message=f"File '{file.filename}' uploaded successfully with {processing_metadata['chunking_strategy']} chunking",
            filename=file.filename,
            file_type=file_type,
            collection_name=collection_name,
            collection_id=collection_id,
            documents_processed=len(documents),
            file_size_bytes=file_size,
            upload_timestamp=datetime.utcnow().isoformat(),
            metadata={
                "file_id": file_id,
                "user_id": str(current_user.id),
                "title": title,
                "description": description,
                "category": category,
                "tags": tags.split(",") if tags else [],
                "processing": processing_metadata,
                "user_tier": str(user_tier)
            },
            status="success"
        )

    except HTTPException:
        # Re-raise HTTPException as-is (don't wrap in 500 error)
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"ERROR: Failed to upload file: {str(e)}")
        logger.error(f"ERROR: Traceback: {error_details}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file: {str(e)}\n\nTraceback: {error_details}"
        )


@router.get("/search")
async def search_knowledge(
    query: str,
    limit: int = 10,
    offset: int = 0,
    collection_id: Optional[str] = None,  # Optional collection_id for specific collection search
    current_user: User = Depends(get_current_user)
):
    """
    Search knowledge base
    """
    try:
        if collection_id:
            # Search in specific collection
            from motor.motor_asyncio import AsyncIOMotorClient
            from bson import ObjectId
            import os

            # Validate collection ownership
            mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
            client = AsyncIOMotorClient(mongodb_url)
            db = client.vexel

            collection = await db.knowledge_bases.find_one({
                "_id": ObjectId(collection_id),
                "user_id": ObjectId(current_user.id)
            })

            if not collection:
                raise HTTPException(
                    status_code=404,
                    detail=f"Collection not found or you don't have access to it."
                )

            # Use specific collection
            qdrant_collection_name = collection.get("qdrant_collection")
            knowledge_manager = VexelKnowledgeManager(
                collection_name=qdrant_collection_name
            )
        else:
            # Search across all user collections (default user collection)
            knowledge_manager = VexelKnowledgeManager(
                user_id=str(current_user.id)
            )

        # Create knowledge base for search
        kb = knowledge_manager.create_unified_knowledge_base()

        # Perform search
        results = kb.search(query=query, num_documents=limit)

        # Format results
        formatted_results = []
        for result in results:
            formatted_results.append({
                "content": result.content,
                "metadata": result.meta_data,
                "score": getattr(result, 'score', 0.0)
            })

        return {
            "query": query,
            "results": formatted_results,
            "total": len(formatted_results),
            "limit": limit,
            "offset": offset,
            "collection_id": collection_id,  # Include collection_id in response
            "search_scope": "specific_collection" if collection_id else "user_default",
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Knowledge search failed: {str(e)}"
        )


@router.get("/analytics")
async def get_knowledge_analytics(current_user: User = Depends(get_current_user)):
    """
    Get knowledge analytics
    """
    try:
        knowledge_manager = VexelKnowledgeManager(
            user_id=str(current_user.id)
        )

        collections_info = knowledge_manager.get_collections_info()

        # Calculate analytics
        total_collections = len(collections_info)
        total_vectors = sum(col.get('vectors_count', 0) for col in collections_info)

        return {
            "total_collections": total_collections,
            "total_vectors": total_vectors,
            "collections": collections_info,
            "user_id": str(current_user.id),
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch analytics: {str(e)}"
        )


# New Pydantic models for enhanced features
class ContentAnalysisResponse(BaseModel):
    file_type: str
    content_length: int
    complexity: str
    structure: str
    recommended_strategy: str
    recommended_chunk_size: int
    recommended_overlap: int
    confidence_score: float
    analysis_details: Dict[str, Any]
    performance_estimate: Dict[str, Any]
    available_strategies: List[str]
    user_tier: str


class ChunkingRecommendationResponse(BaseModel):
    file_type: str
    recommended_strategy: str
    default_chunk_size: int
    default_overlap: int
    rationale: str
    available_strategies: List[str]
    premium_strategy: Optional[str]
    user_tier: str


@router.post("/analyze-content")
async def analyze_content(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
) -> ContentAnalysisResponse:
    """
    Analyze file content and provide chunking strategy recommendations
    """
    try:
        # Read file content
        file_content = await file.read()
        file_type = file.content_type or "application/octet-stream"

        # Get user tier
        user_tier = getattr(current_user, 'tier', UserTier.FREE)

        # Perform content analysis
        from app.agents.enhanced_file_processing import analyze_file_content
        from app.agents.chunking_factory import VexelChunkingFactory

        analysis_result = analyze_file_content(file_content, file.filename, file_type)

        # Get available strategies for user tier
        factory = VexelChunkingFactory()
        available_strategies = [str(s) for s in factory.get_available_strategies(user_tier)]

        return ContentAnalysisResponse(
            file_type=analysis_result.file_type,
            content_length=analysis_result.content_length,
            complexity=analysis_result.complexity,
            structure=analysis_result.structure,
            recommended_strategy=analysis_result.recommended_strategy,
            recommended_chunk_size=analysis_result.recommended_chunk_size,
            recommended_overlap=analysis_result.recommended_overlap,
            confidence_score=analysis_result.confidence_score,
            analysis_details=analysis_result.analysis_details,
            performance_estimate=analysis_result.performance_estimate,
            available_strategies=available_strategies,
            user_tier=str(user_tier)
        )

    except Exception as e:
        logger.error(f"Content analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Content analysis failed: {str(e)}"
        )


@router.get("/chunking-recommendations/{file_type}")
async def get_chunking_recommendations(
    file_type: str,
    current_user: User = Depends(get_current_user)
) -> ChunkingRecommendationResponse:
    """
    Get chunking strategy recommendations for a specific file type
    """
    try:
        # Get user tier
        user_tier = getattr(current_user, 'tier', UserTier.FREE)

        # Get recommendations
        from app.agents.enhanced_file_processing import get_chunking_recommendations

        recommendations = get_chunking_recommendations(file_type, user_tier)

        return ChunkingRecommendationResponse(
            file_type=recommendations["file_type"],
            recommended_strategy=recommendations["recommended_strategy"],
            default_chunk_size=recommendations["default_chunk_size"],
            default_overlap=recommendations["default_overlap"],
            rationale=recommendations["rationale"],
            available_strategies=[str(s) for s in recommendations["available_strategies"]],
            premium_strategy=recommendations.get("premium_strategy"),
            user_tier=str(user_tier)
        )

    except Exception as e:
        logger.error(f"Failed to get chunking recommendations: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get chunking recommendations: {str(e)}"
        )


@router.get("/performance-dashboard")
async def get_performance_dashboard(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get performance dashboard with chunking metrics and insights
    (Available for Premium and Enterprise users)
    """
    try:
        # Check if user has access to analytics
        user_tier = getattr(current_user, 'tier', UserTier.FREE)
        if user_tier == UserTier.FREE:
            raise HTTPException(
                status_code=403,
                detail="Performance dashboard is available for Premium and Enterprise users only"
            )

        # Get performance dashboard data
        from app.services.performance_monitor import get_performance_dashboard

        dashboard_data = get_performance_dashboard()
        dashboard_data["user_tier"] = str(user_tier)
        dashboard_data["access_level"] = "full" if user_tier == UserTier.ENTERPRISE else "limited"

        return dashboard_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get performance dashboard: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get performance dashboard: {str(e)}"
        )


# Admin endpoints (require superuser access)
@router.get("/admin/dashboard")
async def get_admin_dashboard(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get admin dashboard with system overview and user management data
    (Requires superuser access)
    """
    try:
        # Check if user is superuser
        if not getattr(current_user, 'is_superuser', False):
            raise HTTPException(
                status_code=403,
                detail="Admin access required"
            )

        # Get admin dashboard data
        from app.services.admin_service import get_admin_dashboard

        dashboard_data = get_admin_dashboard()
        dashboard_data["admin_user"] = str(current_user.id)

        return dashboard_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get admin dashboard: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get admin dashboard: {str(e)}"
        )


class UserTierUpdateRequest(BaseModel):
    user_id: str
    new_tier: str
    reason: Optional[str] = ""


@router.post("/admin/users/tier")
async def update_user_tier(
    request: UserTierUpdateRequest,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Update user tier (admin only)
    """
    try:
        # Check if user is superuser
        if not getattr(current_user, 'is_superuser', False):
            raise HTTPException(
                status_code=403,
                detail="Admin access required"
            )

        # Validate tier
        try:
            new_tier = UserTier(request.new_tier)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid tier: {request.new_tier}. Valid tiers: {[t.value for t in UserTier]}"
            )

        # Update user tier
        from app.services.admin_service import admin_service

        result = admin_service.upgrade_user_tier(
            user_id=request.user_id,
            new_tier=new_tier,
            admin_id=str(current_user.id),
            reason=request.reason
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update user tier: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update user tier: {str(e)}"
        )


@router.get("/admin/system/health")
async def get_system_health(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get system health metrics (admin only)
    """
    try:
        # Check if user is superuser
        if not getattr(current_user, 'is_superuser', False):
            raise HTTPException(
                status_code=403,
                detail="Admin access required"
            )

        # Get system health
        from app.services.admin_service import admin_service

        health_data = admin_service.get_system_health()

        return health_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get system health: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get system health: {str(e)}"
        )


