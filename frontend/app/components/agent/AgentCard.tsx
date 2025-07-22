"use client";

import React from "react";
import {
  IAgentConfiguration
} from "@/app/lib/interfaces";
import { 
  UserIcon, 
  CogIcon, 
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  PlayIcon
} from "@heroicons/react/24/outline";

interface AgentCardProps {
  agent: IAgentConfiguration;
  onView?: (agent: IAgentConfiguration) => void;
  onEdit?: (agent: IAgentConfiguration) => void;
  onDelete?: (agent: IAgentConfiguration) => void;
  onShare?: (agent: IAgentConfiguration) => void;
  onStart?: (agent: IAgentConfiguration) => void;
  className?: string;
}

const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onView,
  onEdit,
  onDelete,
  onShare,
  onStart,
  className = ""
}) => {
  // Helper functions

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "archived": return "bg-yellow-100 text-yellow-800";
      case "error": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "assistant": return <UserIcon className="h-5 w-5" />;
      case "specialist": return <CogIcon className="h-5 w-5" />;
      case "coordinator": return <ShareIcon className="h-5 w-5" />;
      case "analyzer": return <ChartBarIcon className="h-5 w-5" />;
      default: return <UserIcon className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatSuccessRate = (rate: number): string => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  return (
    <div className={`group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                {getTypeIcon(agent.agent_type)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 truncate mb-1">
                {agent.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {agent.description || "No description available"}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(agent.status)}`}>
            {agent.status}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Conversations</span>
              <ChartBarIcon className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-lg font-bold text-gray-900 mt-1">{agent.total_conversations}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Success Rate</span>
              <CogIcon className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-lg font-bold text-gray-900 mt-1">{formatSuccessRate(agent.success_rate)}</p>
          </div>
        </div>

        {/* Model & Type */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <span className="text-gray-500">Model:</span>
          <span className="font-medium text-gray-900">{agent.model_id}</span>
        </div>

        {/* Features */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {agent.enable_memory && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                🧠 Memory
              </span>
            )}
            {agent.enable_knowledge_search && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                🔍 Knowledge
              </span>
            )}
            {agent.tools.length > 0 && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                🛠️ {agent.tools.length} Tools
              </span>
            )}
            {agent.is_public && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                🌐 Public
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {agent.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {agent.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                >
                  #{tag}
                </span>
              ))}
              {agent.tags.length > 3 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  +{agent.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
          <span>Updated {formatDate(agent.updated)}</span>
          <span className="capitalize">{agent.agent_type}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
        <div className="grid grid-cols-5 gap-2">
          {/* Primary Action */}
          {onStart && agent.status === "active" && (
            <button
              onClick={() => onStart(agent)}
              className="col-span-2 inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold rounded-lg hover:from-rose-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <PlayIcon className="h-4 w-4 mr-2" />
              Start Chat
            </button>
          )}

          {/* View Action */}
          {onView && (
            <button
              onClick={() => onView(agent)}
              className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              View
            </button>
          )}

          {/* Secondary Actions - Equal sized buttons */}
          {onShare && (
            <button
              onClick={() => onShare(agent)}
              className="inline-flex items-center justify-center px-3 py-2.5 border border-gray-300 text-gray-600 rounded-lg bg-white hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
              title="Share Agent"
            >
              <ShareIcon className="h-4 w-4" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(agent)}
              className="inline-flex items-center justify-center px-3 py-2.5 border border-gray-300 text-gray-600 rounded-lg bg-white hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
              title="Edit Agent"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(agent)}
              className="inline-flex items-center justify-center px-3 py-2.5 border border-red-300 text-red-600 rounded-lg bg-white hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
              title="Delete Agent"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentCard;
