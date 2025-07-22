/**
 * Redux slice for Agent Management
 */

import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
} from "@reduxjs/toolkit";
import {
  IAgentConfiguration,
  IAgentConfigurationCreate,
  IAgentConfigurationUpdate,
  IAgentSession,
  IAgentSessionCreate,
  IAgentMetrics,
  IAgentSearchRequest,
  AgentType,
  AgentStatus,
} from "../interfaces";
import { agentAPI } from "../api";
import { RootState } from "../store";
import { addNotice } from "./toastsSlice";

// Helper function to get a valid token (refresh if needed)
async function getValidToken(getState: () => RootState, dispatch: any): Promise<string> {
  const state = getState();
  let token = state.tokens.access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  // Check if token is expired and refresh if needed
  const { tokenExpired } = await import('../utilities');
  if (tokenExpired(token)) {
    console.log("🔄 Token expired, attempting refresh...");
    try {
      const { refreshTokens } = await import('./tokensSlice');
      await dispatch(refreshTokens());

      // Get the refreshed token
      const newState = getState();
      token = newState.tokens.access_token;

      if (!token) {
        throw new Error("Failed to refresh token - no token after refresh");
      }

      console.log("✅ Token refreshed successfully");
    } catch (error) {
      console.error("❌ Token refresh failed:", error);
      // If refresh fails, the user needs to login again
      throw new Error("Token expired and refresh failed. Please login again.");
    }
  }

  return token;
}

// State interface
interface AgentState {
  // Agent configurations
  agents: IAgentConfiguration[];
  currentAgent: IAgentConfiguration | null;
  publicAgents: IAgentConfiguration[];
  
  // Agent sessions
  sessions: IAgentSession[];
  currentSession: IAgentSession | null;
  
  // Agent metrics
  metrics: Record<string, IAgentMetrics[]>; // agentId -> metrics[]
  
  // UI state
  loading: {
    agents: boolean;
    sessions: boolean;
    metrics: boolean;
    creating: boolean;
    updating: boolean;
    deleting: boolean;
  };
  
  // Pagination
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  
  // Filters
  filters: {
    type?: AgentType;
    status?: AgentStatus;
    search?: string;
  };
  
  error: string | null;
}

// Initial state
const initialState: AgentState = {
  agents: [],
  currentAgent: null,
  publicAgents: [],
  sessions: [],
  currentSession: null,
  metrics: {},
  loading: {
    agents: false,
    sessions: false,
    metrics: false,
    creating: false,
    updating: false,
    deleting: false,
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
  },
  filters: {},
  error: null,
};

