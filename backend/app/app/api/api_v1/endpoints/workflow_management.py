"""
Workflow Management API Endpoints
Endpoints for managing workflow templates, executions, and schedules
"""

from typing import Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from motor.core import AgnosticDatabase
from odmantic import ObjectId

from app.api.deps import get_current_user, get_database
from app.models.user import User
from app.models.workflow import (
    WorkflowTemplate, WorkflowExecution, WorkflowStepExecution, 
    WorkflowSchedule, WorkflowStatus, StepType
)
from app.schemas.workflow import (
    WorkflowTemplateCreate,
    WorkflowTemplateUpdate,
    WorkflowTemplateResponse,
    WorkflowExecutionCreate,
    WorkflowExecutionUpdate,
    WorkflowExecutionResponse,
    WorkflowStepExecutionResponse,
    WorkflowScheduleCreate,
    WorkflowScheduleUpdate,
    WorkflowScheduleResponse,
    WorkflowExecuteRequest,
    WorkflowExecuteResponse,
    WorkflowListResponse,
    WorkflowExecutionListResponse,
    WorkflowSearchRequest
)
from app.crud import (
    crud_workflow_template,
    crud_workflow_execution,
    crud_workflow_step_execution,
    crud_workflow_schedule
)

router = APIRouter()


# ============================================================================
# WORKFLOW TEMPLATE ENDPOINTS
# ============================================================================

