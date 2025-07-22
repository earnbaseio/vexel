/**
 * Knowledge Management API Service
 * Handles all knowledge-related API operations
 */

import { apiCore } from "./core";
import {
  IKnowledgeUploadRequest,
  IKnowledgeUploadResponse,
  IKnowledgeTextUploadRequest,
  IKnowledgeUrlUploadRequest,
  IKnowledgeListResponse,
  IKnowledgeSearchRequest,
  IKnowledgeSearchResponse,
  IKnowledgeDeleteRequest,
  IKnowledgeDeleteResponse,
  IKnowledgeAnalytics,
  IKnowledgeCollectionInfo,
  IKnowledgeBulkDeleteRequest,
  IKnowledgeBulkDeleteResponse,
  IKnowledgeExportRequest,
  IKnowledgeExportResponse,
} from "../interfaces";

export const knowledgeAPI = {
  /**
   * Upload a file for knowledge processing
   */
  async uploadFile(
    token: string,
    data: IKnowledgeUploadRequest
  ): Promise<IKnowledgeUploadResponse> {
    if (!data.file) {
      throw new Error("File is required for file upload");
    }

    const formData = new FormData();
    formData.append("file", data.file);
    
    // Add metadata as form fields
    if (data.title) formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    if (data.category) formData.append("category", data.category);
    if (data.tags) formData.append("tags", data.tags);

    const response = await fetch(`${apiCore.url}/agents/knowledge/upload`, {
      method: "POST",
      headers: {
        "Cache-Control": "no-cache",
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Upload failed: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Upload text content for knowledge processing
   */
  async uploadText(
    token: string,
    data: IKnowledgeTextUploadRequest
  ): Promise<IKnowledgeUploadResponse> {
    // Create a text file from the content
    const textBlob = new Blob([data.content], { type: 'text/plain' });
    const textFile = new File([textBlob], `${data.title}.txt`, { type: 'text/plain' });

    const formData = new FormData();
    formData.append("file", textFile);
    formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    formData.append("category", data.category);
    if (data.tags.length > 0) formData.append("tags", data.tags.join(", "));

    const response = await fetch(`${apiCore.url}/agents/knowledge/upload`, {
      method: "POST",
      headers: {
        "Cache-Control": "no-cache",
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Text upload failed: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Upload URL content for knowledge processing
   */
  async uploadUrl(
    token: string,
    data: IKnowledgeUrlUploadRequest
  ): Promise<IKnowledgeUploadResponse> {
    const response = await fetch(`${apiCore.url}/agents/knowledge/upload-url`, {
      method: "POST",
      headers: apiCore.headers(token),
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        category: data.category,
        url: data.url,
        tags: data.tags,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `URL upload failed: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get list of knowledge items
   */
  async getKnowledgeList(
    token: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<IKnowledgeListResponse> {
    const response = await fetch(
      `${apiCore.url}/knowledge/list?page=${page}&per_page=${perPage}`,
      {
        method: "GET",
        headers: apiCore.headers(token),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch knowledge list: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform backend response to match frontend interface
    const transformedItems = (data.files || []).map((file: any) => ({
      id: file.id || '',
      title: file.name || '',
      description: file.description || '',
      category: file.category || 'documentation',
      file_type: file.type || '',
      file_name: file.name || '',
      file_size_bytes: file.size || 0,
      collection_name: file.collection_name || '',
      documents_processed: file.documents_processed || 0,
      upload_timestamp: file.upload_date || '',
      status: 'ready',
      tags: file.tags || [],
      metadata: file.metadata || {},
      user_id: '',
      created_at: file.upload_date || '',
      updated_at: file.upload_date || '',
    }));

    return {
      items: transformedItems,
      total: data.pagination?.total || 0,
      page: data.pagination?.page || 1,
      per_page: data.pagination?.per_page || 20,
      total_pages: data.pagination?.pages || 0,
    };
  },

  /**
   * Search knowledge items
   */
  async searchKnowledge(
    token: string,
    searchRequest: IKnowledgeSearchRequest
  ): Promise<IKnowledgeSearchResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append("query", searchRequest.query);
    if (searchRequest.category) queryParams.append("category", searchRequest.category);
    if (searchRequest.file_type) queryParams.append("file_type", searchRequest.file_type);
    if (searchRequest.tags) {
      searchRequest.tags.forEach(tag => queryParams.append("tags", tag));
    }
    if (searchRequest.limit) queryParams.append("limit", searchRequest.limit.toString());
    if (searchRequest.offset) queryParams.append("offset", searchRequest.offset.toString());

    const response = await fetch(
      `${apiCore.url}/knowledge/search?${queryParams.toString()}`,
      {
        method: "GET",
        headers: apiCore.headers(token),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Knowledge search failed: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Delete a knowledge item
   */
  async deleteKnowledge(
    token: string,
    collectionName: string
  ): Promise<IKnowledgeDeleteResponse> {
    const response = await fetch(
      `${apiCore.url}/agents/knowledge/files/${encodeURIComponent(collectionName)}`,
      {
        method: "DELETE",
        headers: apiCore.headers(token),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to delete knowledge: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get knowledge analytics
   */
  async getKnowledgeAnalytics(token: string): Promise<IKnowledgeAnalytics> {
    const response = await fetch(`${apiCore.url}/knowledge/analytics`, {
      method: "GET",
      headers: apiCore.headers(token),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch analytics: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get knowledge collections info
   */
  async getCollectionsInfo(token: string): Promise<any> {
    const response = await fetch(`${apiCore.url}/knowledge/collections`, {
      method: "GET",
      headers: apiCore.headers(token),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch collections: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get collections list with enhanced metadata
   */
  async getCollectionsList(token: string): Promise<IKnowledgeCollection[]> {
    const response = await fetch(`${apiCore.url}/knowledge/collections`, {
      method: "GET",
      headers: apiCore.headers(token),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch collections list: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform backend response to frontend collection format
    if (data.status === "success" && data.collections?.collections) {
      const collections = data.collections.collections.map((collectionName: string) => {
        // Determine collection type based on name pattern
        let type = 'unified' as any;
        let displayName = collectionName;
        let description = `Collection: ${collectionName}`;

        if (collectionName.includes('_team_')) {
          type = 'team';
          displayName = collectionName.replace('vexel_team_', '').replace(/_/g, ' ');
          description = `Team collaboration collection for ${displayName}`;
        } else if (collectionName.includes('_memory_')) {
          type = 'memory';
          displayName = collectionName.replace('vexel_memory_', '').replace(/_/g, ' ');
          description = `AI agent memory collection for ${displayName}`;
        } else if (collectionName.includes('_shared_')) {
          type = 'shared';
          displayName = collectionName.replace('vexel_shared_', '').replace(/_/g, ' ');
          description = `Shared knowledge collection for ${displayName}`;
        } else if (collectionName.includes('_knowledge_')) {
          type = 'personal';
          displayName = collectionName.replace('vexel_knowledge_', '').replace(/_/g, ' ');
          description = `Personal knowledge collection for ${displayName}`;
        } else if (collectionName === 'vexel_knowledge_base') {
          type = 'unified';
          displayName = 'Main Knowledge Base';
          description = 'Unified collection containing all user knowledge';
        }

        return {
          id: collectionName,
          name: displayName,
          description,
          type,
          fileCount: 0, // Will be populated by separate API calls if needed
          totalSize: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          permissions: {
            read: true,
            write: collectionName !== 'vexel_knowledge_base', // Main collection is read-only for direct edits
            delete: collectionName !== 'vexel_knowledge_base',
            share: type === 'shared' || type === 'team',
            admin: type === 'personal' || type === 'unified',
          },
          metadata: {
            collection_pattern: this.getCollectionPattern(collectionName),
            backend_name: collectionName,
          },
          user_id: '',
          isDefault: collectionName === 'vexel_knowledge_base',
        } as IKnowledgeCollection;
      });

      // Sort collections: default first, then by type, then by name
      return collections.sort((a, b) => {
        if (a.isDefault) return -1;
        if (b.isDefault) return 1;
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.name.localeCompare(b.name);
      });
    }

    return [];
  },

  /**
   * Helper method to determine collection pattern
   */
  getCollectionPattern(collectionName: string): string {
    if (collectionName.startsWith('vexel_team_')) return 'team';
    if (collectionName.startsWith('vexel_memory_')) return 'memory';
    if (collectionName.startsWith('vexel_shared_')) return 'shared';
    if (collectionName.startsWith('vexel_knowledge_')) return 'knowledge';
    return 'unified';
  },

  /**
   * Get collection details with files
   */
  async getCollectionDetails(
    token: string,
    collectionId: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<ICollectionDetailsResponse> {
    // Get all knowledge items
    const listResponse = await this.getKnowledgeList(token, page, perPage);

    // Filter items by collection based on metadata
    let filteredItems = listResponse.items;

    if (collectionId !== 'vexel_knowledge_base' && collectionId !== 'all') {
      // For specific collections, filter by collection metadata
      // This is a placeholder - in the future, the backend should support collection-specific queries
      filteredItems = listResponse.items.filter(item => {
        // Check if item belongs to this collection based on metadata or naming patterns
        if (item.collection_name === collectionId) return true;

        // For team collections, check if the item has team metadata
        if (collectionId.includes('_team_') && item.metadata?.team_collection === collectionId) return true;

        // For memory collections, check if the item has memory metadata
        if (collectionId.includes('_memory_') && item.metadata?.memory_collection === collectionId) return true;

        // For shared collections, check if the item has shared metadata
        if (collectionId.includes('_shared_') && item.metadata?.shared_collection === collectionId) return true;

        return false;
      });
    }

    // Get collection info
    const collections = await this.getCollectionsList(token);
    const collection = collections.find(c => c.id === collectionId);

    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    // Update collection with actual file counts
    const updatedCollection = {
      ...collection,
      fileCount: filteredItems.length,
      totalSize: filteredItems.reduce((sum, item) => sum + (item.file_size_bytes || 0), 0),
    };

    return {
      collection: updatedCollection,
      items: filteredItems,
      pagination: {
        page: listResponse.page,
        per_page: listResponse.per_page,
        total: filteredItems.length,
        total_pages: Math.ceil(filteredItems.length / listResponse.per_page),
      },
    };
  },

  /**
   * Create a new collection
   */
  async createCollection(
    token: string,
    request: ICollectionCreateRequest
  ): Promise<IKnowledgeCollection> {
    // Generate collection name based on type and name
    const collectionName = this.generateCollectionName(request.type, request.name);

    // Use the existing knowledge/create endpoint to create a collection
    const response = await fetch(`${apiCore.url}/knowledge/create`, {
      method: "POST",
      headers: apiCore.headers(token),
      body: JSON.stringify({
        knowledge_type: "text",
        name: collectionName,
        content: [
          `Collection: ${request.name}`,
          `Description: ${request.description || 'No description provided'}`,
          `Type: ${request.type}`,
          `Created: ${new Date().toISOString()}`,
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to create collection: ${response.statusText}`);
    }

    const data = await response.json();

    // Return the created collection in the expected format
    return {
      id: collectionName,
      name: request.name,
      description: request.description || '',
      type: request.type,
      fileCount: 1, // Initial metadata document
      totalSize: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      permissions: {
        read: true,
        write: true,
        delete: true,
        share: request.type === 'shared' || request.type === 'team',
        admin: true,
      },
      workspace: request.workspace,
      metadata: {
        ...request.metadata,
        backend_name: collectionName,
        collection_pattern: request.type,
        created_via_frontend: true,
      },
      user_id: '',
    };
  },

  /**
   * Generate collection name based on type and name
   */
  generateCollectionName(type: string, name: string): string {
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');

    switch (type) {
      case 'team':
        return `vexel_team_${sanitizedName}`;
      case 'memory':
        return `vexel_memory_${sanitizedName}`;
      case 'shared':
        return `vexel_shared_${sanitizedName}`;
      case 'personal':
        return `vexel_knowledge_${sanitizedName}`;
      default:
        return `vexel_knowledge_${sanitizedName}`;
    }
  },

  /**
   * Update collection metadata
   */
  async updateCollection(
    token: string,
    collectionId: string,
    request: ICollectionUpdateRequest
  ): Promise<IKnowledgeCollection> {
    // For now, this is a placeholder since the backend doesn't have this endpoint yet
    // In the future, this should call a dedicated update endpoint

    // Get current collection
    const collections = await this.getCollectionsList(token);
    const collection = collections.find(c => c.id === collectionId);

    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    // Return updated collection (simulated)
    return {
      ...collection,
      name: request.name || collection.name,
      description: request.description || collection.description,
      metadata: { ...collection.metadata, ...request.metadata },
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Delete a collection
   */
  async deleteCollection(
    token: string,
    collectionId: string
  ): Promise<{ message: string; status: string }> {
    // For now, this is a placeholder since the backend doesn't have this endpoint yet
    // In the future, this should call a dedicated delete endpoint

    return {
      message: `Collection ${collectionId} deletion requested`,
      status: "success"
    };
  },

  /**
   * Move file to different collection
   */
  async moveFile(
    token: string,
    request: IFileMoveRequest
  ): Promise<{ message: string; status: string }> {
    // For now, this is a placeholder since the backend doesn't have this endpoint yet
    // In the future, this should call a dedicated move endpoint

    return {
      message: `File ${request.file_id} moved to collection ${request.target_collection_id}`,
      status: "success"
    };
  },

  /**
   * Move multiple files to different collection
   */
  async bulkMoveFiles(
    token: string,
    request: IBulkFileMoveRequest
  ): Promise<{ message: string; status: string; moved_count: number }> {
    // For now, this is a placeholder since the backend doesn't have this endpoint yet
    // In the future, this should call a dedicated bulk move endpoint

    return {
      message: `${request.file_ids.length} files moved to collection ${request.target_collection_id}`,
      status: "success",
      moved_count: request.file_ids.length
    };
  },

  // ===== WORKSPACE MANAGEMENT =====

  /**
   * Get workspaces list
   */
  async getWorkspacesList(token: string): Promise<IWorkspace[]> {
    // For now, this is a placeholder since the backend doesn't have this endpoint yet
    // Return a default personal workspace
    return [
      {
        id: 'personal',
        name: 'Personal Workspace',
        description: 'Your personal knowledge workspace',
        type: 'personal' as any,
        collections: [],
        members: [],
        createdAt: new Date().toISOString(),
        settings: {
          default_collection_type: 'personal' as any,
          auto_categorization: true,
          shared_access: false,
        },
        metadata: {},
        owner_id: '',
      }
    ];
  },

  /**
   * Create a new workspace
   */
  async createWorkspace(
    token: string,
    request: IWorkspaceCreateRequest
  ): Promise<IWorkspace> {
    // For now, this is a placeholder since the backend doesn't have this endpoint yet
    return {
      id: `workspace_${Date.now()}`,
      name: request.name,
      description: request.description || '',
      type: request.type,
      collections: [],
      members: [],
      createdAt: new Date().toISOString(),
      settings: {
        default_collection_type: 'personal' as any,
        auto_categorization: true,
        shared_access: false,
        ...request.settings,
      },
      metadata: {},
      owner_id: '',
    };
  },

  /**
   * Update workspace
   */
  async updateWorkspace(
    token: string,
    workspaceId: string,
    request: IWorkspaceUpdateRequest
  ): Promise<IWorkspace> {
    // For now, this is a placeholder since the backend doesn't have this endpoint yet
    const workspaces = await this.getWorkspacesList(token);
    const workspace = workspaces.find(w => w.id === workspaceId);

    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    return {
      ...workspace,
      name: request.name || workspace.name,
      description: request.description || workspace.description,
      settings: { ...workspace.settings, ...request.settings },
    };
  },

  /**
   * Delete workspace
   */
  async deleteWorkspace(
    token: string,
    workspaceId: string
  ): Promise<{ message: string; status: string }> {
    // For now, this is a placeholder since the backend doesn't have this endpoint yet
    return {
      message: `Workspace ${workspaceId} deletion requested`,
      status: "success"
    };
  },

  /**
   * Bulk delete knowledge items
   */
  async bulkDeleteKnowledge(
    token: string,
    request: IKnowledgeBulkDeleteRequest
  ): Promise<IKnowledgeBulkDeleteResponse> {
    const response = await fetch(`${apiCore.url}/agents/knowledge/bulk-delete`, {
      method: "POST",
      headers: apiCore.headers(token),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Bulk delete failed: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Export knowledge items
   */
  async exportKnowledge(
    token: string,
    request: IKnowledgeExportRequest
  ): Promise<IKnowledgeExportResponse> {
    const response = await fetch(`${apiCore.url}/knowledge/export`, {
      method: "POST",
      headers: apiCore.headers(token),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Export failed: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Upload file with progress tracking
   */
  async uploadFileWithProgress(
    token: string,
    data: IKnowledgeUploadRequest,
    onProgress?: (progress: number) => void
  ): Promise<IKnowledgeUploadResponse> {
    if (!data.file) {
      throw new Error("File is required for file upload");
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.detail || `Upload failed: ${xhr.statusText}`));
          } catch {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was cancelled'));
      });

      const formData = new FormData();
      formData.append("file", data.file);
      if (data.title) formData.append("title", data.title);
      if (data.description) formData.append("description", data.description);
      if (data.category) formData.append("category", data.category);
      if (data.tags) formData.append("tags", data.tags);

      xhr.open('POST', `${apiCore.url}/knowledge/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      
      xhr.send(formData);
    });
  },
};
