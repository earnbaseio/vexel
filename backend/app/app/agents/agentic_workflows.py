"""
Vexel Agentic Workflows System - Level 5
Autonomous workflow execution with conditional logic, branching, and external integrations
"""

import os
import json
import asyncio
from typing import List, Dict, Any, Optional, Union, Iterator, Callable
from datetime import datetime
from uuid import uuid4
from enum import Enum

from agno.workflow import Workflow
from agno.agent.agent import Agent
from agno.team.team import Team
from agno.models.litellm import LiteLLM
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.memory.v2.memory import Memory
from agno.storage.sqlite import SqliteStorage
from agno.tools.reasoning import ReasoningTools
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.utils.log import logger
from agno.agent import RunResponse

from app.agents.team_collaboration import VexelTeamCollaboration
from app.agents.memory_reasoning import VexelMemoryReasoningAgent
from app.agents.gemini_embedder import GeminiEmbedder


class WorkflowStatus(Enum):
    """Workflow execution status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class WorkflowStep:
    """Individual workflow step with conditional logic"""
    
    def __init__(
        self,
        step_id: str,
        name: str,
        step_type: str,  # agent, team, condition, external, parallel
        config: Dict[str, Any],
        conditions: Optional[List[Dict[str, Any]]] = None,
        next_steps: Optional[List[str]] = None,
        error_handling: Optional[Dict[str, Any]] = None
    ):
        self.step_id = step_id
        self.name = name
        self.step_type = step_type
        self.config = config
        self.conditions = conditions or []
        self.next_steps = next_steps or []
        self.error_handling = error_handling or {}
        self.status = WorkflowStatus.PENDING
        self.result = None
        self.error = None
        self.start_time = None
        self.end_time = None


class VexelAgenticWorkflow(Workflow):
    """
    Vexel Level 5: Agentic Workflows System
    
    Features:
    - Autonomous workflow execution with conditional logic
    - Complex multi-step processes with branching
    - External system integrations and monitoring
    - Workflow templates and reusable components
    - Performance optimization and error handling
    """
    
    def __init__(
        self,
        workflow_name: str = "VexelWorkflow",
        workflow_description: str = "Autonomous Vexel workflow",
        user_id: str = "default_user",
        session_id: Optional[str] = None,
        db_file: str = "tmp/vexel_workflows.db",
        steps: Optional[List[WorkflowStep]] = None,
        global_config: Optional[Dict[str, Any]] = None,
        **kwargs
    ):
        # Initialize workflow components
        self.workflow_name = workflow_name
        self.workflow_description = workflow_description
        self.user_id = user_id
        self.session_id = session_id or str(uuid4())
        self.db_file = db_file
        self.steps = steps or []
        self.global_config = global_config or {}
        
        # Workflow execution state
        self.current_step_index = 0
        self.execution_results = {}
        self.workflow_status = WorkflowStatus.PENDING
        self.start_time = None
        self.end_time = None
        
        # Initialize storage and memory
        self._setup_storage()
        self._setup_memory()
        
        # Initialize agents and teams
        self.agents = {}
        self.teams = {}
        
        # Call parent constructor
        super().__init__(
            name=workflow_name,
            description=workflow_description,
            user_id=user_id,
            session_id=self.session_id,
            storage=self.storage,
            memory=self.memory,
            **kwargs
        )
        
        print(f"✅ Agentic workflow initialized: {workflow_name}")
    
    def _setup_storage(self):
        """Setup persistent storage for workflow sessions"""
        self.storage = SqliteStorage(
            table_name="vexel_workflow_sessions",
            db_file=self.db_file
        )
        print(f"✅ Workflow storage initialized")
    
    def _setup_memory(self):
        """Setup memory system for workflow context"""
        memory_db = SqliteMemoryDb(
            table_name="vexel_workflow_memories",
            db_file=self.db_file
        )
        
        self.memory = Memory(
            db=memory_db,
            model=LiteLLM(
                id="gemini/gemini-2.5-flash-lite",
                api_key=os.getenv("GEMINI_API_KEY"),
                temperature=0.3
            ),
            debug_mode=True
        )
        print(f"✅ Workflow memory initialized")
    
    def add_step(self, step: WorkflowStep):
        """Add a step to the workflow"""
        self.steps.append(step)
        print(f"✅ Added step: {step.name} ({step.step_type})")
    
    def add_agent_step(
        self,
        step_id: str,
        name: str,
        agent_config: Dict[str, Any],
        task: str,
        conditions: Optional[List[Dict[str, Any]]] = None,
        next_steps: Optional[List[str]] = None
    ):
        """Add an agent execution step"""
        step = WorkflowStep(
            step_id=step_id,
            name=name,
            step_type="agent",
            config={
                "agent_config": agent_config,
                "task": task
            },
            conditions=conditions,
            next_steps=next_steps
        )
        self.add_step(step)
    
    def add_team_step(
        self,
        step_id: str,
        name: str,
        team_config: Dict[str, Any],
        task: str,
        conditions: Optional[List[Dict[str, Any]]] = None,
        next_steps: Optional[List[str]] = None
    ):
        """Add a team collaboration step"""
        step = WorkflowStep(
            step_id=step_id,
            name=name,
            step_type="team",
            config={
                "team_config": team_config,
                "task": task
            },
            conditions=conditions,
            next_steps=next_steps
        )
        self.add_step(step)
    
    def add_condition_step(
        self,
        step_id: str,
        name: str,
        condition_logic: Dict[str, Any],
        next_steps: Optional[List[str]] = None
    ):
        """Add a conditional branching step"""
        step = WorkflowStep(
            step_id=step_id,
            name=name,
            step_type="condition",
            config={
                "condition_logic": condition_logic
            },
            next_steps=next_steps
        )
        self.add_step(step)
    
    def add_external_step(
        self,
        step_id: str,
        name: str,
        external_config: Dict[str, Any],
        conditions: Optional[List[Dict[str, Any]]] = None,
        next_steps: Optional[List[str]] = None,
        error_handling: Optional[Dict[str, Any]] = None
    ):
        """Add an external system integration step"""
        step = WorkflowStep(
            step_id=step_id,
            name=name,
            step_type="external",
            config=external_config,
            conditions=conditions,
            next_steps=next_steps,
            error_handling=error_handling
        )
        self.add_step(step)
    
    def add_parallel_step(
        self,
        step_id: str,
        name: str,
        parallel_tasks: List[Dict[str, Any]],
        conditions: Optional[List[Dict[str, Any]]] = None,
        next_steps: Optional[List[str]] = None
    ):
        """Add a parallel execution step"""
        step = WorkflowStep(
            step_id=step_id,
            name=name,
            step_type="parallel",
            config={
                "parallel_tasks": parallel_tasks
            },
            conditions=conditions,
            next_steps=next_steps
        )
        self.add_step(step)
    
    def evaluate_conditions(self, conditions: List[Dict[str, Any]], context: Dict[str, Any]) -> bool:
        """Evaluate conditional logic"""
        if not conditions:
            return True
        
        for condition in conditions:
            condition_type = condition.get("type", "equals")
            field = condition.get("field")
            expected_value = condition.get("value")
            operator = condition.get("operator", "and")
            
            if field not in context:
                return False
            
            actual_value = context[field]
            
            if condition_type == "equals":
                result = actual_value == expected_value
            elif condition_type == "not_equals":
                result = actual_value != expected_value
            elif condition_type == "contains":
                result = expected_value in str(actual_value)
            elif condition_type == "greater_than":
                result = float(actual_value) > float(expected_value)
            elif condition_type == "less_than":
                result = float(actual_value) < float(expected_value)
            elif condition_type == "exists":
                result = actual_value is not None
            else:
                result = True
            
            if operator == "and" and not result:
                return False
            elif operator == "or" and result:
                return True
        
        return True
    
    def get_next_steps(self, current_step: WorkflowStep, context: Dict[str, Any]) -> List[str]:
        """Determine next steps based on conditions and results"""
        if not current_step.next_steps:
            return []
        
        # If no conditions, return all next steps
        if not current_step.conditions:
            return current_step.next_steps
        
        # Evaluate conditions to determine which next steps to execute
        valid_next_steps = []
        for next_step_id in current_step.next_steps:
            # Find the step configuration
            next_step = next((s for s in self.steps if s.step_id == next_step_id), None)
            if next_step and self.evaluate_conditions(next_step.conditions, context):
                valid_next_steps.append(next_step_id)
        
        return valid_next_steps
    
    async def execute_agent_step(self, step: WorkflowStep) -> Any:
        """Execute an agent step"""
        agent_config = step.config["agent_config"]
        task = step.config["task"]
        
        # Create or get cached agent
        agent_key = f"agent_{step.step_id}"
        if agent_key not in self.agents:
            agent = VexelMemoryReasoningAgent(
                name=agent_config.get("name", f"WorkflowAgent_{step.step_id}"),
                model=agent_config.get("model", "gemini/gemini-2.5-flash-lite"),
                user_id=self.user_id,
                session_id=self.session_id,
                db_file=self.db_file
            )
            self.agents[agent_key] = agent
        
        agent = self.agents[agent_key]
        
        # Execute task
        logger.info(f"Executing agent step: {step.name}")

        # Create agent if not exists
        if not agent.agent:
            agent.create_agent()

        # Use the underlying agent's arun method
        response = await agent.agent.arun(task)
        result = response.content if hasattr(response, 'content') else str(response)
        
        return {
            "step_id": step.step_id,
            "result": result,
            "agent_name": getattr(agent, 'name', 'VexelAgent'),
            "timestamp": datetime.now().isoformat()
        }
    
    async def execute_team_step(self, step: WorkflowStep) -> Any:
        """Execute a team collaboration step"""
        team_config = step.config["team_config"]
        task = step.config["task"]
        
        # Create or get cached team
        team_key = f"team_{step.step_id}"
        if team_key not in self.teams:
            team = VexelTeamCollaboration(
                team_name=team_config.get("name", f"WorkflowTeam_{step.step_id}"),
                mode=team_config.get("mode", "coordinate"),
                leader_model=team_config.get("leader_model", "gemini/gemini-2.5-flash-lite"),
                user_id=self.user_id,
                session_id=self.session_id,
                db_file=self.db_file,
                knowledge_sources=team_config.get("knowledge_sources", [])
            )
            
            # Load knowledge if provided
            if team_config.get("knowledge_sources"):
                team.load_knowledge(recreate=True)
            
            self.teams[team_key] = team
        
        team = self.teams[team_key]
        
        # Execute task
        logger.info(f"Executing team step: {step.name}")
        result = await team.arun_team_task(task)
        
        return {
            "step_id": step.step_id,
            "result": result,
            "team_name": team.team_name,
            "team_mode": team.mode,
            "timestamp": datetime.now().isoformat()
        }

    async def execute_condition_step(self, step: WorkflowStep) -> Any:
        """Execute a conditional logic step"""
        condition_logic = step.config["condition_logic"]

        logger.info(f"Executing condition step: {step.name}")

        # Evaluate the condition logic against current execution context
        context = {
            "execution_results": self.execution_results,
            "session_state": self.session_state,
            "workflow_status": self.workflow_status.value,
            "current_step": step.step_id
        }

        # Simple condition evaluation
        condition_result = self.evaluate_conditions([condition_logic], context)

        return {
            "step_id": step.step_id,
            "condition_result": condition_result,
            "evaluated_context": context,
            "timestamp": datetime.now().isoformat()
        }

    async def execute_external_step(self, step: WorkflowStep) -> Any:
        """Execute an external system integration step"""
        external_config = step.config

        logger.info(f"Executing external step: {step.name}")

        integration_type = external_config.get("type", "http")

        if integration_type == "http":
            return await self._execute_http_integration(step, external_config)
        elif integration_type == "file":
            return await self._execute_file_integration(step, external_config)
        elif integration_type == "database":
            return await self._execute_database_integration(step, external_config)
        else:
            raise ValueError(f"Unsupported integration type: {integration_type}")

    async def _execute_http_integration(self, step: WorkflowStep, config: Dict[str, Any]) -> Any:
        """Execute HTTP API integration"""
        import httpx

        method = config.get("method", "GET").upper()
        url = config.get("url")
        headers = config.get("headers", {})
        data = config.get("data", {})
        timeout = config.get("timeout", 30)

        if not url:
            raise ValueError("URL is required for HTTP integration")

        async with httpx.AsyncClient() as client:
            if method == "GET":
                response = await client.get(url, headers=headers, timeout=timeout)
            elif method == "POST":
                response = await client.post(url, headers=headers, json=data, timeout=timeout)
            elif method == "PUT":
                response = await client.put(url, headers=headers, json=data, timeout=timeout)
            elif method == "DELETE":
                response = await client.delete(url, headers=headers, timeout=timeout)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            response.raise_for_status()

            return {
                "step_id": step.step_id,
                "status_code": response.status_code,
                "response_data": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text,
                "timestamp": datetime.now().isoformat()
            }

    async def _execute_file_integration(self, step: WorkflowStep, config: Dict[str, Any]) -> Any:
        """Execute file system integration"""
        operation = config.get("operation", "read")
        file_path = config.get("file_path")
        content = config.get("content", "")

        if not file_path:
            raise ValueError("File path is required for file integration")

        if operation == "read":
            with open(file_path, 'r', encoding='utf-8') as f:
                file_content = f.read()
            return {
                "step_id": step.step_id,
                "operation": "read",
                "file_path": file_path,
                "content": file_content,
                "timestamp": datetime.now().isoformat()
            }
        elif operation == "write":
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return {
                "step_id": step.step_id,
                "operation": "write",
                "file_path": file_path,
                "bytes_written": len(content.encode('utf-8')),
                "timestamp": datetime.now().isoformat()
            }
        elif operation == "append":
            with open(file_path, 'a', encoding='utf-8') as f:
                f.write(content)
            return {
                "step_id": step.step_id,
                "operation": "append",
                "file_path": file_path,
                "bytes_appended": len(content.encode('utf-8')),
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise ValueError(f"Unsupported file operation: {operation}")

    async def _execute_database_integration(self, step: WorkflowStep, config: Dict[str, Any]) -> Any:
        """Execute database integration"""
        # Placeholder for database integration
        # In a real implementation, you would connect to various databases
        operation = config.get("operation", "query")
        query = config.get("query", "")

        return {
            "step_id": step.step_id,
            "operation": operation,
            "query": query,
            "result": "Database integration placeholder - implement based on your needs",
            "timestamp": datetime.now().isoformat()
        }

    async def execute_parallel_step(self, step: WorkflowStep) -> Any:
        """Execute parallel tasks"""
        parallel_tasks = step.config["parallel_tasks"]

        logger.info(f"Executing parallel step: {step.name} with {len(parallel_tasks)} tasks")

        # Create tasks for parallel execution
        tasks = []
        for task_config in parallel_tasks:
            task_type = task_config.get("type", "agent")

            if task_type == "agent":
                # Create a temporary agent step
                temp_step = WorkflowStep(
                    step_id=f"{step.step_id}_{task_config.get('name', 'parallel_agent')}",
                    name=task_config.get("name", "Parallel Agent Task"),
                    step_type="agent",
                    config={
                        "agent_config": task_config.get("agent_config", {}),
                        "task": task_config.get("task", "")
                    }
                )
                tasks.append(self.execute_agent_step(temp_step))

            elif task_type == "team":
                # Create a temporary team step
                temp_step = WorkflowStep(
                    step_id=f"{step.step_id}_{task_config.get('name', 'parallel_team')}",
                    name=task_config.get("name", "Parallel Team Task"),
                    step_type="team",
                    config={
                        "team_config": task_config.get("team_config", {}),
                        "task": task_config.get("task", "")
                    }
                )
                tasks.append(self.execute_team_step(temp_step))

            elif task_type == "external":
                # Create a temporary external step
                temp_step = WorkflowStep(
                    step_id=f"{step.step_id}_{task_config.get('name', 'parallel_external')}",
                    name=task_config.get("name", "Parallel External Task"),
                    step_type="external",
                    config=task_config.get("config", {})
                )
                tasks.append(self.execute_external_step(temp_step))

        # Execute all tasks in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results and handle exceptions
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    "task_index": i,
                    "status": "error",
                    "error": str(result),
                    "timestamp": datetime.now().isoformat()
                })
            else:
                processed_results.append({
                    "task_index": i,
                    "status": "success",
                    "result": result,
                    "timestamp": datetime.now().isoformat()
                })

        return {
            "step_id": step.step_id,
            "parallel_results": processed_results,
            "total_tasks": len(parallel_tasks),
            "successful_tasks": len([r for r in processed_results if r["status"] == "success"]),
            "failed_tasks": len([r for r in processed_results if r["status"] == "error"]),
            "timestamp": datetime.now().isoformat()
        }

    async def execute_step(self, step: WorkflowStep) -> Any:
        """Execute a single workflow step"""
        step.status = WorkflowStatus.RUNNING
        step.start_time = datetime.now()

        try:
            if step.step_type == "agent":
                result = await self.execute_agent_step(step)
            elif step.step_type == "team":
                result = await self.execute_team_step(step)
            elif step.step_type == "condition":
                result = await self.execute_condition_step(step)
            elif step.step_type == "external":
                result = await self.execute_external_step(step)
            elif step.step_type == "parallel":
                result = await self.execute_parallel_step(step)
            else:
                raise ValueError(f"Unsupported step type: {step.step_type}")

            step.result = result
            step.status = WorkflowStatus.COMPLETED
            step.end_time = datetime.now()

            # Store result in execution context
            self.execution_results[step.step_id] = result

            logger.info(f"Step completed: {step.name} ({step.step_id})")
            return result

        except Exception as e:
            step.error = str(e)
            step.status = WorkflowStatus.FAILED
            step.end_time = datetime.now()

            logger.error(f"Step failed: {step.name} ({step.step_id}) - {str(e)}")

            # Handle error based on error handling configuration
            if step.error_handling.get("continue_on_error", False):
                logger.info(f"Continuing workflow despite error in step: {step.step_id}")
                return {"error": str(e), "continued": True}
            else:
                raise e

    def run(self, **kwargs) -> Iterator[RunResponse]:
        """Synchronous workflow execution"""
        logger.info(f"Starting workflow: {self.workflow_name}")

        # Run async workflow in sync context
        import asyncio
        try:
            result = asyncio.run(self.arun(**kwargs))
            yield RunResponse(run_id=self.run_id, content=result)
        except Exception as e:
            yield RunResponse(run_id=self.run_id, content=f"Workflow error: {str(e)}")

    async def arun(self, **kwargs) -> str:
        """Asynchronous workflow execution with conditional logic and branching"""
        self.workflow_status = WorkflowStatus.RUNNING
        self.start_time = datetime.now()

        try:
            # Store input parameters in session state
            self.session_state.update(kwargs)

            # Execute workflow steps
            executed_steps = set()
            steps_to_execute = [self.steps[0].step_id] if self.steps else []

            while steps_to_execute:
                current_step_id = steps_to_execute.pop(0)

                # Skip if already executed (prevent infinite loops)
                if current_step_id in executed_steps:
                    continue

                # Find the step
                current_step = next((s for s in self.steps if s.step_id == current_step_id), None)
                if not current_step:
                    logger.warning(f"Step not found: {current_step_id}")
                    continue

                # Check conditions before execution
                context = {
                    "execution_results": self.execution_results,
                    "session_state": self.session_state,
                    "workflow_status": self.workflow_status.value
                }

                if not self.evaluate_conditions(current_step.conditions, context):
                    logger.info(f"Skipping step due to conditions: {current_step.name}")
                    continue

                # Execute the step
                logger.info(f"Executing step: {current_step.name} ({current_step.step_type})")
                await self.execute_step(current_step)
                executed_steps.add(current_step_id)

                # Determine next steps
                next_steps = self.get_next_steps(current_step, context)
                steps_to_execute.extend(next_steps)

            self.workflow_status = WorkflowStatus.COMPLETED
            self.end_time = datetime.now()

            # Generate workflow summary
            summary = self.generate_workflow_summary()

            logger.info(f"Workflow completed: {self.workflow_name}")
            return summary

        except Exception as e:
            self.workflow_status = WorkflowStatus.FAILED
            self.end_time = datetime.now()

            logger.error(f"Workflow failed: {self.workflow_name} - {str(e)}")
            return f"Workflow execution failed: {str(e)}"

    def generate_workflow_summary(self) -> str:
        """Generate a comprehensive workflow execution summary"""
        total_steps = len(self.steps)
        completed_steps = len([s for s in self.steps if s.status == WorkflowStatus.COMPLETED])
        failed_steps = len([s for s in self.steps if s.status == WorkflowStatus.FAILED])

        duration = None
        if self.start_time and self.end_time:
            duration = (self.end_time - self.start_time).total_seconds()

        summary = f"""
