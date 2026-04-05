'use client';

import { useState, useRef, useCallback, useEffect, RefObject } from 'react';

export interface DragItem {
  id: string;
  type: 'task' | 'column';
  data?: any;
}

export interface DropZone {
  id: string;
  type: 'column' | 'task';
  accepts: ('task' | 'column')[];
}

export interface UseDragAndDropOptions {
  onDragStart?: (item: DragItem) => void;
  onDragEnd?: (item: DragItem, dropZoneId: string | null) => void;
  onDragOver?: (dropZoneId: string) => void;
  onDragLeave?: (dropZoneId: string) => void;
  onDrop?: (item: DragItem, dropZoneId: string) => void;
}

export interface UseDragAndDropReturn {
  isDragging: boolean;
  dragItem: DragItem | null;
  activeDropZone: string | null;
  dragStart: (e: React.DragEvent, item: DragItem) => void;
  dragEnd: (e: React.DragEvent) => void;
  dragOver: (e: React.DragEvent, dropZoneId: string) => void;
  dragLeave: (e: React.DragEvent, dropZoneId: string) => void;
  drop: (e: React.DragEvent, dropZoneId: string) => void;
  registerDragElement: (element: HTMLElement | null, item: DragItem) => void;
  registerDropZone: (element: HTMLElement | null, dropZone: DropZone) => void;
}

export function useDragAndDrop(options: UseDragAndDropOptions = {}): UseDragAndDropReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);
  
  const dragElements = useRef<Map<string, HTMLElement>>(new Map());
  const dropZones = useRef<Map<string, DropZone>>(new Map());

  const dragStart = useCallback((e: React.DragEvent, item: DragItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
    
    // Set drag image if element exists
    const dragElement = dragElements.current.get(item.id);
    if (dragElement) {
      e.dataTransfer.setDragImage(dragElement, 20, 20);
    }
    
    setIsDragging(true);
    setDragItem(item);
    options.onDragStart?.(item);
  }, [options]);

  const dragEnd = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setActiveDropZone(null);
    options.onDragEnd?.(dragItem!, activeDropZone);
    setDragItem(null);
  }, [dragItem, activeDropZone, options]);

  const dragOver = useCallback((e: React.DragEvent, dropZoneId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const dropZone = dropZones.current.get(dropZoneId);
    if (!dropZone || !dragItem) return;
    
    // Check if drop zone accepts this drag item type
    if (!dropZone.accepts.includes(dragItem.type)) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    
    setActiveDropZone(dropZoneId);
    options.onDragOver?.(dropZoneId);
  }, [dragItem, options]);

  const dragLeave = useCallback((e: React.DragEvent, dropZoneId: string) => {
    e.preventDefault();
    if (activeDropZone === dropZoneId) {
      setActiveDropZone(null);
      options.onDragLeave?.(dropZoneId);
    }
  }, [activeDropZone, options]);

  const drop = useCallback((e: React.DragEvent, dropZoneId: string) => {
    e.preventDefault();
    
    try {
      const data = e.dataTransfer.getData('application/json');
      const item: DragItem = data ? JSON.parse(data) : dragItem;
      
      if (!item) return;
      
      const dropZone = dropZones.current.get(dropZoneId);
      if (!dropZone || !dropZone.accepts.includes(item.type)) {
        return;
      }
      
      options.onDrop?.(item, dropZoneId);
      setActiveDropZone(null);
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  }, [dragItem, options]);

  const registerDragElement = useCallback((element: HTMLElement | null, item: DragItem) => {
    if (element) {
      dragElements.current.set(item.id, element);
      element.setAttribute('draggable', 'true');
      element.setAttribute('data-drag-item-id', item.id);
      element.setAttribute('data-drag-item-type', item.type);
    } else {
      dragElements.current.delete(item.id);
    }
  }, []);

  const registerDropZone = useCallback((element: HTMLElement | null, dropZone: DropZone) => {
    if (element) {
      dropZones.current.set(dropZone.id, dropZone);
      element.setAttribute('data-drop-zone-id', dropZone.id);
      element.setAttribute('data-drop-zone-type', dropZone.type);
    } else {
      dropZones.current.delete(dropZone.id);
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      dragElements.current.clear();
      dropZones.current.clear();
    };
  }, []);

  return {
    isDragging,
    dragItem,
    activeDropZone,
    dragStart,
    dragEnd,
    dragOver,
    dragLeave,
    drop,
    registerDragElement,
    registerDropZone,
  };
}

// Helper hook for drag and drop with keyboard support
export function useDragAndDropWithKeyboard(
  options: UseDragAndDropOptions & {
    onMove?: (itemId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  }
) {
  const [focusedItem, setFocusedItem] = useState<string | null>(null);
  const [isKeyboardDragging, setIsKeyboardDragging] = useState(false);
  
  const { onMove, ...dragDropOptions } = options;
  
  const dragDrop = useDragAndDrop(dragDropOptions);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, itemId: string, itemType: 'task' | 'column') => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setIsKeyboardDragging(true);
      const item: DragItem = { id: itemId, type: itemType };
      dragDrop.dragStart(e as any, item);
    }
    
    if (isKeyboardDragging && focusedItem) {
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          // Move focus to previous sibling
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          // Move focus to next sibling
          break;
        case 'Escape':
          e.preventDefault();
          setIsKeyboardDragging(false);
          dragDrop.dragEnd(e as any);
          break;
        case 'Tab':
          e.preventDefault();
          // Move between drop zones
          break;
      }
    }
  }, [dragDrop, focusedItem, isKeyboardDragging]);

  const handleDropZoneKeyDown = useCallback((e: React.KeyboardEvent, dropZoneId: string) => {
    if (isKeyboardDragging && e.key === 'Enter') {
      e.preventDefault();
      const item = dragDrop.dragItem;
      if (item) {
        options.onDrop?.(item, dropZoneId);
        setIsKeyboardDragging(false);
      }
    }
  }, [dragDrop.dragItem, isKeyboardDragging, options]);

  return {
    ...dragDrop,
    isKeyboardDragging,
    focusedItem,
    setFocusedItem,
    handleKeyDown,
    handleDropZoneKeyDown,
  };
}