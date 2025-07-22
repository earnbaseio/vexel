"use client";

import { useState } from "react";
import {
  FolderIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CogIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  CalendarIcon,
  ShareIcon,
  LockClosedIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { format } from "date-fns";
import { IKnowledgeCollection, CollectionType } from "@/app/lib/interfaces";
import { useDropTarget } from "./DragDropProvider";
import CollectionShareButton from "./CollectionShareButton";

interface CollectionCardProps {
  collection: IKnowledgeCollection;
  onSelect?: (collection: IKnowledgeCollection) => void;
  onEdit?: (collection: IKnowledgeCollection) => void;
  onDelete?: (collection: IKnowledgeCollection) => void;
  onShare?: (collection: IKnowledgeCollection) => void;
  isSelected?: boolean;
  showActions?: boolean;
  enableDropZone?: boolean;
  onFileDrop?: (items: any[], targetCollection: string, sourceCollection: string) => void;
}

export default function CollectionCard({
  collection,
  onSelect,
  onEdit,
  onDelete,
  onShare,
  isSelected = false,
  showActions = true,
  enableDropZone = true,
  onFileDrop,
}: CollectionCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Drop zone functionality
  const {
    isValidDropTarget,
    isActiveDropZone,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  } = useDropTarget(collection.id);

  const getCollectionIcon = (type: CollectionType) => {
    switch (type) {
      case CollectionType.PERSONAL:
        return FolderIcon;
      case CollectionType.SHARED:
        return UsersIcon;
      case CollectionType.TEAM:
        return BuildingOfficeIcon;
      case CollectionType.MEMORY:
        return CogIcon;
      default:
        return FolderIcon;
    }
  };

  const getCollectionColor = (type: CollectionType) => {
    switch (type) {
      case CollectionType.PERSONAL:
        return "text-blue-500 bg-blue-50 border-blue-200";
      case CollectionType.SHARED:
        return "text-green-500 bg-green-50 border-green-200";
      case CollectionType.TEAM:
        return "text-purple-500 bg-purple-50 border-purple-200";
      case CollectionType.MEMORY:
        return "text-orange-500 bg-orange-50 border-orange-200";
      default:
        return "text-gray-500 bg-gray-50 border-gray-200";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const IconComponent = getCollectionIcon(collection.type);
  const colorClasses = getCollectionColor(collection.type);

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(collection);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(collection);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(collection);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(collection);
  };

  return (
    <div
      className={`bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer relative ${
        isSelected ? 'ring-2 ring-rose-500 shadow-md' : ''
      } ${
        enableDropZone && isActiveDropZone
          ? 'ring-2 ring-blue-500 bg-blue-50 shadow-lg'
          : ''
      } ${
        enableDropZone && isValidDropTarget
          ? 'border-2 border-dashed border-gray-300'
          : ''
      }`}
      onClick={handleCardClick}
      onDragOver={enableDropZone ? handleDragOver : undefined}
      onDragEnter={enableDropZone ? handleDragEnter : undefined}
      onDragLeave={enableDropZone ? handleDragLeave : undefined}
      onDrop={enableDropZone ? handleDrop : undefined}
    >
      {/* Drop zone overlay */}
      {enableDropZone && isActiveDropZone && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-blue-500 border-dashed rounded-lg flex items-center justify-center z-10">
          <div className="bg-white rounded-lg px-4 py-2 shadow-lg border border-blue-500">
            <div className="flex items-center space-x-2 text-blue-700">
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span className="font-medium">Drop files here</span>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Collection Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center flex-1 min-w-0">
            <div className={`p-2 rounded-lg border ${colorClasses}`}>
              <IconComponent className="h-6 w-6" />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {collection.name}
              </h3>
              <div className="flex items-center mt-1">
                <p className="text-sm text-gray-500 capitalize">
                  {collection.type} Collection
                </p>
                {collection.isDefault && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Default
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions Menu */}
          {showActions && (
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button 
                  className="flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  <EllipsisHorizontalIcon className="h-5 w-5" />
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
                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleCardClick}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                      >
                        <EyeIcon className="mr-3 h-4 w-4" />
                        View Collection
                      </button>
                    )}
                  </Menu.Item>
                  {onEdit && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleEdit}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                        >
                          <PencilIcon className="mr-3 h-4 w-4" />
                          Edit Collection
                        </button>
                      )}
                    </Menu.Item>
                  )}
                  {onShare && collection.permissions.share && (
                    <Menu.Item>
                      {({ active }) => (
                        <CollectionShareButton
                          collection={collection}
                          variant="menu-item"
                          className={active ? 'bg-gray-100' : ''}
                          onShare={(emails, permissions) => {
                            console.log('Share collection:', emails, permissions);
                            onShare?.(collection);
                          }}
                          onCreateShareLink={(permissions, expiresAt) => {
                            console.log('Create share link:', permissions, expiresAt);
                          }}
                        />
                      )}
                    </Menu.Item>
                  )}
                  {onDelete && collection.permissions.delete && !collection.isDefault && (
                    <>
                      <div className="border-t border-gray-100 my-1" />
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleDelete}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex w-full items-center px-4 py-2 text-sm text-red-600`}
                          >
                            <TrashIcon className="mr-3 h-4 w-4" />
                            Delete Collection
                          </button>
                        )}
                      </Menu.Item>
                    </>
                  )}
                </Menu.Items>
              </Transition>
            </Menu>
          )}
        </div>

        {/* Collection Description */}
        {collection.description && (
          <p className="mt-3 text-sm text-gray-600 line-clamp-2">
            {collection.description}
          </p>
        )}

        {/* Collection Stats */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center text-sm text-gray-500">
            <DocumentTextIcon className="h-4 w-4 mr-1 flex-shrink-0" />
            <span>{collection.fileCount} files</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span>{formatFileSize(collection.totalSize)}</span>
          </div>
        </div>

        {/* Permissions Indicator */}
        <div className="mt-3 flex items-center space-x-2">
          {collection.permissions.read && (
            <span className="inline-flex items-center text-xs text-gray-500">
              <EyeIcon className="h-3 w-3 mr-1" />
              Read
            </span>
          )}
          {collection.permissions.write && (
            <span className="inline-flex items-center text-xs text-gray-500">
              <PencilIcon className="h-3 w-3 mr-1" />
              Write
            </span>
          )}
          {collection.permissions.share && (
            <span className="inline-flex items-center text-xs text-gray-500">
              <ShareIcon className="h-3 w-3 mr-1" />
              Share
            </span>
          )}
          {!collection.permissions.read && (
            <span className="inline-flex items-center text-xs text-red-500">
              <LockClosedIcon className="h-3 w-3 mr-1" />
              Restricted
            </span>
          )}
        </div>

        {/* Collection Metadata */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <CalendarIcon className="h-3 w-3 mr-1" />
              <span>
                Created {format(new Date(collection.createdAt), 'MMM d, yyyy')}
              </span>
            </div>
            {collection.workspace && (
              <span className="text-xs text-gray-400">
                {collection.workspace}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
