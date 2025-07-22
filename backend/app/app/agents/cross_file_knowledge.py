"""
Cross-File Knowledge Search Implementation
Provides unified knowledge search across multiple user documents using Agno framework's CombinedKnowledgeBase
"""

from typing import List, Optional, Dict, Any
from agno.knowledge.combined import CombinedKnowledgeBase
from agno.knowledge.document import DocumentKnowledgeBase
from agno.vectordb.qdrant import Qdrant
from app.agents.gemini_embedder import GeminiEmbedder
from agno.document import Document

from app.core.config import settings
from app.agents.knowledge import VexelKnowledgeManager


class VexelCrossFileKnowledge:
    """
    Enhanced knowledge management for cross-file search capabilities
    Leverages Agno framework's CombinedKnowledgeBase for multi-source knowledge management
    """
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.unified_collection_name = "vexel_knowledge_base"
        self.shared_collection_name = "vexel_shared_knowledge"
        
        # Initialize unified vector database
        self.unified_vector_db = Qdrant(
            collection=self.unified_collection_name,
            url=settings.QDRANT_URL,
            embedder=GeminiEmbedder(id="text-embedding-004")
        )

        # Initialize shared vector database
        self.shared_vector_db = Qdrant(
            collection=self.shared_collection_name,
            url=settings.QDRANT_URL,
            embedder=GeminiEmbedder(id="text-embedding-004")
        )
    
    def create_user_knowledge_base(self, file_ids: Optional[List[str]] = None) -> DocumentKnowledgeBase:
        """
        Create knowledge base for user's personal documents
        
        Args:
            file_ids: Optional list of specific file IDs to include. If None, includes all user files.
            
        Returns:
            DocumentKnowledgeBase configured for user's documents
        """
        # Build filters for user documents
        filters = {"user_id": self.user_id}
        if file_ids:
            filters["file_id"] = {"$in": file_ids}
        
        return DocumentKnowledgeBase(
            documents=[],  # Empty - will search existing vectors in collection
            vector_db=self.unified_vector_db,
            filters=filters
        )
    
    def create_shared_knowledge_base(self) -> DocumentKnowledgeBase:
        """
        Create knowledge base for shared/public documents
        
        Returns:
            DocumentKnowledgeBase configured for shared documents
        """
        return DocumentKnowledgeBase(
            documents=[],
            vector_db=self.shared_vector_db
        )
    
    def create_combined_knowledge_base(self, 
                                     include_user_files: bool = True,
                                     include_shared_knowledge: bool = False,
                                     specific_file_ids: Optional[List[str]] = None) -> CombinedKnowledgeBase:
        """
        Create combined knowledge base from multiple sources
        
        Args:
            include_user_files: Whether to include user's personal documents
            include_shared_knowledge: Whether to include shared/public documents
            specific_file_ids: Optional list of specific file IDs to include from user files
            
        Returns:
            CombinedKnowledgeBase with configured sources
        """
        sources = []
        
        # Add user's personal documents
        if include_user_files:
            user_kb = self.create_user_knowledge_base(file_ids=specific_file_ids)
            sources.append(user_kb)
        
        # Add shared knowledge base
        if include_shared_knowledge:
            shared_kb = self.create_shared_knowledge_base()
            sources.append(shared_kb)
        
        if not sources:
            raise ValueError("At least one knowledge source must be included")
        
        return CombinedKnowledgeBase(sources=sources)
    
    def search_across_files(self, 
                           query: str, 
                           limit: int = 10,
                           include_shared: bool = False,
                           specific_file_ids: Optional[List[str]] = None) -> List[Document]:
        """
        Search across multiple files using combined knowledge base
        
        Args:
            query: Search query
            limit: Maximum number of results to return
            include_shared: Whether to include shared knowledge in search
            specific_file_ids: Optional list of specific file IDs to search within
            
        Returns:
            List of relevant documents from across multiple files
        """
        # Create combined knowledge base
        combined_kb = self.create_combined_knowledge_base(
            include_user_files=True,
            include_shared_knowledge=include_shared,
            specific_file_ids=specific_file_ids
        )
        
        # Perform search
        results = combined_kb.search(query=query, num_documents=limit)
        
        return results

    def get_user_collections_info(self) -> Dict[str, Any]:
        """
        Get information about user's available collections

        Returns:
            Dictionary with collections information
        """
        try:
            # Get all collections from Qdrant
            from qdrant_client import QdrantClient
            client = QdrantClient(url=self.qdrant_url)

            # Get all collections
            collections_response = client.get_collections()
            all_collections = [col.name for col in collections_response.collections]

            # Filter collections that contain user's data
            user_collections = []
            for collection_name in all_collections:
                try:
                    # Check if collection has user's data by searching with user_id filter
                    search_result = client.search(
                        collection_name=collection_name,
                        query_vector=[0.0] * 768,  # Dummy vector
                        query_filter={
                            "must": [{"key": "user_id", "match": {"value": self.user_id}}]
                        },
                        limit=1
                    )
                    if search_result:
                        user_collections.append(collection_name)
                except Exception:
                    # If search fails, skip this collection
                    continue

            return {
                "collections": user_collections,
                "total_collections": len(user_collections)
            }

        except Exception as e:
            print(f"Error getting user collections info: {str(e)}")
            return {"collections": [], "total_collections": 0}

    def get_collection_stats(self, collection_name: str) -> Dict[str, Any]:
        """
        Get statistics for a specific collection

        Args:
            collection_name: Name of the collection

        Returns:
            Dictionary with collection statistics
        """
        try:
            from qdrant_client import QdrantClient
            client = QdrantClient(url=self.qdrant_url)

            # Get collection info
            collection_info = client.get_collection(collection_name)

            # Count user's documents in this collection
            search_result = client.search(
                collection_name=collection_name,
                query_vector=[0.0] * 768,  # Dummy vector
                query_filter={
                    "must": [{"key": "user_id", "match": {"value": self.user_id}}]
                },
                limit=1000  # Get up to 1000 to count
            )

            return {
                "collection_name": collection_name,
                "total_points": collection_info.points_count,
                "document_count": len(search_result),
                "user_documents": len(search_result)
            }

        except Exception as e:
            print(f"Error getting collection stats for {collection_name}: {str(e)}")
            return {
                "collection_name": collection_name,
                "total_points": 0,
                "document_count": 0,
                "user_documents": 0
            }

    def search_with_file_grouping(self,
                                 query: str,
                                 limit: int = 10,
                                 include_shared: bool = False) -> Dict[str, Any]:
        """
        Search across files and group results by file
        
        Args:
            query: Search query
            limit: Maximum number of results to return
            include_shared: Whether to include shared knowledge in search
            
        Returns:
            Dictionary with results grouped by file
        """
        results = self.search_across_files(
            query=query, 
            limit=limit, 
            include_shared=include_shared
        )
        
        # Group results by file
        grouped_results = {}
        for doc in results:
            file_id = doc.meta_data.get("file_id", "unknown")
            filename = doc.meta_data.get("filename", "Unknown File")
            
            if file_id not in grouped_results:
                grouped_results[file_id] = {
                    "filename": filename,
                    "file_id": file_id,
                    "results": []
                }
            
            grouped_results[file_id]["results"].append({
                "content": doc.content,
                "chunk_id": doc.meta_data.get("chunk_id"),
                "relevance_score": getattr(doc, 'score', 0.0),
                "text_snippet": doc.meta_data.get("text_snippet", "")
            })
        
        return {
            "query": query,
            "total_results": len(results),
            "files_found": len(grouped_results),
            "results_by_file": grouped_results
        }
    
    def get_file_specific_knowledge_base(self, file_id: str) -> DocumentKnowledgeBase:
        """
        Create knowledge base for a specific file
        
        Args:
            file_id: ID of the specific file
            
        Returns:
            DocumentKnowledgeBase configured for the specific file
        """
        return self.create_user_knowledge_base(file_ids=[file_id])


