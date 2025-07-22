/**
 * Redux slice for Chat Management
 */

import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
} from "@reduxjs/toolkit";
import {
  IChatConversation,
  IChatConversationCreate,
  IChatConversationUpdate,
  IMessage,
  IMessageCreate,
  IConversationFeedback,
  IConversationFeedbackCreate,
  IConversationSearchRequest,
  IChatRequest,
  IChatResponse,
  MessageRole,
  ConversationStatus,
} from "../interfaces";
import { chatAPI } from "../api";
import { RootState } from "../store";
import { addNotice } from "./toastsSlice";

// State interface
interface ChatState {
  // Conversations
  conversations: IChatConversation[];
  currentConversation: IChatConversation | null;
  
  // Messages
  messages: Record<string, IMessage[]>; // conversationId -> messages[]
  currentMessages: IMessage[];
  
  // Chat state
  isTyping: boolean;
  streamingMessage: string;
  
  // UI state
  loading: {
    conversations: boolean;
    messages: boolean;
    sending: boolean;
    creating: boolean;
    updating: boolean;
  };
  
  // Pagination
  pagination: {
    conversations: {
      page: number;
      pageSize: number;
      total: number;
    };
    messages: {
      page: number;
      pageSize: number;
      total: number;
    };
  };
  
  // Filters
  filters: {
    status?: ConversationStatus;
    agentId?: string;
    isPinned?: boolean;
    search?: string;
  };
  
  error: string | null;
}

// Initial state
const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: {},
  currentMessages: [],
  isTyping: false,
  streamingMessage: "",
  loading: {
    conversations: false,
    messages: false,
    sending: false,
    creating: false,
    updating: false,
  },
  pagination: {
    conversations: {
      page: 1,
      pageSize: 20,
      total: 0,
    },
    messages: {
      page: 1,
      pageSize: 50,
      total: 0,
    },
  },
  filters: {},
  error: null,
};

