/**
 * Knowledge Management Interfaces
 * Defines types for knowledge upload, storage, and retrieval
 */

// Knowledge Upload Methods
export enum KnowledgeUploadMethod {
  FILE = 'file',
  TEXT = 'text',
  URL = 'url'
}

// Knowledge Categories
export enum KnowledgeCategory {
  DOCUMENTATION = 'documentation',
  RESEARCH = 'research',
  TRAINING = 'training',
  REFERENCE = 'reference',
  POLICY = 'policy',
  PROCEDURE = 'procedure',
  OTHER = 'other'
}

// Knowledge File Types (matching backend)
export enum KnowledgeFileType {
  PDF = 'pdf',
  TXT = 'txt',
  CSV = 'csv',
  JSON = 'json',
  DOCX = 'docx'
}

// Knowledge Item Status
export enum KnowledgeStatus {
  PROCESSING = 'processing',
  READY = 'ready',
  ERROR = 'error',
  DELETED = 'deleted'
}

// Base Knowledge Item
export interface IKnowledgeItem {
  id: string;
  title: string;
  description?: string;
  category: KnowledgeCategory;
  file_type?: KnowledgeFileType;
  file_name?: string;
  file_size_bytes?: number;
  collection_name: string;
  documents_processed: number;
  upload_timestamp: string;
  status: KnowledgeStatus;
  tags: string[];
  metadata: Record<string, any>;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Knowledge Upload Request
export interface IKnowledgeUploadRequest {
  title: string;
  description?: string;
  category: KnowledgeCategory;
  uploadMethod: KnowledgeUploadMethod;
  tags: string;
  file?: File;
  textContent?: string;
  url?: string;
  collection_id: string;  // Required collection ID (Qdrant collection name)
}

// Knowledge Upload Response (matching backend FileUploadResponse)
export interface IKnowledgeUploadResponse {
  message: string;
  filename: string;
  file_type: KnowledgeFileType;
  collection_name: string;
  documents_processed: number;
  file_size_bytes: number;
  upload_timestamp: string;
  metadata: Record<string, any>;
  status: string;
}

// Knowledge Text Upload Request
export interface IKnowledgeTextUploadRequest {
  title: string;
  description?: string;
  category: KnowledgeCategory;
  content: string;
  tags: string[];
  collection_id: string;  // Required collection ID (Qdrant collection name)
}

// Knowledge URL Upload Request
export interface IKnowledgeUrlUploadRequest {
  title: string;
  description?: string;
  category: KnowledgeCategory;
  url: string;
  tags: string[];
  collection_id: string;  // Required collection ID (Qdrant collection name)
}

// Knowledge Search Request
export interface IKnowledgeSearchRequest {
  query: string;
  category?: KnowledgeCategory;
  file_type?: KnowledgeFileType;
  tags?: string[];
  limit?: number;
  offset?: number;
}

// Knowledge Search Response
export interface IKnowledgeSearchResponse {
  items: IKnowledgeItem[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// Knowledge List Response
export interface IKnowledgeListResponse {
  items: IKnowledgeItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Knowledge Delete Request
export interface IKnowledgeDeleteRequest {
  collection_name: string;
}

// Knowledge Delete Response
export interface IKnowledgeDeleteResponse {
  message: string;
  collection_name: string;
  status: string;
}

// Knowledge Upload Progress
export interface IKnowledgeUploadProgress {
  file_name: string;
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error_message?: string;
}

// Knowledge State for Redux
export interface IKnowledgeState {
  // Existing file management
  items: IKnowledgeItem[];
  uploadProgress: Record<string, IKnowledgeUploadProgress>;
  isUploading: boolean;
  isLoading: boolean;
  error: string | null;
  searchResults: IKnowledgeItem[];
  isSearching: boolean;
  searchError: string | null;
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };

  // Collections state
  collections: IKnowledgeCollection[];
  currentCollection: string | null;
  collectionsLoading: boolean;
  collectionsError: string | null;
  collectionDetails: Record<string, ICollectionDetailsResponse>;

  // Workspace state
  workspaces: IWorkspace[];
  currentWorkspace: string | null;
  workspacesLoading: boolean;
  workspacesError: string | null;
}

// Knowledge Form Data (for frontend forms)
export interface IKnowledgeFormData {
  title: string;
  description: string;
  category: KnowledgeCategory;
  uploadMethod: KnowledgeUploadMethod;
  tags: string;
  selectedFiles: File[];
  textContent: string;
  url: string;
}

// Knowledge Validation Errors
export interface IKnowledgeValidationError {
  field: string;
  message: string;
}

// Knowledge Upload Options
export interface IKnowledgeUploadOptions {
  maxFileSize: number; // in bytes
  allowedFileTypes: KnowledgeFileType[];
  maxFiles: number;
  chunkSize?: number;
}

// Knowledge Analytics
export interface IKnowledgeAnalytics {
  total_items: number;
  total_size_bytes: number;
  items_by_category: Record<KnowledgeCategory, number>;
  items_by_type: Record<KnowledgeFileType, number>;
  recent_uploads: number;
  processing_items: number;
  error_items: number;
}

// Knowledge Collection Info
export interface IKnowledgeCollectionInfo {
  name: string;
  description?: string;
  item_count: number;
  total_size_bytes: number;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

// Knowledge Bulk Operations
export interface IKnowledgeBulkDeleteRequest {
  item_ids: string[];
}

export interface IKnowledgeBulkDeleteResponse {
  deleted_count: number;
  failed_items: string[];
  message: string;
}

// Knowledge Export Request
export interface IKnowledgeExportRequest {
  item_ids?: string[];
  category?: KnowledgeCategory;
  format: 'json' | 'csv' | 'zip';
}

export interface IKnowledgeExportResponse {
  download_url: string;
  expires_at: string;
  file_size_bytes: number;
}

// Collection Types
export enum CollectionType {
  PERSONAL = 'personal',
  SHARED = 'shared',
  TEAM = 'team',
  MEMORY = 'memory',
  UNIFIED = 'unified'
}

// Collection Permissions
export interface ICollectionPermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
  share: boolean;
  admin: boolean;
}

// Knowledge Collection
export interface IKnowledgeCollection {
  id: string;
  name: string;
  description?: string;
  type: CollectionType;
  fileCount: number;
  totalSize: number;
  createdAt: string;
  updatedAt: string;
  permissions: ICollectionPermissions;
  workspace?: string;
  metadata: Record<string, any>;
  user_id: string;
  isDefault?: boolean;
}

// Collection Create Request
export interface ICollectionCreateRequest {
  name: string;
  description?: string;
  type: CollectionType;
  workspace?: string;
  metadata?: Record<string, any>;
}

// Collection Update Request
export interface ICollectionUpdateRequest {
  name?: string;
  description?: string;
  metadata?: Record<string, any>;
}

// Collection Details Response
export interface ICollectionDetailsResponse {
  collection: IKnowledgeCollection;
  items: IKnowledgeItem[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// Workspace Types
export enum WorkspaceType {
  PERSONAL = 'personal',
  TEAM = 'team',
  ORGANIZATION = 'organization'
}

// Workspace Member
export interface IWorkspaceMember {
  user_id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
}

// Workspace Settings
export interface IWorkspaceSettings {
  default_collection_type: CollectionType;
  auto_categorization: boolean;
  shared_access: boolean;
  retention_policy?: {
    enabled: boolean;
    days: number;
  };
}

// Workspace
export interface IWorkspace {
  id: string;
  name: string;
  description?: string;
  type: WorkspaceType;
  collections: string[];
  members: IWorkspaceMember[];
  createdAt: string;
  settings: IWorkspaceSettings;
  metadata: Record<string, any>;
  owner_id: string;
}

// Workspace Create Request
export interface IWorkspaceCreateRequest {
  name: string;
  description?: string;
  type: WorkspaceType;
  settings?: Partial<IWorkspaceSettings>;
}

// Workspace Update Request
export interface IWorkspaceUpdateRequest {
  name?: string;
  description?: string;
  settings?: Partial<IWorkspaceSettings>;
}

// File Move Request
export interface IFileMoveRequest {
  file_id: string;
  target_collection_id: string;
}

// Bulk File Move Request
export interface IBulkFileMoveRequest {
  file_ids: string[];
  target_collection_id: string;
}
