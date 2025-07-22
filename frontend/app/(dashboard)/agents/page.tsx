"use client";

import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../lib/hooks";
import { loggedIn } from "../../lib/slices/authSlice";
import { useRouter } from "next/navigation";
import { CpuChipIcon, PlusIcon } from "@heroicons/react/24/outline";
import {
  fetchAgents,
  deleteAgent,
  selectAgents,
  selectAgentLoading,
  selectAgentError,
  selectAgentFilters,
  selectAgentPagination
} from "../../lib/slices/agentSlice";
import { IAgentConfiguration } from "../../lib/interfaces";
import AgentList from "../../components/agent/AgentList";

export default function Agents() {
  const isLoggedIn = useAppSelector((state) => loggedIn(state));
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [mounted, setMounted] = useState(false);

  // Redux state
  const agents = useAppSelector(selectAgents);
  const loading = useAppSelector(selectAgentLoading);
  const error = useAppSelector(selectAgentError);
  const filters = useAppSelector(selectAgentFilters);
  const pagination = useAppSelector(selectAgentPagination);
  const tokensState = useAppSelector((state) => state.tokens);

  // Debug logging
  console.log("Agents Page Debug:", {
    isLoggedIn,
    tokensState,
    hasToken: !!tokensState?.access_token,
    tokenLength: tokensState?.access_token?.length || 0,
    error: error
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.push("/authentication");
    }
  }, [isLoggedIn, mounted, router]);

  // Fetch agents when component mounts and user is logged in
  useEffect(() => {
    if (mounted && isLoggedIn) {
      console.log("🚀 Initial fetchAgents from agents page");
      dispatch(fetchAgents());
    }
  }, [mounted, isLoggedIn, dispatch]);

  // Refetch when filters or pagination change
  useEffect(() => {
    if (mounted && isLoggedIn) {
      const searchParams = {
        ...filters,
        page: pagination.page,
        page_size: pagination.pageSize,
      };
      console.log("🔄 Refetching agents due to filter/pagination change:", searchParams);
      dispatch(fetchAgents(searchParams));
    }
  }, [mounted, isLoggedIn, dispatch, filters.type, filters.status, filters.search, pagination.page, pagination.pageSize]);

  // Handler functions for agent actions
  const handleCreateAgent = () => {
    router.push("/agents/create");
  };

  const handleViewAgent = (agent: IAgentConfiguration) => {
    router.push(`/agents/${agent.id}`);
  };

  const handleEditAgent = (agent: IAgentConfiguration) => {
    router.push(`/agents/${agent.id}/edit`);
  };

  const handleDeleteAgent = async (agent: IAgentConfiguration) => {
    if (window.confirm(`Are you sure you want to delete "${agent.name}"?`)) {
      try {
        await dispatch(deleteAgent(agent.id)).unwrap();
        // Refresh the agents list
        dispatch(fetchAgents());
      } catch (error) {
        console.error("Failed to delete agent:", error);
      }
    }
  };

  const handleShareAgent = (agent: IAgentConfiguration) => {
    // TODO: Implement share functionality
    console.log("Share agent:", agent.name);
    // For now, just copy the agent ID to clipboard
    navigator.clipboard.writeText(agent.id);
    alert(`Agent ID copied to clipboard: ${agent.id}`);
  };

  const handleStartChat = (agent: IAgentConfiguration) => {
    router.push(`/chat?agent=${agent.id}`);
  };

  if (!mounted || !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
            <p className="mt-2 text-gray-600">
              Manage your AI agents and their capabilities
            </p>
          </div>
          <button
            onClick={() => router.push("/agents/create")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Agent
          </button>
        </div>

        {/* Loading State */}
        {loading.agents && agents.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
            <span className="ml-3 text-gray-600">Loading agents...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">
              <strong>Error:</strong> {error}
            </div>
            <button
              onClick={() => dispatch(fetchAgents())}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Agents List */}
        {!loading.agents && !error && (
          <AgentList
            onCreateAgent={handleCreateAgent}
            onViewAgent={handleViewAgent}
            onEditAgent={handleEditAgent}
            onDeleteAgent={handleDeleteAgent}
            onShareAgent={handleShareAgent}
            onStartChat={handleStartChat}
          />
        )}

        {/* Empty State */}
        {!loading.agents && !error && agents.length === 0 && (
          <div className="text-center py-12">
            <CpuChipIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No agents</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first AI agent.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push("/agents/create")}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Agent
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
