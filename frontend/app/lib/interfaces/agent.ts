/**
 * TypeScript interfaces for Agent Management
 */

// Enums
export enum AgentType {
  ASSISTANT = "assistant",
  SPECIALIST = "specialist",
  COORDINATOR = "coordinator",
  ANALYZER = "analyzer"
}

export enum AgentStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  ARCHIVED = "archived",
  ERROR = "error"
}

// Base interfaces
export interface IKnowledgeSource {
  type: string;
  name: string;
  content?: string[];
  urls?: string[];
  file_ids?: string[];
  collection_id?: string;  // For existing knowledge collections
  collection_name?: string;  // For existing knowledge collections
  metadata: Record<string, any>;
}

export interface IToolConfiguration {
  tool_name: string;
  tool_type: string;
  enabled: boolean;
  parameters: Record<string, any>;
}

// Agent Configuration interfaces
export interface IAgentConfiguration {
  id: string;
  user_id: string;
  name: string;
  description: string;
  agent_type: AgentType;

  // Model configuration
  model_provider: string;
  model_id: string;
  model_parameters: Record<string, any>;
  api_keys: Record<string, string>; // API keys per provider
  available_models: Record<string, string[]>; // Available models per provider

  // Agent capabilities
  capabilities: string[];
  instructions: string[];
  tools: IToolConfiguration[];
  knowledge_sources: IKnowledgeSource[];

  // Memory & storage
  enable_memory: boolean;
  enable_knowledge_search: boolean;
  memory_config: Record<string, any>;
  storage_config: Record<string, any>;

  // Team collaboration (Level 4)
  team_role?: string;
  collaboration_mode?: string;
  team_members: string[];

  // Workflow configuration (Level 5)
  workflow_config: Record<string, any>;
  workflow_steps: Record<string, any>[];

  // Access control
  shared_with: string[];
  status: AgentStatus;
  is_public: boolean;
  tags: string[];
  version: string;

  // Performance metrics
  total_conversations: number;
  total_messages: number;
  average_response_time: number;
  success_rate: number;
  last_used?: string;
  
  // Timestamps
  created: string;
  updated: string;
}

export interface IAgentConfigurationCreate {
  name: string;
  description?: string;
  agent_type: AgentType;

  // Model configuration
  model_provider?: string;
  model_id?: string;
  model_parameters?: Record<string, any>;
  api_keys?: Record<string, string>; // API keys per provider

  // Agent capabilities
  capabilities?: string[];
  instructions?: string[];
  tools?: IToolConfiguration[];
  knowledge_sources?: IKnowledgeSource[];

  // Memory & storage
  enable_memory?: boolean;
  enable_knowledge_search?: boolean;
  memory_config?: Record<string, any>;
  storage_config?: Record<string, any>;

  // Team collaboration
  team_role?: string;
  collaboration_mode?: string;
  team_members?: string[];

  // Workflow configuration
  workflow_config?: Record<string, any>;
  workflow_steps?: Record<string, any>[];

  // Access control
  shared_with?: string[];
  is_public?: boolean;
  tags?: string[];
}

export interface IAgentConfigurationUpdate {
  name?: string;
  description?: string;
  agent_type?: AgentType;

  // Model configuration
  model_provider?: string;
  model_id?: string;
  model_parameters?: Record<string, any>;
  api_keys?: Record<string, string>;

  // Agent capabilities
  capabilities?: string[];
  instructions?: string[];
  tools?: IToolConfiguration[];
  knowledge_sources?: IKnowledgeSource[];
  enable_memory?: boolean;
  enable_knowledge_search?: boolean;
  memory_config?: Record<string, any>;
  storage_config?: Record<string, any>;
  team_role?: string;
  collaboration_mode?: string;
  workflow_config?: Record<string, any>;
  workflow_steps?: Record<string, any>[];
  status?: AgentStatus;
  is_public?: boolean;
  tags?: string[];
}

// Agent Session interfaces
export interface IAgentSession {
  id: string;
  agent_id: string;
  user_id: string;
  session_id: string;
  session_name: string;
  session_description: string;
  
  // Runtime state
  is_active: boolean;
  current_context: Record<string, any>;
  session_memory: Record<string, any>;
  
  // Performance tracking
  messages_count: number;
  total_tokens_used: number;
  total_cost: number;
  
  // Timestamps
  started_at: string;
  last_activity: string;
  ended_at?: string;
}

export interface IAgentSessionCreate {
  agent_id: string;
  session_id: string;
  session_name?: string;
  session_description?: string;
}

export interface IAgentSessionUpdate {
  session_name?: string;
  session_description?: string;
  is_active?: boolean;
  current_context?: Record<string, any>;
  session_memory?: Record<string, any>;
}

// Agent Metrics interfaces
export interface IAgentMetrics {
  id: string;
  agent_id: string;
  user_id: string;
  date: string;
  
  // Usage metrics
  daily_conversations: number;
  daily_messages: number;
  daily_tokens: number;
  daily_cost: number;
  
  // Performance metrics
  average_response_time: number;
  success_rate: number;
  error_rate: number;
  user_satisfaction: number;
  
  // Feature usage
  tools_used: Record<string, number>;
  knowledge_searches: number;
  memory_operations: number;
  
  created: string;
}

// API Request/Response interfaces
export interface IAgentChatRequest {
  message: string;
  agent_id?: string;
  session_id?: string;
  context?: Record<string, any>;
  stream?: boolean;
}

export interface IAgentChatResponse {
  message: string;
  response: string;
  agent_id: string;
  session_id: string;
  
  // Response metadata
  tokens_used: number;
  response_time: number;
  cost: number;
  model_used: string;
  
  // Context information
  tools_used: string[];
  knowledge_searched: boolean;
  memory_accessed: boolean;
  
  status: string;
  timestamp: string;
}

export interface IAgentListResponse {
  agents: IAgentConfiguration[];
  total: number;
  page: number;
  page_size: number;
}

export interface IAgentSearchRequest {
  query?: string;
  agent_type?: AgentType;
  tags?: string[];
  is_public?: boolean;
  page?: number;
  page_size?: number;
}
