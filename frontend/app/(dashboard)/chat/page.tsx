"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import {
  createConversation,
  setCurrentConversation,
  selectCurrentConversation,
} from "@/app/lib/slices/chatSlice";
import {
  fetchAgents,
  selectAgents,
} from "@/app/lib/slices/agentSlice";
import {
  IChatConversation,
  IChatConversationCreate,
} from "@/app/lib/interfaces";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

// Dynamic imports to prevent hydration mismatch
const ConversationList = dynamic(() => import("@/app/components/chat/ConversationList"), {
  ssr: false,
  loading: () => <div className="w-80 flex-shrink-0 bg-gray-50 animate-pulse"></div>
});

const ChatInterface = dynamic(() => import("@/app/components/chat/ChatInterface"), {
  ssr: false
});
import {
  PlusIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";

// Utility function to generate conversation ID
const generateConversationId = () => `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const ChatPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  
  const currentConversation = useAppSelector(selectCurrentConversation);
  const agents = useAppSelector(selectAgents);

  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [conversationTitle, setConversationTitle] = useState("");
  const [conversationDescription, setConversationDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Get agent ID from URL params (only on client to prevent hydration mismatch)
  const agentIdFromUrl = isMounted ? searchParams.get("agent") : null;
  const conversationIdFromUrl = isMounted ? searchParams.get("conversation") : null;

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load agents on mount
  useEffect(() => {
    dispatch(fetchAgents({ status: "active" }));
  }, [dispatch]);

  // Handle URL parameters
  useEffect(() => {
    if (agentIdFromUrl && !currentConversation) {
      // Auto-create conversation with specified agent
      handleCreateConversationWithAgent(agentIdFromUrl);
    } else if (conversationIdFromUrl && !currentConversation) {
      // Load existing conversation from URL
      // For now, we'll let ChatInterface handle the conversation loading
      // TODO: Implement getConversation API call if needed
      console.log('Loading conversation from URL:', conversationIdFromUrl);
    }
  }, [agentIdFromUrl, conversationIdFromUrl, currentConversation]);

  // Handle conversation selection
  const handleSelectConversation = (conversation: IChatConversation) => {
    console.log('🎯 ChatPage: Handling conversation selection:', conversation);
    dispatch(setCurrentConversation(conversation));

    // Update URL
    const params = new URLSearchParams();
    params.set("conversation", conversation.conversation_id);
    console.log('🎯 ChatPage: Navigating to:', `/chat?${params.toString()}`);
    router.push(`/chat?${params.toString()}`);
  };

  // Handle new conversation
  const handleNewConversation = () => {
    setShowNewConversationModal(true);
    setSelectedAgentId(agentIdFromUrl || "");
    setConversationTitle("");
    setConversationDescription("");
  };

  // Create conversation with specific agent
  const handleCreateConversationWithAgent = async (agentId: string) => {
    setIsCreating(true);
    try {
      const conversationData: IChatConversationCreate = {
        conversation_id: generateConversationId(),
        agent_id: agentId,
        title: "New Conversation",
      };

      const newConversation = await dispatch(createConversation(conversationData)).unwrap();
      
      // Update URL
      const params = new URLSearchParams();
      params.set("conversation", newConversation.conversation_id);
      router.push(`/chat?${params.toString()}`);
      
    } catch (error) {
      console.error("Failed to create conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle modal form submission
  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAgentId) return;

    setIsCreating(true);
    try {
      const conversationData: IChatConversationCreate = {
        conversation_id: generateConversationId(),
        agent_id: selectedAgentId,
        title: conversationTitle || "New Conversation",
        description: conversationDescription || undefined,
      };

      const newConversation = await dispatch(createConversation(conversationData)).unwrap();
      
      setShowNewConversationModal(false);
      
      // Update URL
      const params = new URLSearchParams();
      params.set("conversation", newConversation.conversation_id);
      router.push(`/chat?${params.toString()}`);
      
    } catch (error) {
      console.error("Failed to create conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle conversation change from ChatInterface
  const handleConversationChange = (conversation: IChatConversation | null) => {
    if (conversation) {
      const params = new URLSearchParams();
      params.set("conversation", conversation.conversation_id);
      router.push(`/chat?${params.toString()}`);
    }
  };

  const activeAgents = agents.filter(agent => agent.status === "active");

  return (
    <>
      {/* Chat Interface - Full viewport within dashboard layout */}
      <div className="fixed inset-0 lg:left-72 top-16 bg-white flex">
        {/* Sidebar - Conversation List */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200">
          <ConversationList
            onSelectConversation={handleSelectConversation}
            onCreateConversation={handleNewConversation}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {!isMounted ? (
            /* Loading during hydration */
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : currentConversation || agentIdFromUrl || conversationIdFromUrl ? (
            <ChatInterface
              agentId={agentIdFromUrl || undefined}
              conversationId={conversationIdFromUrl || undefined}
              onConversationChange={handleConversationChange}
            />
          ) : (
            /* Welcome Screen */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChatBubbleLeftRightIcon className="h-8 w-8 text-rose-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Choose an AI Agent to Start
                </h2>

                <p className="text-gray-600 mb-6">
                  Every conversation requires an AI agent. Select an agent below or create a new conversation with agent selection.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleNewConversation}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Choose Agent & Start Chat
                  </button>

                  {activeAgents.length > 0 && (
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Quick start with your agents:
                      </p>
                      <div className="space-y-2">
                        {activeAgents.slice(0, 3).map((agent) => (
                          <button
                            key={agent.id}
                            onClick={() => handleCreateConversationWithAgent(agent.id)}
                            disabled={isCreating}
                            className="w-full flex items-center p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          >
                            <div className="w-8 h-8 bg-gradient-to-br from-rose-100 to-pink-100 rounded-lg flex items-center justify-center mr-3">
                              <CpuChipIcon className="h-4 w-4 text-rose-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {agent.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {agent.description || "AI Assistant"}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      <Dialog open={showNewConversationModal} onOpenChange={setShowNewConversationModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateConversation} className="space-y-4 mt-4">
            {/* Agent Selection */}
            <div>
              <label htmlFor="agent" className="block text-sm font-medium text-gray-700 mb-1">
                Select Agent *
              </label>
              <select
                id="agent"
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Choose an agent...</option>
                {activeAgents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} - {agent.agent_type}
                  </option>
                ))}
              </select>
            </div>

            {/* Conversation Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Conversation Title
              </label>
              <input
                type="text"
                id="title"
                value={conversationTitle}
                onChange={(e) => setConversationTitle(e.target.value)}
                placeholder="Enter conversation title..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={conversationDescription}
                onChange={(e) => setConversationDescription(e.target.value)}
                placeholder="Describe the purpose of this conversation..."
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowNewConversationModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!selectedAgentId || isCreating}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  "Start Conversation"
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatPage;
