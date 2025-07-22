"use client";

import React, { useState } from "react";
import {
  IMessage,
  IMessageContent,
  IToolCall
} from "@/app/lib/interfaces";
import { 
  UserIcon,
  CpuChipIcon,
  ClockIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  WrenchScrewdriverIcon
} from "@heroicons/react/24/outline";
import { 
  HandThumbUpIcon as HandThumbUpSolidIcon,
  HandThumbDownIcon as HandThumbDownSolidIcon
} from "@heroicons/react/24/solid";

interface MessageBubbleProps {
  message: IMessage;
  isStreaming?: boolean;
  onFeedback?: (messageId: string, rating: number, feedback?: string) => void;
  onCopy?: (content: string) => void;
  onRetry?: (messageId: string) => void;
  className?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isStreaming = false,
  onFeedback,
  onCopy,
  onRetry,
  className = ""
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [copied, setCopied] = useState(false);

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isSystem = message.role === "system";
  const isError = message.role === "tool" && message.content.some(c => c.text?.includes("error"));

  // Handle copy to clipboard
  const handleCopy = () => {
    const textContent = message.raw_content || message.content
      .filter(c => c.type === "text")
      .map(c => c.text)
      .join(" ");
    
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    if (onCopy) {
      onCopy(textContent);
    }
  };

  // Handle feedback submission
  const handleFeedbackSubmit = () => {
    if (feedbackRating && onFeedback) {
      onFeedback(message.message_id, feedbackRating, feedbackText || undefined);
      setShowFeedback(false);
      setFeedbackRating(null);
      setFeedbackText("");
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Render message content
  const renderContent = (content: IMessageContent[]) => {
    return content.map((item, index) => {
      switch (item.type) {
        case "text":
          return (
            <div key={index} className="whitespace-pre-wrap">
              {item.text}
            </div>
          );
        
        case "image":
          return (
            <div key={index} className="mt-2">
              <img 
                src={item.image_url} 
                alt="Message attachment"
                className="max-w-sm rounded-lg shadow-md"
              />
            </div>
          );
        
        case "file":
          return (
            <div key={index} className="mt-2 p-3 bg-gray-100 rounded-lg flex items-center space-x-2">
              <ClipboardDocumentIcon className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">{item.file_name}</p>
                {item.file_size && (
                  <p className="text-xs text-gray-500">
                    {(item.file_size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
            </div>
          );
        
        default:
          return null;
      }
    });
  };

  // Render tool calls
  const renderToolCalls = (toolCalls: IToolCall[]) => {
    if (toolCalls.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {toolCalls.map((toolCall, index) => (
          <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <WrenchScrewdriverIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {toolCall.tool_name} - {toolCall.function_name}
              </span>
              <span className="text-xs text-blue-600">
                {toolCall.execution_time.toFixed(2)}s
              </span>
            </div>
            
            {toolCall.error ? (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                Error: {toolCall.error}
              </div>
            ) : toolCall.result && (
              <div className="text-sm text-gray-700">
                <pre className="whitespace-pre-wrap text-xs">
                  {typeof toolCall.result === 'string' 
                    ? toolCall.result 
                    : JSON.stringify(toolCall.result, null, 2)
                  }
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 ${className}`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-2' : 'mr-2'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-indigo-600 text-white' 
              : isSystem 
              ? 'bg-gray-500 text-white'
              : isError
              ? 'bg-red-500 text-white'
              : 'bg-green-600 text-white'
          }`}>
            {isUser ? (
              <UserIcon className="h-5 w-5" />
            ) : (
              <CpuChipIcon className="h-5 w-5" />
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Message Bubble */}
          <div className={`relative px-4 py-2 rounded-2xl ${
            isUser 
              ? 'bg-indigo-600 text-white' 
              : isError
              ? 'bg-red-50 border border-red-200 text-red-800'
              : isSystem
              ? 'bg-gray-100 text-gray-800'
              : 'bg-white border border-gray-200 text-gray-900'
          } ${isStreaming ? 'animate-pulse' : ''}`}>
            
            {/* Content */}
            <div className="text-sm">
              {renderContent(message.content)}
            </div>

            {/* Tool calls */}
            {renderToolCalls(message.tool_calls)}

            {/* Streaming indicator */}
            {isStreaming && (
              <div className="flex items-center space-x-1 mt-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Message metadata */}
          <div className={`flex items-center space-x-2 mt-1 text-xs text-gray-500 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="flex items-center space-x-1">
              <ClockIcon className="h-3 w-3" />
              <span>{formatTime(message.timestamp)}</span>
            </span>
            
            {message.tokens_used > 0 && (
              <span>{message.tokens_used} tokens</span>
            )}
            
            {message.response_time > 0 && (
              <span>{message.response_time.toFixed(2)}s</span>
            )}
            
            {message.is_edited && (
              <span className="italic">edited</span>
            )}
          </div>

          {/* Actions */}
          {!isUser && !isSystem && (
            <div className="flex items-center space-x-2 mt-2">
              <button
                onClick={handleCopy}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Copy message"
              >
                {copied ? (
                  <CheckIcon className="h-4 w-4 text-green-600" />
                ) : (
                  <ClipboardDocumentIcon className="h-4 w-4" />
                )}
              </button>

              {onFeedback && (
                <>
                  <button
                    onClick={() => {
                      setFeedbackRating(1);
                      if (onFeedback) onFeedback(message.message_id, 1);
                    }}
                    className="p-1 text-gray-400 hover:text-green-600 rounded"
                    title="Good response"
                  >
                    <HandThumbUpIcon className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => setShowFeedback(true)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                    title="Poor response"
                  >
                    <HandThumbDownIcon className="h-4 w-4" />
                  </button>
                </>
              )}

              {isError && onRetry && (
                <button
                  onClick={() => onRetry(message.message_id)}
                  className="p-1 text-gray-400 hover:text-indigo-600 rounded"
                  title="Retry"
                >
                  <ExclamationTriangleIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Feedback form */}
          {showFeedback && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm font-medium text-gray-700 mb-2">
                What could be improved?
              </p>
              
              <div className="flex space-x-2 mb-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFeedbackRating(rating)}
                    className={`p-1 rounded ${
                      feedbackRating === rating
                        ? 'text-yellow-500'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Optional feedback..."
                className="w-full p-2 text-sm border border-gray-300 rounded resize-none"
                rows={2}
              />
              
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={() => setShowFeedback(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={!feedbackRating}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
