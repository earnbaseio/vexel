/**
 * Redux slice for Knowledge Management
 */

import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
} from "@reduxjs/toolkit";
import {
  IKnowledgeItem,
  IKnowledgeUploadRequest,
  IKnowledgeUploadResponse,
  IKnowledgeTextUploadRequest,
  IKnowledgeUrlUploadRequest,
  IKnowledgeSearchRequest,
  IKnowledgeState,
  IKnowledgeUploadProgress,
  KnowledgeCategory,
  KnowledgeFileType,
  // Collections and Workspace interfaces
  IKnowledgeCollection,
  ICollectionCreateRequest,
  ICollectionUpdateRequest,
  ICollectionDetailsResponse,
  IWorkspace,
  IWorkspaceCreateRequest,
  IWorkspaceUpdateRequest,
} from "../interfaces";
import { knowledgeAPI } from "../api";
import { RootState } from "../store";
import { addNotice } from "./toastsSlice";

// Helper function to get a valid token (refresh if needed)
async function getValidToken(getState: () => RootState, dispatch: any): Promise<string> {
  const state = getState();
  let token = state.tokens.access_token;

  if (!token) {
    throw new Error("No access token available");
  }

  // Check if token is expired and refresh if needed
  const { tokenExpired } = await import('../utilities');
  if (tokenExpired(token)) {
    console.log("🔄 Token expired, attempting refresh...");
    try {
      const { refreshTokens } = await import('./tokensSlice');
      await dispatch(refreshTokens());

      // Get the refreshed token
      const newState = getState();
      token = newState.tokens.access_token;

      if (!token) {
        throw new Error("Failed to refresh token - no token after refresh");
      }

      console.log("✅ Token refreshed successfully");
    } catch (error) {
      console.error("❌ Token refresh failed:", error);
      // If refresh fails, the user needs to login again
      throw new Error("Token expired and refresh failed. Please login again.");
    }
  }

  return token;
}

// Async thunks for knowledge operations

// Upload file for knowledge processing
export const uploadKnowledgeFile = createAsyncThunk(
  "knowledge/uploadFile",
  async (
    data: IKnowledgeUploadRequest,
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const token = await getValidToken(getState as () => RootState, dispatch);
      
      // Create progress tracking
      const fileName = data.file?.name || 'unknown';
      dispatch(setUploadProgress({ 
        fileName, 
        progress: { 
          file_name: fileName, 
          progress: 0, 
          status: 'uploading' 
        } 
      }));

      const response = await knowledgeAPI.uploadFileWithProgress(
        token,
        data,
        (progress) => {
          dispatch(setUploadProgress({ 
            fileName, 
            progress: { 
              file_name: fileName, 
              progress, 
              status: 'uploading' 
            } 
          }));
        }
      );

      // Update progress to processing
      dispatch(setUploadProgress({ 
        fileName, 
        progress: { 
          file_name: fileName, 
          progress: 100, 
          status: 'processing' 
        } 
      }));

      // Show success notification
      dispatch(addNotice({
        title: "Upload Successful",
        content: `File "${fileName}" has been uploaded and is being processed.`,
        type: "success",
      }));

      // Mark as completed
      dispatch(setUploadProgress({ 
        fileName, 
        progress: { 
          file_name: fileName, 
          progress: 100, 
          status: 'completed' 
        } 
      }));

      return response;
    } catch (error: any) {
      const fileName = data.file?.name || 'unknown';
      
      // Update progress to error
      dispatch(setUploadProgress({ 
        fileName, 
        progress: { 
          file_name: fileName, 
          progress: 0, 
          status: 'error',
          error_message: error.message 
        } 
      }));

      dispatch(addNotice({
        title: "Upload Failed",
        content: error.message || "Failed to upload file",
        type: "error",
      }));

      return rejectWithValue(error.message);
    }
  }
);

// Upload text content
export const uploadKnowledgeText = createAsyncThunk(
  "knowledge/uploadText",
  async (
    data: IKnowledgeTextUploadRequest,
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const token = await getValidToken(getState as () => RootState, dispatch);
      const response = await knowledgeAPI.uploadText(token, data);

      dispatch(addNotice({
        title: "Text Upload Successful",
        content: `Text content "${data.title}" has been uploaded successfully.`,
        type: "success",
      }));

      return response;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Text Upload Failed",
        content: error.message || "Failed to upload text content",
        type: "error",
      }));

      return rejectWithValue(error.message);
    }
  }
);

