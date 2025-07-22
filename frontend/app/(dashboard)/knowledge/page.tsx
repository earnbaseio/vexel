"use client";

import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../lib/hooks";
import { loggedIn } from "../../lib/slices/authSlice";
import { useRouter } from "next/navigation";
import {
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ArrowPathIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EllipsisHorizontalIcon,
  DocumentDuplicateIcon,
  DocumentMagnifyingGlassIcon,
  LinkIcon,
  ArrowDownTrayIcon
} from "@heroicons/react/24/outline";
import CollectionsNavigation from "../../components/knowledge/CollectionsNavigation";
import CollectionsList from "../../components/knowledge/CollectionsList";
import CollectionDetails from "../../components/knowledge/CollectionDetails";
import CollectionCreateForm from "../../components/knowledge/CollectionCreateForm";
import CollectionEditForm from "../../components/knowledge/CollectionEditForm";
import { DragDropProvider, DragOverlay } from "../../components/knowledge/DragDropProvider";
import DraggableKnowledgeCard from "../../components/knowledge/DraggableKnowledgeCard";
import BulkOperationsBar from "../../components/knowledge/BulkOperationsBar";
import BulkSelectionToolbar from "../../components/knowledge/BulkSelectionToolbar";
import BulkOperationProgress, { useBulkOperations } from "../../components/knowledge/BulkOperationProgress";
import {
  getKnowledgeList,
  deleteKnowledge,
  searchKnowledge,
  setCurrentCollection,
  selectKnowledgeItems,
  selectKnowledgeLoading,
  selectKnowledgeError,
  selectKnowledgePagination
} from "../../lib/slices/knowledgeSlice";
import { addNotice } from "../../lib/slices/noticeSlice";
import { IKnowledgeItem, KnowledgeCategory, KnowledgeFileType } from "../../lib/interfaces/knowledge";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { format, formatDistance } from "date-fns";

