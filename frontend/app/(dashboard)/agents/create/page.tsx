"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "../../../lib/hooks";
import { loggedIn } from "../../../lib/slices/authSlice";
import { useRouter } from "next/navigation";
import { IAgentConfiguration } from "../../../lib/interfaces";
import AgentForm from "../../../components/agent/AgentForm";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function CreateAgent() {
  const isLoggedIn = useAppSelector((state) => loggedIn(state));
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.push("/authentication");
    }
  }, [isLoggedIn, mounted, router]);

  const handleSubmit = async (agent: IAgentConfiguration) => {
    // Agent is already created by AgentForm, just redirect
    router.push("/agents");
  };

  const handleCancel = () => {
    router.push("/agents");
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
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/agents")}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Agents
            </button>
          </div>

          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">Create AI Agent</h1>
            <p className="mt-2 text-gray-600">Configure a new AI agent with specific capabilities</p>
          </div>
        </div>

        {/* Agent Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Agent Configuration</h3>
          </div>

          <div className="p-6">
            <AgentForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