// Upload URL content
export const uploadKnowledgeUrl = createAsyncThunk(
  "knowledge/uploadUrl",
  async (
    data: IKnowledgeUrlUploadRequest,
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const token = await getValidToken(getState as () => RootState, dispatch);
      const response = await knowledgeAPI.uploadUrl(token, data);

      dispatch(addNotice({
        title: "URL Upload Successful",
        content: `URL content "${data.title}" has been uploaded successfully.`,
        type: "success",
      }));

      return response;
    } catch (error: any) {
      dispatch(addNotice({
        title: "URL Upload Failed",
        content: error.message || "Failed to upload URL content",
        type: "error",
      }));

      return rejectWithValue(error.message);
    }
  }
);

// Get knowledge list
export const getKnowledgeList = createAsyncThunk(
  "knowledge/getList",
  async (
    { page = 1, perPage = 20 }: { page?: number; perPage?: number },
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const token = await getValidToken(getState as () => RootState, dispatch);
      const response = await knowledgeAPI.getKnowledgeList(token, page, perPage);
      return response;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Failed to Load Knowledge",
        content: error.message || "Failed to load knowledge list",
        type: "error",
      }));

      return rejectWithValue(error.message);
    }
  }
);

// Search knowledge
export const searchKnowledge = createAsyncThunk(
  "knowledge/search",
  async (
    searchRequest: IKnowledgeSearchRequest,
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const token = await getValidToken(getState as () => RootState, dispatch);
      const response = await knowledgeAPI.searchKnowledge(token, searchRequest);
      return response;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Search Failed",
        content: error.message || "Failed to search knowledge",
        type: "error",
      }));

      return rejectWithValue(error.message);
    }
  }
);

// Delete knowledge item
export const deleteKnowledge = createAsyncThunk(
  "knowledge/delete",
  async (
    collectionName: string,
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const token = await getValidToken(getState as () => RootState, dispatch);
      const response = await knowledgeAPI.deleteKnowledge(token, collectionName);

      dispatch(addNotice({
        title: "Knowledge Deleted",
        content: "Knowledge item has been deleted successfully.",
        type: "success",
      }));

      return { collectionName, response };
    } catch (error: any) {
      dispatch(addNotice({
        title: "Delete Failed",
        content: error.message || "Failed to delete knowledge item",
        type: "error",
      }));

      return rejectWithValue(error.message);
    }
  }
);

// ===== COLLECTIONS ASYNC THUNKS =====

// Get collections list
export const getCollectionsList = createAsyncThunk(
  "knowledge/getCollectionsList",
  async (
    _,
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const token = await getValidToken(getState as () => RootState, dispatch);
      const response = await knowledgeAPI.getCollectionsList(token);
      return response;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Failed to Load Collections",
        content: error.message || "Failed to load collections list",
        type: "error",
      }));

      return rejectWithValue(error.message);
    }
  }
);

// Get collection details
export const getCollectionDetails = createAsyncThunk(
  "knowledge/getCollectionDetails",
  async (
    { collectionId, page = 1, perPage = 20 }: { collectionId: string; page?: number; perPage?: number },
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const token = await getValidToken(getState as () => RootState, dispatch);
      const response = await knowledgeAPI.getCollectionDetails(token, collectionId, page, perPage);
      return { collectionId, ...response };
    } catch (error: any) {
      dispatch(addNotice({
        title: "Failed to Load Collection Details",
        content: error.message || "Failed to load collection details",
        type: "error",
      }));

      return rejectWithValue(error.message);
    }
  }
);

// Create collection
export const createCollection = createAsyncThunk(
  "knowledge/createCollection",
  async (
    request: ICollectionCreateRequest,
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const token = await getValidToken(getState as () => RootState, dispatch);
      const response = await knowledgeAPI.createCollection(token, request);

      dispatch(addNotice({
        title: "Collection Created",
        content: `Collection "${request.name}" has been created successfully.`,
        type: "success",
      }));

      return response;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Failed to Create Collection",
        content: error.message || "Failed to create collection",
        type: "error",
      }));

      return rejectWithValue(error.message);
    }
  }
);