// Knowledge item card component
function KnowledgeCard({ item, onDelete }: { item: IKnowledgeItem, onDelete: (id: string) => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileIcon = getFileIcon(item.file_type);
  // Parse UTC timestamp and convert to local timezone
  const parseUTCDate = (utcString: string) => {
    // If the string doesn't end with 'Z', add it to indicate UTC
    const utcTimestamp = utcString.endsWith('Z') ? utcString : utcString + 'Z';
    return new Date(utcTimestamp);
  };

  const uploadDate = item.upload_timestamp ? parseUTCDate(item.upload_timestamp) : null;
  const formattedDate = uploadDate ? format(uploadDate, 'MMM d, yyyy') : 'Unknown date';
  const timeAgo = uploadDate ? formatDistance(uploadDate, new Date(), { addSuffix: true }) : '';

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-3">
            {fileIcon}
            <div>
              <h3 className="text-lg font-medium text-gray-900 truncate max-w-xs">{item.title}</h3>
              <p className="text-sm text-gray-500">{formattedDate} ({timeAgo})</p>
            </div>
          </div>
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="flex items-center text-gray-400 hover:text-gray-600 focus:outline-none">
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
              <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } flex w-full items-center px-4 py-2 text-sm`}
                      >
                        <DocumentMagnifyingGlassIcon className="mr-3 h-5 w-5 text-gray-400" />
                        View Details
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } flex w-full items-center px-4 py-2 text-sm`}
                      >
                        <ArrowDownTrayIcon className="mr-3 h-5 w-5 text-gray-400" />
                        Download
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => onDelete(item.id)}
                        className={`${
                          active ? 'bg-red-50 text-red-700' : 'text-red-600'
                        } flex w-full items-center px-4 py-2 text-sm`}
                      >
                        <TrashIcon className="mr-3 h-5 w-5 text-red-400" />
                        Delete
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>

        {item.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{item.description}</p>
        )}

        <div className="mt-4">
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium text-gray-900">Type:</span>
            <span className="ml-1 capitalize">{item.file_type || 'Unknown'}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium text-gray-900">Size:</span>
            <span className="ml-1">{formatFileSize(item.file_size_bytes || 0)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium text-gray-900">Documents:</span>
            <span className="ml-1">{item.documents_processed || 0} chunks</span>
          </div>
        </div>

        {item.tags && Array.isArray(item.tags) && item.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {item.tags.map((tag, index) => (
              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to get file icon based on type
function getFileIcon(fileType?: KnowledgeFileType) {
  switch (fileType) {
    case KnowledgeFileType.PDF:
      return <DocumentTextIcon className="h-8 w-8 text-red-500" />;
    case KnowledgeFileType.TXT:
      return <DocumentTextIcon className="h-8 w-8 text-blue-500" />;
    case KnowledgeFileType.CSV:
      return <DocumentTextIcon className="h-8 w-8 text-green-500" />;
    case KnowledgeFileType.JSON:
      return <DocumentTextIcon className="h-8 w-8 text-yellow-500" />;
    case KnowledgeFileType.DOCX:
      return <DocumentTextIcon className="h-8 w-8 text-indigo-500" />;
    default:
      return <DocumentTextIcon className="h-8 w-8 text-gray-500" />;
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function Knowledge() {
  const isLoggedIn = useAppSelector((state) => loggedIn(state));
  const knowledgeItems = useAppSelector(selectKnowledgeItems);
  const isLoading = useAppSelector(selectKnowledgeLoading);
  const error = useAppSelector(selectKnowledgeError);
  const pagination = useAppSelector(selectKnowledgePagination);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | ''>('');
  const [selectedFileType, setSelectedFileType] = useState<KnowledgeFileType | ''>('');

  // Collections navigation state
  const [currentView, setCurrentView] = useState<'all' | 'collections' | 'workspaces'>('all');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any>(null);

  // File selection and drag-drop state
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [isDragMode, setIsDragMode] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk operations
  const {
    operations,
    startOperation,
    updateOperation,
    completeOperation,
    cancelOperation,
    dismissOperation,
    retryOperation,
  } = useBulkOperations();

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      dispatch(searchKnowledge({
        query: searchQuery,
        category: selectedCategory as KnowledgeCategory,
        file_type: selectedFileType as KnowledgeFileType,
      }));
    }
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this knowledge item? This action cannot be undone.')) {
      dispatch(deleteKnowledge(id));
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedFileType('');
    loadKnowledgeItems();
  };

  // Load knowledge items
  const loadKnowledgeItems = () => {
    dispatch(getKnowledgeList({
      page: pagination?.page || 1,
      perPage: pagination?.per_page || 20
    }));
  };

  // Initial load
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Add a small delay to ensure redux-persist rehydration is complete
    if (mounted) {
      const timer = setTimeout(() => {
        if (!isLoggedIn) {
          router.push("/authentication");
        } else {
          // Load knowledge items
          loadKnowledgeItems();
        }
      }, 100); // Small delay to allow rehydration

      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, mounted, router, dispatch]);

  // Handle view changes from navigation
  const handleViewChange = (view: 'all' | 'collections' | 'workspaces', id?: string) => {
    setCurrentView(view);
    if (view === 'collections' && id) {
      setSelectedCollectionId(id);
    } else {
      setSelectedCollectionId(null);
    }

    // Reload knowledge items based on the new view
    loadKnowledgeItems();
  };

  // Form handlers
  const handleCreateCollection = () => {
    setShowCreateForm(true);
  };

  const handleEditCollection = (collection: any) => {
    setEditingCollection(collection);
    setShowEditForm(true);
  };

  const handleCollectionCreated = (collection: any) => {
    // Optionally navigate to the new collection
    setSelectedCollectionId(collection.id);
    dispatch(setCurrentCollection(collection.id));
  };

  const handleCollectionUpdated = (collection: any) => {
    // Refresh the current view if needed
    loadKnowledgeItems();
  };

  const handleCollectionDeleted = (collection: any) => {
    // Navigate back to collections list
    setSelectedCollectionId(null);
    dispatch(setCurrentCollection(null));
  };

  // File selection handlers
  const handleFileSelect = (file: any, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      setSelectedFiles(prev => {
        const isAlreadySelected = prev.some(f => f.id === file.id);
        if (isAlreadySelected) {
          return prev.filter(f => f.id !== file.id);
        } else {
          return [...prev, file];
        }
      });
    } else {
      setSelectedFiles([file]);
    }
  };

  const handleClearSelection = () => {
    setSelectedFiles([]);
  };

  // Drag and drop handlers
  const handleFileDrop = async (items: any[], targetCollection: string, sourceCollection: string) => {
    try {
      console.log('Moving files:', items, 'from', sourceCollection, 'to', targetCollection);

      // TODO: Implement actual file move API call
      // For now, just show a success message
      dispatch(addNotice({
        title: "Files Moved",
        content: `${items.length} file(s) moved to ${targetCollection}`,
        type: "success",
      }));

      // Clear selection and refresh
      setSelectedFiles([]);
      loadKnowledgeItems();
    } catch (error: any) {
      dispatch(addNotice({
        title: "Move Failed",
        content: error.message || "Failed to move files",
        type: "error",
      }));
    }
  };

  const handleBulkFileDrop = async (items: any[], targetCollection: string, sourceCollection: string) => {
    try {
      console.log('Bulk moving files:', items, 'from', sourceCollection, 'to', targetCollection);

      // TODO: Implement actual bulk file move API call
      // For now, just show a success message
      dispatch(addNotice({
        title: "Files Moved",
        content: `${items.length} files moved to ${targetCollection}`,
        type: "success",
      }));

      // Clear selection and refresh
      setSelectedFiles([]);
      loadKnowledgeItems();
    } catch (error: any) {
      dispatch(addNotice({
        title: "Bulk Move Failed",
        content: error.message || "Failed to move files",
        type: "error",
      }));
    }
  };

  // Bulk operation handlers
  const handleBulkDelete = async (items: any[]) => {
    const operationId = startOperation('delete', items.length);

    try {
      updateOperation(operationId, { status: 'running', message: 'Deleting files...' });

      // Simulate bulk delete operation
      for (let i = 0; i < items.length; i++) {
        // TODO: Implement actual delete API call
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call

        updateOperation(operationId, {
          completed: i + 1,
          progress: Math.round(((i + 1) / items.length) * 100),
        });
      }

      completeOperation(operationId, true, `Successfully deleted ${items.length} files`);
      setSelectedFiles([]);
      loadKnowledgeItems();

      dispatch(addNotice({
        title: "Files Deleted",
        content: `${items.length} files deleted successfully`,
        type: "success",
      }));
    } catch (error: any) {
      completeOperation(operationId, false, error.message || 'Failed to delete files');
      dispatch(addNotice({
        title: "Delete Failed",
        content: error.message || "Failed to delete files",
        type: "error",
      }));
    }
  };

  const handleBulkMove = async (items: any[], targetCollection: string) => {
    const operationId = startOperation('move', items.length, { targetCollection });

    try {
      updateOperation(operationId, { status: 'running', message: `Moving files to ${targetCollection}...` });

      // Simulate bulk move operation
      for (let i = 0; i < items.length; i++) {
        // TODO: Implement actual move API call
        await new Promise(resolve => setTimeout(resolve, 150)); // Simulate API call

        updateOperation(operationId, {
          completed: i + 1,
          progress: Math.round(((i + 1) / items.length) * 100),
        });
      }

      completeOperation(operationId, true, `Successfully moved ${items.length} files`);
      setSelectedFiles([]);
      loadKnowledgeItems();

      dispatch(addNotice({
        title: "Files Moved",
        content: `${items.length} files moved to ${targetCollection}`,
        type: "success",
      }));
    } catch (error: any) {
      completeOperation(operationId, false, error.message || 'Failed to move files');
      dispatch(addNotice({
        title: "Move Failed",
        content: error.message || "Failed to move files",
        type: "error",
      }));
    }
  };

  const handleBulkExport = async (items: any[], format: 'json' | 'csv' | 'zip') => {
    const operationId = startOperation('export', items.length, { exportFormat: format });

    try {
      updateOperation(operationId, { status: 'running', message: `Preparing ${format.toUpperCase()} export...` });

      // Simulate export operation
      for (let i = 0; i < items.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate processing

        updateOperation(operationId, {
          completed: i + 1,
          progress: Math.round(((i + 1) / items.length) * 100),
        });
      }

      // Simulate download
      const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `knowledge_export_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      completeOperation(operationId, true, `Export completed successfully`);

      dispatch(addNotice({
        title: "Export Complete",
        content: `${items.length} files exported as ${format.toUpperCase()}`,
        type: "success",
      }));
    } catch (error: any) {
      completeOperation(operationId, false, error.message || 'Failed to export files');
      dispatch(addNotice({
        title: "Export Failed",
        content: error.message || "Failed to export files",
        type: "error",
      }));
    }
  };

  const handleBulkTag = async (items: any[], tags: string[]) => {
    const operationId = startOperation('tag', items.length, { tags });

    try {
      updateOperation(operationId, { status: 'running', message: `Adding tags: ${tags.join(', ')}...` });

      // Simulate tagging operation
      for (let i = 0; i < items.length; i++) {
        // TODO: Implement actual tagging API call
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call

        updateOperation(operationId, {
          completed: i + 1,
          progress: Math.round(((i + 1) / items.length) * 100),
        });
      }

      completeOperation(operationId, true, `Successfully tagged ${items.length} files`);
      setSelectedFiles([]);
      loadKnowledgeItems();

      dispatch(addNotice({
        title: "Tags Added",
        content: `Added tags to ${items.length} files: ${tags.join(', ')}`,
        type: "success",
      }));
    } catch (error: any) {
      completeOperation(operationId, false, error.message || 'Failed to add tags');
      dispatch(addNotice({
        title: "Tagging Failed",
        content: error.message || "Failed to add tags",
        type: "error",
      }));
    }
  };

  // Selection handlers
  const handleSelectAll = () => {
    setSelectedFiles([...knowledgeItems]);
  };

  const handleSelectNone = () => {
    setSelectedFiles([]);
  };

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedFiles([]);
    }
  };

  const handleSortChange = (newSortBy: 'name' | 'date' | 'size' | 'type', order: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(order);
    // TODO: Implement actual sorting logic
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (pagination && pagination.page > 1) {
      dispatch(getKnowledgeList({
        page: pagination.page - 1,
        perPage: pagination.per_page || 20
      }));
    }
  };

  const handleNextPage = () => {
    if (pagination && pagination.page < pagination.total_pages) {
      dispatch(getKnowledgeList({
        page: pagination.page + 1,
        perPage: pagination.per_page || 20
      }));
    }
  };

  // Loading state
  if (!mounted || !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <DragDropProvider
      onFileDrop={handleFileDrop}
      onBulkDrop={handleBulkFileDrop}
    >
    <div className="min-h-screen bg-gray-50 flex">
      {/* Collections Navigation Sidebar */}
      <CollectionsNavigation
        onViewChange={handleViewChange}
        currentView={currentView}
        onCreateCollection={handleCreateCollection}
        onCreateWorkspace={() => {
          // TODO: Implement workspace creation
          console.log('Create workspace');
        }}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - hide when viewing specific collection details */}
        {!(currentView === 'collections' && selectedCollectionId) && (
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {currentView === 'all' && 'All Files'}
              {currentView === 'collections' && selectedCollectionId && `Collection: ${selectedCollectionId}`}
              {currentView === 'collections' && !selectedCollectionId && 'Collections'}
              {currentView === 'workspaces' && 'Workspaces'}
            </h1>
            <p className="mt-2 text-gray-600">
              {currentView === 'all' && 'Manage your AI agents\' knowledge and information sources'}
              {currentView === 'collections' && 'Organize your knowledge into collections'}
              {currentView === 'workspaces' && 'Manage your knowledge workspaces'}
            </p>
          </div>
          <button
            onClick={() => router.push("/knowledge/upload")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Knowledge
          </button>
        </div>
        )}

        {/* Bulk Selection Toolbar - show for All Files view */}
        {currentView === 'all' && (
          <BulkSelectionToolbar
            items={knowledgeItems}
            selectedItems={selectedFiles}
            onSelectAll={handleSelectAll}
            onSelectNone={handleSelectNone}
            onSelectFiltered={(items) => setSelectedFiles(items)}
            onToggleSelectionMode={handleToggleSelectionMode}
            isSelectionMode={isSelectionMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedFileType={selectedFileType}
            onFileTypeChange={setSelectedFileType}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        )}

        {/* Search and Filters - hide when viewing specific collection details */}
        {!(currentView === 'collections' && selectedCollectionId) && (
        <div className="mb-6 bg-white shadow rounded-lg p-4">
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
                  placeholder="Search knowledge items..."
                />
              </div>
            </div>

            <div className="w-full sm:w-48">
              <label htmlFor="category" className="sr-only">Category</label>
              <select
                id="category"
                name="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as KnowledgeCategory | '')}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm rounded-md"
              >
                <option value="">All Categories</option>
                <option value={KnowledgeCategory.DOCUMENTATION}>Documentation</option>
                <option value={KnowledgeCategory.RESEARCH}>Research</option>
                <option value={KnowledgeCategory.TRAINING}>Training</option>
                <option value={KnowledgeCategory.REFERENCE}>Reference</option>
                <option value={KnowledgeCategory.POLICY}>Policy</option>
                <option value={KnowledgeCategory.PROCEDURE}>Procedure</option>
                <option value={KnowledgeCategory.OTHER}>Other</option>
              </select>
            </div>

            <div className="w-full sm:w-48">
              <label htmlFor="fileType" className="sr-only">File Type</label>
              <select
                id="fileType"
                name="fileType"
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value as KnowledgeFileType | '')}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm rounded-md"
              >
                <option value="">All File Types</option>
                <option value={KnowledgeFileType.PDF}>PDF</option>
                <option value={KnowledgeFileType.TXT}>TXT</option>
                <option value={KnowledgeFileType.CSV}>CSV</option>
                <option value={KnowledgeFileType.JSON}>JSON</option>
                <option value={KnowledgeFileType.DOCX}>DOCX</option>
              </select>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                Search
              </button>

              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Reset
              </button>
            </div>
          </form>
        </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading knowledge items</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
          </div>
        )}

        {/* Empty State - for All Files view or specific collection */}
        {(currentView === 'all' || (currentView === 'collections' && selectedCollectionId)) &&
         !isLoading && (!knowledgeItems || knowledgeItems.length === 0) && (
          <div className="text-center py-12 bg-white shadow rounded-lg">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {currentView === 'all' ? 'No knowledge items' : 'No files in this collection'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {currentView === 'all'
                ? 'Get started by uploading documents or adding knowledge to your base.'
                : 'This collection is empty. Upload files to get started.'
              }
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push("/knowledge/upload")}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Knowledge
              </button>
            </div>
          </div>
        )}

        {/* Content based on current view */}
        {currentView === 'collections' && !selectedCollectionId && (
          <CollectionsList
            onCollectionSelect={(collection) => {
              setSelectedCollectionId(collection.id);
              dispatch(setCurrentCollection(collection.id));
            }}
            onCollectionEdit={handleEditCollection}
            onCollectionCreate={handleCreateCollection}
            enableDropZones={true}
            onFileDrop={handleFileDrop}
          />
        )}

        {/* Collection Details View */}
        {currentView === 'collections' && selectedCollectionId && (
          <CollectionDetails
            collectionId={selectedCollectionId}
            onBack={() => {
              setSelectedCollectionId(null);
              dispatch(setCurrentCollection(null));
            }}
            onEdit={handleEditCollection}
            onDelete={handleCollectionDeleted}
            onShare={(collection) => {
              // TODO: Open share modal
              console.log('Share collection:', collection);
            }}
          />
        )}

        {/* Knowledge Items Grid - for All Files view only */}
        {currentView === 'all' &&
         !isLoading && knowledgeItems && knowledgeItems.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {knowledgeItems.map((item, index) => (
                <KnowledgeCard
                  key={`${item.id}-${item.upload_timestamp}-${index}`}
                  item={item}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={handlePreviousPage}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={pagination.page === pagination.total_pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(pagination.page - 1) * pagination.per_page + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.per_page, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={handlePreviousPage}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronDownIcon className="h-5 w-5 rotate-90" aria-hidden="true" />
                      </button>

                      {/* Page numbers */}
                      {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => dispatch(getKnowledgeList({ page, perPage: pagination.per_page }))}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pagination.page
                              ? 'z-10 bg-rose-50 border-rose-500 text-rose-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={handleNextPage}
                        disabled={pagination.page === pagination.total_pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronUpIcon className="h-5 w-5 rotate-90" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* Bulk Operations Bar */}
      <BulkOperationsBar
        selectedItems={selectedFiles}
        collections={[]} // TODO: Get collections from Redux
        onClearSelection={handleSelectNone}
        onBulkDelete={handleBulkDelete}
        onBulkMove={handleBulkMove}
        onBulkExport={handleBulkExport}
        onBulkTag={handleBulkTag}
        isVisible={selectedFiles.length > 0}
      />

      {/* Bulk Operation Progress */}
      <BulkOperationProgress
        operations={operations}
        onCancel={cancelOperation}
        onDismiss={dismissOperation}
        onRetry={retryOperation}
      />

      {/* Collection Management Forms */}
      <CollectionCreateForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={handleCollectionCreated}
      />

      <CollectionEditForm
        isOpen={showEditForm}
        collection={editingCollection}
        onClose={() => {
          setShowEditForm(false);
          setEditingCollection(null);
        }}
        onSuccess={handleCollectionUpdated}
        onDelete={handleCollectionDeleted}
      />

      {/* Drag and Drop Overlay */}
      <DragOverlay />
    </div>
    </DragDropProvider>
  );
}
