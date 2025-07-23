"""
Fixed DocumentKnowledgeBase that preserves metadata correctly
"""
from typing import List, Optional, Dict, Any
from agno.knowledge.document import DocumentKnowledgeBase
from agno.document import Document
from agno.vectordb.base import VectorDb


class VexelDocumentKnowledgeBase(DocumentKnowledgeBase):
    """
    Fixed DocumentKnowledgeBase that properly preserves metadata when loading to vector database
    """

    def __init__(
        self,
        documents: List[Document],
        vector_db: VectorDb,
        filters: Optional[Dict[str, Any]] = None,
        **kwargs
    ):
        super().__init__(documents=documents, vector_db=vector_db, **kwargs)
        # Store filters as private attribute to avoid Pydantic validation
        self._filters = filters or {}
    
    def load(self, recreate: bool = False, upsert: bool = True) -> None:
        """
        Load documents into vector database with proper metadata preservation
        """
        if not self.vector_db:
            raise ValueError("Vector database not configured")
            
        if not self.documents:
            print("⚠️ No documents to load")
            return
            
        print(f"📊 Loading {len(self.documents)} documents into vector database...")
        
        # Prepare documents for vector storage
        documents_to_store = []
        for i, doc in enumerate(self.documents):
            # Ensure metadata is preserved
            if not hasattr(doc, 'meta_data') or doc.meta_data is None:
                doc.meta_data = {}

            # Create a new document with flattened metadata
            from agno.document import Document

            # Flatten metadata to top level for Qdrant
            flattened_metadata = doc.meta_data.copy()
            flattened_metadata['content'] = doc.content

            # Create new document with flattened metadata as top-level fields
            new_doc = Document(
                content=doc.content,
                meta_data=flattened_metadata
            )

            print(f"   📝 Document {i+1} flattened metadata: {flattened_metadata}")
            documents_to_store.append(new_doc)
        
        # Store in vector database
        try:
            if recreate:
                # Clear existing data
                self.vector_db.clear()
                
            # Insert documents with metadata
            self.vector_db.insert(documents_to_store)
            print(f"✅ Successfully loaded {len(documents_to_store)} documents")
            
        except Exception as e:
            print(f"❌ Error loading documents: {e}")
            raise
    
    def search(
        self,
        query: str,
        limit: int = 5,
        num_documents: Optional[int] = None,  # Support for KnowledgeTools compatibility
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        """
        Search with proper filtering
        """
        print(f"🔍 DEBUG: search() called with query='{query}', limit={limit}, num_documents={num_documents}")

        if not self.vector_db:
            raise ValueError("Vector database not configured")

        # Use num_documents if provided (for KnowledgeTools compatibility)
        actual_limit = num_documents if num_documents is not None else limit
        print(f"🔍 DEBUG: Using actual_limit={actual_limit}")

        # Combine instance filters with search filters
        combined_filters = self._filters.copy()
        if filters:
            combined_filters.update(filters)

        print(f"🔍 DEBUG: Searching with filters: {combined_filters}")

        # Perform search
        results = self.vector_db.search(
            query=query,
            limit=actual_limit,
            filters=combined_filters if combined_filters else None
        )
        
        print(f"📊 Found {len(results)} results")
        return results
