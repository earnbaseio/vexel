"use client";

import { useState, useEffect } from "react";
import { useAppDispatch } from "@/app/lib/hooks";
import {
  XMarkIcon,
  FolderIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CogIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { updateCollection, deleteCollection } from "@/app/lib/slices/knowledgeSlice";
import { IKnowledgeCollection, CollectionType, ICollectionUpdateRequest } from "@/app/lib/interfaces";

interface CollectionEditFormProps {
  isOpen: boolean;
  collection: IKnowledgeCollection | null;
  onClose: () => void;
  onSuccess?: (collection: IKnowledgeCollection) => void;
  onDelete?: (collection: IKnowledgeCollection) => void;
}

export default function CollectionEditForm({
  isOpen,
  collection,
  onClose,
  onSuccess,
  onDelete,
}: CollectionEditFormProps) {
  const dispatch = useAppDispatch();
  
  // Form state
  const [formData, setFormData] = useState<ICollectionUpdateRequest>({
    name: '',
    description: '',
    metadata: {},
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form data when collection changes
  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name,
        description: collection.description || '',
        metadata: collection.metadata || {},
      });
    }
  }, [collection]);

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Collection name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Collection name must be at least 3 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Collection name must be less than 50 characters';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!collection || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await dispatch(updateCollection({
        collectionId: collection.id,
        request: formData,
      })).unwrap();
      
      onSuccess?.(result);
      onClose();
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to update collection' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!collection) return;

    setIsDeleting(true);
    
    try {
      await dispatch(deleteCollection(collection.id)).unwrap();
      onDelete?.(collection);
      onClose();
    } catch (error: any) {
      setErrors({ delete: error.message || 'Failed to delete collection' });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleInputChange = (field: keyof ICollectionUpdateRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen || !collection) return null;

  const IconComponent = getCollectionIcon(collection.type);
  const colorClasses = getCollectionColor(collection.type);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg border ${colorClasses} mr-3`}>
                <IconComponent className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Edit Collection
                </h3>
                <p className="text-sm text-gray-500 capitalize">
                  {collection.type} Collection
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Collection Info */}
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Files: {collection.fileCount}</span>
                <span>Created: {new Date(collection.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Collection Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Collection Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${
                  errors.name
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-rose-500 focus:ring-rose-500'
                }`}
                placeholder="Enter collection name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Collection Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`mt-1 block w-full border rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${
                  errors.description
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-rose-500 focus:ring-rose-500'
                }`}
                placeholder="Optional description for this collection"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Delete Error */}
            {errors.delete && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{errors.delete}</p>
              </div>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  Confirm Deletion
                </h4>
                <p className="text-sm text-red-700 mb-3">
                  Are you sure you want to delete this collection? This action cannot be undone.
                  All files in this collection will be moved to the default collection.
                </p>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Collection'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-between pt-4 border-t border-gray-200">
              {/* Delete Button */}
              {collection.permissions.delete && !collection.isDefault && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={showDeleteConfirm}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete Collection
                </button>
              )}
              
              {/* Save/Cancel Buttons */}
              <div className="flex space-x-3 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 border border-transparent rounded-md shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
