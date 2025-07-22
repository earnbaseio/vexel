/**
 * Integration tests for Redux state management
 */

import { configureStore } from '@reduxjs/toolkit';
import agentReducer, {
  fetchAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  setCurrentAgent,
  setAgentFilters,
} from '@/app/lib/slices/agentSlice';
import chatReducer, {
  fetchConversations,
  createConversation,
  sendMessage,
  setCurrentConversation,
  addOptimisticMessage,
} from '@/app/lib/slices/chatSlice';
import workflowReducer, {
  fetchWorkflowTemplates,
  executeWorkflow,
  fetchWorkflowExecutions,
  updateExecutionStatus,
} from '@/app/lib/slices/workflowSlice';
import toastsReducer from '@/app/lib/slices/toastsSlice';
import tokensReducer from '@/app/lib/slices/tokensSlice';
import authReducer from '@/app/lib/slices/authSlice';
import {
  IAgentConfiguration,
  IChatConversation,
  IWorkflowTemplate,
  IWorkflowExecution,
  AgentLevel,
  AgentType,
  AgentStatus,
  ConversationStatus,
  WorkflowStatus,
  MessageRole,
  MessageType,
} from '@/app/lib/interfaces';

// Mock API modules
jest.mock('@/app/lib/api/agent', () => ({
  agentAPI: {
    listAgents: jest.fn(),
    createAgent: jest.fn(),
    updateAgent: jest.fn(),
    deleteAgent: jest.fn(),
  },
}));

jest.mock('@/app/lib/api/chat', () => ({
  chatAPI: {
    listConversations: jest.fn(),
    createConversation: jest.fn(),
    createMessage: jest.fn(),
  },
}));

jest.mock('@/app/lib/api/workflow', () => ({
  workflowAPI: {
    listTemplates: jest.fn(),
    executeWorkflow: jest.fn(),
    listExecutions: jest.fn(),
  },
}));

// Test store setup
const createTestStore = () => {
  return configureStore({
    reducer: {
      agent: agentReducer,
      chat: chatReducer,
      workflow: workflowReducer,
      toasts: toastsReducer,
      tokens: tokensReducer,
      auth: authReducer,
    },
    preloadedState: {
      tokens: { access: 'test-token', refresh: 'test-refresh' },
      auth: { user: { id: 'test-user' } },
    },
  });
};

// Test data
const mockAgent: IAgentConfiguration = {
  id: 'agent-1',
  name: 'Test Agent',
  description: 'A test agent',
  agent_type: AgentType.ASSISTANT,
  level: AgentLevel.LEVEL_1,
  model_provider: 'openai',
  model_id: 'gpt-4',
  model_parameters: { temperature: 0.7 },
  instructions: ['Be helpful'],
  tools: [],
  knowledge_sources: [],
  enable_memory: false,
  enable_knowledge_search: false,
  memory_config: {},
  storage_config: {},
  workflow_config: {},
  workflow_steps: [],
  is_public: false,
  tags: ['test'],
  status: AgentStatus.ACTIVE,
  version: '1.0.0',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z',
  last_used: null,
  total_conversations: 0,
  total_messages: 0,
  success_rate: 0.95,
  average_response_time: 1.2,
};

const mockConversation: IChatConversation = {
  id: 'conv-1',
  conversation_id: 'conv-1',
  agent_id: 'agent-1',
  user_id: 'test-user',
  title: 'Test Conversation',
  description: 'A test conversation',
  status: ConversationStatus.ACTIVE,
  message_count: 0,
  is_pinned: false,
  is_shared: false,
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z',
  metadata: {},
};

