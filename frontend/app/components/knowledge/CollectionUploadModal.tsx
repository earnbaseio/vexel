"use client";

import { useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import {
  XMarkIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import {
  uploadKnowledgeFile,
  uploadKnowledgeText,
  uploadKnowledgeUrl,
  selectKnowledgeUploading,
  selectKnowledgeUploadProgress,
  selectKnowledgeError,
  clearUploadProgress,
  clearError
} from "@/app/lib/slices/knowledgeSlice";
import {
  KnowledgeCategory,
  KnowledgeUploadMethod,
  IKnowledgeCollection
} from "@/app/lib/interfaces/knowledge";

interface CollectionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: IKnowledgeCollection;
  onUploadSuccess?: () => void;
}

interface UploadFormData {
  title: string;
  description: string;
  category: KnowledgeCategory;
  uploadMethod: KnowledgeUploadMethod;
  tags: string;
  selectedFiles: File[];
  textContent: string;
  url: string;
}

export default function CollectionUploadModal({
  isOpen,
  onClose,
  collection,
  onUploadSuccess
}: CollectionUploadModalProps) {
  const dispatch = useAppDispatch();
  const isUploading = useAppSelector(selectKnowledgeUploading);
  const uploadProgress = useAppSelector(selectKnowledgeUploadProgress);
  const error = useAppSelector(selectKnowledgeError);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<UploadFormData>({
    title: "",
    description: "",
    category: KnowledgeCategory.DOCUMENTATION,
    uploadMethod: KnowledgeUploadMethod.FILE,
    tags: "",
    selectedFiles: [],
    textContent: "",
    url: "",
  });

  const [isDragOver, setIsDragOver] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validation
  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['.pdf', '.txt', '.csv', '.json', '.docx'];
    
    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }
    
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      return 'File type not supported. Please upload PDF, TXT, CSV, JSON, or DOCX files';
    }
    
    return null;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (formData.uploadMethod === KnowledgeUploadMethod.FILE && formData.selectedFiles.length === 0) {
      errors.file = 'Please select a file to upload';
    }

    if (formData.uploadMethod === KnowledgeUploadMethod.TEXT && !formData.textContent.trim()) {
      errors.textContent = 'Text content is required';
    }

    if (formData.uploadMethod === KnowledgeUploadMethod.URL && !formData.url.trim()) {
      errors.url = 'URL is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // File handling
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        files: errors.join(', ')
      }));
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.files;
        return newErrors;
      });
    }

    setFormData(prev => ({
      ...prev,
      selectedFiles: validFiles
    }));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Process based on upload method
      if (formData.uploadMethod === KnowledgeUploadMethod.FILE && formData.selectedFiles.length > 0) {
        const file = formData.selectedFiles[0];
        await dispatch(uploadKnowledgeFile({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          uploadMethod: KnowledgeUploadMethod.FILE,
          tags: formData.tags,
          file,
          collection_id: collection.metadata?.backend_name || collection.id  // Required collection ID
        })).unwrap();
      } else if (formData.uploadMethod === KnowledgeUploadMethod.TEXT) {
        await dispatch(uploadKnowledgeText({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          content: formData.textContent,
          tags: formData.tags.split(',').map(tag => tag.trim()),
          collection_id: collection.metadata?.backend_name || collection.id
        })).unwrap();
      } else if (formData.uploadMethod === KnowledgeUploadMethod.URL) {
        await dispatch(uploadKnowledgeUrl({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          url: formData.url,
          tags: formData.tags.split(',').map(tag => tag.trim()),
          collection_id: collection.metadata?.backend_name || collection.id
        })).unwrap();
      }

      // Success - close modal and refresh
      onUploadSuccess?.();
      onClose();
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        category: KnowledgeCategory.DOCUMENTATION,
        uploadMethod: KnowledgeUploadMethod.FILE,
        tags: "",
        selectedFiles: [],
        textContent: "",
        url: "",
      });
      
    } catch (error) {
      console.error("Error uploading to collection:", error);
    }
  };

  const handleClose = () => {
    dispatch(clearError());
    dispatch(clearUploadProgress());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Upload to Collection
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Adding files to: <span className="font-medium text-gray-900">{collection.name}</span>
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4 max-h-96 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm ${
                    validationErrors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter knowledge title"
                  required
                />
                {validationErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                  placeholder="Optional description"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <select
                  name="category"
                  id="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                  required
                >
                  <option value={KnowledgeCategory.DOCUMENTATION}>Documentation</option>
                  <option value={KnowledgeCategory.RESEARCH}>Research</option>
                  <option value={KnowledgeCategory.TRAINING}>Training</option>
                  <option value={KnowledgeCategory.REFERENCE}>Reference</option>
                  <option value={KnowledgeCategory.POLICY}>Policy</option>
                  <option value={KnowledgeCategory.PROCEDURE}>Procedure</option>
                  <option value={KnowledgeCategory.OTHER}>Other</option>
                </select>
              </div>

              {/* Upload Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Upload Method *
                </label>
                <div className="mt-2">
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="uploadMethod"
                        value={KnowledgeUploadMethod.FILE}
                        checked={formData.uploadMethod === KnowledgeUploadMethod.FILE}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300"
                      />
                      <DocumentTextIcon className="ml-2 h-4 w-4 text-gray-500" />
                      <span className="ml-1 text-sm text-gray-700">Upload File</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="uploadMethod"
                        value={KnowledgeUploadMethod.TEXT}
                        checked={formData.uploadMethod === KnowledgeUploadMethod.TEXT}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300"
                      />
                      <DocumentTextIcon className="ml-2 h-4 w-4 text-gray-500" />
                      <span className="ml-1 text-sm text-gray-700">Enter Text</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="uploadMethod"
                        value={KnowledgeUploadMethod.URL}
                        checked={formData.uploadMethod === KnowledgeUploadMethod.URL}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300"
                      />
                      <LinkIcon className="ml-2 h-4 w-4 text-gray-500" />
                      <span className="ml-1 text-sm text-gray-700">From URL</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              {formData.uploadMethod === KnowledgeUploadMethod.FILE && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    File Upload *
                  </label>
                  <div
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                      isDragOver
                        ? 'border-rose-400 bg-rose-50'
                        : validationErrors.files || validationErrors.file
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <div className="space-y-1 text-center">
                      <CloudArrowUpIcon className={`mx-auto h-12 w-12 ${
                        isDragOver ? 'text-rose-500' : 'text-gray-400'
                      }`} />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-rose-600 hover:text-rose-500"
                        >
                          <span>Upload a file</span>
                          <input
                            ref={fileInputRef}
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept=".pdf,.txt,.csv,.json,.docx"
                            multiple={false}
                            onChange={handleFileInputChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, TXT, CSV, JSON, DOCX up to 10MB
                      </p>
                    </div>
                  </div>

                  {/* Selected files */}
                  {formData.selectedFiles.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">Selected files:</p>
                      <ul className="mt-1 space-y-1">
                        {formData.selectedFiles.map((file, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(validationErrors.files || validationErrors.file) && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.files || validationErrors.file}
                    </p>
                  )}
                </div>
              )}

              {/* Text Content */}
              {formData.uploadMethod === KnowledgeUploadMethod.TEXT && (
                <div>
                  <label htmlFor="textContent" className="block text-sm font-medium text-gray-700">
                    Text Content *
                  </label>
                  <textarea
                    name="textContent"
                    id="textContent"
                    rows={6}
                    value={formData.textContent}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm ${
                      validationErrors.textContent ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your text content here..."
                    required
                  />
                  {validationErrors.textContent && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.textContent}</p>
                  )}
                </div>
              )}

              {/* URL */}
              {formData.uploadMethod === KnowledgeUploadMethod.URL && (
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                    URL *
                  </label>
                  <input
                    type="url"
                    name="url"
                    id="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm ${
                      validationErrors.url ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="https://example.com/document.pdf"
                    required
                  />
                  {validationErrors.url && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.url}</p>
                  )}
                </div>
              )}

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  id="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                  placeholder="tag1, tag2, tag3"
                />
                <p className="mt-1 text-xs text-gray-500">Separate tags with commas</p>
              </div>

              {/* Error display */}
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUploading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
