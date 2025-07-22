"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import {
  fetchMessages,
  sendMessage,
  sendChatMessage,
  sendStreamingChatMessage,
  createConversation,
  setCurrentConversation,
  addOptimisticMessage,
  setIsTyping,
  setStreamingMessage,
  addStreamingChunk,
  clearStreamingMessage,
  resetChatState,
  createFeedback,
  selectCurrentConversation,
  selectCurrentMessages,
  selectIsTyping,
  selectStreamingMessage,
  selectChatLoading,
} from "@/app/lib/slices/chatSlice";
import {
  selectAgentById,
} from "@/app/lib/slices/agentSlice";
import { token as selectToken } from "@/app/lib/slices/tokensSlice";
import {
  IChatConversation,
  IMessage,
  IMessageContent,
  IMessageCreate,
  MessageRole,
  MessageType,
} from "@/app/lib/interfaces";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import LoadingSpinner from "../ui/LoadingSpinner";
import EmptyState from "../ui/EmptyState";
import {
  CpuChipIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";

// Utility function to generate conversation ID
const generateConversationId = () => `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

interface ChatInterfaceProps {
  agentId?: string;
  conversationId?: string;
  onConversationChange?: (conversation: IChatConversation | null) => void;
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  agentId,
  conversationId,
  onConversationChange,
  className = ""
}) => {
  const dispatch = useAppDispatch();
  const currentConversation = useAppSelector(selectCurrentConversation);
  const messages = useAppSelector(selectCurrentMessages);
  const isTyping = useAppSelector(selectIsTyping);
  const streamingMessage = useAppSelector(selectStreamingMessage);
  const loading = useAppSelector(selectChatLoading);
  const agents = useAppSelector((state: any) => state.agent.agents);
  const authToken = useAppSelector(selectToken);

  // Get agent information
  const currentAgent = useAppSelector((state) =>
    currentConversation?.agent_id
      ? selectAgentById(state, currentConversation.agent_id)
      : null
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Initialize conversation
  useEffect(() => {
    const initializeChat = async () => {
      console.log('🚀 ChatInterface: Initializing chat with:', { conversationId, agentId, currentConversation: !!currentConversation, authToken: !!authToken });

      // Reset chat state when conversation changes
      dispatch(resetChatState());

      if (conversationId && !currentConversation) {
        // Load existing conversation
        console.log('🔄 ChatInterface: Loading conversation from ID:', conversationId);
        try {
          // Try to load conversation from backend
          if (authToken) {
            console.log('🔄 ChatInterface: Fetching conversation from backend...');
            // Import chatAPI dynamically to avoid circular imports
            const { chatAPI } = await import('@/app/lib/api/chat');
            const conversation = await chatAPI.getConversation(conversationId, authToken);

            console.log('🎯 ChatInterface: Loaded conversation from backend:', conversation);
            dispatch(setCurrentConversation(conversation));

            // Load messages for this conversation
            dispatch(fetchMessages({ conversationId, page: 1, pageSize: 50 }));
          } else {
            throw new Error('No authentication token');
          }
        } catch (error) {
          console.error("Failed to load conversation from backend:", error);

          // Fallback to mock conversation
          console.log('🔄 ChatInterface: Creating fallback mock conversation...');
          const defaultAgentId = agents && agents.length > 0 ? agents[0].id : "unknown";

          const mockConversation = {
            id: conversationId,
            conversation_id: conversationId,
            title: "Loading...",
            agent_id: defaultAgentId,
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          console.log('🎯 ChatInterface: Setting fallback mock conversation:', mockConversation);
          dispatch(setCurrentConversation(mockConversation));
        }
      } else if (agentId && !currentConversation && !conversationId) {
        // Create new conversation with agent
        try {
          const newConversation = await dispatch(createConversation({
            conversation_id: generateConversationId(),
            agent_id: agentId,
            title: "New Conversation",
          })).unwrap();
          
          if (onConversationChange) {
            onConversationChange(newConversation);
          }
        } catch (error) {
          console.error("Failed to create conversation:", error);
        }
      }
      setIsInitialized(true);
    };

    if (!isInitialized) {
      initializeChat();
    }
  }, [agentId, conversationId, isInitialized, authToken]);

  // Load messages when conversation changes
  useEffect(() => {
    console.log('🔄 ChatInterface: Messages useEffect triggered:', {
      currentConversation: !!currentConversation,
      isInitialized,
      conversationId: currentConversation?.conversation_id
    });

    if (currentConversation && isInitialized) {
      console.log('🔄 ChatInterface: Dispatching fetchMessages for:', currentConversation.conversation_id);
      dispatch(fetchMessages({
        conversationId: currentConversation.conversation_id
      }));
    }
  }, [currentConversation, dispatch, isInitialized]);

  // Handle sending message
  const handleSendMessage = async (content: IMessageContent[], rawContent: string) => {
    if (!currentConversation) {
      console.error("Missing conversation");
      return;
    }

    // Get agent ID from conversation or first available agent
    const agentId = currentConversation.agent_id;
    if (!agentId || agentId === "unknown") {
      console.error("Invalid agent ID");
      return;
    }

    // Create optimistic user message
    const optimisticMessage: IMessage = {
      message_id: `temp-${Date.now()}`,
      conversation_id: currentConversation.conversation_id,
      role: "user" as MessageRole,
      content,
      raw_content: rawContent,
      timestamp: new Date().toISOString(),
      tokens_used: 0,
      response_time: 0,
      tool_calls: [],
      is_edited: false,
      metadata: {},
    };

    // Add optimistic user message to UI
    dispatch(addOptimisticMessage({
      conversationId: currentConversation.conversation_id,
      message: optimisticMessage,
    }));

    try {
      console.log("🚀 Sending chat message to AI...");

      // For now, use non-streaming chat until we debug streaming issues
      await dispatch(sendChatMessage({
        conversationId: currentConversation.conversation_id,
        agentId: agentId,
        message: rawContent,
        context: {
          conversation_title: currentConversation.title,
          conversation_description: currentConversation.description,
        }
      })).unwrap();

      console.log("✅ Chat message sent successfully");

    } catch (error) {
      console.error("❌ Failed to send chat message:", error);
      dispatch(setIsTyping(false));
    }
  };

  // Handle message feedback
  const handleMessageFeedback = async (messageId: string, rating: number, feedback?: string) => {
    if (!currentConversation) return;

    try {
      await dispatch(createFeedback({
        conversation_id: currentConversation.conversation_id,
        message_id: messageId,
        rating,
        feedback,
        feedback_type: rating >= 4 ? "positive" : "negative",
      })).unwrap();
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  // Handle message copy
  const handleMessageCopy = (content: string) => {
    // Already handled in MessageBubble component
  };

  // Handle message retry
  const handleMessageRetry = (messageId: string) => {
    // TODO: Implement message retry
    console.log("Retry message:", messageId);
  };

  if (!isMounted) {
    return null; // Return null during SSR to prevent hydration mismatch
  }

  if (!isInitialized) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Chat</h3>
          <p className="text-gray-500">Preparing your conversation...</p>
        </div>
      </div>
    );
  }

  if (!currentConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          title="No conversation selected"
          description="Select a conversation from the sidebar or start a new one."
          icon="search"
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <CpuChipIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {currentConversation.title || "Untitled Conversation"}
              </h1>
              <p className="text-sm text-gray-500">
                {currentAgent ? (
                  <>
                    <span className="font-medium text-indigo-600">{currentAgent.name}</span>
                    <span className="mx-1">•</span>
                    <span className="capitalize">{currentAgent.agent_type}</span>
                    {currentAgent.description && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{currentAgent.description}</span>
                      </>
                    )}
                  </>
                ) : (
                  currentConversation.description || "AI Assistant"
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => dispatch(resetChatState())}
              className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
              title="Reset Chat State (Debug)"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              title="Conversation info"
            >
              <InformationCircleIcon className="h-5 w-5" />
            </button>
            <button
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              title="Settings"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>
            <button
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              title="Share conversation"
            >
              <ShareIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading.messages && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <EmptyState
              title="Start the conversation"
              description="Send a message to begin chatting with the AI assistant."
              icon="add"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.message_id}
                message={message}
                onFeedback={handleMessageFeedback}
                onCopy={handleMessageCopy}
                onRetry={handleMessageRetry}
              />
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <MessageBubble
                message={{
                  message_id: "typing",
                  conversation_id: currentConversation.conversation_id,
                  role: "assistant",
                  content: [{
                    type: "text",
                    text: "Typing...",
                    metadata: {},
                  }],
                  raw_content: "Typing...",
                  timestamp: new Date().toISOString(),
                  tokens_used: 0,
                  response_time: 0,
                  tool_calls: [],
                  is_edited: false,
                  metadata: {},
                }}
                isStreaming={true}
              />
            )}

            {/* Streaming message */}
            {streamingMessage && (
              <MessageBubble
                message={{
                  message_id: "streaming",
                  conversation_id: currentConversation.conversation_id,
                  role: "assistant",
                  content: [{
                    type: "text",
                    text: streamingMessage,
                    metadata: {},
                  }],
                  raw_content: streamingMessage,
                  timestamp: new Date().toISOString(),
                  tokens_used: 0,
                  response_time: 0,
                  tool_calls: [],
                  is_edited: false,
                  metadata: {},
                }}
                isStreaming={true}
              />
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={loading.sending || isTyping}
        placeholder="Type your message..."
        allowAttachments={true}
        allowVoice={false}
      />
    </div>
  );
};

export default ChatInterface;
