"use client";

import { useState } from "react";
import { useAppDispatch } from "@/app/lib/hooks";
import {
  XMarkIcon,
  FolderIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { createCollection } from "@/app/lib/slices/knowledgeSlice";
import { CollectionType, ICollectionCreateRequest } from "@/app/lib/interfaces";

interface CollectionCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (collection: any) => void;
  defaultWorkspace?: string;
}

export default function CollectionCreateForm({
  isOpen,
  onClose,
  onSuccess,
  defaultWorkspace,
}: CollectionCreateFormProps) {
  const dispatch = useAppDispatch();
  
  // Form state
  const [formData, setFormData] = useState<ICollectionCreateRequest>({
    name: '',
    description: '',
    type: CollectionType.PERSONAL,
    workspace: defaultWorkspace || '',
    metadata: {},
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const collectionTypes = [
    {
      value: CollectionType.PERSONAL,
      label: 'Personal',
      description: 'Private collection for your personal knowledge',
      icon: FolderIcon,
      color: 'text-blue-500 bg-blue-50 border-blue-200',
    },
    {
      value: CollectionType.SHARED,
      label: 'Shared',
      description: 'Collection shared with specific users',
      icon: UsersIcon,
      color: 'text-green-500 bg-green-50 border-green-200',
    },
    {
      value: CollectionType.TEAM,
      label: 'Team',
      description: 'Collection for team collaboration',
      icon: BuildingOfficeIcon,
      color: 'text-purple-500 bg-purple-50 border-purple-200',
    },
    {
      value: CollectionType.MEMORY,
      label: 'Memory',
      description: 'Collection for AI agent memory and reasoning',
      icon: CogIcon,
      color: 'text-orange-500 bg-orange-50 border-orange-200',
    },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
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
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await dispatch(createCollection(formData)).unwrap();
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        type: CollectionType.PERSONAL,
        workspace: defaultWorkspace || '',
        metadata: {},
      });
      
      onSuccess?.(result);
      onClose();
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to create collection' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ICollectionCreateRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

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
            <h3 className="text-lg font-medium text-gray-900">
              Create New Collection
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
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

            {/* Collection Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Collection Type *
              </label>
              <div className="space-y-3">
                {collectionTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <label
                      key={type.value}
                      className={`relative flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        formData.type === type.value
                          ? 'border-rose-500 bg-rose-50'
                          : 'border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={(e) => handleInputChange('type', e.target.value as CollectionType)}
                        className="sr-only"
                      />
                      <div className={`flex-shrink-0 p-2 rounded-lg border ${type.color}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {type.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {type.description}
                        </div>
                      </div>
                      {formData.type === type.value && (
                        <div className="flex-shrink-0">
                          <div className="h-5 w-5 rounded-full bg-rose-500 flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-white" />
                          </div>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Workspace */}
            {defaultWorkspace && (
              <div>
                <label htmlFor="workspace" className="block text-sm font-medium text-gray-700">
                  Workspace
                </label>
                <input
                  type="text"
                  id="workspace"
                  value={formData.workspace}
                  onChange={(e) => handleInputChange('workspace', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-1 focus:border-rose-500 focus:ring-rose-500"
                  placeholder="Workspace name"
                />
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
                {isSubmitting ? 'Creating...' : 'Create Collection'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
