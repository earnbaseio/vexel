"""
CRUD operations for Workflow models
"""

from typing import Any, Dict, List, Optional
from datetime import datetime
from motor.core import AgnosticDatabase
from odmantic import ObjectId
from pydantic import BaseModel

from app.crud.base import CRUDBase
from app.models.workflow import (
    WorkflowTemplate,
    WorkflowExecution,
    WorkflowStepExecution,
    WorkflowSchedule,
    WorkflowAnalytics,
    WorkflowStepConfig,
    WorkflowStatus,
    StepType
)


# Pydantic schemas for CRUD operations
class WorkflowTemplateCreate(BaseModel):
    name: str
    description: str = ""
    category: str = "general"
    version: str = "1.0.0"
    steps: List[WorkflowStepConfig] = []
    global_config: Dict[str, Any] = {}
    input_schema: Dict[str, Any] = {}
    output_schema: Dict[str, Any] = {}
    user_id: ObjectId
    tags: List[str] = []
    is_public: bool = False


class WorkflowTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    version: Optional[str] = None
    steps: Optional[List[WorkflowStepConfig]] = None
    global_config: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None
    updated: datetime = datetime.now().replace(microsecond=0)


class WorkflowExecutionCreate(BaseModel):
    execution_id: str
    workflow_template_id: Optional[ObjectId] = None
    workflow_name: str
    user_id: ObjectId
    session_id: str
    input_parameters: Dict[str, Any] = {}
    steps: List[WorkflowStepConfig] = []
    global_config: Dict[str, Any] = {}


class WorkflowExecutionUpdate(BaseModel):
    status: Optional[WorkflowStatus] = None
    current_step_index: Optional[int] = None
    current_step_id: Optional[str] = None
    step_results: Optional[Dict[str, Any]] = None
    final_result: Optional[Any] = None
    error_details: Optional[Dict[str, Any]] = None
    steps_completed: Optional[int] = None
    steps_failed: Optional[int] = None
    total_cost: Optional[float] = None
    last_activity: datetime = datetime.now().replace(microsecond=0)


class WorkflowStepExecutionCreate(BaseModel):
    execution_id: ObjectId
    step_id: str
    step_name: str
    step_type: StepType
    step_config: Dict[str, Any] = {}
    input_data: Dict[str, Any] = {}
    agent_id: Optional[ObjectId] = None
    team_id: Optional[str] = None


class WorkflowScheduleCreate(BaseModel):
    schedule_name: str
    workflow_template_id: ObjectId
    user_id: ObjectId
    cron_expression: str
    timezone: str = "UTC"
    input_parameters: Dict[str, Any] = {}
    description: str = ""


class CRUDWorkflowTemplate(CRUDBase[WorkflowTemplate, WorkflowTemplateCreate, WorkflowTemplateUpdate]):
    """CRUD operations for WorkflowTemplate"""
    
    async def get_by_user(self, db: AgnosticDatabase, user_id: ObjectId) -> List[WorkflowTemplate]:
        """Get workflow templates by user"""
        return await self.engine.find(
            WorkflowTemplate,
            WorkflowTemplate.user_id == user_id,
            sort=WorkflowTemplate.updated.desc()
        )
    
    async def get_by_category(self, db: AgnosticDatabase, category: str) -> List[WorkflowTemplate]:
        """Get workflow templates by category"""
        return await self.engine.find(
            WorkflowTemplate,
            WorkflowTemplate.category == category,
            WorkflowTemplate.is_public == True,
            sort=WorkflowTemplate.average_rating.desc()
        )
    
    async def get_public_templates(self, db: AgnosticDatabase) -> List[WorkflowTemplate]:
        """Get public workflow templates"""
        return await self.engine.find(
            WorkflowTemplate,
            WorkflowTemplate.is_public == True,
            sort=WorkflowTemplate.usage_count.desc()
        )
    
    async def search_templates(
        self, 
        db: AgnosticDatabase, 
        query: str, 
        user_id: Optional[ObjectId] = None
    ) -> List[WorkflowTemplate]:
        """Search workflow templates"""
        # Note: This is a simple search. For production, consider using text search
        if user_id:
            return await self.engine.find(
                WorkflowTemplate,
                WorkflowTemplate.user_id == user_id
            )
        else:
            return await self.engine.find(
                WorkflowTemplate,
                WorkflowTemplate.is_public == True
            )
    
    async def increment_usage(self, db: AgnosticDatabase, template_id: ObjectId) -> Optional[WorkflowTemplate]:
        """Increment template usage count"""
        template = await self.get(db, template_id)
        if template:
            template.usage_count += 1
            return await self.engine.save(template)
        return template
    
    async def update_success_rate(
        self, 
        db: AgnosticDatabase, 
        template_id: ObjectId, 
        success: bool,
        duration: float
    ) -> Optional[WorkflowTemplate]:
        """Update template success rate and average duration"""
        template = await self.get(db, template_id)
        if template:
            total_executions = template.usage_count
            if total_executions > 0:
                # Update success rate
                current_successes = template.success_rate * (total_executions - 1) / 100
                if success:
                    current_successes += 1
                template.success_rate = (current_successes / total_executions) * 100
                
                # Update average duration
                template.average_duration = (
                    (template.average_duration * (total_executions - 1) + duration) / total_executions
                )
            else:
                template.success_rate = 100.0 if success else 0.0
                template.average_duration = duration
            
            return await self.engine.save(template)
        return template


