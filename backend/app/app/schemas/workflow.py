"""
Pydantic schemas for Workflow models
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from app.models.workflow import WorkflowStatus, StepType
from app.schemas.base_schema import BaseSchema


# Base schemas
class WorkflowStepConfigSchema(BaseModel):
    """Schema for workflow step configuration"""
    step_id: str = Field(..., description="Unique step identifier")
    name: str = Field(..., description="Step name")
    step_type: StepType = Field(..., description="Step type")
    config: Dict[str, Any] = Field(default_factory=dict, description="Step configuration")
    conditions: List[Dict[str, Any]] = Field(default_factory=list, description="Step conditions")
    next_steps: List[str] = Field(default_factory=list, description="Next step IDs")
    error_handling: Dict[str, Any] = Field(default_factory=dict, description="Error handling config")
    description: str = Field("", description="Step description")
    timeout_seconds: int = Field(300, description="Step timeout in seconds")
    retry_count: int = Field(0, description="Number of retries")


# Workflow Template schemas
class WorkflowTemplateBase(BaseModel):
    """Base schema for workflow template"""
    name: str = Field(..., min_length=1, max_length=100, description="Template name")
    description: str = Field("", description="Template description")
    category: str = Field("general", description="Template category")
    version: str = Field("1.0.0", description="Template version")
    tags: List[str] = Field(default_factory=list, description="Template tags")
    estimated_duration: int = Field(0, description="Estimated duration in seconds")
    complexity_level: str = Field("medium", description="Complexity level: simple, medium, complex")


class WorkflowTemplateCreate(WorkflowTemplateBase):
    """Schema for creating workflow template"""
    steps: List[WorkflowStepConfigSchema] = Field(default_factory=list, description="Workflow steps")
    global_config: Dict[str, Any] = Field(default_factory=dict, description="Global configuration")
    input_schema: Dict[str, Any] = Field(default_factory=dict, description="Input schema")
    output_schema: Dict[str, Any] = Field(default_factory=dict, description="Output schema")
    is_public: bool = Field(False, description="Whether template is public")


class WorkflowTemplateUpdate(BaseModel):
    """Schema for updating workflow template"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    category: Optional[str] = None
    version: Optional[str] = None
    steps: Optional[List[WorkflowStepConfigSchema]] = None
    global_config: Optional[Dict[str, Any]] = None
    input_schema: Optional[Dict[str, Any]] = None
    output_schema: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    estimated_duration: Optional[int] = None
    complexity_level: Optional[str] = None
    is_public: Optional[bool] = None


class WorkflowTemplateResponse(WorkflowTemplateBase):
    """Schema for workflow template response"""
    id: str = Field(..., description="Template ID")
    user_id: str = Field(..., description="Creator user ID")
    
    # Configuration
    steps: List[WorkflowStepConfigSchema] = Field(default_factory=list, description="Workflow steps")
    global_config: Dict[str, Any] = Field(default_factory=dict, description="Global configuration")
    input_schema: Dict[str, Any] = Field(default_factory=dict, description="Input schema")
    output_schema: Dict[str, Any] = Field(default_factory=dict, description="Output schema")
    
    # Access control
    is_public: bool = Field(False, description="Whether template is public")
    shared_with: List[str] = Field(default_factory=list, description="Users with access")
    
    # Usage statistics
    usage_count: int = Field(0, description="Usage count")
    success_rate: float = Field(0.0, description="Success rate percentage")
    average_duration: float = Field(0.0, description="Average duration in seconds")
    average_rating: float = Field(0.0, description="Average rating")
    
    # Timestamps
    created: datetime = Field(..., description="Creation timestamp")
    updated: datetime = Field(..., description="Last update timestamp")
    
    model_config = ConfigDict(from_attributes=True)


# Workflow Execution schemas
class WorkflowExecutionBase(BaseModel):
    """Base schema for workflow execution"""
    workflow_name: str = Field(..., description="Workflow name")
    input_parameters: Dict[str, Any] = Field(default_factory=dict, description="Input parameters")