@router.post("/templates", response_model=WorkflowTemplateResponse)
async def create_workflow_template(
    *,
    db: AgnosticDatabase = Depends(get_database),
    template_in: WorkflowTemplateCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new workflow template
    """
    try:
        # Create template with user_id
        from app.crud.crud_workflow import WorkflowTemplateCreate

        template_create = WorkflowTemplateCreate(
            **template_in.model_dump(),
            user_id=current_user.id
        )

        template = await crud_workflow_template.create(db, obj_in=template_create)
        
        return WorkflowTemplateResponse(
            id=str(template.id),
            user_id=str(template.user_id),
            shared_with=[str(uid) for uid in (template.shared_with or [])],
            **template.model_dump(exclude={"id", "user_id", "shared_with"})
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create workflow template: {str(e)}")


@router.get("/templates", response_model=WorkflowListResponse)
async def list_workflow_templates(
    *,
    db: AgnosticDatabase = Depends(get_database),
    current_user: User = Depends(get_current_user),
    category: Optional[str] = Query(None, description="Filter by category"),
    public_only: bool = Query(False, description="Show only public templates"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size")
):
    """
    List workflow templates with optional filtering
    """
    try:
        # Get templates based on filters
        if public_only:
            templates = await crud_workflow_template.get_public_templates(db)
        elif category:
            templates = await crud_workflow_template.get_by_category(db, category)
        else:
            templates = await crud_workflow_template.get_by_user(db, current_user.id)
        
        # Apply pagination
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_templates = templates[start_idx:end_idx]
        
        # Convert to response format
        template_responses = [
            WorkflowTemplateResponse(
                id=str(template.id),
                user_id=str(template.user_id),
                shared_with=[str(uid) for uid in template.shared_with],
                **template.model_dump(exclude={"id", "user_id", "shared_with"})
            )
            for template in paginated_templates
        ]
        
        return WorkflowListResponse(
            templates=template_responses,
            total=len(templates),
            page=page,
            page_size=page_size
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list workflow templates: {str(e)}")


@router.get("/templates/{template_id}", response_model=WorkflowTemplateResponse)
async def get_workflow_template(
    *,
    db: AgnosticDatabase = Depends(get_database),
    template_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific workflow template
    """
    try:
        template = await crud_workflow_template.get(db, ObjectId(template_id))
        if not template:
            raise HTTPException(status_code=404, detail="Workflow template not found")
        
        # Check if user has access
        if (template.user_id != current_user.id and 
            current_user.id not in template.shared_with and 
            not template.is_public):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return WorkflowTemplateResponse(
            id=str(template.id),
            user_id=str(template.user_id),
            shared_with=[str(uid) for uid in (template.shared_with or [])],
            **template.model_dump(exclude={"id", "user_id", "shared_with"})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get workflow template: {str(e)}")


@router.put("/templates/{template_id}", response_model=WorkflowTemplateResponse)
async def update_workflow_template(
    *,
    db: AgnosticDatabase = Depends(get_database),
    template_id: str,
    template_update: WorkflowTemplateUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Update a workflow template
    """
    try:
        template = await crud_workflow_template.get(db, ObjectId(template_id))
        if not template:
            raise HTTPException(status_code=404, detail="Workflow template not found")
        
        # Check if user owns this template
        if template.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update template
        updated_template = await crud_workflow_template.update(
            db, db_obj=template, obj_in=template_update.model_dump(exclude_unset=True)
        )
        
        return WorkflowTemplateResponse(
            id=str(updated_template.id),
            user_id=str(updated_template.user_id),
            shared_with=[str(uid) for uid in (updated_template.shared_with or [])],
            **updated_template.model_dump(exclude={"id", "user_id", "shared_with"})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update workflow template: {str(e)}")


@router.delete("/templates/{template_id}")
async def delete_workflow_template(
    *,
    db: AgnosticDatabase = Depends(get_database),
    template_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a workflow template
    """
    try:
        template = await crud_workflow_template.get(db, ObjectId(template_id))
        if not template:
            raise HTTPException(status_code=404, detail="Workflow template not found")
        
        # Check if user owns this template
        if template.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete the template
        await crud_workflow_template.remove(db, id=ObjectId(template_id))
        
        return {"message": "Workflow template deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete workflow template: {str(e)}")


# ============================================================================
# WORKFLOW EXECUTION ENDPOINTS
# ============================================================================

@router.post("/execute", response_model=WorkflowExecuteResponse)
async def execute_workflow(
    *,
    db: AgnosticDatabase = Depends(get_database),
    execute_request: WorkflowExecuteRequest,
    current_user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks
):
    """
    Execute a workflow (synchronously or asynchronously)
    """
    try:
        # Generate execution ID
        import uuid
        execution_id = str(uuid.uuid4())
        
        # Prepare execution data
        execution_data = {
            "execution_id": execution_id,
            "workflow_name": execute_request.workflow_name,
            "user_id": current_user.id,
            "session_id": execute_request.session_id or str(uuid.uuid4()),
            "input_parameters": execute_request.input_parameters,
            "steps": [],
            "global_config": {}
        }
        
        # If template_id provided, get template configuration
        if execute_request.workflow_template_id:
            template = await crud_workflow_template.get(db, ObjectId(execute_request.workflow_template_id))
            if not template:
                raise HTTPException(status_code=404, detail="Workflow template not found")
            
            # Check access
            if (template.user_id != current_user.id and 
                current_user.id not in template.shared_with and 
                not template.is_public):
                raise HTTPException(status_code=403, detail="Access denied to template")
            
            execution_data["workflow_template_id"] = template.id
            execution_data["steps"] = template.steps
            execution_data["global_config"] = template.global_config
            
            # Increment usage count
            await crud_workflow_template.increment_usage(db, template.id)
        
        # Create execution record
        execution = await crud_workflow_execution.create(db, obj_in=execution_data)
        
        if execute_request.async_execution:
            # Start execution in background
            background_tasks.add_task(
                _execute_workflow_background, 
                db, execution_id, execution_data
            )
            
            return WorkflowExecuteResponse(
                execution_id=execution_id,
                workflow_name=execute_request.workflow_name,
                status=WorkflowStatus.PENDING,
                result=None,
                duration=0.0,
                steps_completed=0,
                total_steps=len(execution_data["steps"]),
                cost=0.0,
                started_at=execution.created,
                completed_at=None,
                step_results={},
                error_details=None
            )
        else:
            # Execute synchronously (simplified for demo)
            await crud_workflow_execution.start_execution(db, execution_id)
            
            # Simulate execution (in production, this would call actual workflow engine)
            import time
            start_time = time.time()
            
            # Mock execution result
            result = {
                "status": "completed",
                "message": f"Workflow '{execute_request.workflow_name}' executed successfully",
                "steps_executed": len(execution_data["steps"]),
                "input_parameters": execute_request.input_parameters
            }
            
            duration = time.time() - start_time
            
            # Complete execution
            await crud_workflow_execution.complete_execution(
                db, execution_id, final_result=result, total_duration=duration
            )
            
            return WorkflowExecuteResponse(
                execution_id=execution_id,
                workflow_name=execute_request.workflow_name,
                status=WorkflowStatus.COMPLETED,
                result=result,
                duration=duration,
                steps_completed=len(execution_data["steps"]),
                total_steps=len(execution_data["steps"]),
                cost=0.0,
                started_at=execution.created,
                completed_at=execution.created,
                step_results={},
                error_details=None
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute workflow: {str(e)}")


@router.get("/executions", response_model=WorkflowExecutionListResponse)
async def list_workflow_executions(
    *,
    db: AgnosticDatabase = Depends(get_database),
    current_user: User = Depends(get_current_user),
    status: Optional[WorkflowStatus] = Query(None, description="Filter by status"),
    template_id: Optional[str] = Query(None, description="Filter by template"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size")
):
    """
    List workflow executions with optional filtering
    """
    try:
        # Get executions based on filters
        if status:
            executions = await crud_workflow_execution.get_by_status(db, status, current_user.id)
        elif template_id:
            executions = await crud_workflow_execution.get_by_template(db, ObjectId(template_id))
            # Filter to user's executions
            executions = [e for e in executions if e.user_id == current_user.id]
        else:
            executions = await crud_workflow_execution.get_by_user(db, current_user.id)
        
        # Apply pagination
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_executions = executions[start_idx:end_idx]
        
        # Convert to response format
        execution_responses = [
            WorkflowExecutionResponse(
                id=str(execution.id),
                workflow_template_id=str(execution.workflow_template_id) if execution.workflow_template_id else None,
                user_id=str(execution.user_id),
                **execution.model_dump(exclude={"id", "workflow_template_id", "user_id"})
            )
            for execution in paginated_executions
        ]
        
        return WorkflowExecutionListResponse(
            executions=execution_responses,
            total=len(executions),
            page=page,
            page_size=page_size
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list workflow executions: {str(e)}")


@router.get("/executions/{execution_id}", response_model=WorkflowExecutionResponse)
async def get_workflow_execution(
    *,
    db: AgnosticDatabase = Depends(get_database),
    execution_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific workflow execution
    """
    try:
        execution = await crud_workflow_execution.get_by_execution_id(db, execution_id)
        if not execution:
            raise HTTPException(status_code=404, detail="Workflow execution not found")
        
        # Check if user owns this execution
        if execution.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return WorkflowExecutionResponse(
            id=str(execution.id),
            workflow_template_id=str(execution.workflow_template_id) if execution.workflow_template_id else None,
            user_id=str(execution.user_id),
            **execution.model_dump(exclude={"id", "workflow_template_id", "user_id"})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get workflow execution: {str(e)}")


@router.get("/executions/{execution_id}/steps", response_model=List[WorkflowStepExecutionResponse])
async def list_workflow_step_executions(
    *,
    db: AgnosticDatabase = Depends(get_database),
    execution_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    List step executions for a workflow execution
    """
    try:
        # Verify execution exists and user has access
        execution = await crud_workflow_execution.get_by_execution_id(db, execution_id)
        if not execution:
            raise HTTPException(status_code=404, detail="Workflow execution not found")
        
        if execution.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get step executions
        step_executions = await crud_workflow_step_execution.get_by_execution(db, execution.id)
        
        return [
            WorkflowStepExecutionResponse(
                id=str(step.id),
                execution_id=str(step.execution_id),
                agent_id=str(step.agent_id) if step.agent_id else None,
                **step.model_dump(exclude={"id", "execution_id", "agent_id"})
            )
            for step in step_executions
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list step executions: {str(e)}")


@router.post("/executions/{execution_id}/cancel")
async def cancel_workflow_execution(
    *,
    db: AgnosticDatabase = Depends(get_database),
    execution_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Cancel a running workflow execution
    """
    try:
        execution = await crud_workflow_execution.get_by_execution_id(db, execution_id)
        if not execution:
            raise HTTPException(status_code=404, detail="Workflow execution not found")
        
        if execution.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        if execution.status not in [WorkflowStatus.PENDING, WorkflowStatus.RUNNING]:
            raise HTTPException(status_code=400, detail="Cannot cancel completed workflow")
        
        # Cancel execution
        await crud_workflow_execution.fail_execution(
            db, execution_id, {"reason": "Cancelled by user"}
        )
        
        return {"message": "Workflow execution cancelled successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel workflow execution: {str(e)}")


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def _execute_workflow_background(db: AgnosticDatabase, execution_id: str, execution_data: dict):
    """
    Background task for executing workflows asynchronously
    """
    try:
        # Start execution
        await crud_workflow_execution.start_execution(db, execution_id)
        
        # Simulate workflow execution (in production, integrate with actual workflow engine)
        import asyncio
        import time
        
        start_time = time.time()
        
        # Mock step execution
        for i, step in enumerate(execution_data["steps"]):
            await asyncio.sleep(1)  # Simulate step execution time
            
            # Update execution progress
            await crud_workflow_execution.update(
                db, 
                db_obj=await crud_workflow_execution.get_by_execution_id(db, execution_id),
                obj_in={"current_step_index": i, "steps_completed": i + 1}
            )
        
        # Complete execution
        duration = time.time() - start_time
        result = {
            "status": "completed",
            "message": f"Workflow executed successfully in background",
            "steps_executed": len(execution_data["steps"]),
            "duration": duration
        }
        
        await crud_workflow_execution.complete_execution(
            db, execution_id, final_result=result, total_duration=duration
        )
        
    except Exception as e:
        # Fail execution on error
        await crud_workflow_execution.fail_execution(
            db, execution_id, {"error": str(e), "type": "background_execution_error"}
        )
