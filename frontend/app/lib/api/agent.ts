/**
 * API services for Agent Management
 */

import { 
  IAgentConfiguration,
  IAgentConfigurationCreate,
  IAgentConfigurationUpdate,
  IAgentSession,
  IAgentSessionCreate,
  IAgentSessionUpdate,
  IAgentMetrics,
  IAgentChatRequest,
  IAgentChatResponse,
  IAgentListResponse,
  IAgentSearchRequest,
  IMsg
} from "../interfaces";
import { apiCore } from "./core";

export const agentAPI = {
  // ============================================================================
  // AGENT CONFIGURATION ENDPOINTS
  // ============================================================================

  /**
   * Create a new agent configuration
   */
  async createAgent(data: IAgentConfigurationCreate, token: string): Promise<IAgentConfiguration> {
    const res = await fetch(`${apiCore.url}/agents/configurations`, {
      method: "POST",
      headers: apiCore.headers(token),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to create agent: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * List user's agent configurations
   */
  async listAgents(params: IAgentSearchRequest = {}, token: string): Promise<IAgentListResponse> {
    const searchParams = new URLSearchParams();

    if (params.level) searchParams.append("level", params.level);
    if (params.agent_type) searchParams.append("agent_type", params.agent_type);
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.page_size) searchParams.append("page_size", params.page_size.toString());

    const url = `${apiCore.url}/agents/configurations?${searchParams}`;
    const headers = apiCore.headers(token);

    console.log('🔍 API Debug - listAgents:', {
      url,
      headers,
      token: token ? `${token.substring(0, 20)}...` : 'NO_TOKEN',
      params
    });

    try {
      const res = await fetch(url, {
        method: "GET",
        headers,
      });

      console.log('📡 API Response:', {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        headers: Object.fromEntries(res.headers.entries())
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`Failed to list agents: ${res.status} ${res.statusText} - ${errorText}`);
      }

      const data = await res.json();
      console.log('✅ API Success:', data);
      return data;
    } catch (error) {
      console.error('🚨 Fetch Error:', error);
      throw error;
    }
  },

  /**
   * Get a specific agent configuration
   */
  async getAgent(agentId: string, token: string): Promise<IAgentConfiguration> {
    const res = await fetch(`${apiCore.url}/agents/configurations/${agentId}`, {
      method: "GET",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to get agent: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Update an agent configuration
   */
  async updateAgent(agentId: string, data: IAgentConfigurationUpdate, token: string): Promise<IAgentConfiguration> {
    const res = await fetch(`${apiCore.url}/agents/configurations/${agentId}`, {
      method: "PUT",
      headers: apiCore.headers(token),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to update agent: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Delete (archive) an agent configuration
   */
  async deleteAgent(agentId: string, token: string): Promise<IMsg> {
    const res = await fetch(`${apiCore.url}/agents/configurations/${agentId}`, {
      method: "DELETE",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to delete agent: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * List public agent configurations
   */
  async listPublicAgents(page: number = 1, pageSize: number = 20): Promise<IAgentListResponse> {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    const res = await fetch(`${apiCore.url}/agents/configurations/public?${searchParams}`, {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to list public agents: ${res.statusText}`);
    }

    return await res.json();
  },

  // ============================================================================
  // AGENT SESSION ENDPOINTS
  // ============================================================================

  /**
   * Create a new agent session
   */
  async createSession(data: IAgentSessionCreate, token: string): Promise<IAgentSession> {
    const res = await fetch(`${apiCore.url}/agents/sessions`, {
      method: "POST",
      headers: apiCore.headers(token),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to create session: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * List user's agent sessions
   */
  async listSessions(agentId?: string, activeOnly: boolean = false, token: string = ""): Promise<IAgentSession[]> {
    const searchParams = new URLSearchParams();

    if (agentId) searchParams.append("agent_id", agentId);
    if (activeOnly) searchParams.append("active_only", "true");

    const res = await fetch(`${apiCore.url}/agents/sessions?${searchParams}`, {
      method: "GET",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to list sessions: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Get a specific agent session
   */
  async getSession(sessionId: string, token: string): Promise<IAgentSession> {
    const res = await fetch(`${apiCore.url}/agents/sessions/${sessionId}`, {
      method: "GET",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to get session: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Update an agent session
   */
  async updateSession(sessionId: string, data: IAgentSessionUpdate, token: string): Promise<IAgentSession> {
    const res = await fetch(`${apiCore.url}/agents/sessions/${sessionId}`, {
      method: "PUT",
      headers: apiCore.headers(token),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to update session: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * End an agent session
   */
  async endSession(sessionId: string, token: string): Promise<IMsg> {
    const res = await fetch(`${apiCore.url}/agents/sessions/${sessionId}`, {
      method: "DELETE",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to end session: ${res.statusText}`);
    }

    return await res.json();
  },

  // ============================================================================
  // AGENT METRICS ENDPOINTS
  // ============================================================================

  /**
   * Get agent performance metrics
   */
  async getAgentMetrics(agentId: string, days: number = 30, token: string): Promise<IAgentMetrics[]> {
    const searchParams = new URLSearchParams({
      days: days.toString(),
    });

    const res = await fetch(`${apiCore.url}/agents/metrics/${agentId}?${searchParams}`, {
      method: "GET",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to get agent metrics: ${res.statusText}`);
    }

    return await res.json();
  },

  // ============================================================================
  // AGENT CHAT ENDPOINTS (Integration with existing chat)
  // ============================================================================

  /**
   * Chat with an agent
   */
  async chatWithAgent(data: IAgentChatRequest, token: string): Promise<IAgentChatResponse> {
    const res = await fetch(`${apiCore.url}/agents/chat`, {
      method: "POST",
      headers: apiCore.headers(token),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to chat with agent: ${res.statusText}`);
    }

    return await res.json();
  },
};
