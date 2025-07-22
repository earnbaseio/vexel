/**
 * TypeScript interfaces for Workflow Management
 */

// Enums
export enum WorkflowStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  PAUSED = "paused"
}

export enum StepType {
  AGENT = "agent",
  TEAM = "team",
  TOOL = "tool",
  CONDITION = "condition",
  LOOP = "loop",
  PARALLEL = "parallel",
  WEBHOOK = "webhook",
  DELAY = "delay"
}

// Base interfaces
export interface IWorkflowStepConfig {
  step_id: string;
  name: string;
  step_type: StepType;
  config: Record<string, any>;
  conditions: Record<string, any>[];
  next_steps: string[];
  error_handling: Record<string, any>;
  description: string;
  timeout_seconds: number;
  retry_count: number;
}

// Workflow Template interfaces
export interface IWorkflowTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  tags: string[];
  estimated_duration: number;
  complexity_level: string; // simple, medium, complex
  
  // Configuration
  steps: IWorkflowStepConfig[];
  global_config: Record<string, any>;
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
  
  // Access control
  is_public: boolean;
  shared_with: string[];
  
  // Usage statistics
  usage_count: number;
  success_rate: number;
  average_duration: number;
  average_rating: number;
  
  // Timestamps
  created: string;
  updated: string;
}

export interface IWorkflowTemplateCreate {
  name: string;
  description?: string;
  category?: string;
  version?: string;
  tags?: string[];
  estimated_duration?: number;
  complexity_level?: string;
  steps: IWorkflowStepConfig[];
  global_config?: Record<string, any>;
  input_schema?: Record<string, any>;
  output_schema?: Record<string, any>;
  is_public?: boolean;
}

export interface IWorkflowTemplateUpdate {
  name?: string;
  description?: string;
  category?: string;
  version?: string;
  tags?: string[];
  estimated_duration?: number;
  complexity_level?: string;
  steps?: IWorkflowStepConfig[];
  global_config?: Record<string, any>;
  input_schema?: Record<string, any>;
  output_schema?: Record<string, any>;
  is_public?: boolean;
}

// Workflow Execution interfaces
export interface IWorkflowExecution {
  id: string;
  execution_id: string;
  workflow_template_id?: string;
  user_id: string;
  session_id: string;
  workflow_name: string;
  input_parameters: Record<string, any>;
  
  // Configuration
  steps: IWorkflowStepConfig[];
  global_config: Record<string, any>;
  
  // Execution state
  status: WorkflowStatus;
  current_step_index: number;
  current_step_id?: string;
  
  // Results
  step_results: Record<string, any>;
  final_result?: any;
  error_details?: Record<string, any>;
  
  // Performance metrics
  total_duration: number;
  steps_completed: number;
  steps_failed: number;
  total_cost: number;
  
  // Timestamps
  created: string;
  started_at?: string;
  completed_at?: string;
  last_activity: string;
}

export interface IWorkflowExecutionCreate {
  execution_id: string;
  workflow_template_id?: string;
  workflow_name: string;
  session_id: string;
  input_parameters: Record<string, any>;
  steps: IWorkflowStepConfig[];
  global_config?: Record<string, any>;
}

export interface IWorkflowExecutionUpdate {
  status?: WorkflowStatus;
  current_step_index?: number;
  current_step_id?: string;
  step_results?: Record<string, any>;
  final_result?: any;
  error_details?: Record<string, any>;
  steps_completed?: number;
  steps_failed?: number;
  total_cost?: number;
}

// Workflow Step Execution interfaces
export interface IWorkflowStepExecution {
  id: string;
  execution_id: string;
  step_id: string;
  step_name: string;
  step_type: StepType;
  
  // Configuration
  step_config: Record<string, any>;
  input_data: Record<string, any>;
  
  // Execution state
  status: WorkflowStatus;
  retry_count: number;
  max_retries: number;
  
  // Results
  output_data?: any;
  error_details?: Record<string, any>;
  logs: string[];
  
  // Performance metrics
  execution_time: number;
  tokens_used: number;
  cost: number;
  
  // Agent/Team information
  agent_id?: string;
  team_id?: string;
  
  // Timestamps
  created: string;
  started_at?: string;
  completed_at?: string;
}

// Workflow Schedule interfaces
export interface IWorkflowSchedule {
  id: string;
  workflow_template_id: string;
  user_id: string;
  schedule_name: string;
  cron_expression: string;
  timezone: string;
  input_parameters: Record<string, any>;
  description: string;
  
  // Schedule state
  is_active: boolean;
  last_execution?: string;
  next_execution?: string;
  execution_count: number;
  max_executions?: number;
  
  // Timestamps
  created: string;
  updated: string;
}

export interface IWorkflowScheduleCreate {
  workflow_template_id: string;
  schedule_name: string;
  cron_expression: string;
  timezone?: string;
  input_parameters?: Record<string, any>;
  description?: string;
  max_executions?: number;
}

export interface IWorkflowScheduleUpdate {
  schedule_name?: string;
  cron_expression?: string;
  timezone?: string;
  input_parameters?: Record<string, any>;
  description?: string;
  is_active?: boolean;
  max_executions?: number;
}

// API Request/Response interfaces
export interface IWorkflowExecuteRequest {
  workflow_template_id?: string;
  workflow_name: string;
  input_parameters: Record<string, any>;
  session_id?: string;
  async_execution?: boolean;
}

export interface IWorkflowExecuteResponse {
  execution_id: string;
  workflow_name: string;
  status: WorkflowStatus;
  result?: any;
  
  // Performance metrics
  duration: number;
  steps_completed: number;
  total_steps: number;
  cost: number;
  
  // Timestamps
  started_at: string;
  completed_at?: string;
  
  // Additional info
  step_results: Record<string, any>;
  error_details?: Record<string, any>;
}

export interface IWorkflowListResponse {
  templates: IWorkflowTemplate[];
  total: number;
  page: number;
  page_size: number;
}

export interface IWorkflowExecutionListResponse {
  executions: IWorkflowExecution[];
  total: number;
  page: number;
  page_size: number;
}

export interface IWorkflowSearchRequest {
  query?: string;
  category?: string;
  complexity_level?: string;
  tags?: string[];
  is_public?: boolean;
  page?: number;
  page_size?: number;
}
