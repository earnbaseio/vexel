"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { createAgent, updateAgent } from "@/app/lib/slices/agentSlice";
import {
  IAgentConfiguration,
  IAgentConfigurationCreate,
  IAgentConfigurationUpdate,
  AgentType,
  IToolConfiguration,
  IKnowledgeSource,
} from "@/app/lib/interfaces";
import { IKnowledgeItem, IKnowledgeListResponse } from "@/lib/interfaces/knowledge";
import { knowledgeAPI } from "@/app/lib/api";
import { RootState } from "@/app/lib/store";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";

interface AgentFormProps {
  agent?: IAgentConfiguration;
  onSubmit?: (agent: IAgentConfiguration) => void;
  onCancel?: () => void;
  className?: string;
}

const AgentForm: React.FC<AgentFormProps> = ({
  agent,
  onSubmit,
  onCancel,
  className = ""
}) => {
  const dispatch = useAppDispatch();
  const { creating, updating } = useAppSelector(state => state.agent.loading);
  
  const isEditing = !!agent;
  const isLoading = creating || updating;

  // Available models per provider
  const availableModels = {
    openai: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
    anthropic: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307", "claude-3-opus-20240229"],
    gemini: ["gemini/gemini-2.5-flash-lite-preview-06-17", "gemini/gemini-1.5-pro", "gemini/gemini-1.5-flash"]
  };

  // Available capabilities
  const availableCapabilities = [
    "reasoning", "analysis", "search", "calculation", "code_generation",
    "data_processing", "creative_writing", "translation", "summarization"
  ];

  // Available tools from Agno framework
  const availableTools = [
    { name: "reasoning", description: "Step-by-step reasoning and analysis tools", category: "reasoning" },
    { name: "calculator", description: "Mathematical calculations and computations", category: "calculation" },
    { name: "duckduckgo", description: "Web search using DuckDuckGo", category: "search" },
    { name: "yfinance", description: "Financial data and stock information", category: "finance" },
    { name: "dalle", description: "AI image generation using DALL-E", category: "creative" },
    { name: "file_tools", description: "File reading and writing operations", category: "file" },
    { name: "shell_tools", description: "Shell command execution", category: "system" },
    { name: "python_tools", description: "Python code execution", category: "code" },
    { name: "email_tools", description: "Email sending and management", category: "communication" },
    { name: "calendar_tools", description: "Calendar and scheduling operations", category: "productivity" },
  ];

  // Form state
  const [formData, setFormData] = useState<IAgentConfigurationCreate>({
    name: "",
    description: "",
    agent_type: AgentType.ASSISTANT,

    model_provider: "gemini",
    model_id: "gemini/gemini-2.5-flash-lite-preview-06-17",
    model_parameters: { temperature: 0.7, max_tokens: 1000 },
    api_keys: {},

    capabilities: [],
    instructions: [
      "You are a helpful AI assistant. Follow these critical guidelines:",
      "1. NEVER fabricate or invent information about specific systems, architectures, or technical details",
      "2. If you don't have access to knowledge sources about a topic, clearly state this limitation",
      "3. Distinguish between general knowledge and specific system knowledge",
      "4. When asked about specific projects or systems, only provide information if you have verified knowledge sources",
      "5. If uncertain about any information, express your uncertainty rather than guessing",
      "6. Always prioritize accuracy over completeness - it's better to say 'I don't know' than to provide incorrect information"
    ],
    tools: [],
    knowledge_sources: [],

    enable_memory: false,
    enable_knowledge_search: false,
    memory_config: {},
    storage_config: {},

    team_role: undefined,
    collaboration_mode: undefined,
    team_members: [],

    workflow_config: {},
    workflow_steps: [],

    shared_with: [],
    is_public: false,
    tags: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Knowledge collections state
  const [knowledgeCollections, setKnowledgeCollections] = useState<IKnowledgeItem[]>([]);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);

  // Initialize form with agent data if editing
  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        description: agent.description,
        agent_type: agent.agent_type,

        model_provider: agent.model_provider,
        model_id: agent.model_id,
        model_parameters: agent.model_parameters,
        api_keys: agent.api_keys || {},

        capabilities: agent.capabilities || [],
        instructions: agent.instructions.length > 0 ? agent.instructions : [""],
        tools: agent.tools,
        knowledge_sources: agent.knowledge_sources,

        enable_memory: agent.enable_memory,
        enable_knowledge_search: agent.enable_knowledge_search,
        memory_config: agent.memory_config,
        storage_config: agent.storage_config,

        team_role: agent.team_role,
        collaboration_mode: agent.collaboration_mode,
        team_members: agent.team_members || [],

        workflow_config: agent.workflow_config,
        workflow_steps: agent.workflow_steps,

        shared_with: agent.shared_with || [],
        is_public: agent.is_public,
        tags: agent.tags,
      });
    }
  }, [agent]);

  // Load knowledge collections
  useEffect(() => {
    loadKnowledgeCollections();
  }, []);

  // Get token from Redux state
  const tokens = useAppSelector((state: RootState) => state.tokens);

  const loadKnowledgeCollections = async () => {
    setLoadingKnowledge(true);
    try {
      const token = tokens.access_token;
      if (!token) {
        throw new Error("No access token available");
      }

      const data = await knowledgeAPI.getCollectionsInfo(token);
      console.log('Knowledge collections response:', data);

      // Transform collections data to match IKnowledgeItem format
      // Backend returns: { collections: { collections: ["name1", "name2"], total_collections: N } }
      if (data.collections && data.collections.collections && Array.isArray(data.collections.collections)) {
        const transformedCollections = data.collections.collections.map((collectionName: string) => ({
          id: collectionName,
          title: collectionName,
          description: `Qdrant collection: ${collectionName}`,
          category: 'other',
          collection_name: collectionName,
          documents_processed: 0, // We don't have vector count info in this response
          status: 'ready',
          tags: [],
          metadata: { backend_name: collectionName },
          user_id: 'current_user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          upload_timestamp: new Date().toISOString()
        }));
        setKnowledgeCollections(transformedCollections);
        console.log('✅ Knowledge collections loaded:', transformedCollections.length);
      } else if (typeof data === 'string') {
        // Handle case where API returns a string response
        console.log('API returned string response:', data);
        setKnowledgeCollections([]);
      } else {
        console.log('No collections found in response. Data structure:', data);
        setKnowledgeCollections([]);
      }
    } catch (error) {
      console.error('Failed to load knowledge collections:', error);
      setKnowledgeCollections([]);
    } finally {
      setLoadingKnowledge(false);
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Agent name is required";
    }

    if (formData.name.length > 100) {
      newErrors.name = "Agent name must be less than 100 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    // Validate API keys if provided
    if (formData.api_keys) {
      Object.entries(formData.api_keys).forEach(([provider, key]) => {
        if (key && key.length < 10) {
          newErrors[`api_key_${provider}`] = `${provider} API key seems too short`;
        }
      });
    }

    // Validate knowledge sources
    if (formData.knowledge_sources) {
      formData.knowledge_sources.forEach((ks, index) => {
        if (ks.type === "text" && (!ks.content || !ks.content[0])) {
          newErrors[`knowledge_source_${index}`] = "Text content is required";
        }
        if ((ks.type === "url" || ks.type === "pdf") && (!ks.urls || !ks.urls[0])) {
          newErrors[`knowledge_source_${index}`] = "URL is required";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Clean up instructions (remove empty ones)
      const cleanedData = {
        ...formData,
        instructions: formData.instructions.filter(instruction => instruction.trim() !== ""),
      };

      let result;
      if (isEditing && agent) {
        result = await dispatch(updateAgent({ 
          agentId: agent.id, 
          data: cleanedData as IAgentConfigurationUpdate 
        })).unwrap();
      } else {
        result = await dispatch(createAgent(cleanedData)).unwrap();
      }

      if (onSubmit) {
        onSubmit(result);
      }
    } catch (error) {
      // Error is handled by the slice
      console.error("Form submission error:", error);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof IAgentConfigurationCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Handle instructions
  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, ""]
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((instruction, i) => 
        i === index ? value : instruction
      )
    }));
  };

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  // Handle tags
  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  // Handle capabilities
  const toggleCapability = (capability: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities?.includes(capability)
        ? prev.capabilities.filter(c => c !== capability)
        : [...(prev.capabilities || []), capability]
    }));
  };

  // Handle API keys
  const updateApiKey = (provider: string, apiKey: string) => {
    setFormData(prev => ({
      ...prev,
      api_keys: {
        ...prev.api_keys,
        [provider]: apiKey
      }
    }));
  };

  // Handle model provider change
  const handleProviderChange = (provider: string) => {
    const models = availableModels[provider as keyof typeof availableModels];
    setFormData(prev => ({
      ...prev,
      model_provider: provider,
      model_id: models[0] // Set first model as default
    }));
  };

  // Handle tools
  const toggleTool = (toolName: string) => {
    setFormData(prev => {
      const currentTools = prev.tools || [];
      const toolExists = currentTools.some(tool => tool.name === toolName);

      if (toolExists) {
        return {
          ...prev,
          tools: currentTools.filter(tool => tool.name !== toolName)
        };
      } else {
        const toolConfig = availableTools.find(t => t.name === toolName);
        return {
          ...prev,
          tools: [...currentTools, {
            name: toolName,
            description: toolConfig?.description || "",
            enabled: true,
            parameters: {}
          }]
        };
      }
    });
  };

  // Handle knowledge sources - use existing collections
  const toggleKnowledgeCollection = (collectionId: string) => {
    setFormData(prev => {
      const currentSources = prev.knowledge_sources || [];
      const existingIndex = currentSources.findIndex(ks => ks.collection_id === collectionId);

      if (existingIndex >= 0) {
        // Remove if already selected
        return {
          ...prev,
          knowledge_sources: currentSources.filter((_, i) => i !== existingIndex)
        };
      } else {
        // Add new collection
        const collection = knowledgeCollections.find(kc => kc.id === collectionId);
        if (collection) {
          return {
            ...prev,
            knowledge_sources: [...currentSources, {
              type: "collection",
              name: collection.title,
              collection_id: collectionId,
              collection_name: collection.collection_name,
              content: [],
              file_ids: [],
              urls: []
            }]
          };
        }
      }
      return prev;
    });
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Basic Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Agent Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Agent Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.name ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Enter agent name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Agent Type */}
          <div>
            <label htmlFor="agent_type" className="block text-sm font-medium text-gray-700">
              Agent Type
            </label>
            <select
              id="agent_type"
              value={formData.agent_type}
              onChange={(e) => handleInputChange("agent_type", e.target.value as AgentType)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value={AgentType.ASSISTANT}>Assistant</option>
              <option value={AgentType.SPECIALIST}>Specialist</option>
              <option value={AgentType.COORDINATOR}>Coordinator</option>
              <option value={AgentType.ANALYZER}>Analyzer</option>
            </select>
          </div>



          {/* Model Provider */}
          <div>
            <label htmlFor="model_provider" className="block text-sm font-medium text-gray-700">
              Model Provider
            </label>
            <select
              id="model_provider"
              value={formData.model_provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>

          {/* Model ID */}
          <div>
            <label htmlFor="model_id" className="block text-sm font-medium text-gray-700">
              Model
            </label>
            <select
              id="model_id"
              value={formData.model_id}
              onChange={(e) => handleInputChange("model_id", e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {availableModels[formData.model_provider as keyof typeof availableModels]?.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.description ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="Describe what this agent does..."
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        {/* Model Parameters */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
              Temperature
            </label>
            <input
              type="number"
              id="temperature"
              min="0"
              max="2"
              step="0.1"
              value={formData.model_parameters?.temperature || 0.7}
              onChange={(e) => handleInputChange("model_parameters", {
                ...formData.model_parameters,
                temperature: parseFloat(e.target.value)
              })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="max_tokens" className="block text-sm font-medium text-gray-700">
              Max Tokens
            </label>
            <input
              type="number"
              id="max_tokens"
              min="1"
              max="8000"
              value={formData.model_parameters?.max_tokens || 1000}
              onChange={(e) => handleInputChange("model_parameters", {
                ...formData.model_parameters,
                max_tokens: parseInt(e.target.value)
              })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* API Keys Configuration */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">API Keys Configuration</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure API keys for each provider. These will be stored securely and used instead of environment variables.
        </p>

        <div className="space-y-4">
          {Object.keys(availableModels).map(provider => (
            <div key={provider}>
              <label htmlFor={`api_key_${provider}`} className="block text-sm font-medium text-gray-700 capitalize">
                {provider} API Key
              </label>
              <input
                type="password"
                id={`api_key_${provider}`}
                value={formData.api_keys?.[provider] || ""}
                onChange={(e) => updateApiKey(provider, e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={`Enter ${provider} API key...`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Capabilities */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Capabilities</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select the capabilities this agent should have. These determine what tools and features are available.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {availableCapabilities.map(capability => (
            <div key={capability} className="flex items-center">
              <input
                id={`capability_${capability}`}
                type="checkbox"
                checked={formData.capabilities?.includes(capability) || false}
                onChange={() => toggleCapability(capability)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor={`capability_${capability}`} className="ml-2 block text-sm text-gray-900 capitalize">
                {capability.replace('_', ' ')}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Tools Configuration */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tools Configuration</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select the tools this agent can use. Tools provide specific capabilities like web search, calculations, file operations, etc.
        </p>

        <div className="space-y-4">
          {Object.entries(
            availableTools.reduce((acc, tool) => {
              if (!acc[tool.category]) acc[tool.category] = [];
              acc[tool.category].push(tool);
              return acc;
            }, {} as Record<string, typeof availableTools>)
          ).map(([category, tools]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-800 mb-2 capitalize">{category} Tools</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tools.map(tool => {
                  const isSelected = formData.tools?.some(t => t.name === tool.name) || false;
                  return (
                    <div key={tool.name} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <input
                        id={`tool_${tool.name}`}
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTool(tool.name)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor={`tool_${tool.name}`} className="block text-sm font-medium text-gray-900 capitalize cursor-pointer">
                          {tool.name.replace('_', ' ')}
                        </label>
                        <p className="text-xs text-gray-500 mt-1">{tool.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Instructions</h3>
        
        <div className="space-y-3">
          {formData.instructions.map((instruction, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={instruction}
                onChange={(e) => updateInstruction(index, e.target.value)}
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter instruction..."
              />
              {formData.instructions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInstruction(index)}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            onClick={addInstruction}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Instruction
          </button>
        </div>
      </div>

      {/* Knowledge Sources */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Knowledge Sources</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select existing knowledge collections for the agent to reference. These collections contain processed documents, text, and URLs.
        </p>

        {loadingKnowledge ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">Loading knowledge collections...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {knowledgeCollections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No knowledge collections found.</p>
                <p className="text-sm mt-1">
                  <a href="/knowledge" className="text-indigo-600 hover:text-indigo-500">
                    Create knowledge collections
                  </a> first to use them with agents.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {knowledgeCollections.map(collection => {
                    const isSelected = formData.knowledge_sources?.some(ks => ks.collection_id === collection.id) || false;
                    return (
                      <div key={collection.id} className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}>
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleKnowledgeCollection(collection.id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {collection.title}
                            </h4>
                            {collection.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {collection.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span className="capitalize">{collection.category}</span>
                              <span>{collection.documents_processed} documents</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                collection.status === 'ready'
                                  ? 'bg-green-100 text-green-800'
                                  : collection.status === 'processing'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {collection.status}
                              </span>
                            </div>
                            {collection.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {collection.tags.slice(0, 3).map(tag => (
                                  <span key={tag} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                    {tag}
                                  </span>
                                ))}
                                {collection.tags.length > 3 && (
                                  <span className="text-xs text-gray-500">+{collection.tags.length - 3} more</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {formData.knowledge_sources && formData.knowledge_sources.length > 0 && (
                  <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                    <h4 className="text-sm font-medium text-indigo-900 mb-2">Selected Collections:</h4>
                    <div className="space-y-1">
                      {formData.knowledge_sources.map((ks, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-indigo-800">{ks.name}</span>
                          <button
                            type="button"
                            onClick={() => toggleKnowledgeCollection(ks.collection_id!)}
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Features</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="enable_memory"
              type="checkbox"
              checked={formData.enable_memory}
              onChange={(e) => handleInputChange("enable_memory", e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="enable_memory" className="ml-2 block text-sm text-gray-900">
              Enable Memory
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="enable_knowledge_search"
              type="checkbox"
              checked={formData.enable_knowledge_search}
              onChange={(e) => handleInputChange("enable_knowledge_search", e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="enable_knowledge_search" className="ml-2 block text-sm text-gray-900">
              Enable Knowledge Search
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="is_public"
              type="checkbox"
              checked={formData.is_public}
              onChange={(e) => handleInputChange("is_public", e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
              Make this agent public
            </label>
          </div>
        </div>
      </div>

      {/* Advanced Configuration */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Configuration</h3>

        {/* Memory Configuration */}
        {formData.enable_memory && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-800 mb-3">Memory Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Memory Type</label>
                <select
                  value={formData.memory_config?.type || "sqlite"}
                  onChange={(e) => handleInputChange("memory_config", {
                    ...formData.memory_config,
                    type: e.target.value
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="sqlite">SQLite (Local)</option>
                  <option value="postgres">PostgreSQL</option>
                  <option value="mongodb">MongoDB</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Memory Retention (days)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.memory_config?.retention_days || 30}
                  onChange={(e) => handleInputChange("memory_config", {
                    ...formData.memory_config,
                    retention_days: parseInt(e.target.value)
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Storage Configuration */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">Storage Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Storage Type</label>
              <select
                value={formData.storage_config?.type || "sqlite"}
                onChange={(e) => handleInputChange("storage_config", {
                  ...formData.storage_config,
                  type: e.target.value
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="sqlite">SQLite (Local)</option>
                <option value="postgres">PostgreSQL</option>
                <option value="mongodb">MongoDB</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Auto Cleanup</label>
              <select
                value={formData.storage_config?.auto_cleanup ? "true" : "false"}
                onChange={(e) => handleInputChange("storage_config", {
                  ...formData.storage_config,
                  auto_cleanup: e.target.value === "true"
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="false">Disabled</option>
                <option value="true">Enabled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Workflow Configuration */}
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-3">Workflow Configuration</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Workflow Type</label>
              <select
                value={formData.workflow_config?.type || "sequential"}
                onChange={(e) => handleInputChange("workflow_config", {
                  ...formData.workflow_config,
                  type: e.target.value
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="sequential">Sequential</option>
                <option value="parallel">Parallel</option>
                <option value="conditional">Conditional</option>
                <option value="loop">Loop</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                id="enable_state_management"
                type="checkbox"
                checked={formData.workflow_config?.enable_state_management || false}
                onChange={(e) => handleInputChange("workflow_config", {
                  ...formData.workflow_config,
                  enable_state_management: e.target.checked
                })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="enable_state_management" className="ml-2 block text-sm text-gray-900">
                Enable State Management
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="enable_error_recovery"
                type="checkbox"
                checked={formData.workflow_config?.enable_error_recovery || false}
                onChange={(e) => handleInputChange("workflow_config", {
                  ...formData.workflow_config,
                  enable_error_recovery: e.target.checked
                })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="enable_error_recovery" className="ml-2 block text-sm text-gray-900">
                Enable Error Recovery
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Team Collaboration */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Team Collaboration</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure how this agent works with other agents in team scenarios.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="team_role" className="block text-sm font-medium text-gray-700">
              Team Role
            </label>
            <select
              id="team_role"
              value={formData.team_role || ""}
              onChange={(e) => handleInputChange("team_role", e.target.value || undefined)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">No specific role</option>
              <option value="leader">Leader</option>
              <option value="member">Member</option>
              <option value="specialist">Specialist</option>
            </select>
          </div>

          <div>
            <label htmlFor="collaboration_mode" className="block text-sm font-medium text-gray-700">
              Collaboration Mode
            </label>
            <select
              id="collaboration_mode"
              value={formData.collaboration_mode || ""}
              onChange={(e) => handleInputChange("collaboration_mode", e.target.value || undefined)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">No specific mode</option>
              <option value="route">Route (delegate tasks)</option>
              <option value="coordinate">Coordinate (manage workflow)</option>
              <option value="collaborate">Collaborate (work together)</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Team Members
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Add other agent IDs that this agent should collaborate with
          </p>
          <div className="space-y-2">
            {formData.team_members?.map((memberId, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={memberId}
                  onChange={(e) => {
                    const newMembers = [...(formData.team_members || [])];
                    newMembers[index] = e.target.value;
                    handleInputChange("team_members", newMembers);
                  }}
                  className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter agent ID..."
                />
                <button
                  type="button"
                  onClick={() => {
                    const newMembers = formData.team_members?.filter((_, i) => i !== index) || [];
                    handleInputChange("team_members", newMembers);
                  }}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const newMembers = [...(formData.team_members || []), ""];
                handleInputChange("team_members", newMembers);
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Team Member
            </button>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
        
        <div className="space-y-3">
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:text-indigo-600"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Add a tag..."
              className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Saving..." : isEditing ? "Update Agent" : "Create Agent"}
        </button>
      </div>
    </form>
  );
};

export default AgentForm;
