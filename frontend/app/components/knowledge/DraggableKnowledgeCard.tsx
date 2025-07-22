"use client";

import { useState, useRef } from 'react';
import {
  DocumentTextIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  ArchiveBoxIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { format } from 'date-fns';
import { IKnowledgeItem, KnowledgeFileType } from '@/app/lib/interfaces';
import { useDragSource, createDragPreview } from './DragDropProvider';

interface DraggableKnowledgeCardProps {
  item: IKnowledgeItem;
  isSelected?: boolean;
  selectedItems?: IKnowledgeItem[];
  collectionId: string;
  onSelect?: (item: IKnowledgeItem, isMultiSelect: boolean) => void;
  onEdit?: (item: IKnowledgeItem) => void;
  onDelete?: (item: IKnowledgeItem) => void;
  onView?: (item: IKnowledgeItem) => void;
  showActions?: boolean;
  isDragDisabled?: boolean;
}

export default function DraggableKnowledgeCard({
  item,
  isSelected = false,
  selectedItems = [],
  collectionId,
  onSelect,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  isDragDisabled = false,
}: DraggableKnowledgeCardProps) {
  const { handleDragStart, handleDragEnd, isDragging } = useDragSource();
  const [isHovered, setIsHovered] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  const getFileIcon = (fileType: KnowledgeFileType) => {
    switch (fileType) {
      case 'pdf':
      case 'doc':
      case 'docx':
        return DocumentTextIcon;
      case 'txt':
      case 'md':
        return DocumentIcon;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return PhotoIcon;
      case 'mp4':
      case 'avi':
      case 'mov':
        return VideoCameraIcon;
      case 'mp3':
      case 'wav':
        return MusicalNoteIcon;
      default:
        return ArchiveBoxIcon;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (e.defaultPrevented) return;
    
    const isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;
    onSelect?.(item, isMultiSelect);
  };

  const handleDragStartEvent = (e: React.DragEvent) => {
    if (isDragDisabled) {
      e.preventDefault();
      return;
    }

    // Determine what items to drag
    const itemsToDrag = isSelected && selectedItems.length > 1 
      ? selectedItems 
      : [item];

    // Create drag preview
    const preview = createDragPreview(itemsToDrag);
    e.dataTransfer.setDragImage(preview, 0, 0);

    handleDragStart(e, itemsToDrag, collectionId);
  };

  const IconComponent = getFileIcon(item.file_type);

  return (
    <div
      ref={dragRef}
      draggable={!isDragDisabled}
      onDragStart={handleDragStartEvent}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer
        ${isSelected 
          ? 'border-rose-500 bg-rose-50 shadow-md' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }
        ${isDragging ? 'opacity-50' : ''}
        ${isDragDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
      `}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center z-10">
          <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
      )}

      {/* Drag handle indicator */}
      {!isDragDisabled && isHovered && (
        <div className="absolute top-2 left-2 text-gray-400 z-10">
          <ArrowsPointingOutIcon className="h-4 w-4" />
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center flex-1 min-w-0">
            <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
              <IconComponent className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {item.title}
              </h3>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {item.file_type}
              </p>
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
                <Menu.Items className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {onView && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(item);
                          }}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                        >
                          <EyeIcon className="mr-3 h-4 w-4" />
                          View Details
                        </button>
                      )}
                    </Menu.Item>
                  )}
                  {onEdit && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item);
                          }}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                        >
                          <PencilIcon className="mr-3 h-4 w-4" />
                          Edit
                        </button>
                      )}
                    </Menu.Item>
                  )}
                  {onDelete && (
                    <>
                      <div className="border-t border-gray-100 my-1" />
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(item);
                            }}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex w-full items-center px-4 py-2 text-sm text-red-600`}
                          >
                            <TrashIcon className="mr-3 h-4 w-4" />
                            Delete
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

        {/* Description */}
        {item.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Metadata */}
        <div className="space-y-2">
          {/* File size and category */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formatFileSize(item.file_size_bytes || 0)}</span>
            {item.category && (
              <span className="px-2 py-1 bg-gray-100 rounded-full capitalize">
                {item.category}
              </span>
            )}
          </div>

          {/* Upload date */}
          <div className="text-xs text-gray-500">
            Uploaded {format(new Date(item.created_at), 'MMM d, yyyy')}
          </div>

          {/* Collection indicator */}
          {item.collection_name && item.collection_name !== collectionId && (
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              From: {item.collection_name}
            </div>
          )}
        </div>

        {/* Multi-select indicator */}
        {isSelected && selectedItems.length > 1 && (
          <div className="mt-3 text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded text-center">
            {selectedItems.length} files selected
          </div>
        )}
      </div>

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-rose-500 bg-opacity-20 rounded-lg border-2 border-rose-500 border-dashed flex items-center justify-center">
          <div className="text-rose-700 font-medium text-sm">
            {selectedItems.length > 1 ? `Moving ${selectedItems.length} files` : 'Moving file'}
          </div>
        </div>
      )}
    </div>
  );
}