class VexelKnowledgeMigration:
    """
    Handles migration from per-file collections to unified collection
    """
    
    def __init__(self):
        self.unified_collection_name = "vexel_knowledge_base"
        self.embedder = GeminiEmbedder(id="text-embedding-004")
    
    async def migrate_user_collections_to_unified(self, user_id: str, collection_names: List[str]):
        """
        Migrate user's per-file collections to unified collection
        
        Args:
            user_id: User ID
            collection_names: List of collection names to migrate
        """
        # Create unified collection if it doesn't exist
        unified_vector_db = Qdrant(
            collection=self.unified_collection_name,
            url=settings.QDRANT_URL,
            embedder=self.embedder
        )
        
        if not unified_vector_db.exists():
            unified_vector_db.create()
        
        for collection_name in collection_names:
            try:
                # Extract file info from collection name
                file_info = self._extract_file_info_from_collection_name(collection_name, user_id)
                
                # Migrate collection
                await self._migrate_single_collection(
                    source_collection=collection_name,
                    target_vector_db=unified_vector_db,
                    user_id=user_id,
                    file_info=file_info
                )
                
                print(f"✅ Migrated collection: {collection_name}")
                
            except Exception as e:
                print(f"❌ Failed to migrate collection {collection_name}: {e}")
    
    def _extract_file_info_from_collection_name(self, collection_name: str, user_id: str) -> Dict[str, str]:
        """Extract file information from collection name"""
        # Collection name format: uploaded_filename_userid
        if collection_name.startswith("uploaded_") and collection_name.endswith(user_id):
            filename_part = collection_name[9:-len(user_id)-1]  # Remove "uploaded_" and "_userid"
            return {
                "file_id": f"file_{filename_part}_{user_id}",
                "filename": filename_part,
                "file_type": self._guess_file_type(filename_part)
            }
        else:
            return {
                "file_id": f"file_unknown_{user_id}",
                "filename": "unknown",
                "file_type": "unknown"
            }
    
    def _guess_file_type(self, filename: str) -> str:
        """Guess file type from filename"""
        if "." in filename:
            extension = filename.split(".")[-1].lower()
            return extension
        return "unknown"
    
    async def _migrate_single_collection(self, 
                                       source_collection: str,
                                       target_vector_db: Qdrant,
                                       user_id: str,
                                       file_info: Dict[str, str]):
        """Migrate a single collection to unified collection"""
        # Create source vector db connection
        source_vector_db = Qdrant(
            collection=source_collection,
            url=settings.QDRANT_URL,
            embedder=self.embedder
        )
        
        if not source_vector_db.exists():
            print(f"⚠️ Source collection {source_collection} does not exist")
            return
        
        # Get all points from source collection
        try:
            scroll_result = source_vector_db.client.scroll(
                collection_name=source_collection,
                limit=10000,  # Adjust based on expected collection size
                with_payload=True,
                with_vectors=True
            )
            
            points = scroll_result[0]
            
            # Transform points for unified collection
            transformed_points = []
            for i, point in enumerate(points):
                # Update payload with user and file information
                enhanced_payload = point.payload.copy() if point.payload else {}
                enhanced_payload.update({
                    "user_id": user_id,
                    "file_id": file_info["file_id"],
                    "filename": file_info["filename"],
                    "file_type": file_info["file_type"],
                    "chunk_id": enhanced_payload.get("chunk_id", i),
                    "migrated_from": source_collection
                })
                
                # Create new point for unified collection
                from qdrant_client.models import PointStruct
                new_point = PointStruct(
                    id=f"{user_id}_{file_info['file_id']}_{i}",
                    vector=point.vector,
                    payload=enhanced_payload
                )
                transformed_points.append(new_point)
            
            # Insert into unified collection
            if transformed_points:
                target_vector_db.client.upsert(
                    collection_name=self.unified_collection_name,
                    points=transformed_points
                )
                
                print(f"✅ Migrated {len(transformed_points)} points from {source_collection}")
            else:
                print(f"⚠️ No points found in {source_collection}")
                
        except Exception as e:
            print(f"❌ Error migrating {source_collection}: {e}")
            raise


