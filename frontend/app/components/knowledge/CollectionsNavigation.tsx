"use client";

import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/app/lib/hooks";
import {
  FolderIcon,
  FolderOpenIcon,
  DocumentTextIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CogIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  getCollectionsList,
  getWorkspacesList,
  setCurrentCollection,
  setCurrentWorkspace,
  selectCollections,
  selectWorkspaces,
  selectCurrentCollection,
  selectCurrentWorkspace,
  selectCollectionsLoading,
  selectCollectionsByType,
} from "@/app/lib/slices/knowledgeSlice";
import { CollectionType, WorkspaceType } from "@/app/lib/interfaces";

interface CollectionsNavigationProps {
  onViewChange?: (view: 'all' | 'collections' | 'workspaces', id?: string) => void;
  currentView?: 'all' | 'collections' | 'workspaces';
  onCreateCollection?: () => void;
  onCreateWorkspace?: () => void;
}

export default function CollectionsNavigation({
  onViewChange,
  currentView = 'all',
  onCreateCollection,
  onCreateWorkspace,
}: CollectionsNavigationProps) {
  const dispatch = useAppDispatch();
  
  // Redux state
  const collections = useAppSelector(selectCollections);
  const workspaces = useAppSelector(selectWorkspaces);
  const currentCollection = useAppSelector(selectCurrentCollection);
  const currentWorkspace = useAppSelector(selectCurrentWorkspace);
  const collectionsLoading = useAppSelector(selectCollectionsLoading);
  
  // Collection type selectors
  const personalCollections = useAppSelector(selectCollectionsByType(CollectionType.PERSONAL));
  const sharedCollections = useAppSelector(selectCollectionsByType(CollectionType.SHARED));
  const teamCollections = useAppSelector(selectCollectionsByType(CollectionType.TEAM));
  const memoryCollections = useAppSelector(selectCollectionsByType(CollectionType.MEMORY));
  
  // Local state for expanded sections
  const [expandedSections, setExpandedSections] = useState({
    collections: true,
    personal: true,
    shared: false,
    team: false,
    memory: false,
    workspaces: false,
  });

  // Load data on mount
  useEffect(() => {
    dispatch(getCollectionsList());
    dispatch(getWorkspacesList());
  }, [dispatch]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCollectionSelect = (collectionId: string) => {
    dispatch(setCurrentCollection(collectionId));
    onViewChange?.('collections', collectionId);
  };

  const handleWorkspaceSelect = (workspaceId: string) => {
    dispatch(setCurrentWorkspace(workspaceId));
    onViewChange?.('workspaces', workspaceId);
  };

  const handleAllFilesSelect = () => {
    dispatch(setCurrentCollection(null));
    dispatch(setCurrentWorkspace(null));
    onViewChange?.('all');
  };

  const renderCollectionGroup = (
    title: string,
    collections: any[],
    icon: React.ComponentType<any>,
    sectionKey: keyof typeof expandedSections,
    color: string = "text-gray-500"
  ) => {
    const Icon = icon;
    const isExpanded = expandedSections[sectionKey];
    
    return (
      <div className="mb-2">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
        >
          <div className="flex items-center">
            <Icon className={`h-4 w-4 mr-2 ${color}`} />
            <span>{title}</span>
            <span className="ml-2 text-xs text-gray-500">({collections.length})</span>
          </div>
          {isExpanded ? (
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
          )}
        </button>
        
        {isExpanded && (
          <div className="ml-6 mt-1 space-y-1">
            {collections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => handleCollectionSelect(collection.id)}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  currentCollection === collection.id
                    ? 'bg-rose-100 text-rose-700 border-l-2 border-rose-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <FolderIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span className="truncate">{collection.name}</span>
                <span className="ml-auto text-xs text-gray-400">
                  {collection.fileCount}
                </span>
              </button>
            ))}
            
            {collections.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-500 italic">
                No {title.toLowerCase()} collections
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Knowledge Base</h2>
        
        {/* All Files */}
        <div className="mb-6">
          <button
            onClick={handleAllFilesSelect}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              currentView === 'all' && !currentCollection && !currentWorkspace
                ? 'bg-rose-100 text-rose-700 border-l-2 border-rose-500'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <DocumentTextIcon className="h-5 w-5 mr-3 text-gray-500" />
            All Files
          </button>
        </div>

        {/* Collections Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Collections</h3>
            <button
              onClick={onCreateCollection}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Create Collection"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
          
          {collectionsLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading collections...</div>
          ) : (
            <div className="space-y-1">
              {renderCollectionGroup(
                "Personal", 
                personalCollections, 
                FolderIcon, 
                "personal",
                "text-blue-500"
              )}
              {renderCollectionGroup(
                "Shared", 
                sharedCollections, 
                UsersIcon, 
                "shared",
                "text-green-500"
              )}
              {renderCollectionGroup(
                "Team", 
                teamCollections, 
                BuildingOfficeIcon, 
                "team",
                "text-purple-500"
              )}
              {renderCollectionGroup(
                "Memory", 
                memoryCollections, 
                CogIcon, 
                "memory",
                "text-orange-500"
              )}
            </div>
          )}
        </div>

        {/* Workspaces Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Workspaces</h3>
            <button
              onClick={onCreateWorkspace}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Create Workspace"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-1">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleWorkspaceSelect(workspace.id)}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  currentWorkspace === workspace.id
                    ? 'bg-rose-100 text-rose-700 border-l-2 border-rose-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span className="truncate">{workspace.name}</span>
                <span className="ml-auto text-xs text-gray-400">
                  {workspace.collections.length}
                </span>
              </button>
            ))}
            
            {workspaces.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-500 italic">
                No workspaces available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
