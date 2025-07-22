"use client";

import { useState } from 'react';
import {
  CheckIcon,
  XMarkIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';
import { IKnowledgeItem, KnowledgeCategory, KnowledgeFileType } from '@/app/lib/interfaces';

interface BulkSelectionToolbarProps {
  items: IKnowledgeItem[];
  selectedItems: IKnowledgeItem[];
  onSelectAll: () => void;
  onSelectNone: () => void;
  onSelectFiltered: (items: IKnowledgeItem[]) => void;
  onToggleSelectionMode: () => void;
  isSelectionMode: boolean;
  
  // Filtering and sorting
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: KnowledgeCategory | '';
  onCategoryChange: (category: KnowledgeCategory | '') => void;
  selectedFileType: KnowledgeFileType | '';
  onFileTypeChange: (type: KnowledgeFileType | '') => void;
  sortBy: 'name' | 'date' | 'size' | 'type';
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: 'name' | 'date' | 'size' | 'type', order: 'asc' | 'desc') => void;
  
  // View options
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export default function BulkSelectionToolbar({
  items,
  selectedItems,
  onSelectAll,
  onSelectNone,
  onSelectFiltered,
  onToggleSelectionMode,
  isSelectionMode,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedFileType,
  onFileTypeChange,
  sortBy,
  sortOrder,
  onSortChange,
  viewMode,
  onViewModeChange,
}: BulkSelectionToolbarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const allSelected = items.length > 0 && selectedItems.length === items.length;
  const someSelected = selectedItems.length > 0 && selectedItems.length < items.length;

  const handleSelectAllToggle = () => {
    if (allSelected || someSelected) {
      onSelectNone();
    } else {
      onSelectAll();
    }
  };

  const handleSortClick = (newSortBy: 'name' | 'date' | 'size' | 'type') => {
    if (sortBy === newSortBy) {
      // Toggle order if same field
      onSortChange(newSortBy, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to ascending for new field
      onSortChange(newSortBy, 'asc');
    }
  };

  const getSortIcon = (field: 'name' | 'date' | 'size' | 'type') => {
    if (sortBy !== field) return null;
    return (
      <ArrowsUpDownIcon 
        className={`h-4 w-4 ml-1 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} 
      />
    );
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 py-3">
        {/* Main toolbar */}
        <div className="flex items-center justify-between">
          {/* Left side - Selection controls */}
          <div className="flex items-center space-x-4">
            {/* Selection mode toggle */}
            <button
              onClick={onToggleSelectionMode}
              className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 ${
                isSelectionMode
                  ? 'border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              {isSelectionMode ? 'Exit Selection' : 'Select Files'}
            </button>

            {/* Selection controls - only show in selection mode */}
            {isSelectionMode && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAllToggle}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                >
                  <div className={`w-4 h-4 border-2 rounded mr-2 flex items-center justify-center ${
                    allSelected 
                      ? 'bg-rose-500 border-rose-500' 
                      : someSelected 
                        ? 'bg-rose-200 border-rose-500' 
                        : 'border-gray-300'
                  }`}>
                    {allSelected && <CheckIcon className="h-3 w-3 text-white" />}
                    {someSelected && !allSelected && <div className="w-2 h-2 bg-rose-500 rounded-sm" />}
                  </div>
                  {allSelected ? 'Deselect All' : someSelected ? 'Select All' : 'Select All'}
                </button>

                {selectedItems.length > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedItems.length} of {items.length} selected
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right side - View and filter controls */}
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                placeholder="Search files..."
              />
            </div>

            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 ${
                showFilters || selectedCategory || selectedFileType
                  ? 'border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>

            {/* View mode toggle */}
            <div className="flex border border-gray-300 rounded-md">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`px-3 py-2 text-sm font-medium rounded-l-md focus:outline-none focus:ring-1 focus:ring-rose-500 ${
                  viewMode === 'grid'
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`px-3 py-2 text-sm font-medium rounded-r-md border-l focus:outline-none focus:ring-1 focus:ring-rose-500 ${
                  viewMode === 'list'
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => onCategoryChange(e.target.value as KnowledgeCategory | '')}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                >
                  <option value="">All Categories</option>
                  {Object.values(KnowledgeCategory).map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* File type filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Type
                </label>
                <select
                  value={selectedFileType}
                  onChange={(e) => onFileTypeChange(e.target.value as KnowledgeFileType | '')}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                >
                  <option value="">All Types</option>
                  {Object.values(KnowledgeFileType).map((type) => (
                    <option key={type} value={type}>
                      {type.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <div className="flex space-x-2">
                  {[
                    { key: 'name', label: 'Name' },
                    { key: 'date', label: 'Date' },
                    { key: 'size', label: 'Size' },
                    { key: 'type', label: 'Type' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => handleSortClick(key as any)}
                      className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 ${
                        sortBy === key
                          ? 'border-rose-300 text-rose-700 bg-rose-50'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {label}
                      {getSortIcon(key as any)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear filters */}
            {(selectedCategory || selectedFileType || searchQuery) && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    onSearchChange('');
                    onCategoryChange('');
                    onFileTypeChange('');
                  }}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
