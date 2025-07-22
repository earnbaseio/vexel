"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";
import {
  fetchConversations,
  setCurrentConversation,
  setConversationFilters,
  setConversationPagination,
  deleteConversation,
  selectConversations,
  selectCurrentConversation,
  selectChatLoading,
  selectConversationFilters,
  selectConversationPagination,
} from "@/app/lib/slices/chatSlice";
import {
  IChatConversation,
} from "@/app/lib/interfaces";
import LoadingSpinner from "../ui/LoadingSpinner";
import EmptyState from "../ui/EmptyState";
import {
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  ArchiveBoxIcon,
  ClockIcon,
  UserIcon,
  CpuChipIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";

interface ConversationListProps {
  onSelectConversation?: (conversation: IChatConversation) => void;
  onCreateConversation?: () => void;
  className?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation,
  onCreateConversation,
  className = ""
}) => {
  const dispatch = useAppDispatch();
  const conversations = useAppSelector(selectConversations);
  const currentConversation = useAppSelector(selectCurrentConversation);
  const loading = useAppSelector(selectChatLoading);
  const filters = useAppSelector(selectConversationFilters);
  const pagination = useAppSelector(selectConversationPagination);

  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load conversations on component mount and when filters change
  useEffect(() => {
    if (!isMounted) return;

    // Use a debounce to prevent too many API calls
    const fetchConversationsDebounced = setTimeout(() => {
      const searchParams = {
        ...filters,
        page: pagination.page,
        page_size: pagination.pageSize,
      };

      if (searchQuery.trim()) {
        searchParams.query = searchQuery.trim();
      }

      console.log('🔄 ConversationList: Fetching conversations with params:', searchParams);
      dispatch(fetchConversations(searchParams));
    }, 300); // 300ms debounce

    // Cleanup timeout on unmount or when dependencies change
    return () => clearTimeout(fetchConversationsDebounced);
  }, [dispatch, filters, pagination.page, pagination.pageSize, searchQuery, isMounted]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Reset to first page when searching
    if (pagination.page !== 1) {
      dispatch(setConversationPagination({ page: 1 }));
    }
  };

  // Handle conversation selection
  const handleSelectConversation = (conversation: IChatConversation) => {
    console.log('🎯 ConversationList: Selecting conversation:', conversation);
    dispatch(setCurrentConversation(conversation));
    if (onSelectConversation) {
      console.log('🎯 ConversationList: Calling onSelectConversation callback');
      onSelectConversation(conversation);
    }
  };

  // Handle conversation deletion
  const handleDeleteConversation = (conversationId: string) => {
    if (window.confirm("Are you sure you want to delete this conversation? This action cannot be undone.")) {
      dispatch(deleteConversation(conversationId));
    }
    setShowDropdown(null);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "active": return "text-green-600";
      case "paused": return "text-yellow-600";
      case "completed": return "text-blue-600";
      case "archived": return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  // Truncate text
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (loading.conversations && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                const searchParams = {
                  ...filters,
                  page: 1,
                  page_size: pagination.pageSize,
                };
                console.log('🔄 ConversationList: Manually refreshing conversations');
                dispatch(fetchConversations(searchParams));
              }}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
              title="Refresh conversations"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            {onCreateConversation && (
              <button
                onClick={onCreateConversation}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                title="New conversation"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Search conversations..."
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {!isMounted ? (
          // Return null during SSR to prevent hydration mismatch
          null
        ) : conversations.length === 0 ? (
          <EmptyState
            title="No conversations"
            description={
              searchQuery.trim()
                ? "No conversations match your search."
                : "Start a new conversation to get started."
            }
            icon="search"
            action={
              onCreateConversation && !searchQuery.trim()
                ? {
                    label: "New Conversation",
                    onClick: onCreateConversation,
                  }
                : undefined
            }
          />
        ) : (
          <div className="space-y-1 p-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`relative group cursor-pointer rounded-lg p-3 hover:bg-gray-50 transition-colors ${
                  currentConversation?.id === conversation.id
                    ? "bg-indigo-50 border border-indigo-200"
                    : "border border-transparent"
                }`}
                onClick={() => handleSelectConversation(conversation)}
              >
                {/* Conversation header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {/* Agent indicator */}
                    <div className="flex-shrink-0">
                      <CpuChipIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {conversation.title || "Untitled Conversation"}
                    </h3>
                    
                    {/* Pin indicator */}
                    {conversation.is_pinned && (
                      <BookmarkSolidIcon className="h-3 w-3 text-indigo-600 flex-shrink-0" />
                    )}
                  </div>

                  {/* Actions dropdown */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(showDropdown === conversation.id ? null : conversation.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <EllipsisVerticalIcon className="h-4 w-4" />
                    </button>

                    {showDropdown === conversation.id && (
                      <div className="absolute right-0 top-6 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement pin/unpin
                            setShowDropdown(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <BookmarkIcon className="h-4 w-4 mr-2" />
                          {conversation.is_pinned ? "Unpin" : "Pin"}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement archive
                            setShowDropdown(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <ArchiveBoxIcon className="h-4 w-4 mr-2" />
                          Archive
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conversation.conversation_id);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {conversation.description && (
                  <p className="text-xs text-gray-500 mb-2">
                    {truncateText(conversation.description, 100)}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center ${getStatusColor(conversation.status)}`}>
                      <div className="w-2 h-2 rounded-full bg-current mr-1"></div>
                      {conversation.status}
                    </span>
                    
                    <span>{conversation.message_count} messages</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-3 w-3" />
                    <span>{formatDate(conversation.updated)}</span>
                  </div>
                </div>

                {/* Shared indicator */}
                {conversation.is_shared && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <UserIcon className="h-3 w-3 mr-1" />
                      Shared
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Loading overlay */}
        {loading.conversations && conversations.length > 0 && (
          <div className="flex items-center justify-center py-4">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>

      {/* Load more button */}
      {pagination.total > conversations.length && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => dispatch(setConversationPagination({ page: pagination.page + 1 }))}
            disabled={loading.conversations}
            className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
          >
            {loading.conversations ? "Loading..." : "Load more"}
          </button>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(null)}
        />
      )}
    </div>
  );
};

export default ConversationList;
