/**
 * API services for Workflow Management
 */

import {
  IWorkflowTemplate,
  IWorkflowTemplateCreate,
  IWorkflowTemplateUpdate,
  IWorkflowExecution,
  IWorkflowStepExecution,
  IWorkflowSchedule,
  IWorkflowScheduleCreate,
  IWorkflowScheduleUpdate,
  IWorkflowExecuteRequest,
  IWorkflowExecuteResponse,
  IWorkflowListResponse,
  IWorkflowExecutionListResponse,
  IWorkflowSearchRequest,
  WorkflowStatus,
} from "../interfaces/workflow";
import { IMsg } from "../interfaces";
import { apiCore } from "./core";

export const workflowAPI = {
  // ============================================================================
  // WORKFLOW TEMPLATE ENDPOINTS
  // ============================================================================

  /**
   * Create a new workflow template
   */
  async createTemplate(data: IWorkflowTemplateCreate, token: string): Promise<IWorkflowTemplate> {
    const res = await fetch(`${apiCore.url}/workflows/templates`, {
      method: "POST",
      headers: apiCore.headers(token),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to create workflow template: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * List workflow templates
   */
  async listTemplates(params: IWorkflowSearchRequest = {}, token: string): Promise<IWorkflowListResponse> {
    const searchParams = new URLSearchParams();

    if (params.category) searchParams.append("category", params.category);
    if (params.complexity_level) searchParams.append("complexity_level", params.complexity_level);
    if (params.is_public !== undefined) searchParams.append("public_only", params.is_public.toString());
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.page_size) searchParams.append("page_size", params.page_size.toString());

    const res = await fetch(`${apiCore.url}/workflows/templates?${searchParams}`, {
      method: "GET",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to list workflow templates: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Get a specific workflow template
   */
  async getTemplate(templateId: string, token: string): Promise<IWorkflowTemplate> {
    const res = await fetch(`${apiCore.url}/workflows/templates/${templateId}`, {
      method: "GET",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to get workflow template: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Update a workflow template
   */
  async updateTemplate(templateId: string, data: IWorkflowTemplateUpdate, token: string): Promise<IWorkflowTemplate> {
    const res = await fetch(`${apiCore.url}/workflows/templates/${templateId}`, {
      method: "PUT",
      headers: apiCore.headers(token),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to update workflow template: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Delete a workflow template
   */
  async deleteTemplate(templateId: string, token: string): Promise<IMsg> {
    const res = await fetch(`${apiCore.url}/workflows/templates/${templateId}`, {
      method: "DELETE",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to delete workflow template: ${res.statusText}`);
    }

    return await res.json();
  },

  // ============================================================================
  // WORKFLOW EXECUTION ENDPOINTS
  // ============================================================================

  /**
   * Execute a workflow
   */
  async executeWorkflow(data: IWorkflowExecuteRequest, token: string): Promise<IWorkflowExecuteResponse> {
    const res = await fetch(`${apiCore.url}/workflows/execute`, {
      method: "POST",
      headers: apiCore.headers(token),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to execute workflow: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * List workflow executions
   */
  async listExecutions(
    status?: WorkflowStatus,
    templateId?: string,
    page: number = 1,
    pageSize: number = 20,
    token: string = ""
  ): Promise<IWorkflowExecutionListResponse> {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (status) searchParams.append("status", status);
    if (templateId) searchParams.append("template_id", templateId);

    const res = await fetch(`${apiCore.url}/workflows/executions?${searchParams}`, {
      method: "GET",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to list workflow executions: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Get a specific workflow execution
   */
  async getExecution(executionId: string, token: string): Promise<IWorkflowExecution> {
    const res = await fetch(`${apiCore.url}/workflows/executions/${executionId}`, {
      method: "GET",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to get workflow execution: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * List step executions for a workflow execution
   */
  async listStepExecutions(executionId: string, token: string): Promise<IWorkflowStepExecution[]> {
    const res = await fetch(`${apiCore.url}/workflows/executions/${executionId}/steps`, {
      method: "GET",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to list step executions: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Cancel a workflow execution
   */
  async cancelExecution(executionId: string, token: string): Promise<IMsg> {
    const res = await fetch(`${apiCore.url}/workflows/executions/${executionId}/cancel`, {
      method: "POST",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to cancel workflow execution: ${res.statusText}`);
    }

    return await res.json();
  },

  // ============================================================================
  // WORKFLOW SCHEDULE ENDPOINTS
  // ============================================================================

  /**
   * Create a new workflow schedule
   */
  async createSchedule(data: IWorkflowScheduleCreate, token: string): Promise<IWorkflowSchedule> {
    const res = await fetch(`${apiCore.url}/workflows/schedules`, {
      method: "POST",
      headers: apiCore.headers(token),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to create workflow schedule: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * List workflow schedules
   */
  async listSchedules(activeOnly: boolean = false, token: string = ""): Promise<IWorkflowSchedule[]> {
    const searchParams = new URLSearchParams();

    if (activeOnly) searchParams.append("active_only", "true");

    const res = await fetch(`${apiCore.url}/workflows/schedules?${searchParams}`, {
      method: "GET",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to list workflow schedules: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Get a specific workflow schedule
   */
  async getSchedule(scheduleId: string, token: string): Promise<IWorkflowSchedule> {
    const res = await fetch(`${apiCore.url}/workflows/schedules/${scheduleId}`, {
      method: "GET",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to get workflow schedule: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Update a workflow schedule
   */
  async updateSchedule(scheduleId: string, data: IWorkflowScheduleUpdate, token: string): Promise<IWorkflowSchedule> {
    const res = await fetch(`${apiCore.url}/workflows/schedules/${scheduleId}`, {
      method: "PUT",
      headers: apiCore.headers(token),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to update workflow schedule: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Delete a workflow schedule
   */
  async deleteSchedule(scheduleId: string, token: string): Promise<IMsg> {
    const res = await fetch(`${apiCore.url}/workflows/schedules/${scheduleId}`, {
      method: "DELETE",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to delete workflow schedule: ${res.statusText}`);
    }

    return await res.json();
  },

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get workflow execution status
   */
  async getExecutionStatus(executionId: string, token: string): Promise<{ status: WorkflowStatus; progress: number }> {
    const execution = await this.getExecution(executionId, token);
    const progress = execution.steps_completed / (execution.steps_completed + (execution.steps.length - execution.steps_completed)) * 100;
    
    return {
      status: execution.status,
      progress: Math.round(progress)
    };
  },

  /**
   * Poll workflow execution until completion
   */
  async pollExecution(
    executionId: string, 
    token: string, 
    onUpdate?: (execution: IWorkflowExecution) => void,
    intervalMs: number = 2000
  ): Promise<IWorkflowExecution> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const execution = await this.getExecution(executionId, token);
          
          if (onUpdate) {
            onUpdate(execution);
          }
          
          if (execution.status === WorkflowStatus.COMPLETED || 
              execution.status === WorkflowStatus.FAILED || 
              execution.status === WorkflowStatus.CANCELLED) {
            resolve(execution);
          } else {
            setTimeout(poll, intervalMs);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      poll();
    });
  },
};
