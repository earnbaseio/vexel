"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/app/lib/hooks";
import { loggedIn } from "@/app/lib/slices/authSlice";
import { useRouter } from "next/navigation";
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  LinkIcon,
  XMarkIcon,
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
  IKnowledgeFormData
} from "@/app/lib/interfaces/knowledge";

// Supported file types and their extensions
const SUPPORTED_FILE_TYPES = {
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/json': 'json',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadKnowledge() {
  const isLoggedIn = useAppSelector((state) => loggedIn(state));
  const isUploading = useAppSelector(selectKnowledgeUploading);
  const uploadProgress = useAppSelector(selectKnowledgeUploadProgress);
  const error = useAppSelector(selectKnowledgeError);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState<IKnowledgeFormData>({
    title: "",
    description: "",
    category: KnowledgeCategory.DOCUMENTATION,
    uploadMethod: KnowledgeUploadMethod.FILE,
    tags: "",
    selectedFiles: [],
    textContent: "",
    url: "",
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Redirect to collection-based workflow
    const timer = setTimeout(() => {
      router.push("/knowledge");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.push("/authentication");
    }
  }, [isLoggedIn, mounted, router]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // File validation helper
  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }

    if (!Object.keys(SUPPORTED_FILE_TYPES).includes(file.type)) {
      return 'Unsupported file type. Supported types: PDF, TXT, CSV, JSON, DOCX';
    }

    return null;
  };

  // Handle input changes
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

  // Handle file selection
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

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  // Remove selected file
  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      selectedFiles: prev.selectedFiles.filter((_, i) => i !== index)
    }));
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, []);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Basic validation
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.category) {
      errors.category = 'Category is required';
    }

    if (!formData.uploadMethod) {
      errors.uploadMethod = 'Upload method is required';
    }

    // Method-specific validation
    if (formData.uploadMethod === KnowledgeUploadMethod.FILE) {
      if (formData.selectedFiles.length === 0) {
        errors.files = 'Please select at least one file';
      }
    } else if (formData.uploadMethod === KnowledgeUploadMethod.TEXT) {
      if (!formData.textContent.trim()) {
        errors.textContent = 'Text content is required';
      }
    } else if (formData.uploadMethod === KnowledgeUploadMethod.URL) {
      if (!formData.url.trim()) {
        errors.url = 'URL is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
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
          file
        })).unwrap();
      } else if (formData.uploadMethod === KnowledgeUploadMethod.TEXT) {
        await dispatch(uploadKnowledgeText({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          content: formData.textContent,
          tags: formData.tags.split(',').map(tag => tag.trim())
        })).unwrap();
      } else if (formData.uploadMethod === KnowledgeUploadMethod.URL) {
        await dispatch(uploadKnowledgeUrl({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          url: formData.url,
          tags: formData.tags.split(',').map(tag => tag.trim())
        })).unwrap();
      }

      // Redirect to knowledge list
      router.push("/knowledge");
    } catch (error) {
      console.error("Error uploading knowledge:", error);
    }
  };

  // Render progress for uploaded files
  const renderUploadProgress = () => {
    const progressEntries = Object.entries(uploadProgress);
    if (progressEntries.length === 0) return null;

    return (
      <div className="mb-6 space-y-3">
        {progressEntries.map(([fileName, progress]) => (
          <div key={fileName} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">{fileName}</span>
              <button
                onClick={() => dispatch(clearUploadProgress(fileName))}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    progress.status === 'error' ? 'bg-red-500' :
                    progress.status === 'completed' ? 'bg-green-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">
                {progress.status === 'error' ? 'Error' :
                 progress.status === 'completed' ? 'Complete' :
                 progress.status === 'processing' ? 'Processing' :
                 `${progress.progress}%`}
              </span>
            </div>
            {progress.error_message && (
              <p className="text-sm text-red-600 mt-1">{progress.error_message}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!mounted || !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload Knowledge</h1>
          <p className="mt-2 text-gray-600">
            Add documents and information to your knowledge base
          </p>
        </div>

        {/* Deprecation Notice */}
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-lg font-medium text-yellow-800">
                Upload Workflow Updated
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  We've improved the upload experience! Files now need to be uploaded to specific collections
                  for better organization (similar to Claude Projects).
                </p>
                <p className="mt-2">
                  <strong>New workflow:</strong>
                </p>
                <ol className="mt-1 list-decimal list-inside space-y-1">
                  <li>Create or select a collection</li>
                  <li>Click "Add Files" in the collection</li>
                  <li>Upload your files to that collection</li>
                </ol>
                <p className="mt-3">
                  Redirecting you to the new workflow in 3 seconds...
                </p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => router.push("/knowledge")}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Go to Collections Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {renderUploadProgress()}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Knowledge Upload</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm ${
                    validationErrors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Describe the knowledge content"
                />
                {validationErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                )}
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
                  className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm ${
                    validationErrors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select category</option>
                  <option value={KnowledgeCategory.DOCUMENTATION}>Documentation</option>
                  <option value={KnowledgeCategory.RESEARCH}>Research</option>
                  <option value={KnowledgeCategory.TRAINING}>Training</option>
                  <option value={KnowledgeCategory.REFERENCE}>Reference</option>
                  <option value={KnowledgeCategory.POLICY}>Policy</option>
                  <option value={KnowledgeCategory.PROCEDURE}>Procedure</option>
                  <option value={KnowledgeCategory.OTHER}>Other</option>
                </select>
                {validationErrors.category && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.category}</p>
                )}
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
                {validationErrors.uploadMethod && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.uploadMethod}</p>
                )}
              </div>

              {/* Content based on upload method */}
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
                          className="relative cursor-pointer bg-white rounded-md font-medium text-rose-600 hover:text-rose-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-rose-500"
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

                  {/* Selected Files Display */}
                  {formData.selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {formData.selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center space-x-3">
                            <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {(validationErrors.files || validationErrors.file) && (
                    <p className="mt-1 text-sm text-red-600">
                      {validationErrors.files || validationErrors.file}
                    </p>
                  )}
                </div>
              )}

              {formData.uploadMethod === KnowledgeUploadMethod.TEXT && (
                <div>
                  <label htmlFor="textContent" className="block text-sm font-medium text-gray-700">
                    Text Content *
                  </label>
                  <textarea
                    name="textContent"
                    id="textContent"
                    rows={8}
                    value={formData.textContent}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm ${
                      validationErrors.textContent ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your text content here..."
                  />
                  {validationErrors.textContent && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.textContent}</p>
                  )}
                </div>
              )}

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
                  className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500 sm:text-sm ${
                    validationErrors.tags ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter tags separated by commas"
                />
                {validationErrors.tags && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.tags}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Separate multiple tags with commas (e.g., "AI, machine learning, documentation")
                </p>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.push("/knowledge")}
                  disabled={isUploading}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="-ml-1 mr-2 h-4 w-4" />
                      Upload Knowledge
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
