"""
Agent Enums
"""

from enum import Enum


class AgentStatus(str, Enum):
    """Agent status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"
    ERROR = "error"


class AgentType(str, Enum):
    """Agent types"""
    ASSISTANT = "assistant"
    RESEARCHER = "researcher"
    ANALYST = "analyst"
    SPECIALIST = "specialist"
    COORDINATOR = "coordinator"
    WORKFLOW = "workflow"
