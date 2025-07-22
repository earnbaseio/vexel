"use client";

import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import {
  executeWorkflow,
  selectWorkflowLoading,
} from "@/app/lib/slices/workflowSlice";
import {
  IWorkflowTemplate,
  IWorkflowExecuteRequest,
} from "@/app/lib/interfaces";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import LoadingSpinner from "../ui/LoadingSpinner";
import {
  PlayIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

interface WorkflowExecutionDialogProps {
  workflow: IWorkflowTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExecutionStart?: (executionId: string) => void;
}

const WorkflowExecutionDialog: React.FC<WorkflowExecutionDialogProps> = ({
  workflow,
  open,
  onOpenChange,
  onExecutionStart,
}) => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectWorkflowLoading);

  const [inputData, setInputData] = useState<Record<string, any>>({});
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [timeout, setTimeout] = useState<number>(3600); // 1 hour default
  const [retryCount, setRetryCount] = useState<number>(3);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when workflow changes
  React.useEffect(() => {
    if (workflow) {
      setInputData({});
      setErrors({});
      setPriority("normal");
      setTimeout(3600);
      setRetryCount(3);
    }
  }, [workflow]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (timeout <= 0) {
      newErrors.timeout = "Timeout must be greater than 0";
    }

    if (retryCount < 0) {
      newErrors.retryCount = "Retry count cannot be negative";
    }

    // Validate required input parameters
    if (workflow?.input_schema) {
      const schema = workflow.input_schema;
      if (schema.required) {
        for (const field of schema.required) {
          if (!inputData[field] || inputData[field].toString().trim() === "") {
            newErrors[field] = `${field} is required`;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workflow || !validateForm()) {
      return;
    }

    try {
      const executeRequest: IWorkflowExecuteRequest = {
        template_id: workflow.id,
        input_data: inputData,
        priority,
        timeout_seconds: timeout,
        max_retries: retryCount,
        metadata: {
          executed_from: "ui",
          timestamp: new Date().toISOString(),
        },
      };

      const result = await dispatch(executeWorkflow(executeRequest)).unwrap();
      
      if (onExecutionStart) {
        onExecutionStart(result.execution.execution_id);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to execute workflow:", error);
    }
  };

  // Handle input data change
  const handleInputChange = (field: string, value: any) => {
    setInputData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Render input field based on schema
  const renderInputField = (field: string, schema: any) => {
    const fieldSchema = schema.properties?.[field];
    const isRequired = schema.required?.includes(field);
    
    if (!fieldSchema) {
      return (
        <div key={field}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={inputData[field] || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors[field] ? "border-red-300" : "border-gray-300"
            }`}
            placeholder={`Enter ${field}...`}
          />
          {errors[field] && <p className="mt-1 text-sm text-red-600">{errors[field]}</p>}
        </div>
      );
    }

    const { type, description, enum: enumValues, default: defaultValue } = fieldSchema;

    switch (type) {
      case "string":
        if (enumValues) {
          return (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field} {isRequired && <span className="text-red-500">*</span>}
              </label>
              {description && <p className="text-xs text-gray-500 mb-1">{description}</p>}
              <select
                value={inputData[field] || defaultValue || ""}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors[field] ? "border-red-300" : "border-gray-300"
                }`}
              >
                <option value="">Select {field}...</option>
                {enumValues.map((value: string) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              {errors[field] && <p className="mt-1 text-sm text-red-600">{errors[field]}</p>}
            </div>
          );
        } else {
          return (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field} {isRequired && <span className="text-red-500">*</span>}
              </label>
              {description && <p className="text-xs text-gray-500 mb-1">{description}</p>}
              <input
                type="text"
                value={inputData[field] || defaultValue || ""}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors[field] ? "border-red-300" : "border-gray-300"
                }`}
                placeholder={description || `Enter ${field}...`}
              />
              {errors[field] && <p className="mt-1 text-sm text-red-600">{errors[field]}</p>}
            </div>
          );
        }

      case "number":
      case "integer":
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field} {isRequired && <span className="text-red-500">*</span>}
            </label>
            {description && <p className="text-xs text-gray-500 mb-1">{description}</p>}
            <input
              type="number"
              value={inputData[field] || defaultValue || ""}
              onChange={(e) => handleInputChange(field, type === "integer" ? parseInt(e.target.value) : parseFloat(e.target.value))}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                errors[field] ? "border-red-300" : "border-gray-300"
              }`}
              placeholder={description || `Enter ${field}...`}
            />
            {errors[field] && <p className="mt-1 text-sm text-red-600">{errors[field]}</p>}
          </div>
        );

      case "boolean":
        return (
          <div key={field}>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={inputData[field] || defaultValue || false}
                onChange={(e) => handleInputChange(field, e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                {field} {isRequired && <span className="text-red-500">*</span>}
              </label>
            </div>
            {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
            {errors[field] && <p className="mt-1 text-sm text-red-600">{errors[field]}</p>}
          </div>
        );

      default:
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field} {isRequired && <span className="text-red-500">*</span>}
            </label>
            {description && <p className="text-xs text-gray-500 mb-1">{description}</p>}
            <textarea
              value={typeof inputData[field] === 'object' ? JSON.stringify(inputData[field], null, 2) : (inputData[field] || defaultValue || "")}
              onChange={(e) => {
                try {
                  const value = JSON.parse(e.target.value);
                  handleInputChange(field, value);
                } catch {
                  handleInputChange(field, e.target.value);
                }
              }}
              rows={3}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                errors[field] ? "border-red-300" : "border-gray-300"
              }`}
              placeholder={description || `Enter ${field} (JSON format)...`}
            />
            {errors[field] && <p className="mt-1 text-sm text-red-600">{errors[field]}</p>}
          </div>
        );
    }
  };

  if (!workflow) return null;

  const inputFields = workflow.input_schema?.properties ? Object.keys(workflow.input_schema.properties) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <PlayIcon className="h-5 w-5 text-indigo-600" />
            <span>Execute Workflow: {workflow.name}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleExecute} className="space-y-6 mt-4">
          {/* Workflow Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Workflow Information</h4>
                <p className="text-sm text-blue-700 mt-1">{workflow.description}</p>
                <div className="mt-2 text-xs text-blue-600">
                  <span>Steps: {workflow.steps.length}</span>
                  <span className="mx-2">•</span>
                  <span>Complexity: {workflow.complexity_level}</span>
                  <span className="mx-2">•</span>
                  <span>Avg Duration: {Math.floor(workflow.average_duration / 60)}m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Input Parameters */}
          {inputFields.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Input Parameters</h3>
              <div className="space-y-4">
                {inputFields.map(field => renderInputField(field, workflow.input_schema))}
              </div>
            </div>
          )}

          {/* Execution Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Cog6ToothIcon className="h-5 w-5 mr-2" />
              Execution Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "low" | "normal" | "high")}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Timeout */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeout(parseInt(e.target.value))}
                  min="1"
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.timeout ? "border-red-300" : "border-gray-300"
                  }`}
                />
                {errors.timeout && <p className="mt-1 text-sm text-red-600">{errors.timeout}</p>}
              </div>

              {/* Retry Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Retries
                </label>
                <input
                  type="number"
                  value={retryCount}
                  onChange={(e) => setRetryCount(parseInt(e.target.value))}
                  min="0"
                  max="10"
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.retryCount ? "border-red-300" : "border-gray-300"
                  }`}
                />
                {errors.retryCount && <p className="mt-1 text-sm text-red-600">{errors.retryCount}</p>}
              </div>
            </div>
          </div>

          {/* Warning for complex workflows */}
          {workflow.complexity_level === "complex" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-900">Complex Workflow</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    This is a complex workflow that may take longer to execute and consume more resources. 
                    Please ensure all input parameters are correct before proceeding.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading.executing}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.executing ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  Executing...
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Execute Workflow
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkflowExecutionDialog;
