"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import {
  setCurrentTemplate,
  setCurrentExecution,
  selectCurrentExecution,
} from "@/app/lib/slices/workflowSlice";
import {
  IWorkflowTemplate,
  IWorkflowExecution,
} from "@/app/lib/interfaces";
import WorkflowList from "@/app/components/workflow/WorkflowList";
import WorkflowExecutionDialog from "@/app/components/workflow/WorkflowExecutionDialog";
import WorkflowExecutionMonitor from "@/app/components/workflow/WorkflowExecutionMonitor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import {
  Cog6ToothIcon,
  PlayIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

type ViewMode = "list" | "execution" | "details";

const WorkflowsPage: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const currentExecution = useAppSelector(selectCurrentExecution);

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedWorkflow, setSelectedWorkflow] = useState<IWorkflowTemplate | null>(null);
  const [showExecutionDialog, setShowExecutionDialog] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExecutionMonitor, setShowExecutionMonitor] = useState(false);

  // Handle workflow creation
  const handleCreateWorkflow = () => {
    router.push("/workflows/create");
  };

  // Handle workflow execution
  const handleExecuteWorkflow = (workflow: IWorkflowTemplate) => {
    setSelectedWorkflow(workflow);
    setShowExecutionDialog(true);
  };

  // Handle workflow viewing
  const handleViewWorkflow = (workflow: IWorkflowTemplate) => {
    setSelectedWorkflow(workflow);
    dispatch(setCurrentTemplate(workflow));
    setShowDetailsModal(true);
  };

  // Handle workflow editing
  const handleEditWorkflow = (workflow: IWorkflowTemplate) => {
    router.push(`/workflows/${workflow.id}/edit`);
  };

  // Handle workflow deletion
  const handleDeleteWorkflow = (workflow: IWorkflowTemplate) => {
    // Deletion is handled in WorkflowList component
    console.log("Delete workflow:", workflow.id);
  };

  // Handle workflow sharing
  const handleShareWorkflow = (workflow: IWorkflowTemplate) => {
    // TODO: Implement share functionality
    console.log("Share workflow:", workflow.id);
  };

  // Handle execution start
  const handleExecutionStart = (executionId: string) => {
    // Navigate to execution monitoring
    router.push(`/workflows/executions/${executionId}`);
  };

  // Handle execution monitoring
  const handleViewExecution = (execution: IWorkflowExecution) => {
    dispatch(setCurrentExecution(execution));
    setShowExecutionMonitor(true);
  };

  // Handle execution cancellation
  const handleCancelExecution = (executionId: string) => {
    // Cancellation is handled in WorkflowExecutionMonitor component
    console.log("Cancel execution:", executionId);
  };

  // Handle execution retry
  const handleRetryExecution = (executionId: string) => {
    // TODO: Implement retry functionality
    console.log("Retry execution:", executionId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Workflow Management
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Create, execute, and monitor automated workflows with your AI agents.
                </p>
              </div>
              
              <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                <button
                  onClick={() => router.push("/workflows/executions")}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  View Executions
                </button>
                
                <button
                  onClick={() => router.push("/workflows/public")}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Cog6ToothIcon className="h-4 w-4 mr-2" />
                  Browse Public
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WorkflowList
          onCreateWorkflow={handleCreateWorkflow}
          onExecuteWorkflow={handleExecuteWorkflow}
          onViewWorkflow={handleViewWorkflow}
          onEditWorkflow={handleEditWorkflow}
          onDeleteWorkflow={handleDeleteWorkflow}
          onShareWorkflow={handleShareWorkflow}
        />
      </div>

      {/* Workflow Execution Dialog */}
      <WorkflowExecutionDialog
        workflow={selectedWorkflow}
        open={showExecutionDialog}
        onOpenChange={setShowExecutionDialog}
        onExecutionStart={handleExecutionStart}
      />

      {/* Workflow Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedWorkflow?.name || "Workflow Details"}
            </DialogTitle>
          </DialogHeader>
          
          {selectedWorkflow && (
            <div className="mt-4 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Name</dt>
                      <dd className="text-sm text-gray-900">{selectedWorkflow.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Category</dt>
                      <dd className="text-sm text-gray-900 capitalize">{selectedWorkflow.category}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Complexity</dt>
                      <dd className="text-sm text-gray-900 capitalize">{selectedWorkflow.complexity_level}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Steps</dt>
                      <dd className="text-sm text-gray-900">{selectedWorkflow.steps.length}</dd>
                    </div>
                  </dl>
                  
                  {selectedWorkflow.description && (
                    <div className="mt-4">
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="text-sm text-gray-900 mt-1">{selectedWorkflow.description}</dd>
                    </div>
                  )}
                </div>
              </div>

              {/* Steps */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Workflow Steps</h3>
                <div className="space-y-3">
                  {selectedWorkflow.steps.map((step, index) => (
                    <div key={step.step_id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full text-sm font-medium">
                            {index + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{step.name}</h4>
                            <p className="text-xs text-gray-500 capitalize">{step.step_type.replace('_', ' ')}</p>
                          </div>
                        </div>
                        
                        <span className="text-xs text-gray-500">
                          {step.timeout_seconds}s timeout
                        </span>
                      </div>
                      
                      {step.description && (
                        <p className="text-sm text-gray-600 mt-2">{step.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Performance Metrics</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Executions</dt>
                      <dd className="text-2xl font-semibold text-gray-900">{selectedWorkflow.execution_count}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Success Rate</dt>
                      <dd className="text-2xl font-semibold text-green-600">
                        {(selectedWorkflow.success_rate * 100).toFixed(1)}%
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Avg Duration</dt>
                      <dd className="text-2xl font-semibold text-blue-600">
                        {Math.floor(selectedWorkflow.average_duration / 60)}m
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Tags */}
              {selectedWorkflow.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorkflow.tags.map((tag, index) => (
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

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Close
                </button>
                
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleExecuteWorkflow(selectedWorkflow);
                  }}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Execute Workflow
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Execution Monitor Modal */}
      <Dialog open={showExecutionMonitor} onOpenChange={setShowExecutionMonitor}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Workflow Execution Monitor</DialogTitle>
          </DialogHeader>
          
          {currentExecution && (
            <div className="mt-4">
              <WorkflowExecutionMonitor
                execution={currentExecution}
                onCancel={handleCancelExecution}
                onRetry={handleRetryExecution}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkflowsPage;
