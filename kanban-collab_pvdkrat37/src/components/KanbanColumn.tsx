'use client';

import { useState, useRef } from 'react';
import type { Column, Card } from '@/lib/types';
import CardTile from './CardTile';
import { PlusIcon } from '@heroicons/react/24/outline';

interface KanbanColumnProps {
  column: Column;
  cards: Card[];
  onDragStart: (cardId: string) => void;
  onDrop: (columnId: string, position: number) => void;
  onCardUpdate: (cardId: string, updates: Partial<Card>) => void;
  onCreateCard: (columnId: string, title: string) => Promise<Card | null>;
  currentUserId: string;
  isDragging: boolean;
  loadingCardId: string | null;
}

export default function KanbanColumn({
  column,
  cards,
  onDragStart,
  onDrop,
  onCardUpdate,
  onCreateCard,
  currentUserId,
  isDragging,
  loadingCardId,
}: KanbanColumnProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isCreatingLoading, setIsCreatingLoading] = useState(false);
  const columnRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!isDragging) return;
    
    const rect = columnRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseY = e.clientY;
    const columnTop = rect.top;
    const cardHeight = 80; // Approximate card height
    
    // Calculate drop position
    const relativeY = mouseY - columnTop;
    const position = Math.max(0, Math.min(
      Math.floor(relativeY / cardHeight),
      cards.length
    ));
    
    onDrop(column.id, position);
  };

  const handleCreateCard = async () => {
    if (!newCardTitle.trim()) {
      setIsCreating(false);
      return;
    }

    setIsCreatingLoading(true);
    try {
      await onCreateCard(column.id, newCardTitle.trim());
      setNewCardTitle('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create card:', error);
    } finally {
      setIsCreatingLoading(false);
    }
  };

  const getCardCountColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 text-gray-600';
    if (count > 10) return 'bg-red-100 text-red-800';
    if (count > 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div
      ref={columnRef}
      className={`flex-shrink-0 w-80 bg-gray-50 rounded-lg border ${
        isDragging ? 'border-blue-300' : 'border-gray-200'
      }`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{column.name}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCardCountColor(cards.length)}`}>
              {cards.length}
            </span>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            disabled={isCreating}
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-2 space-y-2 min-h-[200px]">
        {cards.map((card, index) => (
          <CardTile
            key={card.id}
            card={card}
            onDragStart={() => onDragStart(card.id)}
            onUpdate={(updates) => onCardUpdate(card.id, updates)}
            currentUserId={currentUserId}
            isLoading={loadingCardId === card.id}
          />
        ))}

        {isCreating && (
          <div className="p-3 bg-white border border-gray-300 rounded-lg shadow-sm">
            <input
              type="text"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCreatingLoading) {
                  handleCreateCard();
                }
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewCardTitle('');
                }
              }}
              placeholder="Enter card title..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              disabled={isCreatingLoading}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCreateCard}
                disabled={isCreatingLoading || !newCardTitle.trim()}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreatingLoading ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewCardTitle('');
                }}
                disabled={isCreatingLoading}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {cards.length === 0 && !isCreating && (
          <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-sm text-gray-500">Drop cards here or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}