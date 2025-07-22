"use client";

import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/app/lib/hooks";
import {
  ArrowLeftIcon,
  FolderIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CogIcon,
  DocumentTextIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import {
  getCollectionDetails,
  selectCollectionDetailsByCollectionId,
  selectCollectionsLoading,
  selectCollectionsError,
} from "@/app/lib/slices/knowledgeSlice";
import { IKnowledgeCollection, CollectionType, KnowledgeCategory, KnowledgeFileType } from "@/app/lib/interfaces";
import { format } from "date-fns";
import CollectionShareButton from "./CollectionShareButton";

// Import the existing KnowledgeCard component
// We'll assume it exists from the original knowledge page
interface KnowledgeCardProps {
  item: any;
  onDelete: (id: string) => void;
}

// Placeholder KnowledgeCard component - this should be extracted from the main knowledge page
function KnowledgeCard({ item, onDelete }: KnowledgeCardProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <DocumentTextIcon className="h-8 w-8 text-gray-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900">{item.title}</h3>
            <p className="text-xs text-gray-500">{item.file_type}</p>
          </div>
        </div>
        <button
          onClick={() => onDelete(item.id)}
          className="text-red-400 hover:text-red-600"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface CollectionDetailsProps {
  collectionId: string;
  onBack?: () => void;
  onEdit?: (collection: IKnowledgeCollection) => void;
  onDelete?: (collection: IKnowledgeCollection) => void;
  onShare?: (collection: IKnowledgeCollection) => void;
}

export default function CollectionDetails({
  collectionId,
  onBack,
  onEdit,
  onDelete,
  onShare,
}: CollectionDetailsProps) {
  const dispatch = useAppDispatch();
  
  // Redux state
  const collectionDetails = useAppSelector(selectCollectionDetailsByCollectionId(collectionId));
  const isLoading = useAppSelector(selectCollectionsLoading);
  const error = useAppSelector(selectCollectionsError);

  // Local state for filtering and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | ''>('');
  const [selectedFileType, setSelectedFileType] = useState<KnowledgeFileType | ''>('');
  const [currentPage, setCurrentPage] = useState(1);

  // Load collection details on mount
  useEffect(() => {
    if (collectionId) {
      dispatch(getCollectionDetails({ 
        collectionId, 
        page: currentPage, 
        perPage: 20 
      }));
    }
  }, [dispatch, collectionId, currentPage]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Search:', searchQuery);
  };

  const handleFileDelete = (fileId: string) => {
    // TODO: Implement file deletion
    console.log('Delete file:', fileId);
  };

  if (isLoading && !collectionDetails) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
        <span className="ml-3 text-gray-600">Loading collection details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading collection</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!collectionDetails) {
    return (
      <div className="text-center py-12">
        <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Collection not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The requested collection could not be found.
        </p>
      </div>
    );
  }

  const { collection, items, pagination } = collectionDetails;
  const IconComponent = getCollectionIcon(collection.type);
  const colorClasses = getCollectionColor(collection.type);

  // Filter items based on search and filters
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesFileType = !selectedFileType || item.file_type === selectedFileType;
    
    return matchesSearch && matchesCategory && matchesFileType;
  });

  return (
    <div className="space-y-6">
      {/* Collection Header */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          {/* Back Button and Title */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {onBack && (
                <button
                  onClick={onBack}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
              )}
              <div className="flex items-center">
                <div className={`p-3 rounded-lg border ${colorClasses}`}>
                  <IconComponent className="h-8 w-8" />
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">{collection.name}</h1>
                  <p className="text-sm text-gray-500 capitalize">
                    {collection.type} Collection
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => console.log('Add files to collection')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Files
              </button>
              
              {onEdit && (
                <button
                  onClick={() => onEdit(collection)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </button>
              )}
              
              {onShare && collection.permissions.share && (
                <CollectionShareButton
                  collection={collection}
                  onShare={(emails, permissions) => {
                    console.log('Share collection:', emails, permissions);
                    onShare?.(collection);
                  }}
                  onCreateShareLink={(permissions, expiresAt) => {
                    console.log('Create share link:', permissions, expiresAt);
                  }}
                />
              )}
            </div>
          </div>

          {/* Collection Description */}
          {collection.description && (
            <p className="text-gray-600 mb-4">{collection.description}</p>
          )}

          {/* Collection Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{collection.fileCount}</div>
              <div className="text-sm text-gray-500">Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{formatFileSize(collection.totalSize)}</div>
              <div className="text-sm text-gray-500">Total Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{filteredItems.length}</div>
              <div className="text-sm text-gray-500">Visible</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-900">
                Created {format(new Date(collection.createdAt), 'MMM d, yyyy')}
              </div>
              <div className="text-sm text-gray-500">
                Updated {format(new Date(collection.updatedAt), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <form onSubmit={handleSearch} className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="search"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="focus:ring-rose-500 focus:border-rose-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search files in this collection..."
              />
            </div>
          </div>
          
          <div className="flex space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as KnowledgeCategory | '')}
              className="focus:ring-rose-500 focus:border-rose-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="">All Categories</option>
              {Object.values(KnowledgeCategory).map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            
            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value as KnowledgeFileType | '')}
              className="focus:ring-rose-500 focus:border-rose-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="">All Types</option>
              {Object.values(KnowledgeFileType).map((type) => (
                <option key={type} value={type}>
                  {type.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>

      {/* Files Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => (
            <KnowledgeCard
              key={`${item.id}-${item.upload_timestamp}-${index}`}
              item={item}
              onDelete={handleFileDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchQuery || selectedCategory || selectedFileType 
              ? 'No files match your filters' 
              : 'No files in this collection'
            }
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || selectedCategory || selectedFileType
              ? 'Try adjusting your search criteria or filters.'
              : 'Upload files to get started with this collection.'
            }
          </p>
        </div>
      )}
    </div>
  );
}
