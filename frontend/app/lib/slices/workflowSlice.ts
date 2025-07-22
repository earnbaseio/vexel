/**
 * Redux slice for Workflow Management
 */

import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
} from "@reduxjs/toolkit";
import {
  IWorkflowTemplate,
  IWorkflowTemplateCreate,
  IWorkflowTemplateUpdate,
  IWorkflowExecution,
  IWorkflowStepExecution,
  IWorkflowSchedule,
  IWorkflowScheduleCreate,
  IWorkflowExecuteRequest,
  WorkflowStatus,
  StepType,
} from "../interfaces/workflow";
import { workflowAPI } from "../api";
import { RootState } from "../store";
import { addNotice } from "./toastsSlice";

// State interface
interface WorkflowState {
  // Templates
  templates: IWorkflowTemplate[];
  currentTemplate: IWorkflowTemplate | null;
  publicTemplates: IWorkflowTemplate[];
  
  // Executions
  executions: IWorkflowExecution[];
  currentExecution: IWorkflowExecution | null;
  stepExecutions: Record<string, IWorkflowStepExecution[]>; // executionId -> steps[]
  
  // Schedules
  schedules: IWorkflowSchedule[];
  
  // UI state
  loading: {
    templates: boolean;
    executions: boolean;
    schedules: boolean;
    executing: boolean;
    creating: boolean;
    updating: boolean;
    deleting: boolean;
  };
  
  // Pagination
  pagination: {
    templates: {
      page: number;
      pageSize: number;
      total: number;
    };
    executions: {
      page: number;
      pageSize: number;
      total: number;
    };
  };
  
  // Filters
  filters: {
    category?: string;
    complexity?: string;
    status?: WorkflowStatus;
    isPublic?: boolean;
  };
  
  error: string | null;
}

// Initial state
const initialState: WorkflowState = {
  templates: [],
  currentTemplate: null,
  publicTemplates: [],
  executions: [],
  currentExecution: null,
  stepExecutions: {},
  schedules: [],
  loading: {
    templates: false,
    executions: false,
    schedules: false,
    executing: false,
    creating: false,
    updating: false,
    deleting: false,
  },
  pagination: {
    templates: {
      page: 1,
      pageSize: 20,
      total: 0,
    },
    executions: {
      page: 1,
      pageSize: 20,
      total: 0,
    },
  },
  filters: {},
  error: null,
};

