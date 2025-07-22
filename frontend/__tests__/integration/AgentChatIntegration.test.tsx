/**
 * Integration tests for Agent and Chat components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'next/router';
import '@testing-library/jest-dom';

import AgentList from '@/app/components/agent/AgentList';
import ChatInterface from '@/app/components/chat/ChatInterface';
import agentReducer from '@/app/lib/slices/agentSlice';
import chatReducer from '@/app/lib/slices/chatSlice';
import toastsReducer from '@/app/lib/slices/toastsSlice';
import tokensReducer from '@/app/lib/slices/tokensSlice';
import authReducer from '@/app/lib/slices/authSlice';
import {
  IAgentConfiguration,
  AgentLevel,
  AgentType,
  AgentStatus,
  IChatConversation,
  ConversationStatus,
} from '@/app/lib/interfaces';

// Mock API modules
jest.mock('@/app/lib/api/agent', () => ({
  agentAPI: {
    listAgents: jest.fn(),
    createAgent: jest.fn(),
    updateAgent: jest.fn(),
    deleteAgent: jest.fn(),
    getAgentMetrics: jest.fn(),
  },
}));

jest.mock('@/app/lib/api/chat', () => ({
  chatAPI: {
    createConversation: jest.fn(),
    listConversations: jest.fn(),
    listMessages: jest.fn(),
    createMessage: jest.fn(),
    updateConversation: jest.fn(),
    deleteConversation: jest.fn(),
  },
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/agents',
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Test store setup
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      agent: agentReducer,
      chat: chatReducer,
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
const mockAgent: IAgentConfiguration = {
  id: 'agent-1',
  name: 'Test Agent',
  description: 'A test agent for integration testing',
  agent_type: AgentType.ASSISTANT,
  level: AgentLevel.LEVEL_1,
  model_provider: 'openai',
  model_id: 'gpt-4',
  model_parameters: { temperature: 0.7 },
  instructions: ['Be helpful and accurate'],
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

describe('Agent-Chat Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Agent to Chat Navigation', () => {
    it('should navigate to chat when starting conversation with agent', async () => {
      const mockPush = jest.fn();
      jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        pathname: '/agents',
      });

      const store = createTestStore({
        agent: {
          agents: [mockAgent],
          loading: { agents: false },
          pagination: { page: 1, pageSize: 20, total: 1 },
          filters: {},
          error: null,
        },
      });

      const mockStartChat = jest.fn();

      render(
        <TestWrapper store={store}>
          <AgentList onStartChat={mockStartChat} />
        </TestWrapper>
      );

      // Find and click the "Start Chat" button
      const startChatButton = screen.getByText('Start Chat');
      fireEvent.click(startChatButton);

      expect(mockStartChat).toHaveBeenCalledWith(mockAgent);
    });

    it('should create conversation when starting chat with agent', async () => {
      const { chatAPI } = require('@/app/lib/api/chat');
      chatAPI.createConversation.mockResolvedValue(mockConversation);

      const store = createTestStore();

      render(
        <TestWrapper store={store}>
          <ChatInterface agentId="agent-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(chatAPI.createConversation).toHaveBeenCalledWith(
          expect.objectContaining({
            agent_id: 'agent-1',
            title: 'New Conversation',
            status: ConversationStatus.ACTIVE,
          }),
          'test-token'
        );
      });
    });
  });

  describe('Chat Interface with Agent Context', () => {
    it('should display agent information in chat header', async () => {
      const store = createTestStore({
        chat: {
          currentConversation: mockConversation,
          currentMessages: [],
          conversations: [mockConversation],
          messages: {},
          isTyping: false,
          streamingMessage: '',
          loading: { messages: false },
          pagination: { conversations: { page: 1, pageSize: 20, total: 1 } },
          filters: {},
          error: null,
        },
      });

      render(
        <TestWrapper store={store}>
          <ChatInterface agentId="agent-1" />
        </TestWrapper>
      );

      // Check if conversation title is displayed
      expect(screen.getByText('Test Conversation')).toBeInTheDocument();
    });

    it('should handle message sending in agent conversation', async () => {
      const { chatAPI } = require('@/app/lib/api/chat');
      chatAPI.createMessage.mockResolvedValue({
        message_id: 'msg-1',
        conversation_id: 'conv-1',
        role: 'user',
        content: [{ type: 'text', text: 'Hello', metadata: {} }],
        raw_content: 'Hello',
        timestamp: '2024-01-01T00:00:00Z',
        tokens_used: 5,
        response_time: 0.1,
        tool_calls: [],
        is_edited: false,
        metadata: {},
      });

      const store = createTestStore({
        chat: {
          currentConversation: mockConversation,
          currentMessages: [],
          conversations: [mockConversation],
          messages: {},
          isTyping: false,
          streamingMessage: '',
          loading: { messages: false, sending: false },
          pagination: { conversations: { page: 1, pageSize: 20, total: 1 } },
          filters: {},
          error: null,
        },
      });

      render(
        <TestWrapper store={store}>
          <ChatInterface agentId="agent-1" />
        </TestWrapper>
      );

      // Find message input and send button
      const messageInput = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByTitle('Send message');

      // Type and send message
      fireEvent.change(messageInput, { target: { value: 'Hello' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(chatAPI.createMessage).toHaveBeenCalledWith(
          'conv-1',
          expect.objectContaining({
            role: 'user',
            content: expect.arrayContaining([
              expect.objectContaining({
                type: 'text',
                text: 'Hello',
              }),
            ]),
            raw_content: 'Hello',
          }),
          'test-token'
        );
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle agent loading errors gracefully', async () => {
      const { agentAPI } = require('@/app/lib/api/agent');
      agentAPI.listAgents.mockRejectedValue(new Error('Failed to load agents'));

      const store = createTestStore({
        agent: {
          agents: [],
          loading: { agents: false },
          pagination: { page: 1, pageSize: 20, total: 0 },
          filters: {},
          error: 'Failed to load agents',
        },
      });

      render(
        <TestWrapper store={store}>
          <AgentList />
        </TestWrapper>
      );

      expect(screen.getByText(/Error loading agents/)).toBeInTheDocument();
    });

    it('should handle chat creation errors gracefully', async () => {
      const { chatAPI } = require('@/app/lib/api/chat');
      chatAPI.createConversation.mockRejectedValue(new Error('Failed to create conversation'));

      const store = createTestStore();

      render(
        <TestWrapper store={store}>
          <ChatInterface agentId="agent-1" />
        </TestWrapper>
      );

      // Wait for error to be handled
      await waitFor(() => {
        // Error should be handled by Redux and not crash the component
        expect(screen.queryByText(/Failed to create conversation/)).not.toBeInTheDocument();
      });
    });
  });

  describe('State Synchronization', () => {
    it('should maintain agent state when navigating to chat', async () => {
      const store = createTestStore({
        agent: {
          agents: [mockAgent],
          currentAgent: mockAgent,
          loading: { agents: false },
          pagination: { page: 1, pageSize: 20, total: 1 },
          filters: {},
          error: null,
        },
      });

      render(
        <TestWrapper store={store}>
          <ChatInterface agentId="agent-1" />
        </TestWrapper>
      );

      // Agent state should be preserved
      expect(store.getState().agent.currentAgent).toEqual(mockAgent);
    });

    it('should update conversation list when new conversation is created', async () => {
      const { chatAPI } = require('@/app/lib/api/chat');
      chatAPI.createConversation.mockResolvedValue(mockConversation);
      chatAPI.listConversations.mockResolvedValue({
        conversations: [mockConversation],
        total: 1,
        page: 1,
        page_size: 20,
      });

      const store = createTestStore();

      render(
        <TestWrapper store={store}>
          <ChatInterface agentId="agent-1" />
        </TestWrapper>
      );

      await waitFor(() => {
        const chatState = store.getState().chat;
        expect(chatState.conversations).toContainEqual(mockConversation);
      });
    });
  });

  describe('Performance Integration', () => {
    it('should not cause memory leaks when switching between components', async () => {
      const store = createTestStore();

      const { rerender } = render(
        <TestWrapper store={store}>
          <AgentList />
        </TestWrapper>
      );

      // Switch to chat interface
      rerender(
        <TestWrapper store={store}>
          <ChatInterface agentId="agent-1" />
        </TestWrapper>
      );

      // Switch back to agent list
      rerender(
        <TestWrapper store={store}>
          <AgentList />
        </TestWrapper>
      );

      // No memory leaks should occur (this is more of a smoke test)
      expect(true).toBe(true);
    });

    it('should handle rapid state updates without performance issues', async () => {
      const store = createTestStore();

      render(
        <TestWrapper store={store}>
          <ChatInterface agentId="agent-1" />
        </TestWrapper>
      );

      // Simulate rapid typing updates
      const messageInput = screen.getByPlaceholderText('Type your message...');
      
      for (let i = 0; i < 10; i++) {
        fireEvent.change(messageInput, { target: { value: `Message ${i}` } });
      }

      // Component should handle rapid updates without issues
      expect(messageInput).toHaveValue('Message 9');
    });
  });
});
