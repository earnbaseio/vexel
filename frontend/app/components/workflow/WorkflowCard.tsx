"use client";

import React from "react";
import {
  IWorkflowTemplate
} from "@/app/lib/interfaces";
import { StepType } from "@/app/lib/interfaces/workflow";
import { 
  PlayIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  ClockIcon,
  CpuChipIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ChartBarIcon,
  TagIcon
} from "@heroicons/react/24/outline";

interface WorkflowCardProps {
  workflow: IWorkflowTemplate;
  onExecute?: (workflow: IWorkflowTemplate) => void;
  onView?: (workflow: IWorkflowTemplate) => void;
  onEdit?: (workflow: IWorkflowTemplate) => void;
  onDelete?: (workflow: IWorkflowTemplate) => void;
  onShare?: (workflow: IWorkflowTemplate) => void;
  className?: string;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({
  workflow,
  onExecute,
  onView,
  onEdit,
  onDelete,
  onShare,
  className = ""
}) => {
  // Helper functions
  const getComplexityColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case "simple": return "bg-green-100 text-green-800";
      case "moderate": return "bg-yellow-100 text-yellow-800";
      case "complex": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "automation": return <Cog6ToothIcon className="h-5 w-5" />;
      case "analysis": return <ChartBarIcon className="h-5 w-5" />;
      case "collaboration": return <UserGroupIcon className="h-5 w-5" />;
      case "processing": return <CpuChipIcon className="h-5 w-5" />;
      default: return <DocumentTextIcon className="h-5 w-5" />;
    }
  };

  const getStepTypeIcon = (type: StepType) => {
    switch (type) {
      case StepType.AGENT_TASK: return <CpuChipIcon className="h-4 w-4" />;
      case StepType.HUMAN_INPUT: return <UserGroupIcon className="h-4 w-4" />;
      case StepType.CONDITION: return <ChartBarIcon className="h-4 w-4" />;
      case StepType.LOOP: return <Cog6ToothIcon className="h-4 w-4" />;
      default: return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  // Count step types
  const stepTypeCounts = workflow.steps.reduce((acc, step) => {
    acc[step.step_type] = (acc[step.step_type] || 0) + 1;
    return acc;
  }, {} as Record<StepType, number>);

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                {getCategoryIcon(workflow.category)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {workflow.name}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {workflow.description || "No description"}
              </p>
            </div>
          </div>
          
          {/* Complexity badge */}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComplexityColor(workflow.complexity_level)}`}>
            {workflow.complexity_level}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Workflow details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Category</p>
            <p className="text-sm text-gray-900 capitalize">{workflow.category}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Steps</p>
            <p className="text-sm text-gray-900">{workflow.steps.length} steps</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Executions</p>
            <p className="text-sm text-gray-900">{workflow.execution_count}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Success Rate</p>
            <p className="text-sm text-gray-900">{(workflow.success_rate * 100).toFixed(1)}%</p>
          </div>
        </div>

        {/* Step types breakdown */}
        {Object.keys(stepTypeCounts).length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-500 mb-2">Step Types</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stepTypeCounts).map(([type, count]) => (
                <span
                  key={type}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {getStepTypeIcon(type as StepType)}
                  <span className="ml-1">{type.replace('_', ' ')}: {count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {workflow.tags.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-500 mb-2">Tags</p>
            <div className="flex flex-wrap gap-1">
              {workflow.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                >
                  <TagIcon className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
              {workflow.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                  +{workflow.tags.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Performance metrics */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-500 mb-2">Performance</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>Avg Duration: {formatDuration(workflow.average_duration)}</div>
            <div>Last Run: {workflow.last_execution ? formatDate(workflow.last_execution) : "Never"}</div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {workflow.is_public && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                Public
              </span>
            )}
            {workflow.requires_approval && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800">
                Requires Approval
              </span>
            )}
            {workflow.is_scheduled && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                <ClockIcon className="h-3 w-3 mr-1" />
                Scheduled
              </span>
            )}
          </div>
        </div>

        {/* Timestamps */}
        <div className="text-xs text-gray-500 mb-4">
          <p>Created: {formatDate(workflow.created)}</p>
          <p>Updated: {formatDate(workflow.updated)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {onExecute && (
              <button
                onClick={() => onExecute(workflow)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlayIcon className="h-4 w-4 mr-1" />
                Execute
              </button>
            )}
            {onView && (
              <button
                onClick={() => onView(workflow)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <EyeIcon className="h-4 w-4 mr-1" />
                View
              </button>
            )}
          </div>
          
          <div className="flex space-x-2">
            {onShare && (
              <button
                onClick={() => onShare(workflow)}
                className="inline-flex items-center p-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                title="Share Workflow"
              >
                <ShareIcon className="h-4 w-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(workflow)}
                className="inline-flex items-center p-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                title="Edit Workflow"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(workflow)}
                className="inline-flex items-center p-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                title="Delete Workflow"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowCard;
