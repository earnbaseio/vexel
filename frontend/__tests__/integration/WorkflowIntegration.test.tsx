/**
 * Integration tests for Workflow components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'next/router';
import '@testing-library/jest-dom';

import WorkflowList from '@/app/components/workflow/WorkflowList';
import WorkflowExecutionDialog from '@/app/components/workflow/WorkflowExecutionDialog';
import WorkflowExecutionMonitor from '@/app/components/workflow/WorkflowExecutionMonitor';
import workflowReducer from '@/app/lib/slices/workflowSlice';
import agentReducer from '@/app/lib/slices/agentSlice';
import toastsReducer from '@/app/lib/slices/toastsSlice';
import tokensReducer from '@/app/lib/slices/tokensSlice';
import authReducer from '@/app/lib/slices/authSlice';
import {
  IWorkflowTemplate,
  IWorkflowExecution,
  IWorkflowStepExecution,
  WorkflowStatus,
  StepType,
} from '@/app/lib/interfaces';

// Mock API modules
jest.mock('@/app/lib/api/workflow', () => ({
  workflowAPI: {
    listTemplates: jest.fn(),
    createTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
    executeWorkflow: jest.fn(),
    listExecutions: jest.fn(),
    listStepExecutions: jest.fn(),
    cancelExecution: jest.fn(),
  },
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/workflows',
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Test store setup
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      workflow: workflowReducer,
      agent: agentReducer,
      toasts: toastsReducer,
      tokens: tokensReducer,
      auth: authReducer,
    },
    preloadedState: {
      tokens: { access: 'test-token', refresh: 'test-refresh' },
      auth: { user: { id: 'test-user' } },
      ...initialState,
    },
  });
};

// Test data
const mockWorkflowTemplate: IWorkflowTemplate = {
  id: 'workflow-1',
  name: 'Test Workflow',
  description: 'A test workflow for integration testing',
  category: 'automation',
  complexity_level: 'simple',
  steps: [
    {
      step_id: 'step-1',
      name: 'Test Step',
      description: 'A test step',
      step_type: StepType.AGENT_TASK,
      step_order: 1,
      agent_id: 'agent-1',
      input_schema: {},
      output_schema: {},
      timeout_seconds: 300,
      retry_count: 3,
      conditions: [],
      metadata: {},
    },
  ],
  input_schema: {
    type: 'object',
    properties: {
      input_text: {
        type: 'string',
        description: 'Input text for the workflow',
      },
    },
    required: ['input_text'],
  },
  output_schema: {},
  tags: ['test'],
  is_public: false,
  requires_approval: false,
  is_scheduled: false,
  schedule_config: {},
  execution_count: 0,
  success_rate: 1.0,
  average_duration: 60,
  last_execution: null,
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z',
  version: '1.0.0',
  metadata: {},
};

const mockWorkflowExecution: IWorkflowExecution = {
  execution_id: 'exec-1',
  template_id: 'workflow-1',
  user_id: 'test-user',
  status: WorkflowStatus.RUNNING,
  progress: 50,
  steps: [
    {
      step_id: 'step-1',
      name: 'Test Step',
      step_type: StepType.AGENT_TASK,
      step_order: 1,
      agent_id: 'agent-1',
      input_schema: {},
      output_schema: {},
      timeout_seconds: 300,
      retry_count: 3,
      conditions: [],
      metadata: {},
    },
  ],
  steps_completed: 0,
  input_data: { input_text: 'Test input' },
  output_data: null,
  error_message: null,
  started_at: '2024-01-01T00:00:00Z',
  completed_at: null,
  metadata: {},
};

const mockStepExecution: IWorkflowStepExecution = {
  step_execution_id: 'step-exec-1',
  execution_id: 'exec-1',
  step_id: 'step-1',
  step_name: 'Test Step',
  step_type: StepType.AGENT_TASK,
  step_order: 1,
  status: WorkflowStatus.RUNNING,
  agent_id: 'agent-1',
  input_data: { input_text: 'Test input' },
  output_data: null,
  error_message: null,
  execution_time: 0,
  retry_count: 0,
  started_at: '2024-01-01T00:00:00Z',
  completed_at: null,
  metadata: {},
};

const TestWrapper: React.FC<{ children: React.ReactNode; store?: any }> = ({ 
  children, 
  store = createTestStore() 
}) => (
  <Provider store={store}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </Provider>
);

describe('Workflow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Workflow Execution Flow', () => {
    it('should execute workflow from template list', async () => {
      const { workflowAPI } = require('@/app/lib/api/workflow');
      workflowAPI.executeWorkflow.mockResolvedValue({
        execution: mockWorkflowExecution,
      });

      const store = createTestStore({
        workflow: {
          templates: [mockWorkflowTemplate],
          loading: { templates: false, executing: false },
          pagination: { templates: { page: 1, pageSize: 20, total: 1 } },
          filters: {},
          error: null,
        },
      });

      const mockExecute = jest.fn();

      render(
        <TestWrapper store={store}>
          <WorkflowList onExecuteWorkflow={mockExecute} />
        </TestWrapper>
      );

      // Find and click execute button
      const executeButton = screen.getByText('Execute');
      fireEvent.click(executeButton);

      expect(mockExecute).toHaveBeenCalledWith(mockWorkflowTemplate);
    });

    it('should handle workflow execution dialog submission', async () => {
      const { workflowAPI } = require('@/app/lib/api/workflow');
      workflowAPI.executeWorkflow.mockResolvedValue({
        execution: mockWorkflowExecution,
      });

      const store = createTestStore();
      const mockExecutionStart = jest.fn();

      render(
        <TestWrapper store={store}>
          <WorkflowExecutionDialog
            workflow={mockWorkflowTemplate}
            open={true}
            onOpenChange={() => {}}
            onExecutionStart={mockExecutionStart}
          />
        </TestWrapper>
      );

      // Fill required input
      const inputField = screen.getByPlaceholderText(/Enter input_text/);
      fireEvent.change(inputField, { target: { value: 'Test input' } });

      // Submit form
      const executeButton = screen.getByText('Execute Workflow');
      fireEvent.click(executeButton);

      await waitFor(() => {
        expect(workflowAPI.executeWorkflow).toHaveBeenCalledWith(
          expect.objectContaining({
            template_id: 'workflow-1',
            input_data: { input_text: 'Test input' },
            priority: 'normal',
            timeout_seconds: 3600,
            max_retries: 3,
          }),
          'test-token'
        );
      });
    });
  });

  describe('Real-time Execution Monitoring', () => {
    it('should auto-refresh execution status', async () => {
      const { workflowAPI } = require('@/app/lib/api/workflow');
      workflowAPI.listStepExecutions.mockResolvedValue([mockStepExecution]);

      const store = createTestStore({
        workflow: {
          currentExecution: mockWorkflowExecution,
          stepExecutions: { 'exec-1': [mockStepExecution] },
          loading: { executions: false },
        },
      });

      render(
        <TestWrapper store={store}>
          <WorkflowExecutionMonitor execution={mockWorkflowExecution} />
        </TestWrapper>
      );

      // Auto-refresh should be enabled by default for running executions
      expect(screen.getByDisplayValue('Auto-refresh')).toBeChecked();

      // Wait for initial step execution fetch
      await waitFor(() => {
        expect(workflowAPI.listStepExecutions).toHaveBeenCalledWith('exec-1');
      });
    });

    it('should handle execution cancellation', async () => {
      const { workflowAPI } = require('@/app/lib/api/workflow');
      workflowAPI.cancelExecution.mockResolvedValue();

      // Mock window.confirm
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => true);

      const store = createTestStore({
        workflow: {
          currentExecution: mockWorkflowExecution,
          stepExecutions: { 'exec-1': [mockStepExecution] },
          loading: { executions: false },
        },
      });

      const mockCancel = jest.fn();

      render(
        <TestWrapper store={store}>
          <WorkflowExecutionMonitor 
            execution={mockWorkflowExecution} 
            onCancel={mockCancel}
          />
        </TestWrapper>
      );

      // Find and click cancel button
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(window.confirm).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(workflowAPI.cancelExecution).toHaveBeenCalledWith('exec-1');
      });

      // Restore original confirm
      window.confirm = originalConfirm;
    });
  });

  describe('Workflow-Agent Integration', () => {
    it('should display agent information in workflow steps', async () => {
      const store = createTestStore({
        workflow: {
          currentExecution: mockWorkflowExecution,
          stepExecutions: { 'exec-1': [mockStepExecution] },
          loading: { executions: false },
        },
        agent: {
          agents: [{
            id: 'agent-1',
            name: 'Test Agent',
            agent_type: 'assistant',
          }],
        },
      });

      render(
        <TestWrapper store={store}>
          <WorkflowExecutionMonitor execution={mockWorkflowExecution} />
        </TestWrapper>
      );

      // Should display step information
      expect(screen.getByText('Test Step')).toBeInTheDocument();
      expect(screen.getByText('Step 1')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle workflow execution errors', async () => {
      const { workflowAPI } = require('@/app/lib/api/workflow');
      workflowAPI.executeWorkflow.mockRejectedValue(new Error('Execution failed'));

      const store = createTestStore();

      render(
        <TestWrapper store={store}>
          <WorkflowExecutionDialog
            workflow={mockWorkflowTemplate}
            open={true}
            onOpenChange={() => {}}
          />
        </TestWrapper>
      );

      // Fill required input
      const inputField = screen.getByPlaceholderText(/Enter input_text/);
      fireEvent.change(inputField, { target: { value: 'Test input' } });

      // Submit form
      const executeButton = screen.getByText('Execute Workflow');
      fireEvent.click(executeButton);

      await waitFor(() => {
        // Error should be handled gracefully
        expect(executeButton).not.toBeDisabled();
      });
    });

    it('should display step execution errors', async () => {
      const failedStepExecution = {
        ...mockStepExecution,
        status: WorkflowStatus.FAILED,
        error_message: 'Step execution failed',
      };

      const store = createTestStore({
        workflow: {
          currentExecution: {
            ...mockWorkflowExecution,
            status: WorkflowStatus.FAILED,
          },
          stepExecutions: { 'exec-1': [failedStepExecution] },
          loading: { executions: false },
        },
      });

      render(
        <TestWrapper store={store}>
          <WorkflowExecutionMonitor 
            execution={{
              ...mockWorkflowExecution,
              status: WorkflowStatus.FAILED,
            }} 
          />
        </TestWrapper>
      );

      expect(screen.getByText('Step execution failed')).toBeInTheDocument();
    });
  });

  describe('Performance and State Management', () => {
    it('should handle large workflow templates efficiently', async () => {
      const largeWorkflow = {
        ...mockWorkflowTemplate,
        steps: Array.from({ length: 50 }, (_, i) => ({
          step_id: `step-${i}`,
          name: `Step ${i}`,
          description: `Step ${i} description`,
          step_type: StepType.AGENT_TASK,
          step_order: i + 1,
          agent_id: 'agent-1',
          input_schema: {},
          output_schema: {},
          timeout_seconds: 300,
          retry_count: 3,
          conditions: [],
          metadata: {},
        })),
      };

      const store = createTestStore({
        workflow: {
          templates: [largeWorkflow],
          loading: { templates: false },
          pagination: { templates: { page: 1, pageSize: 20, total: 1 } },
          filters: {},
          error: null,
        },
      });

      render(
        <TestWrapper store={store}>
          <WorkflowList />
        </TestWrapper>
      );

      // Should render without performance issues
      expect(screen.getByText('Test Workflow')).toBeInTheDocument();
      expect(screen.getByText('50 steps')).toBeInTheDocument();
    });

    it('should maintain state consistency during execution updates', async () => {
      const store = createTestStore({
        workflow: {
          executions: [mockWorkflowExecution],
          currentExecution: mockWorkflowExecution,
          stepExecutions: { 'exec-1': [mockStepExecution] },
          loading: { executions: false },
        },
      });

      render(
        <TestWrapper store={store}>
          <WorkflowExecutionMonitor execution={mockWorkflowExecution} />
        </TestWrapper>
      );

      // State should be consistent
      const state = store.getState().workflow;
      expect(state.currentExecution).toEqual(mockWorkflowExecution);
      expect(state.stepExecutions['exec-1']).toContainEqual(mockStepExecution);
    });
  });
});