class VexelKnowledgeCache:
    """
    Caching layer for knowledge search results
    """
    
    def __init__(self, ttl: int = 300):  # 5 minutes default TTL
        self.cache = {}
        self.ttl = ttl
    
    def get_cache_key(self, query: str, user_id: str, file_ids: Optional[List[str]] = None) -> str:
        """Generate cache key for search query"""
        import hashlib
        
        key_components = [query, user_id]
        if file_ids:
            key_components.extend(sorted(file_ids))
        
        key_string = ":".join(key_components)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def get(self, cache_key: str) -> Optional[List[Document]]:
        """Get cached results if still valid"""
        import time
        
        if cache_key in self.cache:
            results, timestamp = self.cache[cache_key]
            if time.time() - timestamp < self.ttl:
                return results
            else:
                # Remove expired entry
                del self.cache[cache_key]
        
        return None
    
    def set(self, cache_key: str, results: List[Document]):
        """Cache search results"""
        import time
        self.cache[cache_key] = (results, time.time())
    
    def clear_user_cache(self, user_id: str):
        """Clear all cached results for a specific user"""
        keys_to_remove = []
        for key in self.cache.keys():
            if user_id in key:
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del self.cache[key]


# Global cache instance
knowledge_cache = VexelKnowledgeCache()
