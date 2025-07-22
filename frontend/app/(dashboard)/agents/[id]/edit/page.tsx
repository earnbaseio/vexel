"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/app/lib/hooks";
import { loggedIn } from "@/app/lib/slices/authSlice";
import { updateAgent } from "@/app/lib/slices/agentSlice";
import { 
  ArrowLeftIcon,
  CpuChipIcon
} from "@heroicons/react/24/outline";
import { IAgentConfiguration, IAgentConfigurationUpdate } from "@/app/lib/interfaces";
import { agentAPI } from "@/app/lib/api";
import AgentForm from "@/app/components/agent/AgentForm";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

export default function EditAgent() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(loggedIn);
  const tokensState = useAppSelector((state) => state.tokens);
  
  const [agent, setAgent] = useState<IAgentConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agentId = params.id as string;

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/authentication");
      return;
    }

    const fetchAgent = async () => {
      try {
        console.log("🔄 Fetching agent data for edit:", { agentId, hasToken: !!tokensState.access_token });
        setLoading(true);
        setError(null);

        const token = tokensState.access_token;
        if (!token) {
          throw new Error("No access token available");
        }

        console.log("📡 Calling agentAPI.getAgent...");
        const agentData = await agentAPI.getAgent(agentId, token);
        console.log("✅ Agent data loaded:", agentData);
        setAgent(agentData);
      } catch (err: any) {
        console.error("❌ Failed to fetch agent:", err);
        setError(err.message || "Failed to load agent");
      } finally {
        setLoading(false);
      }
    };

    if (agentId && tokensState.access_token) {
      fetchAgent();
    }
  }, [agentId, isLoggedIn, tokensState.access_token, router]);

  const handleSubmit = async (data: IAgentConfigurationUpdate) => {
    try {
      setSaving(true);
      
      await dispatch(updateAgent({ agentId, data })).unwrap();
      
      // Redirect to agent detail page
      router.push(`/agents/${agentId}`);
    } catch (err: any) {
      console.error("Failed to update agent:", err);
      alert("Failed to update agent: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/agents/${agentId}`);
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
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push(`/agents/${agentId}`)}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Agent
            </button>
          </div>
          
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">Edit Agent</h1>
            <p className="mt-2 text-gray-600">Update your agent configuration and settings</p>
          </div>
        </div>

        {/* Agent Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Agent Configuration</h3>
          </div>
          
          <div className="p-6">
            <AgentForm
              agent={agent}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