// Update collection
export const updateCollection = createAsyncThunk(
  "knowledge/updateCollection",
  async (
    { collectionId, request }: { collectionId: string; request: ICollectionUpdateRequest },
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const token = await getValidToken(getState as () => RootState, dispatch);
      const response = await knowledgeAPI.updateCollection(token, collectionId, request);

      dispatch(addNotice({
        title: "Collection Updated",
        content: `Collection has been updated successfully.`,
        type: "success",
      }));

      return response;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Failed to Update Collection",
        content: error.message || "Failed to update collection",
        type: "error",
      }));

      return rejectWithValue(error.message);
    }
  }
);

// Delete collection
export const deleteCollection = createAsyncThunk(
  "knowledge/deleteCollection",
  async (
    collectionId: string,
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const token = await getValidToken(getState as () => RootState, dispatch);
      const response = await knowledgeAPI.deleteCollection(token, collectionId);

      dispatch(addNotice({
        title: "Collection Deleted",
        content: "Collection has been deleted successfully.",
        type: "success",
      }));

      return { collectionId, response };
    } catch (error: any) {
      dispatch(addNotice({
        title: "Failed to Delete Collection",
        content: error.message || "Failed to delete collection",
        type: "error",
      }));

      return rejectWithValue(error.message);
    }
  }
);

// ===== WORKSPACE ASYNC THUNKS =====

// Get workspaces list
export const getWorkspacesList = createAsyncThunk(
  "knowledge/getWorkspacesList",
  async (
    _,
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const token = await getValidToken(getState as () => RootState, dispatch);
      const response = await knowledgeAPI.getWorkspacesList(token);
      return response;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Failed to Load Workspaces",
        content: error.message || "Failed to load workspaces list",
        type: "error",
      }));

      return rejectWithValue(error.message);
    }
  }
);

// Create workspace
export const createWorkspace = createAsyncThunk(
  "knowledge/createWorkspace",
  async (
    request: IWorkspaceCreateRequest,
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const token = await getValidToken(getState as () => RootState, dispatch);
      const response = await knowledgeAPI.createWorkspace(token, request);

      dispatch(addNotice({
        title: "Workspace Created",
        content: `Workspace "${request.name}" has been created successfully.`,
        type: "success",
      }));

      return response;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Failed to Create Workspace",
        content: error.message || "Failed to create workspace",
        type: "error",
      }));

      return rejectWithValue(error.message);
    }
  }
);

// Update workspace
export const updateWorkspace = createAsyncThunk(
  "knowledge/updateWorkspace",
  async (
    { workspaceId, request }: { workspaceId: string; request: IWorkspaceUpdateRequest },
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const token = await getValidToken(getState as () => RootState, dispatch);
      const response = await knowledgeAPI.updateWorkspace(token, workspaceId, request);

      dispatch(addNotice({
        title: "Workspace Updated",
        content: `Workspace has been updated successfully.`,
        type: "success",
      }));

      return response;
    } catch (error: any) {
      dispatch(addNotice({
        title: "Failed to Update Workspace",
        content: error.message || "Failed to update workspace",
        type: "error",
      }));

      return rejectWithValue(error.message);
    }
  }
);

