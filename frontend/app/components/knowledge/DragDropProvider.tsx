"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { IKnowledgeItem, IKnowledgeCollection } from '@/app/lib/interfaces';

interface DragDropContextType {
  // Drag state
  isDragging: boolean;
  draggedItems: IKnowledgeItem[];
  draggedFromCollection: string | null;
  
  // Drop zones
  activeDropZone: string | null;
  validDropZones: string[];
  
  // Actions
  startDrag: (items: IKnowledgeItem[], fromCollection: string) => void;
  endDrag: () => void;
  setActiveDropZone: (zoneId: string | null) => void;
  setValidDropZones: (zones: string[]) => void;
  
  // Callbacks
  onFileDrop?: (items: IKnowledgeItem[], targetCollection: string, sourceCollection: string) => void;
  onBulkDrop?: (items: IKnowledgeItem[], targetCollection: string, sourceCollection: string) => void;
}

const DragDropContext = createContext<DragDropContextType | null>(null);

interface DragDropProviderProps {
  children: React.ReactNode;
  onFileDrop?: (items: IKnowledgeItem[], targetCollection: string, sourceCollection: string) => void;
  onBulkDrop?: (items: IKnowledgeItem[], targetCollection: string, sourceCollection: string) => void;
}

export function DragDropProvider({ 
  children, 
  onFileDrop, 
  onBulkDrop 
}: DragDropProviderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItems, setDraggedItems] = useState<IKnowledgeItem[]>([]);
  const [draggedFromCollection, setDraggedFromCollection] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);
  const [validDropZones, setValidDropZones] = useState<string[]>([]);

  const startDrag = useCallback((items: IKnowledgeItem[], fromCollection: string) => {
    setIsDragging(true);
    setDraggedItems(items);
    setDraggedFromCollection(fromCollection);
    
    // Set valid drop zones (all collections except source)
    // This would be populated from available collections
    setValidDropZones([]);
  }, []);

  const endDrag = useCallback(() => {
    setIsDragging(false);
    setDraggedItems([]);
    setDraggedFromCollection(null);
    setActiveDropZone(null);
    setValidDropZones([]);
  }, []);

  const handleSetActiveDropZone = useCallback((zoneId: string | null) => {
    setActiveDropZone(zoneId);
  }, []);

  const handleSetValidDropZones = useCallback((zones: string[]) => {
    setValidDropZones(zones);
  }, []);

  const value: DragDropContextType = {
    isDragging,
    draggedItems,
    draggedFromCollection,
    activeDropZone,
    validDropZones,
    startDrag,
    endDrag,
    setActiveDropZone: handleSetActiveDropZone,
    setValidDropZones: handleSetValidDropZones,
    onFileDrop,
    onBulkDrop,
  };

  return (
    <DragDropContext.Provider value={value}>
      {children}
    </DragDropContext.Provider>
  );
}

export function useDragDrop() {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
}

// Custom hook for drag operations
export function useDragSource() {
  const { startDrag, endDrag, isDragging } = useDragDrop();
  
  const handleDragStart = useCallback((
    e: React.DragEvent,
    items: IKnowledgeItem[],
    fromCollection: string
  ) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({
      items: items.map(item => item.id),
      fromCollection,
    }));
    
    startDrag(items, fromCollection);
  }, [startDrag]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    endDrag();
  }, [endDrag]);

  return {
    handleDragStart,
    handleDragEnd,
    isDragging,
  };
}

// Custom hook for drop operations
export function useDropTarget(collectionId: string) {
  const { 
    setActiveDropZone, 
    activeDropZone, 
    validDropZones, 
    draggedItems,
    draggedFromCollection,
    onFileDrop,
    onBulkDrop,
    endDrag,
  } = useDragDrop();

  const isValidDropTarget = validDropZones.includes(collectionId);
  const isActiveDropZone = activeDropZone === collectionId;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!isValidDropTarget) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, [isValidDropTarget]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (!isValidDropTarget) return;
    
    e.preventDefault();
    setActiveDropZone(collectionId);
  }, [isValidDropTarget, collectionId, setActiveDropZone]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!isValidDropTarget) return;
    
    // Only clear if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setActiveDropZone(null);
    }
  }, [isValidDropTarget, setActiveDropZone]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!isValidDropTarget) return;
    
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { items: itemIds, fromCollection } = data;
      
      if (draggedItems.length > 0 && draggedFromCollection) {
        // Use context data if available
        if (draggedItems.length === 1) {
          onFileDrop?.(draggedItems, collectionId, draggedFromCollection);
        } else {
          onBulkDrop?.(draggedItems, collectionId, draggedFromCollection);
        }
      }
    } catch (error) {
      console.error('Failed to parse drop data:', error);
    }
    
    setActiveDropZone(null);
    endDrag();
  }, [
    isValidDropTarget,
    collectionId,
    draggedItems,
    draggedFromCollection,
    onFileDrop,
    onBulkDrop,
    setActiveDropZone,
    endDrag,
  ]);

  return {
    isValidDropTarget,
    isActiveDropZone,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  };
}

// Utility function to get drag preview element
export function createDragPreview(items: IKnowledgeItem[]): HTMLElement {
  const preview = document.createElement('div');
  preview.className = 'drag-preview';
  preview.style.cssText = `
    position: absolute;
    top: -1000px;
    left: -1000px;
    background: white;
    border: 2px solid #e11d48;
    border-radius: 8px;
    padding: 8px 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    z-index: 1000;
    pointer-events: none;
  `;
  
  if (items.length === 1) {
    preview.textContent = `Moving "${items[0].title}"`;
  } else {
    preview.textContent = `Moving ${items.length} files`;
  }
  
  document.body.appendChild(preview);
  
  // Clean up after drag
  setTimeout(() => {
    if (document.body.contains(preview)) {
      document.body.removeChild(preview);
    }
  }, 100);
  
  return preview;
}

// Visual feedback component for drag operations
export function DragOverlay() {
  const { isDragging, draggedItems } = useDragDrop();
  
  if (!isDragging) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-10 pointer-events-none z-40">
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white border-2 border-rose-500 rounded-lg px-4 py-2 shadow-lg z-50">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-900">
            {draggedItems.length === 1 
              ? `Moving "${draggedItems[0].title}"` 
              : `Moving ${draggedItems.length} files`
            }
          </span>
        </div>
      </div>
    </div>
  );
}
