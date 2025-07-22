"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "../../../lib/hooks";
import { loggedIn } from "../../../lib/slices/authSlice";
import { useRouter } from "next/navigation";

export default function StartCollaboration() {
  const isLoggedIn = useAppSelector((state) => loggedIn(state));
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    sessionName: "",
    objective: "",
    sessionType: "",
    agents: [] as string[],
    duration: "",
    mode: "sequential",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.push("/authentication");
    }
  }, [isLoggedIn, mounted, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAgentChange = (agent: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      agents: checked
        ? [...prev.agents, agent]
        : prev.agents.filter(a => a !== agent)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.sessionName.trim()) {
        alert("Please enter a session name");
        return;
      }
      if (!formData.sessionType) {
        alert("Please select a session type");
        return;
      }

      // TODO: Implement collaboration start API call
      console.log("Starting collaboration with data:", formData);

      // Redirect to collaboration list
      router.push("/collaboration");

    } catch (error) {
      console.error("Error starting collaboration:", error);
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Start Collaboration Session</h1>
          <p className="mt-2 text-gray-600">
            Create a new multi-agent collaboration session
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Session Configuration</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="sessionName" className="block text-sm font-medium text-gray-700">
                  Session Name
                </label>
                <input
                  type="text"
                  name="sessionName"
                  id="sessionName"
                  value={formData.sessionName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                  placeholder="Enter session name"
                  required
                />
              </div>

              <div>
                <label htmlFor="objective" className="block text-sm font-medium text-gray-700">
                  Collaboration Objective
                </label>
                <textarea
                  name="objective"
                  id="objective"
                  rows={3}
                  value={formData.objective}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                  placeholder="Describe what you want the agents to collaborate on"
                />
              </div>

              <div>
                <label htmlFor="sessionType" className="block text-sm font-medium text-gray-700">
                  Session Type
                </label>
                <select
                  name="sessionType"
                  id="sessionType"
                  value={formData.sessionType}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                  required
                >
                  <option value="">Select session type</option>
                  <option value="brainstorming">Brainstorming</option>
                  <option value="problem_solving">Problem Solving</option>
                  <option value="decision_making">Decision Making</option>
                  <option value="planning">Planning</option>
                  <option value="analysis">Analysis</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Participating Agents
                </label>
                <div className="mt-2 space-y-2">
                  {[
                    { name: "Reasoning Agent", description: "Logical analysis and inference" },
                    { name: "Memory Agent", description: "Information storage and retrieval" },
                    { name: "Creative Agent", description: "Idea generation and innovation" },
                    { name: "Analytical Agent", description: "Data analysis and insights" },
                    { name: "Communication Agent", description: "Coordination and messaging" },
                  ].map((agent) => (
                    <label key={agent.name} className="flex items-start">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 rounded mt-1"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-700">{agent.name}</span>
                        <p className="text-sm text-gray-500">{agent.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                  Session Duration (minutes)
                </label>
                <input
                  type="number"
                  name="duration"
                  id="duration"
                  min="5"
                  max="480"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                  placeholder="30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Collaboration Mode
                </label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="mode"
                      value="sequential"
                      className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300"
                      defaultChecked
                    />
                    <span className="ml-2 text-sm text-gray-700">Sequential - Agents take turns</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="mode"
                      value="parallel"
                      className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Parallel - Agents work simultaneously</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="mode"
                      value="hybrid"
                      className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Hybrid - Mixed approach</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.push("/collaboration")}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                >
                  Start Session
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