// Delete workspace
export const deleteWorkspace = createAsyncThunk(
  "knowledge/deleteWorkspace",
  async (
    workspaceId: string,
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const token = await getValidToken(getState as () => RootState, dispatch);
      const response = await knowledgeAPI.deleteWorkspace(token, workspaceId);

      dispatch(addNotice({
        title: "Workspace Deleted",
        content: "Workspace has been deleted successfully.",
        type: "success",
      }));

      return { workspaceId, response };
    } catch (error: any) {
      dispatch(addNotice({
        title: "Failed to Delete Workspace",
        content: error.message || "Failed to delete workspace",
        type: "error",
      }));

      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState: IKnowledgeState = {
  // Existing file management
  items: [],
  uploadProgress: {},
  isUploading: false,
  isLoading: false,
  error: null,
  searchResults: [],
  isSearching: false,
  searchError: null,
  pagination: {
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  },

  // Collections state
  collections: [],
  currentCollection: null,
  collectionsLoading: false,
  collectionsError: null,
  collectionDetails: {},

  // Workspace state
  workspaces: [],
  currentWorkspace: null,
  workspacesLoading: false,
  workspacesError: null,
};

// Knowledge slice
const knowledgeSlice = createSlice({
  name: "knowledge",
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
      state.searchError = null;
    },

    // Clear search results
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchError = null;
    },

    // Set upload progress
    setUploadProgress: (
      state,
      action: PayloadAction<{ fileName: string; progress: IKnowledgeUploadProgress }>
    ) => {
      state.uploadProgress[action.payload.fileName] = action.payload.progress;
    },

    // Clear upload progress
    clearUploadProgress: (state, action: PayloadAction<string>) => {
      delete state.uploadProgress[action.payload];
    },

    // Clear all upload progress
    clearAllUploadProgress: (state) => {
      state.uploadProgress = {};
    },

    // Collections actions
    setCurrentCollection: (state, action: PayloadAction<string | null>) => {
      state.currentCollection = action.payload;
    },

    clearCollectionsError: (state) => {
      state.collectionsError = null;
    },

    clearCollectionDetails: (state, action: PayloadAction<string>) => {
      delete state.collectionDetails[action.payload];
    },

    // Workspace actions
    setCurrentWorkspace: (state, action: PayloadAction<string | null>) => {
      state.currentWorkspace = action.payload;
    },

    clearWorkspacesError: (state) => {
      state.workspacesError = null;
    },

    // Reset knowledge state
    resetKnowledgeState: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Upload file
    builder
      .addCase(uploadKnowledgeFile.pending, (state) => {
        state.isUploading = true;
        state.error = null;
      })
      .addCase(uploadKnowledgeFile.fulfilled, (state, action) => {
        state.isUploading = false;
        // Note: We don't add to items here since we need to refresh the list
        // to get the properly formatted knowledge item
      })
      .addCase(uploadKnowledgeFile.rejected, (state, action) => {
        state.isUploading = false;
        state.error = action.payload as string;
      });

    // Upload text
    builder
      .addCase(uploadKnowledgeText.pending, (state) => {
        state.isUploading = true;
        state.error = null;
      })
      .addCase(uploadKnowledgeText.fulfilled, (state) => {
        state.isUploading = false;
      })
      .addCase(uploadKnowledgeText.rejected, (state, action) => {
        state.isUploading = false;
        state.error = action.payload as string;
      });

    // Upload URL
    builder
      .addCase(uploadKnowledgeUrl.pending, (state) => {
        state.isUploading = true;
        state.error = null;
      })
      .addCase(uploadKnowledgeUrl.fulfilled, (state) => {
        state.isUploading = false;
      })
      .addCase(uploadKnowledgeUrl.rejected, (state, action) => {
        state.isUploading = false;
        state.error = action.payload as string;
      });

    // Get knowledge list
    builder
      .addCase(getKnowledgeList.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getKnowledgeList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items;
        state.pagination = {
          page: action.payload.page,
          per_page: action.payload.per_page,
          total: action.payload.total,
          total_pages: action.payload.total_pages,
        };
      })
      .addCase(getKnowledgeList.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Search knowledge
    builder
      .addCase(searchKnowledge.pending, (state) => {
        state.isSearching = true;
        state.searchError = null;
      })
      .addCase(searchKnowledge.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload.items;
      })
      .addCase(searchKnowledge.rejected, (state, action) => {
        state.isSearching = false;
        state.searchError = action.payload as string;
      });

    // Delete knowledge
    builder
      .addCase(deleteKnowledge.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteKnowledge.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove the deleted item from the list
        state.items = state.items.filter(
          item => item.collection_name !== action.payload.collectionName
        );
      })
      .addCase(deleteKnowledge.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Collections reducers
    builder
      .addCase(getCollectionsList.pending, (state) => {
        state.collectionsLoading = true;
        state.collectionsError = null;
      })
      .addCase(getCollectionsList.fulfilled, (state, action) => {
        state.collectionsLoading = false;
        state.collections = action.payload;
      })
      .addCase(getCollectionsList.rejected, (state, action) => {
        state.collectionsLoading = false;
        state.collectionsError = action.payload as string;
      });

    builder
      .addCase(getCollectionDetails.pending, (state) => {
        state.collectionsLoading = true;
        state.collectionsError = null;
      })
      .addCase(getCollectionDetails.fulfilled, (state, action) => {
        state.collectionsLoading = false;
        if (!state.collectionDetails) {
          state.collectionDetails = {};
        }
        state.collectionDetails[action.payload.collectionId] = {
          collection: action.payload.collection,
          items: action.payload.items,
          pagination: action.payload.pagination,
        };
      })
      .addCase(getCollectionDetails.rejected, (state, action) => {
        state.collectionsLoading = false;
        state.collectionsError = action.payload as string;
      });

    builder
      .addCase(createCollection.pending, (state) => {
        state.collectionsLoading = true;
        state.collectionsError = null;
      })
      .addCase(createCollection.fulfilled, (state, action) => {
        state.collectionsLoading = false;
        state.collections.push(action.payload);
      })
      .addCase(createCollection.rejected, (state, action) => {
        state.collectionsLoading = false;
        state.collectionsError = action.payload as string;
      });

    builder
      .addCase(updateCollection.pending, (state) => {
        state.collectionsLoading = true;
        state.collectionsError = null;
      })
      .addCase(updateCollection.fulfilled, (state, action) => {
        state.collectionsLoading = false;
        const index = state.collections.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.collections[index] = action.payload;
        }
      })
      .addCase(updateCollection.rejected, (state, action) => {
        state.collectionsLoading = false;
        state.collectionsError = action.payload as string;
      });

    builder
      .addCase(deleteCollection.pending, (state) => {
        state.collectionsLoading = true;
        state.collectionsError = null;
      })
      .addCase(deleteCollection.fulfilled, (state, action) => {
        state.collectionsLoading = false;
        state.collections = state.collections.filter(c => c.id !== action.payload.collectionId);
        delete state.collectionDetails[action.payload.collectionId];
      })
      .addCase(deleteCollection.rejected, (state, action) => {
        state.collectionsLoading = false;
        state.collectionsError = action.payload as string;
      });

    // Workspace reducers
    builder
      .addCase(getWorkspacesList.pending, (state) => {
        state.workspacesLoading = true;
        state.workspacesError = null;
      })
      .addCase(getWorkspacesList.fulfilled, (state, action) => {
        state.workspacesLoading = false;
        state.workspaces = action.payload;
      })
      .addCase(getWorkspacesList.rejected, (state, action) => {
        state.workspacesLoading = false;
        state.workspacesError = action.payload as string;
      });

    builder
      .addCase(createWorkspace.pending, (state) => {
        state.workspacesLoading = true;
        state.workspacesError = null;
      })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.workspacesLoading = false;
        state.workspaces.push(action.payload);
      })
      .addCase(createWorkspace.rejected, (state, action) => {
        state.workspacesLoading = false;
        state.workspacesError = action.payload as string;
      });

    builder
      .addCase(updateWorkspace.pending, (state) => {
        state.workspacesLoading = true;
        state.workspacesError = null;
      })
      .addCase(updateWorkspace.fulfilled, (state, action) => {
        state.workspacesLoading = false;
        const index = state.workspaces.findIndex(w => w.id === action.payload.id);
        if (index !== -1) {
          state.workspaces[index] = action.payload;
        }
      })
      .addCase(updateWorkspace.rejected, (state, action) => {
        state.workspacesLoading = false;
        state.workspacesError = action.payload as string;
      });

    builder
      .addCase(deleteWorkspace.pending, (state) => {
        state.workspacesLoading = true;
        state.workspacesError = null;
      })
      .addCase(deleteWorkspace.fulfilled, (state, action) => {
        state.workspacesLoading = false;
        state.workspaces = state.workspaces.filter(w => w.id !== action.payload.workspaceId);
      })
      .addCase(deleteWorkspace.rejected, (state, action) => {
        state.workspacesLoading = false;
        state.workspacesError = action.payload as string;
      });
  },
});

