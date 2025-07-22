"use client";

import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export interface BulkOperationStatus {
  id: string;
  type: 'move' | 'delete' | 'export' | 'tag';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  total: number;
  completed: number;
  failed: number;
  message?: string;
  startTime: Date;
  endTime?: Date;
  details?: {
    targetCollection?: string;
    exportFormat?: string;
    tags?: string[];
    errors?: Array<{ itemId: string; error: string }>;
  };
}

interface BulkOperationProgressProps {
  operations: BulkOperationStatus[];
  onCancel: (operationId: string) => void;
  onDismiss: (operationId: string) => void;
  onRetry: (operationId: string) => void;
}

export default function BulkOperationProgress({
  operations,
  onCancel,
  onDismiss,
  onRetry,
}: BulkOperationProgressProps) {
  const [expandedOperations, setExpandedOperations] = useState<Set<string>>(new Set());

  const toggleExpanded = (operationId: string) => {
    setExpandedOperations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(operationId)) {
        newSet.delete(operationId);
      } else {
        newSet.add(operationId);
      }
      return newSet;
    });
  };

  const getOperationIcon = (operation: BulkOperationStatus) => {
    switch (operation.status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'running':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <div className="h-5 w-5 bg-gray-300 rounded-full animate-pulse" />;
    }
  };

  const getOperationTitle = (operation: BulkOperationStatus) => {
    switch (operation.type) {
      case 'move':
        return `Moving ${operation.total} files to ${operation.details?.targetCollection || 'collection'}`;
      case 'delete':
        return `Deleting ${operation.total} files`;
      case 'export':
        return `Exporting ${operation.total} files as ${operation.details?.exportFormat?.toUpperCase() || 'file'}`;
      case 'tag':
        return `Adding tags to ${operation.total} files`;
      default:
        return `Processing ${operation.total} files`;
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = Math.floor((end.getTime() - startTime.getTime()) / 1000);
    
    if (duration < 60) {
      return `${duration}s`;
    } else if (duration < 3600) {
      return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    } else {
      return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
    }
  };

  const activeOperations = operations.filter(op => 
    op.status === 'pending' || op.status === 'running'
  );
  
  const completedOperations = operations.filter(op => 
    op.status === 'completed' || op.status === 'failed' || op.status === 'cancelled'
  );

  if (operations.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 w-96 max-h-96 overflow-y-auto z-50">
      <div className="space-y-2">
        {/* Active Operations */}
        {activeOperations.map((operation) => (
          <div
            key={operation.id}
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {getOperationIcon(operation)}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {getOperationTitle(operation)}
                  </h4>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>
                        {operation.completed} of {operation.total} completed
                        {operation.failed > 0 && ` (${operation.failed} failed)`}
                      </span>
                      <span>{operation.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${operation.progress}%` }}
                      />
                    </div>
                  </div>
                  {operation.message && (
                    <p className="mt-2 text-xs text-gray-600">{operation.message}</p>
                  )}
                </div>
              </div>
              
              {operation.status === 'running' && (
                <button
                  onClick={() => onCancel(operation.id)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Completed Operations */}
        {completedOperations.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">
                Recent Operations ({completedOperations.length})
              </h3>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {completedOperations.slice(0, 5).map((operation) => (
                <div key={operation.id} className="p-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getOperationIcon(operation)}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {getOperationTitle(operation)}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                          <span>
                            {operation.status === 'completed' 
                              ? `Completed in ${formatDuration(operation.startTime, operation.endTime)}`
                              : operation.status === 'failed'
                                ? `Failed after ${formatDuration(operation.startTime, operation.endTime)}`
                                : 'Cancelled'
                            }
                          </span>
                          {operation.failed > 0 && (
                            <span className="text-red-500">
                              {operation.failed} failed
                            </span>
                          )}
                        </div>
                        
                        {/* Error details for failed operations */}
                        {operation.status === 'failed' && operation.details?.errors && (
                          <div className="mt-2">
                            <button
                              onClick={() => toggleExpanded(operation.id)}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              {expandedOperations.has(operation.id) ? 'Hide' : 'Show'} errors
                            </button>
                            {expandedOperations.has(operation.id) && (
                              <div className="mt-2 p-2 bg-red-50 rounded text-xs">
                                {operation.details.errors.slice(0, 3).map((error, index) => (
                                  <div key={index} className="text-red-700">
                                    {error.error}
                                  </div>
                                ))}
                                {operation.details.errors.length > 3 && (
                                  <div className="text-red-600 mt-1">
                                    +{operation.details.errors.length - 3} more errors
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-2">
                      {operation.status === 'failed' && (
                        <button
                          onClick={() => onRetry(operation.id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Retry
                        </button>
                      )}
                      <button
                        onClick={() => onDismiss(operation.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for managing bulk operations
export function useBulkOperations() {
  const [operations, setOperations] = useState<BulkOperationStatus[]>([]);

  const startOperation = (
    type: BulkOperationStatus['type'],
    total: number,
    details?: BulkOperationStatus['details']
  ): string => {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const operation: BulkOperationStatus = {
      id,
      type,
      status: 'pending',
      progress: 0,
      total,
      completed: 0,
      failed: 0,
      startTime: new Date(),
      details,
    };
    
    setOperations(prev => [...prev, operation]);
    return id;
  };

  const updateOperation = (id: string, updates: Partial<BulkOperationStatus>) => {
    setOperations(prev => prev.map(op => 
      op.id === id ? { ...op, ...updates } : op
    ));
  };

  const completeOperation = (id: string, success: boolean, message?: string) => {
    setOperations(prev => prev.map(op => 
      op.id === id 
        ? { 
            ...op, 
            status: success ? 'completed' : 'failed',
            progress: 100,
            endTime: new Date(),
            message,
          }
        : op
    ));
  };

  const cancelOperation = (id: string) => {
    setOperations(prev => prev.map(op => 
      op.id === id 
        ? { 
            ...op, 
            status: 'cancelled',
            endTime: new Date(),
          }
        : op
    ));
  };

  const dismissOperation = (id: string) => {
    setOperations(prev => prev.filter(op => op.id !== id));
  };

  const retryOperation = (id: string) => {
    setOperations(prev => prev.map(op => 
      op.id === id 
        ? { 
            ...op, 
            status: 'pending',
            progress: 0,
            completed: 0,
            failed: 0,
            startTime: new Date(),
            endTime: undefined,
            message: undefined,
          }
        : op
    ));
  };

  return {
    operations,
    startOperation,
    updateOperation,
    completeOperation,
    cancelOperation,
    dismissOperation,
    retryOperation,
  };
}
