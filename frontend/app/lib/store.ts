import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  REHYDRATE,
  PERSIST,
  PURGE,
  REGISTER,
  persistReducer,
  createTransform,
} from "redux-persist";
import authReducer from "./slices/authSlice";
import toastsReducer from "./slices/toastsSlice";
import tokensReducer from "./slices/tokensSlice";
import agentReducer from "./slices/agentSlice";
import chatReducer from "./slices/chatSlice";
import workflowReducer from "./slices/workflowSlice";
import knowledgeReducer from "./slices/knowledgeSlice";
import storage from "./storage";

const reducers = combineReducers({
  auth: authReducer,
  toasts: toastsReducer,
  tokens: tokensReducer,
  agent: agentReducer,
  chat: chatReducer,
  workflow: workflowReducer,
  knowledge: knowledgeReducer,
});

// Transform to exclude loading states from persistence
const excludeLoadingTransform = createTransform(
  // Transform state on its way to being serialized and persisted
  (inboundState: any, key) => {
    if (key === 'agent' || key === 'chat' || key === 'workflow' || key === 'knowledge') {
      // Remove loading states before persisting
      const { loading, ...stateWithoutLoading } = inboundState;
      return stateWithoutLoading;
    }
    return inboundState;
  },
  // Transform state being rehydrated
  (outboundState: any, key) => {
    if (key === 'agent' || key === 'chat' || key === 'workflow' || key === 'knowledge') {
      // Add back default loading states when rehydrating
      return {
        ...outboundState,
        loading: {
          agents: false,
          sessions: false,
          metrics: false,
          creating: false,
          updating: false,
          deleting: false,
          // Add other loading states as needed
          ...(key === 'chat' && {
            conversations: false,
            messages: false,
            sending: false,
          }),
          ...(key === 'workflow' && {
            templates: false,
            executions: false,
            executing: false,
          }),
          ...(key === 'knowledge' && {
            collections: false,
            items: false,
            uploading: false,
            processing: false,
          }),
        },
      };
    }
    return outboundState;
  }
);

const persistConfig = {
  key: "root",
  storage,
  transforms: [excludeLoadingTransform],
};

const persistedReducer = persistReducer(persistConfig, reducers);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {auth: AuthState, toasts: ToastsState, tokens: TokensState}
export type AppDispatch = typeof store.dispatch;