# Workflow Execution Summary

**Workflow:** {self.workflow_name}
**Status:** {self.workflow_status.value}
**Duration:** {duration:.2f} seconds
**Steps:** {completed_steps}/{total_steps} completed, {failed_steps} failed

## Step Results:
"""

        for step in self.steps:
            status_emoji = {
                WorkflowStatus.COMPLETED: "✅",
                WorkflowStatus.FAILED: "❌",
                WorkflowStatus.RUNNING: "🔄",
                WorkflowStatus.PENDING: "⏳"
            }.get(step.status, "❓")

            summary += f"\n{status_emoji} **{step.name}** ({step.step_type})"

            if step.status == WorkflowStatus.COMPLETED and step.result:
                # Truncate long results
                result_str = str(step.result)
                if len(result_str) > 200:
                    result_str = result_str[:200] + "..."
                summary += f"\n   Result: {result_str}"

            if step.status == WorkflowStatus.FAILED and step.error:
                summary += f"\n   Error: {step.error}"

        summary += f"\n\n## Execution Context:\n"
        summary += f"- Total execution results: {len(self.execution_results)}\n"
        summary += f"- Session state keys: {list(self.session_state.keys())}\n"

        return summary

    def get_workflow_status(self) -> Dict[str, Any]:
        """Get current workflow status and metrics"""
        return {
            "workflow_name": self.workflow_name,
            "workflow_id": self.workflow_id,
            "status": self.workflow_status.value,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "total_steps": len(self.steps),
            "completed_steps": len([s for s in self.steps if s.status == WorkflowStatus.COMPLETED]),
            "failed_steps": len([s for s in self.steps if s.status == WorkflowStatus.FAILED]),
            "current_step": self.current_step_index,
            "execution_results_count": len(self.execution_results),
            "session_state_keys": list(self.session_state.keys())
        }

    def pause_workflow(self):
        """Pause workflow execution"""
        self.workflow_status = WorkflowStatus.PAUSED
        logger.info(f"Workflow paused: {self.workflow_name}")

    def resume_workflow(self):
        """Resume workflow execution"""
        if self.workflow_status == WorkflowStatus.PAUSED:
            self.workflow_status = WorkflowStatus.RUNNING
            logger.info(f"Workflow resumed: {self.workflow_name}")

    def cancel_workflow(self):
        """Cancel workflow execution"""
        self.workflow_status = WorkflowStatus.CANCELLED
        self.end_time = datetime.now()
        logger.info(f"Workflow cancelled: {self.workflow_name}")


# Workflow Templates and Factory Functions

def create_research_analysis_workflow(
    topic: str,
    user_id: str = "default_user",
    **kwargs
) -> VexelAgenticWorkflow:
    """
    Create a research and analysis workflow template
    """
    workflow = VexelAgenticWorkflow(
        workflow_name="ResearchAnalysisWorkflow",
        workflow_description=f"Research and analyze: {topic}",
        user_id=user_id,
        **kwargs
    )

    # Step 1: Research
    workflow.add_team_step(
        step_id="research_step",
        name="Research Phase",
        team_config={
            "name": "ResearchTeam",
            "mode": "coordinate",
            "leader_model": "gemini/gemini-2.5-flash-lite"
        },
        task=f"Research comprehensive information about: {topic}",
        next_steps=["analysis_step"]
    )

    # Step 2: Analysis
    workflow.add_agent_step(
        step_id="analysis_step",
        name="Analysis Phase",
        agent_config={
            "name": "AnalysisAgent",
            "model": "gemini/gemini-2.5-flash-lite"
        },
        task=f"Analyze the research findings and provide insights about: {topic}",
        next_steps=["report_step"]
    )

    # Step 3: Report Generation
    workflow.add_agent_step(
        step_id="report_step",
        name="Report Generation",
        agent_config={
            "name": "ReportAgent",
            "model": "gemini/gemini-2.5-flash-lite"
        },
        task="Generate a comprehensive report based on research and analysis results"
    )

    return workflow


def create_conditional_workflow(
    user_id: str = "default_user",
    **kwargs
) -> VexelAgenticWorkflow:
    """
    Create a workflow with conditional branching
    """
    workflow = VexelAgenticWorkflow(
        workflow_name="ConditionalWorkflow",
        workflow_description="Workflow with conditional logic and branching",
        user_id=user_id,
        **kwargs
    )

    # Step 1: Initial Assessment
    workflow.add_agent_step(
        step_id="assessment_step",
        name="Initial Assessment",
        agent_config={
            "name": "AssessmentAgent",
            "model": "gemini/gemini-2.5-flash-lite"
        },
        task="Assess the complexity of the given task and determine the approach",
        next_steps=["condition_step"]
    )

    # Step 2: Conditional Logic
    workflow.add_condition_step(
        step_id="condition_step",
        name="Complexity Check",
        condition_logic={
            "type": "contains",
            "field": "assessment_step",
            "value": "complex"
        },
        next_steps=["complex_path", "simple_path"]
    )

    # Step 3a: Complex Path
    workflow.add_team_step(
        step_id="complex_path",
        name="Complex Task Handling",
        team_config={
            "name": "ComplexTeam",
            "mode": "collaborate",
            "leader_model": "gemini/gemini-2.5-flash-lite"
        },
        task="Handle complex task with team collaboration",
        conditions=[{
            "type": "contains",
            "field": "assessment_step",
            "value": "complex"
        }],
        next_steps=["final_step"]
    )

    # Step 3b: Simple Path
    workflow.add_agent_step(
        step_id="simple_path",
        name="Simple Task Handling",
        agent_config={
            "name": "SimpleAgent",
            "model": "gemini/gemini-2.5-flash-lite"
        },
        task="Handle simple task with single agent",
        conditions=[{
            "type": "not_equals",
            "field": "assessment_step",
            "value": "complex"
        }],
        next_steps=["final_step"]
    )

    # Step 4: Final Processing
    workflow.add_agent_step(
        step_id="final_step",
        name="Final Processing",
        agent_config={
            "name": "FinalAgent",
            "model": "gemini/gemini-2.5-flash-lite"
        },
        task="Finalize and summarize the results"
    )

    return workflow


def create_parallel_processing_workflow(
    tasks: List[str],
    user_id: str = "default_user",
    **kwargs
) -> VexelAgenticWorkflow:
    """
    Create a workflow with parallel task processing
    """
    workflow = VexelAgenticWorkflow(
        workflow_name="ParallelProcessingWorkflow",
        workflow_description="Workflow with parallel task execution",
        user_id=user_id,
        **kwargs
    )

    # Step 1: Parallel Processing
    parallel_tasks = []
    for i, task in enumerate(tasks):
        parallel_tasks.append({
            "type": "agent",
            "name": f"parallel_agent_{i}",
            "agent_config": {
                "name": f"ParallelAgent_{i}",
                "model": "gemini/gemini-2.5-flash-lite"
            },
            "task": task
        })

    workflow.add_parallel_step(
        step_id="parallel_processing",
        name="Parallel Task Processing",
        parallel_tasks=parallel_tasks,
        next_steps=["aggregation_step"]
    )

    # Step 2: Result Aggregation
    workflow.add_agent_step(
        step_id="aggregation_step",
        name="Result Aggregation",
        agent_config={
            "name": "AggregationAgent",
            "model": "gemini/gemini-2.5-flash-lite"
        },
        task="Aggregate and synthesize results from parallel processing"
    )

    return workflow


def create_external_integration_workflow(
    api_endpoints: List[Dict[str, Any]],
    user_id: str = "default_user",
    **kwargs
) -> VexelAgenticWorkflow:
    """
    Create a workflow with external system integrations
    """
    workflow = VexelAgenticWorkflow(
        workflow_name="ExternalIntegrationWorkflow",
        workflow_description="Workflow with external system integrations",
        user_id=user_id,
        **kwargs
    )

    # Step 1: Data Collection from External APIs
    for i, endpoint in enumerate(api_endpoints):
        workflow.add_external_step(
            step_id=f"external_api_{i}",
            name=f"External API Call {i+1}",
            external_config={
                "type": "http",
                "method": endpoint.get("method", "GET"),
                "url": endpoint.get("url"),
                "headers": endpoint.get("headers", {}),
                "data": endpoint.get("data", {})
            },
            next_steps=["processing_step"] if i == len(api_endpoints) - 1 else [f"external_api_{i+1}"]
        )

    # Step 2: Process External Data
    workflow.add_agent_step(
        step_id="processing_step",
        name="External Data Processing",
        agent_config={
            "name": "DataProcessingAgent",
            "model": "gemini/gemini-2.5-flash-lite"
        },
        task="Process and analyze data collected from external systems",
        next_steps=["output_step"]
    )

    # Step 3: Generate Output File
    workflow.add_external_step(
        step_id="output_step",
        name="Generate Output File",
        external_config={
            "type": "file",
            "operation": "write",
            "file_path": "tmp/workflow_output.json",
            "content": "Processed results will be written here"
        }
    )

    return workflow


def create_monitoring_workflow(
    monitored_systems: List[str],
    user_id: str = "default_user",
    **kwargs
) -> VexelAgenticWorkflow:
    """
    Create a monitoring and alerting workflow
    """
    workflow = VexelAgenticWorkflow(
        workflow_name="MonitoringWorkflow",
        workflow_description="System monitoring and alerting workflow",
        user_id=user_id,
        **kwargs
    )

    # Step 1: System Health Check
    workflow.add_parallel_step(
        step_id="health_check",
        name="System Health Check",
        parallel_tasks=[
            {
                "type": "external",
                "name": f"check_{system}",
                "config": {
                    "type": "http",
                    "method": "GET",
                    "url": f"http://{system}/health",
                    "timeout": 10
                }
            }
            for system in monitored_systems
        ],
        next_steps=["analysis_step"]
    )

    # Step 2: Analyze Health Status
    workflow.add_agent_step(
        step_id="analysis_step",
        name="Health Status Analysis",
        agent_config={
            "name": "MonitoringAgent",
            "model": "gemini/gemini-2.5-flash-lite"
        },
        task="Analyze system health check results and identify issues",
        next_steps=["alert_condition"]
    )

    # Step 3: Alert Condition
    workflow.add_condition_step(
        step_id="alert_condition",
        name="Alert Condition Check",
        condition_logic={
            "type": "contains",
            "field": "analysis_step",
            "value": "issue"
        },
        next_steps=["alert_step", "report_step"]
    )

    # Step 4a: Send Alert
    workflow.add_external_step(
        step_id="alert_step",
        name="Send Alert",
        external_config={
            "type": "http",
            "method": "POST",
            "url": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
            "data": {"text": "System health issue detected"}
        },
        conditions=[{
            "type": "contains",
            "field": "analysis_step",
            "value": "issue"
        }],
        next_steps=["report_step"]
    )

    # Step 4b: Generate Report
    workflow.add_agent_step(
        step_id="report_step",
        name="Generate Monitoring Report",
        agent_config={
            "name": "ReportAgent",
            "model": "gemini/gemini-2.5-flash-lite"
        },
        task="Generate comprehensive monitoring report"
    )

    return workflow
