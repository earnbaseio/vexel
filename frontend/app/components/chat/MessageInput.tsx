"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  PaperAirplaneIcon,
  PaperClipIcon,
  MicrophoneIcon,
  StopIcon,
  PhotoIcon,
  DocumentIcon
} from "@heroicons/react/24/outline";
import { IMessageContent } from "@/app/lib/interfaces";

interface MessageInputProps {
  onSendMessage: (content: IMessageContent[], rawContent: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  allowAttachments?: boolean;
  allowVoice?: boolean;
  className?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  maxLength = 4000,
  allowAttachments = true,
  allowVoice = false,
  className = ""
}) => {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Handle message submission
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if ((!message.trim() && attachments.length === 0) || disabled) {
      return;
    }

    const content: IMessageContent[] = [];

    // Add text content
    if (message.trim()) {
      content.push({
        type: "text",
        text: message.trim(),
        metadata: {}
      });
    }

    // Add file attachments
    for (const file of attachments) {
      if (file.type.startsWith('image/')) {
        const imageUrl = URL.createObjectURL(file);
        content.push({
          type: "image",
          image_url: imageUrl,
          file_name: file.name,
          file_size: file.size,
          metadata: { originalFile: file }
        });
      } else {
        const fileUrl = URL.createObjectURL(file);
        content.push({
          type: "file",
          file_url: fileUrl,
          file_name: file.name,
          file_size: file.size,
          metadata: { originalFile: file }
        });
      }
    }

    // Send message
    onSendMessage(content, message.trim());

    // Clear input
    setMessage("");
    setAttachments([]);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const file = new File([blob], `recording-${Date.now()}.wav`, { type: 'audio/wav' });
        setAttachments(prev => [...prev, file]);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  // Format recording time
  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <PhotoIcon className="h-4 w-4" />;
    }
    return <DocumentIcon className="h-4 w-4" />;
  };

  const canSend = (message.trim() || attachments.length > 0) && !disabled;

  return (
    <div className={`bg-white border-t border-gray-200 ${className}`}>
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2"
              >
                {getFileIcon(file)}
                <span className="text-sm text-gray-700 truncate max-w-32">
                  {file.name}
                </span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-100">
          <div className="flex items-center space-x-2 text-red-600">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              Recording... {formatRecordingTime(recordingTime)}
            </span>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          {/* Attachment button */}
          {allowAttachments && (
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Attach file"
              >
                <PaperClipIcon className="h-5 w-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
            </div>
          )}

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={maxLength}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            
            {/* Character count */}
            {message.length > maxLength * 0.8 && (
              <div className="absolute bottom-1 right-2 text-xs text-gray-400">
                {message.length}/{maxLength}
              </div>
            )}
          </div>

          {/* Voice recording button */}
          {allowVoice && (
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={disabled}
                className={`p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  isRecording
                    ? 'text-red-600 bg-red-50 hover:bg-red-100'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title={isRecording ? "Stop recording" : "Start voice recording"}
              >
                {isRecording ? (
                  <StopIcon className="h-5 w-5" />
                ) : (
                  <MicrophoneIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          )}

          {/* Send button */}
          <div className="flex-shrink-0">
            <button
              type="submit"
              disabled={!canSend}
              className={`p-2 rounded-lg transition-colors ${
                canSend
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title="Send message"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessageInput;