// Async thunks
export const fetchAgents = createAsyncThunk(
  "agent/fetchAgents",
  async (params: IAgentSearchRequest = {}, { getState, dispatch, rejectWithValue }) => {
    console.log("🔥 fetchAgents thunk called with params:", params);

    try {
      const token = await getValidToken(getState, dispatch);

      console.log("🔑 Token check:", {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO_TOKEN'
      });

      console.log("📡 Calling agentAPI.listAgents...");
      const response = await agentAPI.listAgents(params, token);
      console.log("✅ fetchAgents success:", response);
      return response;
    } catch (error: any) {
      console.error("🚨 fetchAgents error:", error);
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to fetch agents",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPublicAgents = createAsyncThunk(
  "agent/fetchPublicAgents",
  async (params: { page?: number; pageSize?: number } = {}, { dispatch, rejectWithValue }) => {
    try {
      const response = await agentAPI.listPublicAgents(params.page, params.pageSize);
      return response;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to fetch public agents",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

export const createAgent = createAsyncThunk(
  "agent/createAgent",
  async (data: IAgentConfigurationCreate, { getState, dispatch, rejectWithValue }) => {
    try {
      const token = await getValidToken(getState, dispatch);
      const agent = await agentAPI.createAgent(data, token);
      
      dispatch(addNotice({
        title: "Success",
        message: `Agent "${agent.name}" created successfully`,
        type: "success",
      }));
      
      return agent;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to create agent",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

export const updateAgent = createAsyncThunk(
  "agent/updateAgent",
  async ({ agentId, data }: { agentId: string; data: IAgentConfigurationUpdate }, { getState, dispatch, rejectWithValue }) => {
    try {
      const token = await getValidToken(getState, dispatch);
      const agent = await agentAPI.updateAgent(agentId, data, token);
      
      dispatch(addNotice({
        title: "Success",
        message: `Agent "${agent.name}" updated successfully`,
        type: "success",
      }));
      
      return agent;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to update agent",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

export const deleteAgent = createAsyncThunk(
  "agent/deleteAgent",
  async (agentId: string, { getState, dispatch, rejectWithValue }) => {
    try {
      const token = await getValidToken(getState, dispatch);
      await agentAPI.deleteAgent(agentId, token);
      
      dispatch(addNotice({
        title: "Success",
        message: "Agent deleted successfully",
        type: "success",
      }));
      
      return agentId;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to delete agent",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAgentSessions = createAsyncThunk(
  "agent/fetchSessions",
  async (params: { agentId?: string; activeOnly?: boolean } = {}, { getState, dispatch, rejectWithValue }) => {
    try {
      const token = await getValidToken(getState, dispatch);
      const sessions = await agentAPI.listSessions(params.agentId, params.activeOnly, token);
      return sessions;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to fetch sessions",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

export const createAgentSession = createAsyncThunk(
  "agent/createSession",
  async (data: IAgentSessionCreate, { getState, dispatch, rejectWithValue }) => {
    try {
      const token = await getValidToken(getState, dispatch);
      const session = await agentAPI.createSession(data, token);
      
      dispatch(addNotice({
        title: "Success",
        message: "Agent session created successfully",
        type: "success",
      }));
      
      return session;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to create session",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAgentMetrics = createAsyncThunk(
  "agent/fetchMetrics",
  async ({ agentId, days = 30 }: { agentId: string; days?: number }, { getState, dispatch, rejectWithValue }) => {
    try {
      const token = await getValidToken(getState, dispatch);
      const metrics = await agentAPI.getAgentMetrics(agentId, days, token);
      return { agentId, metrics };
    } catch (error: any) {
      dispatch(addNotice({
        title: "Error",
        message: error.message || "Failed to fetch metrics",
        type: "error",
      }));
      return rejectWithValue(error.message);
    }
  }
);

// Slice
const agentSlice = createSlice({
  name: "agent",
  initialState,
  reducers: {
    setCurrentAgent: (state, action: PayloadAction<IAgentConfiguration | null>) => {
      state.currentAgent = action.payload;
    },
    setCurrentSession: (state, action: PayloadAction<IAgentSession | null>) => {
      state.currentSession = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<AgentState["filters"]>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action: PayloadAction<Partial<AgentState["pagination"]>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    resetAgentState: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch agents
    builder
      .addCase(fetchAgents.pending, (state) => {
        state.loading.agents = true;
        state.error = null;
      })
      .addCase(fetchAgents.fulfilled, (state, action) => {
        state.loading.agents = false;
        state.agents = action.payload.agents;
        state.pagination.total = action.payload.total;
        state.pagination.page = action.payload.page;
        state.pagination.pageSize = action.payload.page_size;
      })
      .addCase(fetchAgents.rejected, (state, action) => {
        state.loading.agents = false;
        state.error = action.payload as string;
      });

    // Fetch public agents
    builder
      .addCase(fetchPublicAgents.fulfilled, (state, action) => {
        state.publicAgents = action.payload.agents;
      });

    // Create agent
    builder
      .addCase(createAgent.pending, (state) => {
        state.loading.creating = true;
        state.error = null;
      })
      .addCase(createAgent.fulfilled, (state, action) => {
        state.loading.creating = false;
        state.agents.unshift(action.payload);
      })
      .addCase(createAgent.rejected, (state, action) => {
        state.loading.creating = false;
        state.error = action.payload as string;
      });

    // Update agent
    builder
      .addCase(updateAgent.pending, (state) => {
        state.loading.updating = true;
        state.error = null;
      })
      .addCase(updateAgent.fulfilled, (state, action) => {
        state.loading.updating = false;
        const index = state.agents.findIndex(agent => agent.id === action.payload.id);
        if (index !== -1) {
          state.agents[index] = action.payload;
        }
        if (state.currentAgent?.id === action.payload.id) {
          state.currentAgent = action.payload;
        }
      })
      .addCase(updateAgent.rejected, (state, action) => {
        state.loading.updating = false;
        state.error = action.payload as string;
      });

    // Delete agent
    builder
      .addCase(deleteAgent.pending, (state) => {
        state.loading.deleting = true;
        state.error = null;
      })
      .addCase(deleteAgent.fulfilled, (state, action) => {
        state.loading.deleting = false;
        state.agents = state.agents.filter(agent => agent.id !== action.payload);
        if (state.currentAgent?.id === action.payload) {
          state.currentAgent = null;
        }
      })
      .addCase(deleteAgent.rejected, (state, action) => {
        state.loading.deleting = false;
        state.error = action.payload as string;
      });

    // Fetch sessions
    builder
      .addCase(fetchAgentSessions.pending, (state) => {
        state.loading.sessions = true;
      })
      .addCase(fetchAgentSessions.fulfilled, (state, action) => {
        state.loading.sessions = false;
        state.sessions = action.payload;
      })
      .addCase(fetchAgentSessions.rejected, (state, action) => {
        state.loading.sessions = false;
        state.error = action.payload as string;
      });

    // Create session
    builder
      .addCase(createAgentSession.fulfilled, (state, action) => {
        state.sessions.unshift(action.payload);
        state.currentSession = action.payload;
      });

    // Fetch metrics
    builder
      .addCase(fetchAgentMetrics.pending, (state) => {
        state.loading.metrics = true;
      })
      .addCase(fetchAgentMetrics.fulfilled, (state, action) => {
        state.loading.metrics = false;
        state.metrics[action.payload.agentId] = action.payload.metrics;
      })
      .addCase(fetchAgentMetrics.rejected, (state, action) => {
        state.loading.metrics = false;
        state.error = action.payload as string;
      });
  },
});

// Actions
export const {
  setCurrentAgent,
  setCurrentSession,
  setFilters,
  setPagination,
  clearError,
  resetAgentState,
} = agentSlice.actions;

// Selectors
export const selectAgents = (state: RootState) => state.agent.agents;
export const selectCurrentAgent = (state: RootState) => state.agent.currentAgent;
export const selectPublicAgents = (state: RootState) => state.agent.publicAgents;
export const selectAgentSessions = (state: RootState) => state.agent.sessions;
export const selectCurrentSession = (state: RootState) => state.agent.currentSession;
export const selectAgentMetrics = (state: RootState) => state.agent.metrics;
export const selectAgentLoading = (state: RootState) => state.agent.loading;
export const selectAgentFilters = (state: RootState) => state.agent.filters;
export const selectAgentPagination = (state: RootState) => state.agent.pagination;
export const selectAgentError = (state: RootState) => state.agent.error;

// Get agent by ID selector
export const selectAgentById = (state: RootState, agentId: string) =>
  state.agent.agents.find(agent => agent.id === agentId);

export default agentSlice.reducer;
