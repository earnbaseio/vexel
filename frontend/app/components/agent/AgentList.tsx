"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import { loggedIn } from "@/app/lib/slices/authSlice";
import { useDebouncedSearch } from "@/app/lib/hooks/useDebounce";
import {
  fetchAgents,
  setFilters,
  setPagination,
  selectAgents,
  selectAgentLoading,
  selectAgentFilters,
  selectAgentPagination,
  selectAgentError,
} from "@/app/lib/slices/agentSlice";
import {
  IAgentConfiguration,
} from "@/app/lib/interfaces";
import AgentCard from "./AgentCard";
import AgentFilters from "./AgentFilters";
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

interface AgentListProps {
  onCreateAgent?: () => void;
  onViewAgent?: (agent: IAgentConfiguration) => void;
  onEditAgent?: (agent: IAgentConfiguration) => void;
  onDeleteAgent?: (agent: IAgentConfiguration) => void;
  onShareAgent?: (agent: IAgentConfiguration) => void;
  onStartChat?: (agent: IAgentConfiguration) => void;
  showPublicAgents?: boolean;
  className?: string;
}

type ViewMode = "grid" | "list";

const AgentList: React.FC<AgentListProps> = ({
  onCreateAgent,
  onViewAgent,
  onEditAgent,
  onDeleteAgent,
  onShareAgent,
  onStartChat,
  showPublicAgents = false,
  className = ""
}) => {
  const dispatch = useAppDispatch();
  const agents = useAppSelector(selectAgents);
  const loading = useAppSelector(selectAgentLoading);
  const filters = useAppSelector(selectAgentFilters);
  const pagination = useAppSelector(selectAgentPagination);
  const error = useAppSelector(selectAgentError);
  const isLoggedIn = useAppSelector(loggedIn);

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Debounced search to prevent excessive API calls - temporarily disabled to fix loop
  // useDebouncedSearch(
  //   searchQuery,
  //   (debouncedQuery) => {
  //     const searchParams = {
  //       ...filters,
  //       page: 1, // Reset to first page on search
  //       page_size: pagination.pageSize,
  //     };

  //     if (debouncedQuery.trim()) {
  //       searchParams.query = debouncedQuery.trim();
  //     }

  //     dispatch(fetchAgents(searchParams));

  //     // Reset pagination to first page when searching
  //     if (pagination.page !== 1) {
  //       dispatch(setAgentPagination({ page: 1 }));
  //     }
  //   },
  //   300
  // );

  // Memoize search params to prevent unnecessary re-renders
  const searchParams = useMemo(() => ({
    ...filters,
    page: pagination.page,
    page_size: pagination.pageSize,
  }), [filters.type, filters.status, filters.search, pagination.page, pagination.pageSize]);

  // Handle filter/pagination changes by dispatching fetchAgents from parent
  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    dispatch(setFilters(newFilters));
    // Reset to first page when filtering
    if (pagination.page !== 1) {
      dispatch(setPagination({ page: 1 }));
    }
    // Parent component (agents page) will handle the refetch
  };

  const handlePaginationChange = (page: number, pageSize?: number) => {
    dispatch(setPagination({ page, pageSize: pageSize || pagination.pageSize }));
    // Parent component (agents page) will handle the refetch
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Reset to first page when searching
    if (pagination.page !== 1) {
      dispatch(setPagination({ page: 1 }));
    }
  };



  // Handle pagination
  const handlePageChange = (page: number) => {
    dispatch(setPagination({ page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    dispatch(setPagination({ page: 1, pageSize }));
  };

  // Clear all filters
  const clearFilters = () => {
    dispatch(setFilters({}));
    setSearchQuery("");
  };

  // Check if any filters are active
  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.trim() !== "";

  if (loading.agents && agents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>


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
              placeholder="Search agents..."
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
        <AgentFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">
            Error loading agents: {error}
          </div>
        </div>
      )}

      {/* Results Count */}
      {!loading.agents && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {agents.length} of {pagination.total} agents
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

      {/* Agents Grid/List */}
      {agents.length === 0 && !loading.agents ? (
        <EmptyState
          title="No agents found"
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters to find agents."
              : showPublicAgents
              ? "No public agents are available at the moment."
              : "Create your first AI agent to get started."
          }
          action={
            !showPublicAgents && onCreateAgent
              ? {
                  label: "Create Agent",
                  onClick: onCreateAgent,
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
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onView={onViewAgent}
                onEdit={!showPublicAgents ? onEditAgent : undefined}
                onDelete={!showPublicAgents ? onDeleteAgent : undefined}
                onShare={onShareAgent}
                onStart={onStartChat}
                className={viewMode === "list" ? "max-w-none" : ""}
              />
            ))}
          </div>

          {/* Loading overlay for pagination */}
          {loading.agents && (
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

export default AgentList;