// Async thunks
export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (params: IConversationSearchRequest = {}, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.tokens.access_token;

      if (!token) {
        throw new Error("No access token available");
      }

      const response = await chatAPI.listConversations(params, token);
      return response;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to fetch conversations",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

export const createConversation = createAsyncThunk(
  "chat/createConversation",
  async (data: IChatConversationCreate, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.tokens.access_token;

      if (!token) {
        throw new Error("No access token available");
      }

      const conversation = await chatAPI.createConversation(data, token);
      
      dispatch(addNotice({
        title: "Success",
        message: "Conversation created successfully",
        type: "success",
      }));
      
      return conversation;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to create conversation",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (
    { conversationId, page = 1, pageSize = 50 }: { conversationId: string; page?: number; pageSize?: number },
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      console.log('🔄 fetchMessages thunk called with:', { conversationId, page, pageSize });

      const state = getState() as RootState;
      const token = state.tokens.access_token;

      if (!token) {
        console.error('❌ fetchMessages: No access token available');
        throw new Error("No access token available");
      }

      console.log('📡 fetchMessages: Calling chatAPI.listMessages...');
      const response = await chatAPI.listMessages(conversationId, page, pageSize, false, token);

      console.log('✅ fetchMessages success:', {
        conversationId,
        messagesCount: response.messages?.length || 0,
        total: response.total,
        responseStructure: Object.keys(response),
        firstMessage: response.messages?.[0]
      });

      return { conversationId, ...response };
    } catch (error: any) {
      console.error('❌ fetchMessages error:', error);
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to fetch messages",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (
    { conversationId, messageData }: { conversationId: string; messageData: IMessageCreate },
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.tokens.access_token;

      if (!token) {
        throw new Error("No access token available");
      }

      const message = await chatAPI.createMessage(conversationId, messageData, token);
      return { conversationId, message };
    } catch (error: any) {
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to send message",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

// New thunk for real chat with AI
export const sendChatMessage = createAsyncThunk(
  "chat/sendChatMessage",
  async (
    {
      conversationId,
      agentId,
      message,
      context
    }: {
      conversationId: string;
      agentId: string;
      message: string;
      context?: Record<string, any>
    },
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.tokens.access_token;

      if (!token) {
        throw new Error("No access token available");
      }

      // Prepare chat request
      const chatRequest: IChatRequest = {
        message,
        agent_id: agentId,
        conversation_id: conversationId,
        context,
        stream: false // For now, we'll implement non-streaming first
      };

      console.log("🚀 Sending chat message:", chatRequest);

      // Send to AI chat endpoint
      const response = await chatAPI.sendMessage(chatRequest, token);

      console.log("✅ Chat response received:", response);

      return {
        conversationId,
        userMessage: message,
        aiResponse: response
      };
    } catch (error: any) {
      console.error("❌ Chat error:", error);
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to send chat message",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

// New thunk for streaming chat with AI
export const sendStreamingChatMessage = createAsyncThunk(
  "chat/sendStreamingChatMessage",
  async (
    {
      conversationId,
      agentId,
      message,
      context
    }: {
      conversationId: string;
      agentId: string;
      message: string;
      context?: Record<string, any>
    },
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.tokens.access_token;

      if (!token) {
        throw new Error("No access token available");
      }

      // Prepare streaming chat request
      const chatRequest: IChatRequest = {
        message,
        agent_id: agentId,
        conversation_id: conversationId,
        context,
        stream: true
      };

      console.log("🚀 Starting streaming chat:", chatRequest);

      // Start streaming
      dispatch(setIsTyping(true));
      dispatch(clearStreamingMessage());

      return new Promise<{ conversationId: string; userMessage: string; aiResponse: IChatResponse }>((resolve, reject) => {
        chatAPI.sendStreamingMessage(
          chatRequest,
          token,
          // onChunk callback
          (chunk: string) => {
            console.log("📝 Streaming chunk:", chunk);
            dispatch(addStreamingChunk(chunk));
          },
          // onComplete callback
          (response: IChatResponse) => {
            console.log("✅ Streaming completed:", response);
            dispatch(setIsTyping(false));
            resolve({
              conversationId,
              userMessage: message,
              aiResponse: response
            });
          },
          // onError callback
          (error: Error) => {
            console.error("❌ Streaming error:", error);
            dispatch(setIsTyping(false));
            dispatch(addNotice({
              title: "Error",
              message: error.message || "Failed to send streaming message",
              type: "error",
            }));
            reject(error);
          }
        );
      });
    } catch (error: any) {
      console.error("❌ Streaming setup error:", error);
      dispatch(setIsTyping(false));
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to setup streaming",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

export const updateConversation = createAsyncThunk(
  "chat/updateConversation",
  async (
    { conversationId, data }: { conversationId: string; data: IChatConversationUpdate },
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const token = state.tokens.access_token;

      if (!token) {
        throw new Error("No access token available");
      }

      const conversation = await chatAPI.updateConversation(conversationId, data, token);
      
      dispatch(addNotice({
        title: "Success",
        message: "Conversation updated successfully",
        type: "success",
      }));
      
      return conversation;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to update conversation",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

export const deleteConversation = createAsyncThunk(
  "chat/deleteConversation",
  async (conversationId: string, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.tokens.access_token;

      if (!token) {
        throw new Error("No access token available");
      }

      await chatAPI.deleteConversation(conversationId, token);
      
      dispatch(addNotice({
        title: "Success",
        message: "Conversation deleted successfully",
        type: "success",
      }));
      
      return conversationId;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to delete conversation",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

export const createFeedback = createAsyncThunk(
  "chat/createFeedback",
  async (data: IConversationFeedbackCreate, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.tokens.access_token;

      if (!token) {
        throw new Error("No access token available");
      }

      const feedback = await chatAPI.createFeedback(data, token);
      
      dispatch(addNotice({
        title: "Success",
        message: "Feedback submitted successfully",
        type: "success",
      }));
      
      return feedback;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to submit feedback",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setCurrentConversation: (state, action: PayloadAction<IChatConversation | null>) => {
      state.currentConversation = action.payload;
      if (action.payload) {
        state.currentMessages = state.messages[action.payload.conversation_id] || [];
      } else {
        state.currentMessages = [];
      }
    },
    
    setIsTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    
    setStreamingMessage: (state, action: PayloadAction<string>) => {
      state.streamingMessage = action.payload;
    },
    
    addStreamingChunk: (state, action: PayloadAction<string>) => {
      state.streamingMessage += action.payload;
    },
    
    clearStreamingMessage: (state) => {
      state.streamingMessage = "";
    },

    // Reset chat state (useful when switching conversations or on errors)
    resetChatState: (state) => {
      state.isTyping = false;
      state.streamingMessage = "";
      state.loading.sending = false;
      state.error = null;
    },
    
    setConversationFilters: (state, action: PayloadAction<Partial<ChatState["filters"]>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    setConversationPagination: (state, action: PayloadAction<Partial<ChatState["pagination"]["conversations"]>>) => {
      state.pagination.conversations = { ...state.pagination.conversations, ...action.payload };
    },
    
    setMessagePagination: (state, action: PayloadAction<Partial<ChatState["pagination"]["messages"]>>) => {
      state.pagination.messages = { ...state.pagination.messages, ...action.payload };
    },
    
    addOptimisticMessage: (state, action: PayloadAction<{ conversationId: string; message: IMessage }>) => {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      state.messages[conversationId].push(message);
      if (state.currentConversation?.conversation_id === conversationId) {
        state.currentMessages.push(message);
      }
    },
    
    updateOptimisticMessage: (state, action: PayloadAction<{ conversationId: string; tempId: string; message: IMessage }>) => {
      const { conversationId, tempId, message } = action.payload;
      if (state.messages[conversationId]) {
        const index = state.messages[conversationId].findIndex(m => m.message_id === tempId);
        if (index !== -1) {
          state.messages[conversationId][index] = message;
        }
      }
      if (state.currentConversation?.conversation_id === conversationId) {
        const index = state.currentMessages.findIndex(m => m.message_id === tempId);
        if (index !== -1) {
          state.currentMessages[index] = message;
        }
      }
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    // Fetch conversations
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading.conversations = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading.conversations = false;
        state.conversations = action.payload.conversations;
        state.pagination.conversations.total = action.payload.total;
        state.pagination.conversations.page = action.payload.page;
        state.pagination.conversations.pageSize = action.payload.page_size;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading.conversations = false;
        state.error = action.payload as string;
      });

    // Create conversation
    builder
      .addCase(createConversation.pending, (state) => {
        state.loading.creating = true;
        state.error = null;
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.loading.creating = false;
        state.conversations.unshift(action.payload);
        state.currentConversation = action.payload;
        state.currentMessages = [];
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.loading.creating = false;
        state.error = action.payload as string;
      });

    // Fetch messages
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading.messages = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        console.log('🔄 fetchMessages.fulfilled reducer called with:', {
          payload: action.payload,
          payloadKeys: Object.keys(action.payload),
          messagesArray: action.payload.messages
        });

        state.loading.messages = false;
        const { conversationId, messages, total, page, page_size } = action.payload;

        console.log('🔄 Updating messages state:', {
          conversationId,
          messagesCount: messages?.length || 0,
          messagesArray: messages,
          currentConversationId: state.currentConversation?.conversation_id,
          willUpdateCurrentMessages: state.currentConversation?.conversation_id === conversationId
        });

        state.messages[conversationId] = messages;
        if (state.currentConversation?.conversation_id === conversationId) {
          state.currentMessages = messages;
          console.log('✅ Updated currentMessages:', state.currentMessages.length);
        }
        state.pagination.messages.total = total;
        state.pagination.messages.page = page;
        state.pagination.messages.pageSize = page_size;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading.messages = false;
        state.error = action.payload as string;
      });

    // Send message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.loading.sending = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading.sending = false;
        const { conversationId, message } = action.payload;
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        state.messages[conversationId].push(message);
        if (state.currentConversation?.conversation_id === conversationId) {
          state.currentMessages.push(message);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading.sending = false;
        state.error = action.payload as string;
      });

    // Send chat message to AI
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.loading.sending = true;
        state.isTyping = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.loading.sending = false;
        state.isTyping = false;

        const { conversationId, userMessage, aiResponse } = action.payload;

        // Create AI message from response
        const aiMessage: IMessage = {
          message_id: aiResponse.message_id,
          conversation_id: conversationId,
          role: "assistant" as MessageRole,
          content: [{
            type: "text",
            text: aiResponse.response,
            metadata: aiResponse.metadata || {},
          }],
          raw_content: aiResponse.response,
          timestamp: aiResponse.timestamp,
          tokens_used: aiResponse.tokens_used || 0,
          response_time: aiResponse.response_time || 0,
          tool_calls: [],
          is_edited: false,
          metadata: {
            knowledge_searched: aiResponse.knowledge_searched,
            memory_accessed: aiResponse.memory_accessed,
            tools_used: aiResponse.tools_used,
          },
        };

        // Add AI message to state
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        state.messages[conversationId].push(aiMessage);

        if (state.currentConversation?.conversation_id === conversationId) {
          state.currentMessages.push(aiMessage);
        }
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.loading.sending = false;
        state.isTyping = false;
        state.error = action.payload as string;
      });

    // Send streaming chat message to AI
    builder
      .addCase(sendStreamingChatMessage.pending, (state) => {
        state.loading.sending = true;
        state.isTyping = true;
        state.streamingMessage = "";
        state.error = null;
      })
      .addCase(sendStreamingChatMessage.fulfilled, (state, action) => {
        state.loading.sending = false;
        state.isTyping = false;

        const { conversationId, userMessage, aiResponse } = action.payload;

        // Create AI message from streaming response
        const aiMessage: IMessage = {
          message_id: aiResponse.message_id,
          conversation_id: conversationId,
          role: "assistant" as MessageRole,
          content: [{
            type: "text",
            text: aiResponse.response,
            metadata: aiResponse.metadata || {},
          }],
          raw_content: aiResponse.response,
          timestamp: aiResponse.timestamp,
          tokens_used: aiResponse.tokens_used || 0,
          response_time: aiResponse.response_time || 0,
          tool_calls: [],
          is_edited: false,
          metadata: {
            knowledge_searched: aiResponse.knowledge_searched,
            memory_accessed: aiResponse.memory_accessed,
            tools_used: aiResponse.tools_used,
          },
        };

        // Add AI message to state
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        state.messages[conversationId].push(aiMessage);

        if (state.currentConversation?.conversation_id === conversationId) {
          state.currentMessages.push(aiMessage);
        }

        // Clear streaming message
        state.streamingMessage = "";
      })
      .addCase(sendStreamingChatMessage.rejected, (state, action) => {
        state.loading.sending = false;
        state.isTyping = false;
        state.streamingMessage = "";
        state.error = action.payload as string;
      });

    // Update conversation
    builder
      .addCase(updateConversation.fulfilled, (state, action) => {
        const index = state.conversations.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.conversations[index] = action.payload;
        }
        if (state.currentConversation?.id === action.payload.id) {
          state.currentConversation = action.payload;
        }
      });

    // Delete conversation
    builder
      .addCase(deleteConversation.fulfilled, (state, action) => {
        state.conversations = state.conversations.filter(c => c.conversation_id !== action.payload);
        if (state.currentConversation?.conversation_id === action.payload) {
          state.currentConversation = null;
          state.currentMessages = [];
        }
        delete state.messages[action.payload];
      });
  },
});

// Actions
export const {
  setCurrentConversation,
  setIsTyping,
  setStreamingMessage,
  addStreamingChunk,
  clearStreamingMessage,
  setConversationFilters,
  setConversationPagination,
  setMessagePagination,
  addOptimisticMessage,
  updateOptimisticMessage,
  clearError,
  resetChatState,
} = chatSlice.actions;

// Selectors
export const selectConversations = (state: RootState) => state.chat.conversations;
export const selectCurrentConversation = (state: RootState) => state.chat.currentConversation;
export const selectCurrentMessages = (state: RootState) => state.chat.currentMessages;
export const selectIsTyping = (state: RootState) => state.chat.isTyping;
export const selectStreamingMessage = (state: RootState) => state.chat.streamingMessage;
export const selectChatLoading = (state: RootState) => state.chat.loading;
export const selectConversationFilters = (state: RootState) => state.chat.filters;
export const selectConversationPagination = (state: RootState) => state.chat.pagination.conversations;
export const selectMessagePagination = (state: RootState) => state.chat.pagination.messages;
export const selectChatError = (state: RootState) => state.chat.error;

export default chatSlice.reducer;
