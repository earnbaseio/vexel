/**
 * TypeScript interfaces for Chat Management
 */

// Enums
export enum MessageRole {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system",
  TOOL = "tool"
}

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  FILE = "file",
  AUDIO = "audio",
  VIDEO = "video"
}

export enum ConversationStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
  ARCHIVED = "archived"
}

// Base interfaces
export interface IMessageContent {
  type: MessageType;
  text?: string;
  image_url?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  metadata: Record<string, any>;
}

export interface IToolCall {
  tool_name: string;
  tool_id: string;
  function_name: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
  execution_time: number;
  timestamp: string;
}

// Chat Conversation interfaces
export interface IChatConversation {
  id: string;
  conversation_id: string;
  user_id: string;
  agent_id: string;
  agent_session_id?: string;
  
  // Basic info
  title: string;
  description: string;
  
  // Configuration
  agent_config_snapshot: Record<string, any>;
  conversation_settings: Record<string, any>;
  
  // State
  status: ConversationStatus;
  is_pinned: boolean;
  is_shared: boolean;
  shared_with: string[];
  
  // Statistics
  message_count: number;
  total_tokens: number;
  total_cost: number;
  average_response_time: number;
  
  // Context
  conversation_context: Record<string, any>;
  conversation_summary: string;
  key_topics: string[];
  
  // Timestamps
  created: string;
  updated: string;
  last_message_at?: string;
  archived_at?: string;
}

export interface IChatConversationCreate {
  conversation_id: string;
  agent_id: string;
  title?: string;
  description?: string;
  agent_session_id?: string;
  agent_config_snapshot?: Record<string, any>;
  conversation_settings?: Record<string, any>;
}

export interface IChatConversationUpdate {
  title?: string;
  description?: string;
  status?: ConversationStatus;
  is_pinned?: boolean;
  is_shared?: boolean;
  shared_with?: string[];
  conversation_summary?: string;
  key_topics?: string[];
}

// Message interfaces
export interface IMessage {
  id: string;
  message_id: string;
  conversation_id: string;
  role: MessageRole;
  content: IMessageContent[];
  raw_content: string;
  
  // Tool usage
  tool_calls: IToolCall[];
  
  // Metadata
  tokens_used: number;
  cost: number;
  response_time: number;
  model_used?: string;
  
  // Context and memory
  context_used: Record<string, any>;
  memory_operations: Record<string, any>[];
  knowledge_searches: Record<string, any>[];
  
  // Status
  is_edited: boolean;
  edit_history: Record<string, any>[];
  is_deleted: boolean;
  
  // Timestamps
  timestamp: string;
  edited_at?: string;
}

export interface IMessageCreate {
  message_id: string;
  conversation_id: string;
  role: MessageRole;
  content: IMessageContent[];
  raw_content: string;
  tool_calls?: IToolCall[];
}

export interface IMessageUpdate {
  content?: IMessageContent[];
  raw_content?: string;
  is_edited?: boolean;
  edit_history?: Record<string, any>[];
  is_deleted?: boolean;
}

// Conversation Feedback interfaces
export interface IConversationFeedback {
  id: string;
  conversation_id: string;
  message_id?: string;
  user_id: string;
  rating: number; // 1-5
  feedback_text: string;
  feedback_type: string; // helpful, unhelpful, inappropriate, error
  categories: string[];
  suggestions: string;
  created: string;
}

export interface IConversationFeedbackCreate {
  conversation_id: string;
  message_id?: string;
  rating: number;
  feedback_text?: string;
  feedback_type: string;
  categories?: string[];
  suggestions?: string;
}

// Conversation Template interfaces
export interface IConversationTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: string;
  initial_prompt: string;
  system_instructions: string[];
  suggested_questions: string[];
  
  // Configuration
  recommended_agent_level?: string;
  recommended_tools: string[];
  required_knowledge_sources: string[];
  
  // Access control
  is_public: boolean;
  shared_with: string[];
  
  // Usage statistics
  usage_count: number;
  average_rating: number;
  
  // Timestamps
  created: string;
  updated: string;
}

export interface IConversationTemplateCreate {
  name: string;
  description?: string;
  category?: string;
  initial_prompt: string;
  system_instructions?: string[];
  suggested_questions?: string[];
  recommended_agent_level?: string;
  recommended_tools?: string[];
  required_knowledge_sources?: string[];
  is_public?: boolean;
}

export interface IConversationTemplateUpdate {
  name?: string;
  description?: string;
  category?: string;
  initial_prompt?: string;
  system_instructions?: string[];
  suggested_questions?: string[];
  recommended_agent_level?: string;
  recommended_tools?: string[];
  required_knowledge_sources?: string[];
  is_public?: boolean;
}

// API Request/Response interfaces
export interface IChatRequest {
  message: string;
  agent_id: string;  // Required: Reference to existing AgentConfiguration
  conversation_id?: string;
  context?: Record<string, any>;
  stream?: boolean;
}

export interface IChatResponse {
  message_id: string;
  conversation_id: string;
  response: string;
  sources?: string[];
  metadata?: Record<string, any>;
  status: string;

  // Legacy fields for backward compatibility
  message?: string;
  tokens_used?: number;
  response_time?: number;
  cost?: number;
  
  // Context information
  tools_used: string[];
  knowledge_searched: boolean;
  memory_accessed: boolean;
  
  status: string;
  timestamp: string;
}

export interface IConversationListResponse {
  conversations: IChatConversation[];
  total: number;
  page: number;
  page_size: number;
}

export interface IMessageListResponse {
  messages: IMessage[];
  total: number;
  page: number;
  page_size: number;
}

export interface IConversationSearchRequest {
  query?: string;
  status?: ConversationStatus;
  agent_id?: string;
  is_pinned?: boolean;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}
