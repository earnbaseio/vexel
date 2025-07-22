from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from datetime import datetime
import uuid

from app.api.deps import get_current_user
from app.models.user import User
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
    Get information about Qdrant collections
    """
    try:
        knowledge_manager = VexelKnowledgeManager()
        collections_info = knowledge_manager.get_collections_info()

        return {
            "message": "Knowledge collections retrieved",
            "qdrant_url": "http://localhost:6333",
            "collections": collections_info,
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
    current_user: User = Depends(get_current_user)
) -> FileUploadResponse:
    """
    Upload a file to knowledge base
    """
    try:
        # Generate unique file ID
        file_id = str(uuid.uuid4())

        # Read file content
        file_content = await file.read()
        file_size = len(file_content)

        # Determine file type
        file_type = file.content_type or "application/octet-stream"

        # Process file based on type
        from app.agents.file_processing import process_uploaded_file
        documents = process_uploaded_file(file_content, file.filename, file_type)

        # Create unified collection name
        collection_name = "vexel_knowledge_base"

        # Create knowledge manager with unified collection
        knowledge_manager = VexelKnowledgeManager(
            collection_name=collection_name,
            user_id=str(current_user.id),
            unified_collection=True
        )

        # Create knowledge base from documents with enhanced metadata
        from agno.knowledge.document import DocumentKnowledgeBase

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

        # Create document knowledge base
        kb = DocumentKnowledgeBase(
            documents=documents,
            vector_db=knowledge_manager.vector_db
        )

        # Load knowledge base (this will store vectors)
        kb.load(recreate=False)  # Don't recreate, just add to existing

        return FileUploadResponse(
            message=f"File '{file.filename}' uploaded successfully",
            filename=file.filename,
            file_type=file_type,
            collection_name=collection_name,
            documents_processed=len(documents),
            file_size_bytes=file_size,
            upload_timestamp=datetime.utcnow().isoformat(),
            metadata={
                "file_id": file_id,
                "user_id": str(current_user.id),
                "title": title,
                "description": description,
                "category": category,
                "tags": tags.split(",") if tags else []
            },
            status="success"
        )

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
    collection: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Search knowledge base
    """
    try:
        knowledge_manager = VexelKnowledgeManager(
            user_id=str(current_user.id),
            unified_collection=True
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
            user_id=str(current_user.id),
            unified_collection=True
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