// Export actions
export const {
  clearError,
  clearSearchResults,
  setUploadProgress,
  clearUploadProgress,
  clearAllUploadProgress,
  setCurrentCollection,
  clearCollectionsError,
  clearCollectionDetails,
  setCurrentWorkspace,
  clearWorkspacesError,
  resetKnowledgeState,
} = knowledgeSlice.actions;

// Selectors

// Existing knowledge selectors
export const selectKnowledgeItems = (state: RootState) => state.knowledge.items || [];
export const selectKnowledgeLoading = (state: RootState) => state.knowledge.isLoading;
export const selectKnowledgeUploading = (state: RootState) => state.knowledge.isUploading;
export const selectKnowledgeError = (state: RootState) => state.knowledge.error;
export const selectKnowledgeSearchResults = (state: RootState) => state.knowledge.searchResults;
export const selectKnowledgeSearching = (state: RootState) => state.knowledge.isSearching;
export const selectKnowledgeUploadProgress = (state: RootState) => state.knowledge.uploadProgress;
export const selectKnowledgePagination = (state: RootState) => state.knowledge.pagination || { page: 1, per_page: 20, total: 0, total_pages: 0 };

// Collections selectors
export const selectCollections = (state: RootState) => state.knowledge.collections || [];
export const selectCurrentCollection = (state: RootState) => state.knowledge.currentCollection;
export const selectCollectionsLoading = (state: RootState) => state.knowledge.collectionsLoading;
export const selectCollectionsError = (state: RootState) => state.knowledge.collectionsError;
export const selectCollectionDetails = (state: RootState) => state.knowledge.collectionDetails || {};