class CRUDWorkflowExecution(CRUDBase[WorkflowExecution, WorkflowExecutionCreate, WorkflowExecutionUpdate]):
    """CRUD operations for WorkflowExecution"""
    
    async def get_by_execution_id(self, db: AgnosticDatabase, execution_id: str) -> Optional[WorkflowExecution]:
        """Get workflow execution by execution ID"""
        return await self.engine.find_one(WorkflowExecution, WorkflowExecution.execution_id == execution_id)
    
    async def get_by_user(self, db: AgnosticDatabase, user_id: ObjectId) -> List[WorkflowExecution]:
        """Get workflow executions by user"""
        return await self.engine.find(
            WorkflowExecution,
            WorkflowExecution.user_id == user_id,
            sort=WorkflowExecution.created.desc()
        )
    
    async def get_by_template(self, db: AgnosticDatabase, template_id: ObjectId) -> List[WorkflowExecution]:
        """Get executions for a workflow template"""
        return await self.engine.find(
            WorkflowExecution,
            WorkflowExecution.workflow_template_id == template_id,
            sort=WorkflowExecution.created.desc()
        )
    
    async def get_by_status(
        self, 
        db: AgnosticDatabase, 
        status: WorkflowStatus,
        user_id: Optional[ObjectId] = None
    ) -> List[WorkflowExecution]:
        """Get executions by status"""
        query = [WorkflowExecution.status == status]
        if user_id:
            query.append(WorkflowExecution.user_id == user_id)
        
        return await self.engine.find(WorkflowExecution, *query, sort=WorkflowExecution.created.desc())
    
    async def get_running_executions(self, db: AgnosticDatabase) -> List[WorkflowExecution]:
        """Get all running workflow executions"""
        return await self.engine.find(
            WorkflowExecution,
            WorkflowExecution.status == WorkflowStatus.RUNNING,
            sort=WorkflowExecution.started_at.asc()
        )
    
    async def start_execution(self, db: AgnosticDatabase, execution_id: str) -> Optional[WorkflowExecution]:
        """Start a workflow execution"""
        execution = await self.get_by_execution_id(db, execution_id)
        if execution:
            execution.status = WorkflowStatus.RUNNING
            execution.started_at = datetime.now().replace(microsecond=0)
            execution.last_activity = datetime.now().replace(microsecond=0)
            return await self.engine.save(execution)
        return execution
    
    async def complete_execution(
        self, 
        db: AgnosticDatabase, 
        execution_id: str,
        final_result: Any = None,
        total_duration: float = 0.0
    ) -> Optional[WorkflowExecution]:
        """Complete a workflow execution"""
        execution = await self.get_by_execution_id(db, execution_id)
        if execution:
            execution.status = WorkflowStatus.COMPLETED
            execution.completed_at = datetime.now().replace(microsecond=0)
            execution.final_result = final_result
            execution.total_duration = total_duration
            return await self.engine.save(execution)
        return execution
    
    async def fail_execution(
        self, 
        db: AgnosticDatabase, 
        execution_id: str,
        error_details: Dict[str, Any]
    ) -> Optional[WorkflowExecution]:
        """Fail a workflow execution"""
        execution = await self.get_by_execution_id(db, execution_id)
        if execution:
            execution.status = WorkflowStatus.FAILED
            execution.completed_at = datetime.now().replace(microsecond=0)
            execution.error_details = error_details
            return await self.engine.save(execution)
        return execution


