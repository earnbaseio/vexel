"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/app/lib/hooks";
import { loggedIn } from "@/app/lib/slices/authSlice";
import { 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  ShareIcon,
  CpuChipIcon
} from "@heroicons/react/24/outline";
import { IAgentConfiguration } from "@/app/lib/interfaces";
import { agentAPI } from "@/app/lib/api";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

export default function AgentDetail() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(loggedIn);
  const tokensState = useAppSelector((state) => state.tokens);
  
  const [agent, setAgent] = useState<IAgentConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const agentId = params.id as string;

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/authentication");
      return;
    }

    const fetchAgent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = tokensState.access_token;
        if (!token) {
          throw new Error("No access token available");
        }

        const agentData = await agentAPI.getAgent(agentId, token);
        setAgent(agentData);
      } catch (err: any) {
        console.error("Failed to fetch agent:", err);
        setError(err.message || "Failed to load agent");
      } finally {
        setLoading(false);
      }
    };

    if (agentId && tokensState.access_token) {
      fetchAgent();
    }
  }, [agentId, isLoggedIn, tokensState.access_token, router]);

  const handleEdit = () => {
    router.push(`/agents/${agentId}/edit`);
  };

  const handleDelete = async () => {
    if (!agent) return;
    
    if (window.confirm(`Are you sure you want to delete "${agent.name}"?`)) {
      try {
        const token = tokensState.access_token;
        if (!token) throw new Error("No access token");
        
        await agentAPI.deleteAgent(agentId, token);
        router.push("/agents");
      } catch (err: any) {
        console.error("Failed to delete agent:", err);
        alert("Failed to delete agent: " + err.message);
      }
    }
  };

  const handleStartChat = () => {
    router.push(`/chat?agent=${agentId}`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(agentId);
    alert(`Agent ID copied to clipboard: ${agentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CpuChipIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading agent</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={() => router.push("/agents")}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Agents
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CpuChipIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Agent not found</h3>
          <p className="mt-1 text-sm text-gray-500">The agent you're looking for doesn't exist.</p>
          <div className="mt-6">
            <button
              onClick={() => router.push("/agents")}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Agents
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/agents")}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Agents
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              {agent.status === "active" && (
                <button
                  onClick={handleStartChat}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Start Chat
                </button>
              )}
              
              <button
                onClick={handleShare}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ShareIcon className="h-4 w-4 mr-2" />
                Share
              </button>
              
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
              
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
          
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">{agent.name}</h1>
            <p className="mt-2 text-gray-600">{agent.description}</p>
          </div>
        </div>

        {/* Agent Details */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Agent Configuration</h3>
          </div>
          
          <div className="px-6 py-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{agent.agent_type}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    agent.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {agent.status}
                  </span>
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Model</dt>
                <dd className="mt-1 text-sm text-gray-900">{agent.model_id}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Provider</dt>
                <dd className="mt-1 text-sm text-gray-900">{agent.model_provider}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Conversations</dt>
                <dd className="mt-1 text-sm text-gray-900">{agent.total_conversations}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Success Rate</dt>
                <dd className="mt-1 text-sm text-gray-900">{(agent.success_rate * 100).toFixed(1)}%</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(agent.created).toLocaleDateString()}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(agent.updated).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Features */}
        {(agent.enable_memory || agent.enable_knowledge_search || agent.tools.length > 0) && (
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Features</h3>
            </div>
            
            <div className="px-6 py-4">
              <div className="flex flex-wrap gap-2">
                {agent.enable_memory && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Memory Enabled
                  </span>
                )}
                {agent.enable_knowledge_search && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Knowledge Search
                  </span>
                )}
                {agent.tools.length > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    {agent.tools.length} Tools
                  </span>
                )}
                {agent.is_public && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    Public
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        {agent.tags.length > 0 && (
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Tags</h3>
            </div>
            
            <div className="px-6 py-4">
              <div className="flex flex-wrap gap-2">
                {agent.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
