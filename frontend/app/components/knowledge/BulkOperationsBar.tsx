"use client";

import { useState } from 'react';
import {
  XMarkIcon,
  TrashIcon,
  ArrowRightIcon,
  DocumentArrowDownIcon,
  TagIcon,
  EyeIcon,
  CheckIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { IKnowledgeItem, IKnowledgeCollection } from '@/app/lib/interfaces';

interface BulkOperationsBarProps {
  selectedItems: IKnowledgeItem[];
  collections: IKnowledgeCollection[];
  onClearSelection: () => void;
  onBulkDelete: (items: IKnowledgeItem[]) => void;
  onBulkMove: (items: IKnowledgeItem[], targetCollection: string) => void;
  onBulkExport: (items: IKnowledgeItem[], format: 'json' | 'csv' | 'zip') => void;
  onBulkTag: (items: IKnowledgeItem[], tags: string[]) => void;
  isVisible: boolean;
}

export default function BulkOperationsBar({
  selectedItems,
  collections,
  onClearSelection,
  onBulkDelete,
  onBulkMove,
  onBulkExport,
  onBulkTag,
  isVisible,
}: BulkOperationsBarProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');

  if (!isVisible || selectedItems.length === 0) {
    return null;
  }

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} selected files?`)) {
      onBulkDelete(selectedItems);
    }
  };

  const handleBulkMove = (collectionId: string) => {
    onBulkMove(selectedItems, collectionId);
    setShowMoveMenu(false);
  };

  const handleBulkExport = (format: 'json' | 'csv' | 'zip') => {
    onBulkExport(selectedItems, format);
    setShowExportMenu(false);
  };

  const handleBulkTag = () => {
    if (tagInput.trim()) {
      const tags = tagInput.split(',').map(tag => tag.trim()).filter(Boolean);
      onBulkTag(selectedItems, tags);
      setTagInput('');
      setShowTagInput(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalSize = selectedItems.reduce((sum, item) => sum + (item.file_size_bytes || 0), 0);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30 transition-transform duration-300 ease-in-out">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Selection Info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center">
                <CheckIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900">
                {selectedItems.length} file{selectedItems.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            
            <div className="text-sm text-gray-500">
              Total size: {formatFileSize(totalSize)}
            </div>

            {/* Quick preview of selected files */}
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-xs text-gray-400">Files:</span>
              <div className="flex items-center space-x-1">
                {selectedItems.slice(0, 3).map((item, index) => (
                  <span
                    key={item.id}
                    className="text-xs bg-gray-100 px-2 py-1 rounded truncate max-w-24"
                    title={item.title}
                  >
                    {item.title}
                  </span>
                ))}
                {selectedItems.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{selectedItems.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Move to Collection */}
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500">
                  <ArrowRightIcon className="h-4 w-4 mr-2" />
                  Move to
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute bottom-full mb-2 right-0 w-56 origin-bottom-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-y-auto">
                  <div className="py-1">
                    {collections.map((collection) => (
                      <Menu.Item key={collection.id}>
                        {({ active }) => (
                          <button
                            onClick={() => handleBulkMove(collection.id)}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                          >
                            <FolderIcon className="mr-3 h-4 w-4" />
                            <div className="flex-1 text-left">
                              <div className="font-medium">{collection.name}</div>
                              <div className="text-xs text-gray-500 capitalize">
                                {collection.type} collection
                              </div>
                            </div>
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            {/* Export */}
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500">
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Export
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute bottom-full mb-2 right-0 w-48 origin-bottom-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleBulkExport('json')}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                        >
                          Export as JSON
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleBulkExport('csv')}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                        >
                          Export as CSV
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleBulkExport('zip')}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                        >
                          Download as ZIP
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            {/* Add Tags */}
            {!showTagInput ? (
              <button
                onClick={() => setShowTagInput(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                <TagIcon className="h-4 w-4 mr-2" />
                Tag
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBulkTag()}
                  placeholder="Enter tags (comma-separated)"
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  autoFocus
                />
                <button
                  onClick={handleBulkTag}
                  className="px-3 py-2 bg-rose-600 text-white text-sm font-medium rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowTagInput(false);
                    setTagInput('');
                  }}
                  className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Delete */}
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </button>

            {/* Clear Selection */}
            <button
              onClick={onClearSelection}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
