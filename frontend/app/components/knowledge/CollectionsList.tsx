"use client";

import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/app/lib/hooks";
import {
  FolderIcon,
} from "@heroicons/react/24/outline";
import CollectionCard from "./CollectionCard";
import {
  selectCollections,
  selectCollectionsLoading,
  selectCollectionsError,
  deleteCollection,
  setCurrentCollection,
} from "@/app/lib/slices/knowledgeSlice";
import { IKnowledgeCollection, CollectionType } from "@/app/lib/interfaces";

interface CollectionsListProps {
  onCollectionSelect?: (collection: IKnowledgeCollection) => void;
  onCollectionEdit?: (collection: IKnowledgeCollection) => void;
  onCollectionCreate?: () => void;
  filterType?: CollectionType | 'all';
  enableDropZones?: boolean;
  onFileDrop?: (items: any[], targetCollection: string, sourceCollection: string) => void;
}

export default function CollectionsList({
  onCollectionSelect,
  onCollectionEdit,
  onCollectionCreate,
  filterType = 'all',
  enableDropZones = false,
  onFileDrop,
}: CollectionsListProps) {
  const dispatch = useAppDispatch();
  
  // Redux state
  const collections = useAppSelector(selectCollections);
  const isLoading = useAppSelector(selectCollectionsLoading);
  const error = useAppSelector(selectCollectionsError);

  // Filter collections based on type
  const filteredCollections = filterType === 'all' 
    ? collections 
    : collections.filter(c => c.type === filterType);

  const handleCollectionSelect = (collection: IKnowledgeCollection) => {
    dispatch(setCurrentCollection(collection.id));
    onCollectionSelect?.(collection);
  };

  const handleCollectionEdit = (collection: IKnowledgeCollection) => {
    onCollectionEdit?.(collection);
  };

  const handleCollectionDelete = async (collection: IKnowledgeCollection) => {
    if (window.confirm(`Are you sure you want to delete the collection "${collection.name}"?`)) {
      try {
        await dispatch(deleteCollection(collection.id)).unwrap();
      } catch (error) {
        console.error('Failed to delete collection:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
        <span className="ml-3 text-gray-600">Loading collections...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading collections</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (filteredCollections.length === 0) {
    return (
      <div className="text-center py-12 bg-white shadow rounded-lg">
        <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No collections</h3>
        <p className="mt-1 text-sm text-gray-500">
          {filterType === 'all' 
            ? 'Get started by creating your first collection.'
            : `No ${filterType} collections found.`
          }
        </p>
        {onCollectionCreate && (
          <div className="mt-6">
            <button
              onClick={onCollectionCreate}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              <FolderIcon className="h-4 w-4 mr-2" />
              Create Collection
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredCollections.map((collection) => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          onSelect={handleCollectionSelect}
          onEdit={handleCollectionEdit}
          onDelete={handleCollectionDelete}
          showActions={true}
          enableDropZone={enableDropZones}
          onFileDrop={onFileDrop}
        />
      ))}
    </div>
  );
}