const mockWorkflow: IWorkflowTemplate = {
  id: 'workflow-1',
  name: 'Test Workflow',
  description: 'A test workflow',
  category: 'automation',
  complexity_level: 'simple',
  steps: [],
  input_schema: {},
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

describe('Redux State Integration', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    jest.clearAllMocks();
  });

  describe('Agent State Management', () => {
    it('should handle agent CRUD operations', async () => {
      const { agentAPI } = require('@/app/lib/api/agent');
      
      // Mock API responses
      agentAPI.listAgents.mockResolvedValue({
        agents: [mockAgent],
        total: 1,
        page: 1,
        page_size: 20,
      });
      agentAPI.createAgent.mockResolvedValue(mockAgent);
      agentAPI.updateAgent.mockResolvedValue({ ...mockAgent, name: 'Updated Agent' });

      // Test fetch agents
      await store.dispatch(fetchAgents({}));
      expect(store.getState().agent.agents).toHaveLength(1);
      expect(store.getState().agent.agents[0]).toEqual(mockAgent);

      // Test create agent
      const newAgent = { ...mockAgent, name: 'New Agent' };
      agentAPI.createAgent.mockResolvedValue(newAgent);
      await store.dispatch(createAgent(newAgent));
      expect(store.getState().agent.agents).toHaveLength(2);

      // Test update agent
      const updatedAgent = { ...mockAgent, name: 'Updated Agent' };
      agentAPI.updateAgent.mockResolvedValue(updatedAgent);
      await store.dispatch(updateAgent({ agentId: 'agent-1', data: updatedAgent }));
      
      const state = store.getState().agent;
      const agent = state.agents.find(a => a.id === 'agent-1');
      expect(agent?.name).toBe('Updated Agent');

      // Test delete agent
      await store.dispatch(deleteAgent('agent-1'));
      expect(store.getState().agent.agents.find(a => a.id === 'agent-1')).toBeUndefined();
    });

    it('should handle agent filters and pagination', () => {
      // Test filters
      store.dispatch(setAgentFilters({ level: AgentLevel.LEVEL_1 }));
      expect(store.getState().agent.filters.level).toBe(AgentLevel.LEVEL_1);

      // Test current agent
      store.dispatch(setCurrentAgent(mockAgent));
      expect(store.getState().agent.currentAgent).toEqual(mockAgent);
    });
  });

  describe('Chat State Management', () => {
    it('should handle conversation and message operations', async () => {
      const { chatAPI } = require('@/app/lib/api/chat');
      
      // Mock API responses
      chatAPI.listConversations.mockResolvedValue({
        conversations: [mockConversation],
        total: 1,
        page: 1,
        page_size: 20,
      });
      chatAPI.createConversation.mockResolvedValue(mockConversation);
      chatAPI.createMessage.mockResolvedValue({
        message_id: 'msg-1',
        conversation_id: 'conv-1',
        role: MessageRole.USER,
        content: [{ type: MessageType.TEXT, text: 'Hello', metadata: {} }],
        raw_content: 'Hello',
        timestamp: '2024-01-01T00:00:00Z',
        tokens_used: 5,
        response_time: 0.1,
        tool_calls: [],
        is_edited: false,
        metadata: {},
      });

      // Test fetch conversations
      await store.dispatch(fetchConversations({}));
      expect(store.getState().chat.conversations).toHaveLength(1);

      // Test create conversation
      await store.dispatch(createConversation({
        agent_id: 'agent-1',
        title: 'New Conversation',
        status: ConversationStatus.ACTIVE,
      }));
      expect(store.getState().chat.currentConversation).toEqual(mockConversation);

      // Test optimistic message updates
      const optimisticMessage = {
        message_id: 'temp-1',
        conversation_id: 'conv-1',
        role: MessageRole.USER,
        content: [{ type: MessageType.TEXT, text: 'Hello', metadata: {} }],
        raw_content: 'Hello',
        timestamp: '2024-01-01T00:00:00Z',
        tokens_used: 0,
        response_time: 0,
        tool_calls: [],
        is_edited: false,
        metadata: {},
      };

      store.dispatch(addOptimisticMessage({
        conversationId: 'conv-1',
        message: optimisticMessage,
      }));

      const chatState = store.getState().chat;
      expect(chatState.messages['conv-1']).toContainEqual(optimisticMessage);
    });

    it('should handle conversation state transitions', () => {
      // Set current conversation
      store.dispatch(setCurrentConversation(mockConversation));
      expect(store.getState().chat.currentConversation).toEqual(mockConversation);

      // Clear current conversation
      store.dispatch(setCurrentConversation(null));
      expect(store.getState().chat.currentConversation).toBeNull();
    });
  });

  describe('Workflow State Management', () => {
    it('should handle workflow template and execution operations', async () => {
      const { workflowAPI } = require('@/app/lib/api/workflow');
      
      const mockExecution: IWorkflowExecution = {
        execution_id: 'exec-1',
        template_id: 'workflow-1',
        user_id: 'test-user',
        status: WorkflowStatus.RUNNING,
        progress: 0,
        steps: [],
        steps_completed: 0,
        input_data: {},
        output_data: null,
        error_message: null,
        started_at: '2024-01-01T00:00:00Z',
        completed_at: null,
        metadata: {},
      };

      // Mock API responses
      workflowAPI.listTemplates.mockResolvedValue({
        templates: [mockWorkflow],
        total: 1,
        page: 1,
        page_size: 20,
      });
      workflowAPI.executeWorkflow.mockResolvedValue({
        execution: mockExecution,
      });
      workflowAPI.listExecutions.mockResolvedValue({
        executions: [mockExecution],
        total: 1,
        page: 1,
        page_size: 20,
      });

      // Test fetch templates
      await store.dispatch(fetchWorkflowTemplates({}));
      expect(store.getState().workflow.templates).toHaveLength(1);

      // Test execute workflow
      await store.dispatch(executeWorkflow({
        template_id: 'workflow-1',
        input_data: {},
        priority: 'normal',
        timeout_seconds: 3600,
        max_retries: 3,
        metadata: {},
      }));
      expect(store.getState().workflow.currentExecution).toEqual(mockExecution);

      // Test fetch executions
      await store.dispatch(fetchWorkflowExecutions({}));
      expect(store.getState().workflow.executions).toHaveLength(1);
    });

    it('should handle real-time execution updates', () => {
      const mockExecution: IWorkflowExecution = {
        execution_id: 'exec-1',
        template_id: 'workflow-1',
        user_id: 'test-user',
        status: WorkflowStatus.RUNNING,
        progress: 0,
        steps: [],
        steps_completed: 0,
        input_data: {},
        output_data: null,
        error_message: null,
        started_at: '2024-01-01T00:00:00Z',
        completed_at: null,
        metadata: {},
      };

      // Add execution to state
      store.dispatch({ 
        type: 'workflow/fetchWorkflowExecutions/fulfilled',
        payload: {
          executions: [mockExecution],
          total: 1,
          page: 1,
          page_size: 20,
        },
      });

      // Update execution status
      store.dispatch(updateExecutionStatus({
        executionId: 'exec-1',
        status: WorkflowStatus.COMPLETED,
        progress: 100,
      }));

      const execution = store.getState().workflow.executions.find(e => e.execution_id === 'exec-1');
      expect(execution?.status).toBe(WorkflowStatus.COMPLETED);
      expect(execution?.progress).toBe(100);
    });
  });

  describe('Cross-Slice State Interactions', () => {
    it('should maintain state consistency across slices', async () => {
      const { agentAPI, chatAPI } = require('@/app/lib/api/agent');
      
      // Setup agent
      agentAPI.listAgents.mockResolvedValue({
        agents: [mockAgent],
        total: 1,
        page: 1,
        page_size: 20,
      });
      await store.dispatch(fetchAgents({}));

      // Create conversation with agent
      chatAPI.createConversation.mockResolvedValue({
        ...mockConversation,
        agent_id: mockAgent.id,
      });
      await store.dispatch(createConversation({
        agent_id: mockAgent.id,
        title: 'Agent Conversation',
        status: ConversationStatus.ACTIVE,
      }));

      // Verify state consistency
      const agentState = store.getState().agent;
      const chatState = store.getState().chat;
      
      expect(agentState.agents).toHaveLength(1);
      expect(chatState.currentConversation?.agent_id).toBe(mockAgent.id);
    });

    it('should handle error states consistently', async () => {
      const { agentAPI } = require('@/app/lib/api/agent');
      
      // Mock API error
      agentAPI.listAgents.mockRejectedValue(new Error('API Error'));

      try {
        await store.dispatch(fetchAgents({}));
      } catch (error) {
        // Error should be handled by the slice
      }

      const agentState = store.getState().agent;
      expect(agentState.error).toBeTruthy();
      expect(agentState.loading.agents).toBe(false);
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large state updates efficiently', () => {
      const largeAgentList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockAgent,
        id: `agent-${i}`,
        name: `Agent ${i}`,
      }));

      // Simulate large state update
      store.dispatch({
        type: 'agent/fetchAgents/fulfilled',
        payload: {
          agents: largeAgentList,
          total: 1000,
          page: 1,
          page_size: 1000,
        },
      });

      expect(store.getState().agent.agents).toHaveLength(1000);
    });

    it('should clean up state properly', () => {
      // Add some state
      store.dispatch(setCurrentAgent(mockAgent));
      store.dispatch(setCurrentConversation(mockConversation));

      // Clear state
      store.dispatch(setCurrentAgent(null));
      store.dispatch(setCurrentConversation(null));

      expect(store.getState().agent.currentAgent).toBeNull();
      expect(store.getState().chat.currentConversation).toBeNull();
    });
  });
});
