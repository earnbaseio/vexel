"""
Gemini Embedder for Agno Framework
Custom implementation to use Google Gemini embeddings with Agno agents
"""

import os
from typing import List, Optional, Dict, Any
import google.generativeai as genai
from agno.embedder.base import Embedder


class GeminiEmbedder(Embedder):
    """
    Gemini Embedder for Agno Framework
    Uses Google Gemini API for text embeddings
    """
    
    def __init__(
        self,
        id: str = "gemini-embedding-exp-03-07",
        api_key: Optional[str] = None,
        task_type: str = "SEMANTIC_SIMILARITY",
        dimensions: Optional[int] = 768,  # Default Gemini embedding dimensions
        **kwargs
    ):
        super().__init__(dimensions=dimensions)

        # Store model info
        self.id = id
        
        # Configure Gemini API
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is required")
            
        genai.configure(api_key=self.api_key)
        
        # Set model and task type
        self.model_id = id
        self.task_type = task_type
        
        # Available task types for Gemini embeddings
        self.valid_task_types = [
            "SEMANTIC_SIMILARITY",
            "CLASSIFICATION", 
            "CLUSTERING",
            "RETRIEVAL_DOCUMENT",
            "RETRIEVAL_QUERY",
            "QUESTION_ANSWERING",
            "FACT_VERIFICATION",
            "CODE_RETRIEVAL_QUERY"
        ]
        
        if task_type not in self.valid_task_types:
            raise ValueError(f"Invalid task_type. Must be one of: {self.valid_task_types}")
    
    def get_embedding(self, text: str) -> List[float]:
        """
        Get embedding for a single text
        """
        try:
            # Use the new Google GenAI client
            result = genai.embed_content(
                model=self.model_id,
                content=text,
                task_type=self.task_type
            )
            
            return result['embedding']
            
        except Exception as e:
            raise Exception(f"Failed to get Gemini embedding: {str(e)}")
    
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Get embeddings for multiple texts
        Note: Gemini embedding API processes one text at a time
        """
        embeddings = []
        
        for text in texts:
            try:
                embedding = self.get_embedding(text)
                embeddings.append(embedding)
            except Exception as e:
                print(f"Warning: Failed to get embedding for text: {str(e)}")
                # Return zero vector as fallback
                embeddings.append([0.0] * (self.dimensions or 768))
        
        return embeddings
    
    def embed_documents(self, documents: List[str]) -> List[List[float]]:
        """
        Embed documents (optimized for document retrieval)
        """
        # Use RETRIEVAL_DOCUMENT task type for documents
        original_task_type = self.task_type
        self.task_type = "RETRIEVAL_DOCUMENT"
        
        try:
            embeddings = self.get_embeddings(documents)
        finally:
            # Restore original task type
            self.task_type = original_task_type
        
        return embeddings
    
    def embed_query(self, query: str) -> List[float]:
        """
        Embed query (optimized for query retrieval)
        """
        # Use RETRIEVAL_QUERY task type for queries
        original_task_type = self.task_type
        self.task_type = "RETRIEVAL_QUERY"
        
        try:
            embedding = self.get_embedding(query)
        finally:
            # Restore original task type
            self.task_type = original_task_type
        
        return embedding

    def get_embedding_and_usage(self, text: str) -> tuple[List[float], Dict[str, Any]]:
        """
        Get embedding and usage information for a single text
        Required by Agno framework
        """
        try:
            embedding = self.get_embedding(text)

            # Mock usage data since Gemini doesn't provide detailed usage
            usage = {
                "input_tokens": len(text.split()),  # Rough estimate
                "total_tokens": len(text.split()),
                "model": self.model_id
            }

            return embedding, usage

        except Exception as e:
            raise Exception(f"Failed to get Gemini embedding and usage: {str(e)}")

    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the embedding model
        """
        return {
            "model_id": self.model_id,
            "provider": "Google Gemini",
            "task_type": self.task_type,
            "dimensions": self.dimensions,
            "api_configured": bool(self.api_key),
            "supported_task_types": self.valid_task_types
        }


# Factory function for easy creation
def create_gemini_embedder(
    model_id: str = "gemini-embedding-exp-03-07",
    task_type: str = "SEMANTIC_SIMILARITY",
    api_key: Optional[str] = None,
    **kwargs
) -> GeminiEmbedder:
    """
    Factory function to create Gemini embedder instances
    """
    return GeminiEmbedder(
        id=model_id,
        task_type=task_type,
        api_key=api_key,
        **kwargs
    )


# Test function
def test_gemini_embedder():
    """
    Test Gemini embedder functionality
    """
    try:
        embedder = create_gemini_embedder()
        
        # Test single embedding
        test_text = "Hello, this is a test for Gemini embeddings."
        embedding = embedder.get_embedding(test_text)
        
        # Test multiple embeddings
        test_texts = [
            "Vexel is an AI Agent platform.",
            "It uses Qdrant for vector storage.",
            "Gemini provides powerful embeddings."
        ]
        embeddings = embedder.get_embeddings(test_texts)
        
        return {
            "status": "success",
            "model_info": embedder.get_model_info(),
            "single_embedding_length": len(embedding),
            "multiple_embeddings_count": len(embeddings),
            "sample_embedding": embedding[:5]  # First 5 dimensions
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


if __name__ == "__main__":
    # Test the embedder
    result = test_gemini_embedder()
    import json
    print(json.dumps(result, indent=2))
