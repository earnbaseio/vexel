from __future__ import annotations
from typing import TYPE_CHECKING, Any, Optional
from datetime import datetime
from enum import Enum
from pydantic import EmailStr
from odmantic import ObjectId, Field

from app.db.base_class import Base

if TYPE_CHECKING:
    from . import Token  # noqa: F401


def datetime_now_sec():
    return datetime.now().replace(microsecond=0)


class UserTier(str, Enum):
    """User subscription tier enumeration"""
    FREE = "free"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


class User(Base):
    created: datetime = Field(default_factory=datetime_now_sec)
    modified: datetime = Field(default_factory=datetime_now_sec)
    full_name: str = Field(default="")
    email: EmailStr
    hashed_password: Any = Field(default=None)
    totp_secret: Any = Field(default=None)
    totp_counter: Optional[int] = Field(default=None)
    email_validated: bool = Field(default=False)
    is_active: bool = Field(default=False)
    is_superuser: bool = Field(default=False)
    refresh_tokens: list[ObjectId] = Field(default_factory=list)

    # User tier and feature access
    tier: UserTier = Field(default=UserTier.FREE, description="User subscription tier")
    tier_updated_at: datetime = Field(default_factory=datetime_now_sec, description="When tier was last updated")

    # Usage tracking for tier limits
    monthly_uploads: int = Field(default=0, description="Number of uploads this month")
    monthly_reset_date: datetime = Field(default_factory=datetime_now_sec, description="When monthly counters reset")
    total_storage_bytes: int = Field(default=0, description="Total storage used in bytes")

    # Feature flags
    advanced_chunking_enabled: bool = Field(default=False, description="Access to premium chunking strategies")
    parallel_processing_enabled: bool = Field(default=False, description="Access to parallel document processing")
    analytics_enabled: bool = Field(default=False, description="Access to processing analytics")

    def get_tier_limits(self) -> dict:
        """Get limits based on user tier"""
        tier_limits = {
            UserTier.FREE: {
                "max_monthly_uploads": 50,
                "max_file_size_mb": 10,
                "max_storage_gb": 1,
                "chunking_strategies": ["auto", "fixed", "recursive", "document"],
                "parallel_processing": False,
                "analytics": False
            },
            UserTier.PREMIUM: {
                "max_monthly_uploads": 500,
                "max_file_size_mb": 50,
                "max_storage_gb": 10,
                "chunking_strategies": ["auto", "fixed", "recursive", "document", "semantic", "markdown"],
                "parallel_processing": True,
                "analytics": True
            },
            UserTier.ENTERPRISE: {
                "max_monthly_uploads": -1,  # Unlimited
                "max_file_size_mb": 100,
                "max_storage_gb": 100,
                "chunking_strategies": ["auto", "fixed", "recursive", "document", "semantic", "agentic", "markdown"],
                "parallel_processing": True,
                "analytics": True
            }
        }
        return tier_limits.get(self.tier, tier_limits[UserTier.FREE])

    def can_upload(self, file_size_bytes: int) -> tuple[bool, str]:
        """Check if user can upload a file of given size"""
        limits = self.get_tier_limits()

        # Check monthly upload limit
        if limits["max_monthly_uploads"] != -1 and self.monthly_uploads >= limits["max_monthly_uploads"]:
            return False, f"Monthly upload limit of {limits['max_monthly_uploads']} reached"

        # Check file size limit
        max_file_size_bytes = limits["max_file_size_mb"] * 1024 * 1024
        if file_size_bytes > max_file_size_bytes:
            return False, f"File size exceeds limit of {limits['max_file_size_mb']}MB"

        # Check storage limit
        max_storage_bytes = limits["max_storage_gb"] * 1024 * 1024 * 1024
        if self.total_storage_bytes + file_size_bytes > max_storage_bytes:
            return False, f"Storage limit of {limits['max_storage_gb']}GB would be exceeded"

        return True, "Upload allowed"

    def can_use_chunking_strategy(self, strategy: str) -> bool:
        """Check if user can use a specific chunking strategy"""
        limits = self.get_tier_limits()
        return strategy in limits["chunking_strategies"]

    def increment_usage(self, file_size_bytes: int):
        """Increment usage counters"""
        self.monthly_uploads += 1
        self.total_storage_bytes += file_size_bytes
        self.modified = datetime_now_sec()