class WorkflowExecutionCreate(WorkflowExecutionBase):
    """Schema for creating workflow execution"""
    execution_id: str = Field(..., description="Unique execution identifier")
    workflow_template_id: Optional[str] = Field(None, description="Template ID")
    session_id: str = Field(..., description="Session ID")
    steps: List[WorkflowStepConfigSchema] = Field(default_factory=list, description="Execution steps")
    global_config: Dict[str, Any] = Field(default_factory=dict, description="Global configuration")


class WorkflowExecutionUpdate(BaseModel):
    """Schema for updating workflow execution"""
    status: Optional[WorkflowStatus] = None
    current_step_index: Optional[int] = None
    current_step_id: Optional[str] = None
    step_results: Optional[Dict[str, Any]] = None
    final_result: Optional[Any] = None
    error_details: Optional[Dict[str, Any]] = None
    steps_completed: Optional[int] = None
    steps_failed: Optional[int] = None
    total_cost: Optional[float] = None


class WorkflowExecutionResponse(WorkflowExecutionBase):
    """Schema for workflow execution response"""
    id: str = Field(..., description="Execution ID")
    execution_id: str = Field(..., description="Unique execution identifier")
    workflow_template_id: Optional[str] = Field(None, description="Template ID")
    user_id: str = Field(..., description="User ID")
    session_id: str = Field(..., description="Session ID")
    
    # Configuration
    steps: List[WorkflowStepConfigSchema] = Field(default_factory=list, description="Execution steps")
    global_config: Dict[str, Any] = Field(default_factory=dict, description="Global configuration")
    
    # Execution state
    status: WorkflowStatus = Field(..., description="Execution status")
    current_step_index: int = Field(0, description="Current step index")
    current_step_id: Optional[str] = Field(None, description="Current step ID")
    
    # Results
    step_results: Dict[str, Any] = Field(default_factory=dict, description="Step results")
    final_result: Optional[Any] = Field(None, description="Final result")
    error_details: Optional[Dict[str, Any]] = Field(None, description="Error details")
    
    # Performance metrics
    total_duration: float = Field(0.0, description="Total duration in seconds")
    steps_completed: int = Field(0, description="Steps completed")
    steps_failed: int = Field(0, description="Steps failed")
    total_cost: float = Field(0.0, description="Total cost in USD")
    
    # Timestamps
    created: datetime = Field(..., description="Creation timestamp")
    started_at: Optional[datetime] = Field(None, description="Start timestamp")
    completed_at: Optional[datetime] = Field(None, description="Completion timestamp")
    last_activity: datetime = Field(..., description="Last activity timestamp")
    
    model_config = ConfigDict(from_attributes=True)


# Workflow Step Execution schemas
class WorkflowStepExecutionResponse(BaseModel):
    """Schema for workflow step execution response"""
    id: str = Field(..., description="Step execution ID")
    execution_id: str = Field(..., description="Workflow execution ID")
    step_id: str = Field(..., description="Step ID")
    step_name: str = Field(..., description="Step name")
    step_type: StepType = Field(..., description="Step type")
    
    # Configuration
    step_config: Dict[str, Any] = Field(default_factory=dict, description="Step configuration")
    input_data: Dict[str, Any] = Field(default_factory=dict, description="Input data")
    
    # Execution state
    status: WorkflowStatus = Field(..., description="Step status")
    retry_count: int = Field(0, description="Current retry count")
    max_retries: int = Field(3, description="Maximum retries")
    
    # Results
    output_data: Optional[Any] = Field(None, description="Output data")
    error_details: Optional[Dict[str, Any]] = Field(None, description="Error details")
    logs: List[str] = Field(default_factory=list, description="Execution logs")
    
    # Performance metrics
    execution_time: float = Field(0.0, description="Execution time in seconds")
    tokens_used: int = Field(0, description="Tokens used")
    cost: float = Field(0.0, description="Cost in USD")
    
    # Agent/Team information
    agent_id: Optional[str] = Field(None, description="Agent ID if applicable")
    team_id: Optional[str] = Field(None, description="Team ID if applicable")
    
    # Timestamps
    created: datetime = Field(..., description="Creation timestamp")
    started_at: Optional[datetime] = Field(None, description="Start timestamp")
    completed_at: Optional[datetime] = Field(None, description="Completion timestamp")
    
    model_config = ConfigDict(from_attributes=True)


