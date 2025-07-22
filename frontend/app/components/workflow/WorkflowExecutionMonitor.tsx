"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import {
  fetchStepExecutions,
  cancelWorkflowExecution,
  updateExecutionStatus,
  selectCurrentExecution,
  selectStepExecutions,
  selectWorkflowLoading,
} from "@/app/lib/slices/workflowSlice";
import {
  IWorkflowExecution,
  IWorkflowStepExecution,
} from "@/app/lib/interfaces";
import { WorkflowStatus, StepType } from "@/app/lib/interfaces/workflow";
import LoadingSpinner from "../ui/LoadingSpinner";
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface WorkflowExecutionMonitorProps {
  execution: IWorkflowExecution;
  onCancel?: (executionId: string) => void;
  onRetry?: (executionId: string) => void;
  className?: string;
}

const WorkflowExecutionMonitor: React.FC<WorkflowExecutionMonitorProps> = ({
  execution,
  onCancel,
  onRetry,
  className = ""
}) => {
  const dispatch = useAppDispatch();
  const stepExecutions = useAppSelector(selectStepExecutions);
  const loading = useAppSelector(selectWorkflowLoading);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const steps = stepExecutions[execution.execution_id] || [];

  // Auto-refresh for running executions
  useEffect(() => {
    if (autoRefresh && (execution.status === WorkflowStatus.RUNNING || execution.status === WorkflowStatus.PENDING)) {
      const interval = setInterval(() => {
        dispatch(fetchStepExecutions(execution.execution_id));
      }, 2000);
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh, execution.status, execution.execution_id, dispatch, refreshInterval]);

  // Load step executions on mount
  useEffect(() => {
    dispatch(fetchStepExecutions(execution.execution_id));
  }, [dispatch, execution.execution_id]);

  // Helper functions
  const getStatusColor = (status: WorkflowStatus): string => {
    switch (status) {
      case WorkflowStatus.PENDING: return "text-yellow-600 bg-yellow-100";
      case WorkflowStatus.RUNNING: return "text-blue-600 bg-blue-100";
      case WorkflowStatus.COMPLETED: return "text-green-600 bg-green-100";
      case WorkflowStatus.FAILED: return "text-red-600 bg-red-100";
      case WorkflowStatus.CANCELLED: return "text-gray-600 bg-gray-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: WorkflowStatus) => {
    switch (status) {
      case WorkflowStatus.PENDING: return <ClockIcon className="h-5 w-5" />;
      case WorkflowStatus.RUNNING: return <PlayIcon className="h-5 w-5" />;
      case WorkflowStatus.COMPLETED: return <CheckCircleIcon className="h-5 w-5" />;
      case WorkflowStatus.FAILED: return <XCircleIcon className="h-5 w-5" />;
      case WorkflowStatus.CANCELLED: return <StopIcon className="h-5 w-5" />;
      default: return <ClockIcon className="h-5 w-5" />;
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

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const calculateProgress = (): number => {
    if (steps.length === 0) return 0;
    const completedSteps = steps.filter(step => 
      step.status === WorkflowStatus.COMPLETED || step.status === WorkflowStatus.FAILED
    ).length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel this workflow execution?")) {
      dispatch(cancelWorkflowExecution(execution.execution_id));
      if (onCancel) {
        onCancel(execution.execution_id);
      }
    }
  };

  const progress = calculateProgress();
  const isRunning = execution.status === WorkflowStatus.RUNNING || execution.status === WorkflowStatus.PENDING;

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getStatusColor(execution.status)}`}>
              {getStatusIcon(execution.status)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Workflow Execution
              </h3>
              <p className="text-sm text-gray-500">
                ID: {execution.execution_id}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Auto-refresh toggle */}
            <label className="flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              Auto-refresh
            </label>

            {/* Cancel button */}
            {isRunning && (
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <StopIcon className="h-4 w-4 mr-1" />
                Cancel
              </button>
            )}

            {/* Retry button */}
            {execution.status === WorkflowStatus.FAILED && onRetry && (
              <button
                onClick={() => onRetry(execution.execution_id)}
                className="inline-flex items-center px-3 py-1.5 border border-indigo-300 shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlayIcon className="h-4 w-4 mr-1" />
                Retry
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress: {progress}%</span>
            <span>
              {steps.filter(s => s.status === WorkflowStatus.COMPLETED).length} / {steps.length} steps completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                execution.status === WorkflowStatus.FAILED
                  ? "bg-red-600"
                  : execution.status === WorkflowStatus.COMPLETED
                  ? "bg-green-600"
                  : "bg-indigo-600"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Execution metadata */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Status:</span>
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
              {execution.status}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Started:</span>
            <span className="ml-2 text-gray-900">{formatTimestamp(execution.started_at)}</span>
          </div>
          <div>
            <span className="text-gray-500">Duration:</span>
            <span className="ml-2 text-gray-900">
              {execution.completed_at 
                ? formatDuration(Math.floor((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000))
                : formatDuration(Math.floor((Date.now() - new Date(execution.started_at).getTime()) / 1000))
              }
            </span>
          </div>
          <div>
            <span className="text-gray-500">Steps:</span>
            <span className="ml-2 text-gray-900">{execution.steps_completed} / {execution.steps.length}</span>
          </div>
        </div>
      </div>

      {/* Step executions */}
      <div className="p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Step Executions</h4>
        
        {loading.executions && steps.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : steps.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No step executions found</p>
        ) : (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.step_execution_id}
                className={`border rounded-lg p-4 ${
                  step.status === WorkflowStatus.RUNNING
                    ? "border-blue-200 bg-blue-50"
                    : step.status === WorkflowStatus.COMPLETED
                    ? "border-green-200 bg-green-50"
                    : step.status === WorkflowStatus.FAILED
                    ? "border-red-200 bg-red-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500">
                        Step {step.step_order}
                      </span>
                      {index < steps.length - 1 && (
                        <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStepTypeIcon(step.step_type)}
                      <span className="text-sm font-medium text-gray-900">
                        {step.step_name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(step.status)}`}>
                      {step.status}
                    </span>
                    
                    {step.execution_time > 0 && (
                      <span className="text-xs text-gray-500">
                        {formatDuration(step.execution_time)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Step details */}
                {step.input_data && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Input:</p>
                    <pre className="text-xs text-gray-700 bg-white p-2 rounded border overflow-x-auto">
                      {typeof step.input_data === 'string' 
                        ? step.input_data 
                        : JSON.stringify(step.input_data, null, 2)
                      }
                    </pre>
                  </div>
                )}

                {step.output_data && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Output:</p>
                    <pre className="text-xs text-gray-700 bg-white p-2 rounded border overflow-x-auto">
                      {typeof step.output_data === 'string' 
                        ? step.output_data 
                        : JSON.stringify(step.output_data, null, 2)
                      }
                    </pre>
                  </div>
                )}

                {step.error_message && (
                  <div className="mt-3">
                    <div className="flex items-center space-x-2 text-red-600">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <p className="text-xs font-medium">Error:</p>
                    </div>
                    <p className="text-xs text-red-700 mt-1 bg-red-50 p-2 rounded border">
                      {step.error_message}
                    </p>
                  </div>
                )}

                {/* Step metadata */}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    {step.started_at && (
                      <span>Started: {formatTimestamp(step.started_at)}</span>
                    )}
                    {step.completed_at && (
                      <span>Completed: {formatTimestamp(step.completed_at)}</span>
                    )}
                  </div>
                  
                  {step.retry_count > 0 && (
                    <span className="text-yellow-600">
                      Retries: {step.retry_count}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowExecutionMonitor;
