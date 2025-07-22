"use client";

import React from "react";
// No need to import enums since we use string literals
import { XMarkIcon } from "@heroicons/react/24/outline";

interface AgentFiltersProps {
  filters: {
    type?: AgentType;
    status?: AgentStatus;
    search?: string;
  };
  onFilterChange: (filters: Partial<AgentFiltersProps["filters"]>) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const AgentFilters: React.FC<AgentFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
}) => {


  const agentTypes = [
    { value: "assistant", label: "Assistant" },
    { value: "specialist", label: "Specialist" },
    { value: "coordinator", label: "Coordinator" },
    { value: "analyzer", label: "Analyzer" },
  ];

  const agentStatuses = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "archived", label: "Archived" },
    { value: "error", label: "Error" },
  ];

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Agent Type Filter */}
        <div>
          <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Agent Type
          </label>
          <select
            id="type-filter"
            value={filters.type || ""}
            onChange={(e) =>
              onFilterChange({
                type: e.target.value || undefined,
              })
            }
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">All Types</option>
            {agentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Agent Status Filter */}
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status-filter"
            value={filters.status || ""}
            onChange={(e) =>
              onFilterChange({
                status: e.target.value || undefined,
              })
            }
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">All Statuses</option>
            {agentStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">

            
            {filters.type && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Type: {agentTypes.find(t => t.value === filters.type)?.label}
                <button
                  onClick={() => onFilterChange({ type: undefined })}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:text-green-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filters.status && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Status: {agentStatuses.find(s => s.value === filters.status)?.label}
                <button
                  onClick={() => onFilterChange({ status: undefined })}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-yellow-400 hover:text-yellow-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentFilters;