# Workflow Schedule schemas
class WorkflowScheduleBase(BaseModel):
    """Base schema for workflow schedule"""
    schedule_name: str = Field(..., description="Schedule name")
    cron_expression: str = Field(..., description="Cron expression")
    timezone: str = Field("UTC", description="Timezone")
    input_parameters: Dict[str, Any] = Field(default_factory=dict, description="Input parameters")
    description: str = Field("", description="Schedule description")


class WorkflowScheduleCreate(WorkflowScheduleBase):
    """Schema for creating workflow schedule"""
    workflow_template_id: str = Field(..., description="Workflow template ID")
    max_executions: Optional[int] = Field(None, description="Maximum executions")


class WorkflowScheduleUpdate(BaseModel):
    """Schema for updating workflow schedule"""
    schedule_name: Optional[str] = None
    cron_expression: Optional[str] = None
    timezone: Optional[str] = None
    input_parameters: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    max_executions: Optional[int] = None


class WorkflowScheduleResponse(WorkflowScheduleBase):
    """Schema for workflow schedule response"""
    id: str = Field(..., description="Schedule ID")
    workflow_template_id: str = Field(..., description="Workflow template ID")
    user_id: str = Field(..., description="User ID")
    
    # Schedule state
    is_active: bool = Field(True, description="Whether schedule is active")
    last_execution: Optional[datetime] = Field(None, description="Last execution time")
    next_execution: Optional[datetime] = Field(None, description="Next execution time")
    execution_count: int = Field(0, description="Total executions")
    max_executions: Optional[int] = Field(None, description="Maximum executions")
    
    # Timestamps
    created: datetime = Field(..., description="Creation timestamp")
    updated: datetime = Field(..., description="Last update timestamp")
    
    model_config = ConfigDict(from_attributes=True)


# Request/Response schemas for API endpoints
class WorkflowExecuteRequest(BaseModel):
    """Schema for workflow execution request"""
    workflow_template_id: Optional[str] = Field(None, description="Template ID to execute")
    workflow_name: str = Field(..., description="Workflow name")
    input_parameters: Dict[str, Any] = Field(default_factory=dict, description="Input parameters")
    session_id: Optional[str] = Field(None, description="Session ID")
    async_execution: bool = Field(False, description="Whether to execute asynchronously")


class WorkflowExecuteResponse(BaseModel):
    """Schema for workflow execution response"""
    execution_id: str = Field(..., description="Execution ID")
    workflow_name: str = Field(..., description="Workflow name")
    status: WorkflowStatus = Field(..., description="Execution status")
    result: Optional[Any] = Field(None, description="Execution result")
    
    # Performance metrics
    duration: float = Field(0.0, description="Execution duration in seconds")
    steps_completed: int = Field(0, description="Steps completed")
    total_steps: int = Field(0, description="Total steps")
    cost: float = Field(0.0, description="Total cost in USD")
    
    # Timestamps
    started_at: datetime = Field(..., description="Start timestamp")
    completed_at: Optional[datetime] = Field(None, description="Completion timestamp")
    
    # Additional info
    step_results: Dict[str, Any] = Field(default_factory=dict, description="Step results")
    error_details: Optional[Dict[str, Any]] = Field(None, description="Error details if failed")


class WorkflowListResponse(BaseModel):
    """Schema for workflow list response"""
    templates: List[WorkflowTemplateResponse] = Field(..., description="List of workflow templates")
    total: int = Field(..., description="Total number of templates")
    page: int = Field(1, description="Current page")
    page_size: int = Field(20, description="Page size")


class WorkflowExecutionListResponse(BaseModel):
    """Schema for workflow execution list response"""
    executions: List[WorkflowExecutionResponse] = Field(..., description="List of executions")
    total: int = Field(..., description="Total number of executions")
    page: int = Field(1, description="Current page")
    page_size: int = Field(20, description="Page size")


class WorkflowSearchRequest(BaseModel):
    """Schema for workflow search request"""
    query: Optional[str] = Field(None, description="Search query")
    category: Optional[str] = Field(None, description="Filter by category")
    complexity_level: Optional[str] = Field(None, description="Filter by complexity")
    tags: Optional[List[str]] = Field(None, description="Filter by tags")
    is_public: Optional[bool] = Field(None, description="Filter by public/private")
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Page size")