// Async thunks
export const fetchWorkflowTemplates = createAsyncThunk(
  "workflow/fetchTemplates",
  async (params: any = {}, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.tokens.access_token;
      
      if (!token) {
        throw new Error("No access token available");
      }
      
      const response = await workflowAPI.listTemplates(params, token);
      return response;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to fetch workflow templates",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

export const createWorkflowTemplate = createAsyncThunk(
  "workflow/createTemplate",
  async (data: IWorkflowTemplateCreate, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.tokens.access_token;

      if (!token) {
        throw new Error("No access token available");
      }

      const template = await workflowAPI.createTemplate(data, token);
      
      dispatch(addNotice({
        title: "Success",
        message: `Workflow template "${template.name}" created successfully`,
        type: "success",
      }));
      
      return template;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to create workflow template",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

export const executeWorkflow = createAsyncThunk(
  "workflow/executeWorkflow",
  async (data: IWorkflowExecuteRequest, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.tokens.access_token;

      if (!token) {
        throw new Error("No access token available");
      }

      const response = await workflowAPI.executeWorkflow(data, token);
      
      dispatch(addNotice({
        title: "Success",
        message: "Workflow execution started successfully",
        type: "success",
      }));
      
      return response;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to execute workflow",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

export const fetchWorkflowExecutions = createAsyncThunk(
  "workflow/fetchExecutions",
  async (
    params: { status?: WorkflowStatus; templateId?: string; page?: number; pageSize?: number } = {},
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.tokens.access_token;

      if (!token) {
        throw new Error("No access token available");
      }

      const response = await workflowAPI.listExecutions(
        params.status,
        params.templateId,
        params.page || 1,
        params.pageSize || 20,
        token
      );
      return response;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to fetch workflow executions",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

export const fetchStepExecutions = createAsyncThunk(
  "workflow/fetchStepExecutions",
  async (executionId: string, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.tokens.access_token;

      if (!token) {
        throw new Error("No access token available");
      }

      const steps = await workflowAPI.listStepExecutions(executionId, token);
      return { executionId, steps };
    } catch (error: any) {
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to fetch step executions",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

export const cancelWorkflowExecution = createAsyncThunk(
  "workflow/cancelExecution",
  async (executionId: string, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.tokens.access_token;

      if (!token) {
        throw new Error("No access token available");
      }

      await workflowAPI.cancelExecution(executionId, token);
      
      dispatch(addNotice({
        title: "Success",
        message: "Workflow execution cancelled successfully",
        type: "success",
      }));
      
      return executionId;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to cancel workflow execution",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

export const updateWorkflowTemplate = createAsyncThunk(
  "workflow/updateTemplate",
  async (
    { templateId, data }: { templateId: string; data: IWorkflowTemplateUpdate },
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.tokens.access_token;

      if (!token) {
        throw new Error("No access token available");
      }

      const template = await workflowAPI.updateTemplate(templateId, data, token);
      
      dispatch(addNotice({
        title: "Success",
        message: `Workflow template "${template.name}" updated successfully`,
        type: "success",
      }));
      
      return template;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to update workflow template",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

export const deleteWorkflowTemplate = createAsyncThunk(
  "workflow/deleteTemplate",
  async (templateId: string, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.tokens.access_token;

      if (!token) {
        throw new Error("No access token available");
      }

      await workflowAPI.deleteTemplate(templateId, token);
      
      dispatch(addNotice({
        title: "Success",
        message: "Workflow template deleted successfully",
        type: "success",
      }));
      
      return templateId;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to delete workflow template",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const workflowSlice = createSlice({
  name: "workflow",
  initialState,
  reducers: {
    setCurrentTemplate: (state, action: PayloadAction<IWorkflowTemplate | null>) => {
      state.currentTemplate = action.payload;
    },
    
    setCurrentExecution: (state, action: PayloadAction<IWorkflowExecution | null>) => {
      state.currentExecution = action.payload;
    },
    
    setWorkflowFilters: (state, action: PayloadAction<Partial<WorkflowState["filters"]>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    setTemplatePagination: (state, action: PayloadAction<Partial<WorkflowState["pagination"]["templates"]>>) => {
      state.pagination.templates = { ...state.pagination.templates, ...action.payload };
    },
    
    setExecutionPagination: (state, action: PayloadAction<Partial<WorkflowState["pagination"]["executions"]>>) => {
      state.pagination.executions = { ...state.pagination.executions, ...action.payload };
    },
    
    updateExecutionStatus: (state, action: PayloadAction<{ executionId: string; status: WorkflowStatus; progress?: number }>) => {
      const { executionId, status, progress } = action.payload;
      const execution = state.executions.find(e => e.execution_id === executionId);
      if (execution) {
        execution.status = status;
        if (progress !== undefined) {
          execution.progress = progress;
        }
      }
      if (state.currentExecution?.execution_id === executionId) {
        state.currentExecution.status = status;
        if (progress !== undefined) {
          state.currentExecution.progress = progress;
        }
      }
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    resetWorkflowState: () => initialState,
  },
  
  extraReducers: (builder) => {
    // Fetch templates
    builder
      .addCase(fetchWorkflowTemplates.pending, (state) => {
        state.loading.templates = true;
        state.error = null;
      })
      .addCase(fetchWorkflowTemplates.fulfilled, (state, action) => {
        state.loading.templates = false;
        state.templates = action.payload.templates;
        state.pagination.templates.total = action.payload.total;
        state.pagination.templates.page = action.payload.page;
        state.pagination.templates.pageSize = action.payload.page_size;
      })
      .addCase(fetchWorkflowTemplates.rejected, (state, action) => {
        state.loading.templates = false;
        state.error = action.payload as string;
      });

    // Create template
    builder
      .addCase(createWorkflowTemplate.pending, (state) => {
        state.loading.creating = true;
        state.error = null;
      })
      .addCase(createWorkflowTemplate.fulfilled, (state, action) => {
        state.loading.creating = false;
        state.templates.unshift(action.payload);
      })
      .addCase(createWorkflowTemplate.rejected, (state, action) => {
        state.loading.creating = false;
        state.error = action.payload as string;
      });

    // Execute workflow
    builder
      .addCase(executeWorkflow.pending, (state) => {
        state.loading.executing = true;
        state.error = null;
      })
      .addCase(executeWorkflow.fulfilled, (state, action) => {
        state.loading.executing = false;
        state.executions.unshift(action.payload.execution);
        state.currentExecution = action.payload.execution;
      })
      .addCase(executeWorkflow.rejected, (state, action) => {
        state.loading.executing = false;
        state.error = action.payload as string;
      });

    // Fetch executions
    builder
      .addCase(fetchWorkflowExecutions.pending, (state) => {
        state.loading.executions = true;
        state.error = null;
      })
      .addCase(fetchWorkflowExecutions.fulfilled, (state, action) => {
        state.loading.executions = false;
        state.executions = action.payload.executions;
        state.pagination.executions.total = action.payload.total;
        state.pagination.executions.page = action.payload.page;
        state.pagination.executions.pageSize = action.payload.page_size;
      })
      .addCase(fetchWorkflowExecutions.rejected, (state, action) => {
        state.loading.executions = false;
        state.error = action.payload as string;
      });

    // Fetch step executions
    builder
      .addCase(fetchStepExecutions.fulfilled, (state, action) => {
        const { executionId, steps } = action.payload;
        state.stepExecutions[executionId] = steps;
      });

    // Cancel execution
    builder
      .addCase(cancelWorkflowExecution.fulfilled, (state, action) => {
        const executionId = action.payload;
        const execution = state.executions.find(e => e.execution_id === executionId);
        if (execution) {
          execution.status = WorkflowStatus.CANCELLED;
        }
        if (state.currentExecution?.execution_id === executionId) {
          state.currentExecution.status = WorkflowStatus.CANCELLED;
        }
      });

    // Update template
    builder
      .addCase(updateWorkflowTemplate.fulfilled, (state, action) => {
        const index = state.templates.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
        if (state.currentTemplate?.id === action.payload.id) {
          state.currentTemplate = action.payload;
        }
      });

    // Delete template
    builder
      .addCase(deleteWorkflowTemplate.fulfilled, (state, action) => {
        state.templates = state.templates.filter(t => t.id !== action.payload);
        if (state.currentTemplate?.id === action.payload) {
          state.currentTemplate = null;
        }
      });
  },
});

// Actions
export const {
  setCurrentTemplate,
  setCurrentExecution,
  setWorkflowFilters,
  setTemplatePagination,
  setExecutionPagination,
  updateExecutionStatus,
  clearError,
  resetWorkflowState,
} = workflowSlice.actions;

// Selectors
export const selectWorkflowTemplates = (state: RootState) => state.workflow.templates;
export const selectCurrentTemplate = (state: RootState) => state.workflow.currentTemplate;
export const selectWorkflowExecutions = (state: RootState) => state.workflow.executions;
export const selectCurrentExecution = (state: RootState) => state.workflow.currentExecution;
export const selectStepExecutions = (state: RootState) => state.workflow.stepExecutions;
export const selectWorkflowSchedules = (state: RootState) => state.workflow.schedules;
export const selectWorkflowLoading = (state: RootState) => state.workflow.loading;
export const selectWorkflowFilters = (state: RootState) => state.workflow.filters;
export const selectTemplatePagination = (state: RootState) => state.workflow.pagination.templates;
export const selectExecutionPagination = (state: RootState) => state.workflow.pagination.executions;
export const selectWorkflowError = (state: RootState) => state.workflow.error;

export default workflowSlice.reducer;
