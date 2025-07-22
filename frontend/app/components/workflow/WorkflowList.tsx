"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import {
  fetchWorkflowTemplates,
  setWorkflowFilters,
  setTemplatePagination,
  deleteWorkflowTemplate,
  selectWorkflowTemplates,
  selectWorkflowLoading,
  selectWorkflowFilters,
  selectTemplatePagination,
  selectWorkflowError,
} from "@/app/lib/slices/workflowSlice";
import {
  IWorkflowTemplate,
} from "@/app/lib/interfaces";
import WorkflowCard from "./WorkflowCard";
import LoadingSpinner from "../ui/LoadingSpinner";
import EmptyState from "../ui/EmptyState";
import Pagination from "../ui/Pagination";
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ViewColumnsIcon,
  Squares2X2Icon
} from "@heroicons/react/24/outline";

interface WorkflowListProps {
  onCreateWorkflow?: () => void;
  onExecuteWorkflow?: (workflow: IWorkflowTemplate) => void;
  onViewWorkflow?: (workflow: IWorkflowTemplate) => void;
  onEditWorkflow?: (workflow: IWorkflowTemplate) => void;
  onDeleteWorkflow?: (workflow: IWorkflowTemplate) => void;
  onShareWorkflow?: (workflow: IWorkflowTemplate) => void;
  showPublicWorkflows?: boolean;
  className?: string;
}

type ViewMode = "grid" | "list";

const WorkflowList: React.FC<WorkflowListProps> = ({
  onCreateWorkflow,
  onExecuteWorkflow,
  onViewWorkflow,
  onEditWorkflow,
  onDeleteWorkflow,
  onShareWorkflow,
  showPublicWorkflows = false,
  className = ""
}) => {
  const dispatch = useAppDispatch();
  const workflows = useAppSelector(selectWorkflowTemplates);
  const loading = useAppSelector(selectWorkflowLoading);
  const filters = useAppSelector(selectWorkflowFilters);
  const pagination = useAppSelector(selectTemplatePagination);
  const error = useAppSelector(selectWorkflowError);

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load workflows on component mount and when filters change
  useEffect(() => {
    const searchParams = {
      ...filters,
      page: pagination.page,
      page_size: pagination.pageSize,
    };
    
    if (searchQuery.trim()) {
      searchParams.query = searchQuery.trim();
    }

    if (showPublicWorkflows) {
      searchParams.is_public = true;
    }

    dispatch(fetchWorkflowTemplates(searchParams));
  }, [dispatch, filters, pagination.page, pagination.pageSize, searchQuery, showPublicWorkflows]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Reset to first page when searching
    if (pagination.page !== 1) {
      dispatch(setTemplatePagination({ page: 1 }));
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    dispatch(setWorkflowFilters(newFilters));
    // Reset to first page when filtering
    if (pagination.page !== 1) {
      dispatch(setTemplatePagination({ page: 1 }));
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    dispatch(setTemplatePagination({ page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    dispatch(setTemplatePagination({ page: 1, pageSize }));
  };

  // Clear all filters
  const clearFilters = () => {
    dispatch(setWorkflowFilters({}));
    setSearchQuery("");
  };

  // Handle workflow deletion
  const handleDeleteWorkflow = (workflow: IWorkflowTemplate) => {
    if (window.confirm(`Are you sure you want to delete "${workflow.name}"? This action cannot be undone.`)) {
      dispatch(deleteWorkflowTemplate(workflow.id));
      if (onDeleteWorkflow) {
        onDeleteWorkflow(workflow);
      }
    }
  };

  // Check if any filters are active
  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.trim() !== "";

  const categories = ["automation", "analysis", "collaboration", "processing", "custom"];
  const complexityLevels = ["simple", "moderate", "complex"];

  if (loading.templates && workflows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {showPublicWorkflows ? "Public Workflows" : "My Workflows"}
          </h2>
          <p className="text-sm text-gray-600">
            {showPublicWorkflows 
              ? "Discover and use public workflow templates created by the community"
              : "Create and manage your workflow templates for automation"
            }
          </p>
        </div>
        
        {!showPublicWorkflows && onCreateWorkflow && (
          <button
            onClick={onCreateWorkflow}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Workflow
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search workflows..."
            />
          </div>
        </div>

        {/* Filter and View Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              hasActiveFilters ? "ring-2 ring-indigo-500 border-indigo-500" : ""
            }`}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Active
              </span>
            )}
          </button>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 text-sm font-medium ${
                viewMode === "grid"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } rounded-l-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 text-sm font-medium ${
                viewMode === "list"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } rounded-r-md border-l border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              <ViewColumnsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category-filter"
                value={filters.category || ""}
                onChange={(e) => handleFilterChange({ category: e.target.value || undefined })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Complexity Filter */}
            <div>
              <label htmlFor="complexity-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Complexity
              </label>
              <select
                id="complexity-filter"
                value={filters.complexity || ""}
                onChange={(e) => handleFilterChange({ complexity: e.target.value || undefined })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">All Levels</option>
                {complexityLevels.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Public Filter */}
            {!showPublicWorkflows && (
              <div>
                <label htmlFor="public-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Visibility
                </label>
                <select
                  id="public-filter"
                  value={filters.isPublic !== undefined ? filters.isPublic.toString() : ""}
                  onChange={(e) => handleFilterChange({ 
                    isPublic: e.target.value ? e.target.value === "true" : undefined 
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">All Workflows</option>
                  <option value="true">Public Only</option>
                  <option value="false">Private Only</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">
            Error loading workflows: {error}
          </div>
        </div>
      )}

      {/* Results Count */}
      {!loading.templates && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {workflows.length} of {pagination.total} workflows
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Workflows Grid/List */}
      {workflows.length === 0 && !loading.templates ? (
        <EmptyState
          title="No workflows found"
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters to find workflows."
              : showPublicWorkflows
              ? "No public workflows are available at the moment."
              : "Create your first workflow template to get started."
          }
          action={
            !showPublicWorkflows && onCreateWorkflow
              ? {
                  label: "Create Workflow",
                  onClick: onCreateWorkflow,
                }
              : undefined
          }
        />
      ) : (
        <>
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {workflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onExecute={onExecuteWorkflow}
                onView={onViewWorkflow}
                onEdit={!showPublicWorkflows ? onEditWorkflow : undefined}
                onDelete={!showPublicWorkflows ? handleDeleteWorkflow : undefined}
                onShare={onShareWorkflow}
                className={viewMode === "list" ? "max-w-none" : ""}
              />
            ))}
          </div>

          {/* Loading overlay for pagination */}
          {loading.templates && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          )}

          {/* Pagination */}
          {pagination.total > pagination.pageSize && (
            <Pagination
              currentPage={pagination.page}
              totalPages={Math.ceil(pagination.total / pagination.pageSize)}
              pageSize={pagination.pageSize}
              totalItems={pagination.total}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default WorkflowList;
