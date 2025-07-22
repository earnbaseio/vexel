/**
 * API services for Chat Management
 */

import {
  IChatConversation,
  IChatConversationCreate,
  IChatConversationUpdate,
  IMessage,
  IMessageCreate,
  IMessageUpdate,
  IConversationFeedback,
  IConversationFeedbackCreate,
  IConversationTemplate,
  IConversationTemplateCreate,
  IConversationTemplateUpdate,
  IChatRequest,
  IChatResponse,
  IConversationListResponse,
  IMessageListResponse,
  IConversationSearchRequest,
  IMsg
} from "../interfaces";
import { apiCore } from "./core";

export const chatAPI = {
  // ============================================================================
  // CONVERSATION ENDPOINTS
  // ============================================================================

  /**
   * Create a new conversation
   */
  async createConversation(data: IChatConversationCreate, token: string): Promise<IChatConversation> {
    const res = await fetch(`${apiCore.url}/chats/conversations`, {
      method: "POST",
      headers: apiCore.headers(token),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to create conversation: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * List user's conversations
   */
  async listConversations(params: IConversationSearchRequest = {}, token: string): Promise<IConversationListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.status) searchParams.append("status", params.status);
    if (params.agent_id) searchParams.append("agent_id", params.agent_id);
    if (params.is_pinned !== undefined) searchParams.append("pinned_only", params.is_pinned.toString());
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.page_size) searchParams.append("page_size", params.page_size.toString());

    const res = await fetch(`${apiCore.url}/chats/conversations?${searchParams}`, {
      method: "GET",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to list conversations: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Get a specific conversation
   */
  async getConversation(conversationId: string, token: string): Promise<IChatConversation> {
    const res = await fetch(`${apiCore.url}/chats/conversations/${conversationId}`, {
      method: "GET",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to get conversation: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Update a conversation
   */
  async updateConversation(conversationId: string, data: IChatConversationUpdate, token: string): Promise<IChatConversation> {
    const res = await fetch(`${apiCore.url}/chats/conversations/${conversationId}`, {
      method: "PUT",
      headers: apiCore.headers(token),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to update conversation: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Delete (archive) a conversation
   */
  async deleteConversation(conversationId: string, token: string): Promise<IMsg> {
    const res = await fetch(`${apiCore.url}/chats/conversations/${conversationId}`, {
      method: "DELETE",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to delete conversation: ${res.statusText}`);
    }

    return await res.json();
  },

  // ============================================================================
  // MESSAGE ENDPOINTS
  // ============================================================================

  /**
   * Create a new message in a conversation
   */
  async createMessage(conversationId: string, data: IMessageCreate, token: string): Promise<IMessage> {
    const res = await fetch(`${apiCore.url}/chats/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: apiCore.headers(token),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to create message: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * List messages in a conversation
   */
  async listMessages(
    conversationId: string,
    page: number = 1,
    pageSize: number = 50,
    recentOnly: boolean = false,
    token: string
  ): Promise<IMessageListResponse> {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (recentOnly) {
      searchParams.append("recent_only", "true");
    }

    console.log('📡 chatAPI.listMessages called with:', { conversationId, page, pageSize, recentOnly });

    const res = await fetch(`${apiCore.url}/chats/conversations/${conversationId}/messages?${searchParams}`, {
      method: "GET",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      console.error('❌ chatAPI.listMessages failed:', res.status, res.statusText);
      throw new Error(`Failed to list messages: ${res.statusText}`);
    }

    const data = await res.json();
    console.log('✅ chatAPI.listMessages response:', {
      messagesCount: data.messages?.length || 0,
      total: data.total,
      page: data.page,
      responseKeys: Object.keys(data),
      firstMessage: data.messages?.[0]
    });

    return data;
  },

  /**
   * Get a specific message
   */
  async getMessage(messageId: string, token: string): Promise<IMessage> {
    const res = await fetch(`${apiCore.url}/chats/messages/${messageId}`, {
      method: "GET",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to get message: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Update a message
   */
  async updateMessage(messageId: string, data: IMessageUpdate, token: string): Promise<IMessage> {
    const res = await fetch(`${apiCore.url}/chats/messages/${messageId}`, {
      method: "PUT",
      headers: apiCore.headers(token),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to update message: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Delete (soft delete) a message
   */
  async deleteMessage(messageId: string, token: string): Promise<IMsg> {
    const res = await fetch(`${apiCore.url}/chats/messages/${messageId}`, {
      method: "DELETE",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to delete message: ${res.statusText}`);
    }

    return await res.json();
  },

  // ============================================================================
  // FEEDBACK ENDPOINTS
  // ============================================================================

  /**
   * Create feedback for a conversation or message
   */
  async createFeedback(data: IConversationFeedbackCreate, token: string): Promise<IConversationFeedback> {
    const res = await fetch(`${apiCore.url}/chats/feedback`, {
      method: "POST",
      headers: apiCore.headers(token),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to create feedback: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * List feedback for a conversation
   */
  async listConversationFeedback(conversationId: string, token: string): Promise<IConversationFeedback[]> {
    const res = await fetch(`${apiCore.url}/chats/conversations/${conversationId}/feedback`, {
      method: "GET",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to list feedback: ${res.statusText}`);
    }

    return await res.json();
  },

  // ============================================================================
  // CONVERSATION TEMPLATE ENDPOINTS
  // ============================================================================

  /**
   * Create a new conversation template
   */
  async createTemplate(data: IConversationTemplateCreate, token: string): Promise<IConversationTemplate> {
    const res = await fetch(`${apiCore.url}/chats/templates`, {
      method: "POST",
      headers: apiCore.headers(token),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to create template: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * List conversation templates
   */
  async listTemplates(category?: string, publicOnly: boolean = false, token: string = ""): Promise<IConversationTemplate[]> {
    const searchParams = new URLSearchParams();

    if (category) searchParams.append("category", category);
    if (publicOnly) searchParams.append("public_only", "true");

    const res = await fetch(`${apiCore.url}/chats/templates?${searchParams}`, {
      method: "GET",
      headers: publicOnly ? {
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
      } : apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to list templates: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Get a specific conversation template
   */
  async getTemplate(templateId: string, token: string): Promise<IConversationTemplate> {
    const res = await fetch(`${apiCore.url}/chats/templates/${templateId}`, {
      method: "GET",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to get template: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Update a conversation template
   */
  async updateTemplate(templateId: string, data: IConversationTemplateUpdate, token: string): Promise<IConversationTemplate> {
    const res = await fetch(`${apiCore.url}/chats/templates/${templateId}`, {
      method: "PUT",
      headers: apiCore.headers(token),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to update template: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Delete a conversation template
   */
  async deleteTemplate(templateId: string, token: string): Promise<IMsg> {
    const res = await fetch(`${apiCore.url}/chats/templates/${templateId}`, {
      method: "DELETE",
      headers: apiCore.headers(token),
    });

    if (!res.ok) {
      throw new Error(`Failed to delete template: ${res.statusText}`);
    }

    return await res.json();
  },

  // ============================================================================
  // CHAT ENDPOINTS (Integration with existing chat)
  // ============================================================================

  /**
   * Send a chat message using unified chat endpoint
   */
  async sendMessage(data: IChatRequest, token: string): Promise<IChatResponse> {
    const res = await fetch(`${apiCore.url}/agents/chat`, {
      method: "POST",
      headers: apiCore.headers(token),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to send message: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Send a streaming chat message using Server-Sent Events
   */
  async sendStreamingMessage(
    data: IChatRequest,
    token: string,
    onChunk: (chunk: string) => void,
    onComplete: (response: IChatResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      // Set stream to true
      const streamingData = { ...data, stream: true };

      const response = await fetch(`${apiCore.url}/agents/chat`, {
        method: "POST",
        headers: {
          ...apiCore.headers(token),
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(streamingData),
      });

      if (!response.ok) {
        throw new Error(`Failed to send streaming message: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body reader available");
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';
      let messageId = '';
      let conversationId = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                // Stream completed, call onComplete with final response
                const finalResponse: IChatResponse = {
                  message_id: messageId || `stream-${Date.now()}`,
                  conversation_id: conversationId || data.conversation_id || '',
                  response: fullResponse,
                  status: 'completed',
                  timestamp: new Date().toISOString(),
                  tools_used: [],
                  knowledge_searched: false,
                  memory_accessed: false,
                };
                onComplete(finalResponse);
                return;
              }

              try {
                const chunk = JSON.parse(data);

                // Handle different chunk types
                if (chunk.type === 'content' || chunk.delta) {
                  const text = chunk.delta || chunk.content || '';
                  if (text) {
                    fullResponse += text;
                    onChunk(text);
                  }
                } else if (chunk.message_id) {
                  messageId = chunk.message_id;
                } else if (chunk.conversation_id) {
                  conversationId = chunk.conversation_id;
                }
              } catch (parseError) {
                // If not JSON, treat as plain text chunk
                if (data.trim()) {
                  fullResponse += data;
                  onChunk(data);
                }
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  },
};
