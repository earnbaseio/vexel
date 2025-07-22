"use client";

import React, { useState } from "react";
import {
  IAgentConfiguration,
  AgentType,
  AgentStatus
} from "@/app/lib/interfaces";
import { 
  UserIcon, 
  CogIcon, 
  ChartBarIcon,
  ShareIcon,
  PlayIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CpuChipIcon,
  BoltIcon,
  DocumentTextIcon,
  TagIcon,
  EyeIcon,
  EyeSlashIcon
} from "@heroicons/react/24/outline";

interface AgentDetailsProps {
  agent: IAgentConfiguration;
  onEdit?: (agent: IAgentConfiguration) => void;
  onDelete?: (agent: IAgentConfiguration) => void;
  onShare?: (agent: IAgentConfiguration) => void;
  onStartChat?: (agent: IAgentConfiguration) => void;
  onViewMetrics?: (agent: IAgentConfiguration) => void;
  className?: string;
}

const AgentDetails: React.FC<AgentDetailsProps> = ({
  agent,
  onEdit,
  onDelete,
  onShare,
  onStartChat,
  onViewMetrics,
  className = ""
}) => {
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

  // Helper functions

  const getStatusColor = (status: AgentStatus): string => {
    switch (status) {
      case AgentStatus.ACTIVE: return "bg-green-100 text-green-800 border-green-200";
      case AgentStatus.INACTIVE: return "bg-gray-100 text-gray-800 border-gray-200";
      case AgentStatus.ARCHIVED: return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case AgentStatus.ERROR: return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = (type: AgentType) => {
    switch (type) {
      case AgentType.ASSISTANT: return <UserIcon className="h-6 w-6" />;
      case AgentType.SPECIALIST: return <CogIcon className="h-6 w-6" />;
      case AgentType.COORDINATOR: return <ShareIcon className="h-6 w-6" />;
      case AgentType.ANALYZER: return <ChartBarIcon className="h-6 w-6" />;
      default: return <UserIcon className="h-6 w-6" />;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const formatSuccessRate = (rate: number): string => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  const formatResponseTime = (time: number): string => {
    return `${time.toFixed(2)}s`;
  };

  return (
    <div className={`bg-white shadow-lg rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              {getTypeIcon(agent.agent_type)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{agent.name}</h1>
              <p className="text-indigo-100 mt-1">{agent.description || "No description"}</p>
              <div className="flex items-center space-x-3 mt-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(agent.status)}`}>
                  {agent.status}
                </span>

              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex space-x-2">
            {onStartChat && agent.status === AgentStatus.ACTIVE && (
              <button
                onClick={() => onStartChat(agent)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                Start Chat
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(agent)}
                className="inline-flex items-center p-2 border border-white border-opacity-30 shadow-sm text-sm font-medium rounded-md text-white hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-indigo-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Conversations</p>
                <p className="text-2xl font-semibold text-gray-900">{agent.total_conversations}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Messages</p>
                <p className="text-2xl font-semibold text-gray-900">{agent.total_messages}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <BoltIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{formatSuccessRate(agent.success_rate)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Avg Response</p>
                <p className="text-2xl font-semibold text-gray-900">{formatResponseTime(agent.average_response_time)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Configuration */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CogIcon className="h-5 w-5 mr-2" />
              Configuration
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="text-sm text-gray-900 capitalize">{agent.agent_type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Model Provider</dt>
                <dd className="text-sm text-gray-900">{agent.model_provider}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Model ID</dt>
                <dd className="text-sm text-gray-900">{agent.model_id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Version</dt>
                <dd className="text-sm text-gray-900">{agent.version}</dd>
              </div>
            </dl>
          </div>

          {/* Features */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <BoltIcon className="h-5 w-5 mr-2" />
              Features
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Memory</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  agent.enable_memory ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}>
                  {agent.enable_memory ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Knowledge Search</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  agent.enable_knowledge_search ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}>
                  {agent.enable_knowledge_search ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Public</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  agent.is_public ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                }`}>
                  {agent.is_public ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Tools</span>
                <span className="text-sm text-gray-900">{agent.tools.length} configured</span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {agent.instructions.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Instructions
            </h3>
            <ul className="space-y-2">
              {agent.instructions.map((instruction, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start">
                  <span className="inline-block w-2 h-2 bg-indigo-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  {instruction}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Model Parameters */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CpuChipIcon className="h-5 w-5 mr-2" />
              Model Parameters
            </h3>
            <button
              onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
            >
              {showSensitiveInfo ? (
                <>
                  <EyeSlashIcon className="h-4 w-4 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <EyeIcon className="h-4 w-4 mr-1" />
                  Show
                </>
              )}
            </button>
          </div>
          
          {showSensitiveInfo ? (
            <pre className="text-sm text-gray-700 bg-white p-4 rounded border overflow-x-auto">
              {JSON.stringify(agent.model_parameters, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-gray-500 italic">
              Click "Show" to view model parameters
            </p>
          )}
        </div>

        {/* Tags */}
        {agent.tags.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <TagIcon className="h-5 w-5 mr-2" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {agent.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2" />
            Timeline
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="text-sm text-gray-900">{formatDate(agent.created)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="text-sm text-gray-900">{formatDate(agent.updated)}</dd>
            </div>
            {agent.last_used && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Used</dt>
                <dd className="text-sm text-gray-900">{formatDate(agent.last_used)}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex space-x-3">
            {onViewMetrics && (
              <button
                onClick={() => onViewMetrics(agent)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                View Metrics
              </button>
            )}
            {onShare && (
              <button
                onClick={() => onShare(agent)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ShareIcon className="h-4 w-4 mr-2" />
                Share
              </button>
            )}
          </div>
          
          {onDelete && (
            <button
              onClick={() => onDelete(agent)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete Agent
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDetails;
