"""
Vexel Workflow Models
ODMantic models for storing workflow configurations, executions, and results
"""

from __future__ import annotations
from typing import TYPE_CHECKING, Any, Optional, List, Dict, Literal
from datetime import datetime
from enum import Enum
from pydantic import validator
from odmantic import ObjectId, Field

from app.db.base_class import Base

if TYPE_CHECKING:
    from .user import User
    from .agent import AgentConfiguration


def datetime_now_sec():
    return datetime.now().replace(microsecond=0)


class WorkflowStatus(str, Enum):
    """Workflow execution status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class StepType(str, Enum):
    """Workflow step types"""
    AGENT = "agent"
    TEAM = "team"
    CONDITION = "condition"
    EXTERNAL = "external"
    PARALLEL = "parallel"
    DELAY = "delay"
    NOTIFICATION = "notification"


class WorkflowStepConfig(Base):
    """Configuration for individual workflow steps"""
    step_id: str = Field(...)
    name: str = Field(...)
    step_type: StepType = Field(...)
    
    # Step Configuration
    config: Dict[str, Any] = Field(default_factory=dict)
    conditions: List[Dict[str, Any]] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)
    error_handling: Dict[str, Any] = Field(default_factory=dict)
    
    # Step Metadata
    description: str = Field(default="")
    timeout_seconds: int = Field(default=300)  # 5 minutes default
    retry_count: int = Field(default=0)
    
    # Timestamps
    created: datetime = Field(default_factory=datetime_now_sec)
    updated: datetime = Field(default_factory=datetime_now_sec)


class WorkflowTemplate(Base):
    """
    Reusable workflow templates
    """
    # Template Identity
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(default="")
    category: str = Field(default="general")
    version: str = Field(default="1.0.0")
    
    # Workflow Configuration
    steps: List[WorkflowStepConfig] = Field(default_factory=list)
    global_config: Dict[str, Any] = Field(default_factory=dict)
    input_schema: Dict[str, Any] = Field(default_factory=dict)
    output_schema: Dict[str, Any] = Field(default_factory=dict)
    
    # Template Metadata
    tags: List[str] = Field(default_factory=list)
    estimated_duration: int = Field(default=0)  # in seconds
    complexity_level: Literal["simple", "medium", "complex"] = Field(default="medium")
    
    # Access Control
    user_id: ObjectId = Field(...)  # Template creator
    is_public: bool = Field(default=False)
    shared_with: List[ObjectId] = Field(default_factory=list)
    
    # Usage Statistics
    usage_count: int = Field(default=0)
    success_rate: float = Field(default=0.0)
    average_duration: float = Field(default=0.0)
    average_rating: float = Field(default=0.0)
    
    # Timestamps
    created: datetime = Field(default_factory=datetime_now_sec)
    updated: datetime = Field(default_factory=datetime_now_sec)
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Workflow name cannot be empty')
        return v.strip()
    

class WorkflowExecution(Base):
    """
    Individual workflow execution instance
    """
    # Execution Identity
    execution_id: str = Field(...)  # Unique execution identifier
    workflow_template_id: Optional[ObjectId] = Field(default=None)  # Reference to template
    workflow_name: str = Field(...)
    
    # Execution Context
    user_id: ObjectId = Field(...)
    session_id: str = Field(...)
    input_parameters: Dict[str, Any] = Field(default_factory=dict)
    
    # Execution Configuration
    steps: List[WorkflowStepConfig] = Field(default_factory=list)
    global_config: Dict[str, Any] = Field(default_factory=dict)
    
    # Execution State
    status: WorkflowStatus = Field(default=WorkflowStatus.PENDING)
    current_step_index: int = Field(default=0)
    current_step_id: Optional[str] = Field(default=None)
    
    # Execution Results
    step_results: Dict[str, Any] = Field(default_factory=dict)  # step_id: result
    final_result: Optional[Any] = Field(default=None)
    error_details: Optional[Dict[str, Any]] = Field(default=None)
    
    # Performance Metrics
    total_duration: float = Field(default=0.0)  # in seconds
    steps_completed: int = Field(default=0)
    steps_failed: int = Field(default=0)
    total_cost: float = Field(default=0.0)  # in USD
    
    # Timestamps
    created: datetime = Field(default_factory=datetime_now_sec)
    started_at: Optional[datetime] = Field(default=None)
    completed_at: Optional[datetime] = Field(default=None)
    last_activity: datetime = Field(default_factory=datetime_now_sec)
    

class WorkflowStepExecution(Base):
    """
    Individual step execution within a workflow
    """
    # Step Identity
    execution_id: ObjectId = Field(...)  # Reference to WorkflowExecution
    step_id: str = Field(...)
    step_name: str = Field(...)
    step_type: StepType = Field(...)
    
    # Step Configuration
    step_config: Dict[str, Any] = Field(default_factory=dict)
    input_data: Dict[str, Any] = Field(default_factory=dict)
    
    # Step Execution State
    status: WorkflowStatus = Field(default=WorkflowStatus.PENDING)
    retry_count: int = Field(default=0)
    max_retries: int = Field(default=3)
    
    # Step Results
    output_data: Optional[Any] = Field(default=None)
    error_details: Optional[Dict[str, Any]] = Field(default=None)
    logs: List[str] = Field(default_factory=list)
    
    # Performance Metrics
    execution_time: float = Field(default=0.0)  # in seconds
    tokens_used: int = Field(default=0)
    cost: float = Field(default=0.0)  # in USD
    
    # Agent/Team Information (if applicable)
    agent_id: Optional[ObjectId] = Field(default=None)
    team_id: Optional[str] = Field(default=None)
    
    # Timestamps
    created: datetime = Field(default_factory=datetime_now_sec)
    started_at: Optional[datetime] = Field(default=None)
    completed_at: Optional[datetime] = Field(default=None)
    
class WorkflowSchedule(Base):
    """
    Scheduled workflow executions
    """
    # Schedule Identity
    schedule_name: str = Field(...)
    workflow_template_id: ObjectId = Field(...)
    user_id: ObjectId = Field(...)
    
    # Schedule Configuration
    cron_expression: str = Field(...)  # Cron format for scheduling
    timezone: str = Field(default="UTC")
    input_parameters: Dict[str, Any] = Field(default_factory=dict)
    
    # Schedule State
    is_active: bool = Field(default=True)
    last_execution: Optional[datetime] = Field(default=None)
    next_execution: Optional[datetime] = Field(default=None)
    execution_count: int = Field(default=0)
    
    # Schedule Metadata
    description: str = Field(default="")
    max_executions: Optional[int] = Field(default=None)  # Limit total executions
    
    # Timestamps
    created: datetime = Field(default_factory=datetime_now_sec)
    updated: datetime = Field(default_factory=datetime_now_sec)
    
class WorkflowAnalytics(Base):
    """
    Workflow performance analytics and metrics
    """
    # Analytics Identity
    workflow_template_id: Optional[ObjectId] = Field(default=None)
    user_id: ObjectId = Field(...)
    date: datetime = Field(default_factory=lambda: datetime.now().replace(hour=0, minute=0, second=0, microsecond=0))
    
    # Execution Metrics
    total_executions: int = Field(default=0)
    successful_executions: int = Field(default=0)
    failed_executions: int = Field(default=0)
    cancelled_executions: int = Field(default=0)
    
    # Performance Metrics
    average_duration: float = Field(default=0.0)
    min_duration: float = Field(default=0.0)
    max_duration: float = Field(default=0.0)
    total_cost: float = Field(default=0.0)
    
    # Step Analytics
    step_success_rates: Dict[str, float] = Field(default_factory=dict)  # step_id: success_rate
    step_average_durations: Dict[str, float] = Field(default_factory=dict)  # step_id: avg_duration
    most_failed_steps: List[str] = Field(default_factory=list)
    
    # Usage Patterns
    peak_execution_hours: List[int] = Field(default_factory=list)  # Hours of day (0-23)
    common_input_patterns: Dict[str, int] = Field(default_factory=dict)
    
    # Timestamps
    created: datetime = Field(default_factory=datetime_now_sec)
    