class CRUDWorkflowStepExecution(CRUDBase[WorkflowStepExecution, WorkflowStepExecutionCreate, BaseModel]):
    """CRUD operations for WorkflowStepExecution"""
    
    async def get_by_execution(self, db: AgnosticDatabase, execution_id: ObjectId) -> List[WorkflowStepExecution]:
        """Get step executions for a workflow execution"""
        return await self.engine.find(
            WorkflowStepExecution,
            WorkflowStepExecution.execution_id == execution_id,
            sort=WorkflowStepExecution.created.asc()
        )
    
    async def get_by_step_id(
        self, 
        db: AgnosticDatabase, 
        execution_id: ObjectId, 
        step_id: str
    ) -> Optional[WorkflowStepExecution]:
        """Get step execution by step ID"""
        return await self.engine.find_one(
            WorkflowStepExecution,
            WorkflowStepExecution.execution_id == execution_id,
            WorkflowStepExecution.step_id == step_id
        )
    
    async def update_step_status(
        self,
        db: AgnosticDatabase,
        step_execution_id: ObjectId,
        status: WorkflowStatus,
        output_data: Any = None,
        error_details: Dict[str, Any] = None,
        execution_time: float = 0.0
    ) -> Optional[WorkflowStepExecution]:
        """Update step execution status"""
        step_execution = await self.get(db, step_execution_id)
        if step_execution:
            step_execution.status = status
            if output_data is not None:
                step_execution.output_data = output_data
            if error_details:
                step_execution.error_details = error_details
            if execution_time > 0:
                step_execution.execution_time = execution_time
            
            if status in [WorkflowStatus.COMPLETED, WorkflowStatus.FAILED]:
                step_execution.completed_at = datetime.now().replace(microsecond=0)
            elif status == WorkflowStatus.RUNNING:
                step_execution.started_at = datetime.now().replace(microsecond=0)
            
            return await self.engine.save(step_execution)
        return step_execution


class CRUDWorkflowSchedule(CRUDBase[WorkflowSchedule, WorkflowScheduleCreate, BaseModel]):
    """CRUD operations for WorkflowSchedule"""
    
    async def get_by_user(self, db: AgnosticDatabase, user_id: ObjectId) -> List[WorkflowSchedule]:
        """Get workflow schedules by user"""
        return await self.engine.find(
            WorkflowSchedule,
            WorkflowSchedule.user_id == user_id,
            sort=WorkflowSchedule.created.desc()
        )
    
    async def get_active_schedules(self, db: AgnosticDatabase) -> List[WorkflowSchedule]:
        """Get active workflow schedules"""
        return await self.engine.find(
            WorkflowSchedule,
            WorkflowSchedule.is_active == True,
            sort=WorkflowSchedule.next_execution.asc()
        )
    
    async def get_due_schedules(self, db: AgnosticDatabase, current_time: datetime) -> List[WorkflowSchedule]:
        """Get schedules that are due for execution"""
        return await self.engine.find(
            WorkflowSchedule,
            WorkflowSchedule.is_active == True,
            WorkflowSchedule.next_execution <= current_time
        )
    
    async def update_execution_info(
        self,
        db: AgnosticDatabase,
        schedule_id: ObjectId,
        next_execution: datetime
    ) -> Optional[WorkflowSchedule]:
        """Update schedule execution information"""
        schedule = await self.get(db, schedule_id)
        if schedule:
            schedule.last_execution = datetime.now().replace(microsecond=0)
            schedule.next_execution = next_execution
            schedule.execution_count += 1
            return await self.engine.save(schedule)
        return schedule


class CRUDWorkflowAnalytics(CRUDBase[WorkflowAnalytics, BaseModel, BaseModel]):
    """CRUD operations for WorkflowAnalytics"""
    
    async def get_by_template_and_date(
        self,
        db: AgnosticDatabase,
        template_id: ObjectId,
        date: datetime
    ) -> Optional[WorkflowAnalytics]:
        """Get analytics for a template on a specific date"""
        date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        return await self.engine.find_one(
            WorkflowAnalytics,
            WorkflowAnalytics.workflow_template_id == template_id,
            WorkflowAnalytics.date == date_start
        )
    
    async def get_user_analytics_range(
        self,
        db: AgnosticDatabase,
        user_id: ObjectId,
        start_date: datetime,
        end_date: datetime
    ) -> List[WorkflowAnalytics]:
        """Get user analytics within a date range"""
        return await self.engine.find(
            WorkflowAnalytics,
            WorkflowAnalytics.user_id == user_id,
            WorkflowAnalytics.date >= start_date,
            WorkflowAnalytics.date <= end_date,
            sort=WorkflowAnalytics.date.asc()
        )


# Create CRUD instances
crud_workflow_template = CRUDWorkflowTemplate(WorkflowTemplate)
crud_workflow_execution = CRUDWorkflowExecution(WorkflowExecution)
crud_workflow_step_execution = CRUDWorkflowStepExecution(WorkflowStepExecution)
crud_workflow_schedule = CRUDWorkflowSchedule(WorkflowSchedule)
crud_workflow_analytics = CRUDWorkflowAnalytics(WorkflowAnalytics)