// Collection-specific selectors
export const selectCollectionById = (collectionId: string) => (state: RootState) =>
  (state.knowledge.collections || []).find(c => c.id === collectionId);

export const selectCollectionDetailsByCollectionId = (collectionId: string) => (state: RootState) =>
  state.knowledge.collectionDetails?.[collectionId] || null;

export const selectCollectionsByType = (type: string) => (state: RootState) =>
  (state.knowledge.collections || []).filter(c => c.type === type);

export const selectDefaultCollection = (state: RootState) =>
  (state.knowledge.collections || []).find(c => c.isDefault);

// Workspace selectors
export const selectWorkspaces = (state: RootState) => state.knowledge.workspaces || [];
export const selectCurrentWorkspace = (state: RootState) => state.knowledge.currentWorkspace;
export const selectWorkspacesLoading = (state: RootState) => state.knowledge.workspacesLoading;
export const selectWorkspacesError = (state: RootState) => state.knowledge.workspacesError;

// Workspace-specific selectors
export const selectWorkspaceById = (workspaceId: string) => (state: RootState) =>
  state.knowledge.workspaces.find(w => w.id === workspaceId);

export const selectWorkspacesByType = (type: string) => (state: RootState) =>
  state.knowledge.workspaces.filter(w => w.type === type);

export const selectPersonalWorkspace = (state: RootState) =>
  state.knowledge.workspaces.find(w => w.type === 'personal');

// Combined selectors
export const selectCurrentCollectionDetails = (state: RootState) => {
  const currentCollectionId = state.knowledge.currentCollection;
  if (!currentCollectionId) return null;
  return state.knowledge.collectionDetails[currentCollectionId];
};

export const selectCurrentWorkspaceCollections = (state: RootState) => {
  const currentWorkspaceId = state.knowledge.currentWorkspace;
  if (!currentWorkspaceId) return state.knowledge.collections || [];

  const workspace = (state.knowledge.workspaces || []).find(w => w.id === currentWorkspaceId);
  if (!workspace) return [];

  return (state.knowledge.collections || []).filter(c =>
    workspace.collections.includes(c.id) || c.workspace === currentWorkspaceId
  );
};

// Statistics selectors
export const selectCollectionsStats = (state: RootState) => {
  const collections = state.knowledge.collections;
  return {
    total: collections.length,
    byType: collections.reduce((acc, collection) => {
      acc[collection.type] = (acc[collection.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    totalFiles: collections.reduce((sum, collection) => sum + collection.fileCount, 0),
    totalSize: collections.reduce((sum, collection) => sum + collection.totalSize, 0),
  };
};

export const selectWorkspacesStats = (state: RootState) => {
  const workspaces = state.knowledge.workspaces;
  return {
    total: workspaces.length,
    byType: workspaces.reduce((acc, workspace) => {
      acc[workspace.type] = (acc[workspace.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    totalCollections: workspaces.reduce((sum, workspace) => sum + workspace.collections.length, 0),
  };
};

export default knowledgeSlice.reducer;
