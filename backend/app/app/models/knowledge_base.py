"""
Knowledge Base model for MongoDB
"""
from datetime import datetime
from typing import Optional, List
from beanie import Document
from pydantic import Field
from bson import ObjectId


class KnowledgeBase(Document):
    """Knowledge Base collection model"""
    
    name: str = Field(..., description="Knowledge base name")
    type: str = Field(..., description="Knowledge base type (text, url, pdf)")
    user_id: ObjectId = Field(..., description="Owner user ID")
    content: Optional[List[str]] = Field(None, description="Text content for text type")
    urls: Optional[List[str]] = Field(None, description="URLs for url/pdf types")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "knowledge_bases"
        indexes = [
            "user_id",
            "name",
            "type",
            "created_at"
        ]
    
    class Config:
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }
