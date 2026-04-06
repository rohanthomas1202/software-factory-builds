'use client';

import { useState } from 'react';
import CardItem from './CardItem';
import { Column, Card } from '@/lib/types';
import { PlusIcon, GripVerticalIcon } from 'lucide-react';

interface ColumnListProps {
  column: Column & { cards: Card[] };
  columnIndex: number;
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onColumnReorder: (columnId: string, newIndex: number) => void;
  onAddCard: (columnId: string, title: string) => void;
  onCardEdit: (cardId: string) => void;
  isLoading: boolean;
}

export default function ColumnList({
  column,
  columnIndex,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onColumnReorder,
  onAddCard,
  onCardEdit,
  isLoading,
}: ColumnListProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  const handleDragStartCard = (cardId: string) => {
    const event = new Event('dragstart') as any;
    event.dataTransfer = { setData: () => {} };
    // This would be set in parent via dataTransfer
  };

  const handleDragOverCard = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropCard = (e: React.DragEvent, targetCardId?: string) => {
    e.preventDefault();
    // Card reordering within same column would be handled here
  };

  const handleAddCardSubmit = () => {
    if (newCardTitle.trim()) {
      onAddCard(column.id, newCardTitle.trim());
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCardSubmit();
    } else if (e.key === 'Escape') {
      setIsAddingCard(false);
      setNewCardTitle('');
    }
  };

  return (
    <div
      className={`w-64 flex-shrink-0 flex flex-col rounded-lg border bg-gray-50 ${
        isDragging ? 'opacity-50 border-blue-500' : 'border-gray-200'
      }`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Column Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            className="cursor-move text-gray-400 hover:text-gray-600"
            draggable
            onDragStart={onDragStart}
            title="Drag to reorder column"
          >
            <GripVerticalIcon size={16} />
          </button>
          <h3 className="font-semibold text-gray-900">{column.name}</h3>
          <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {column.cards.length}
          </span>
        </div>
        
        <button
          onClick={() => setIsAddingCard(true)}
          disabled={isLoading}
          className="text-gray-500 hover:text-blue-600 hover:bg-blue-100 p-1 rounded"
          title="Add card"
        >
          <PlusIcon size={18} />
        </button>
      </div>

      {/* Cards List */}
      <div 
        className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]"
        onDragOver={handleDragOverCard}
        onDrop={(e) => handleDropCard(e)}
      >
        {column.cards.map(card => (
          <div
            key={card.id}
            draggable
            onDragStart={() => handleDragStartCard(card.id)}
            onDragOver={handleDragOverCard}
            onDrop={(e) => handleDropCard(e, card.id)}
          >
            <CardItem 
              card={card} 
              onEdit={() => onCardEdit(card.id)}
            />
          </div>
        ))}

        {/* Add Card Form */}
        {isAddingCard && (
          <div className="mt-2">
            <textarea
              autoFocus
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter card title..."
              className="w-full p-2 text-sm border border-blue-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAddCardSubmit}
                disabled={!newCardTitle.trim() || isLoading}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Card
              </button>
              <button
                onClick={() => {
                  setIsAddingCard(false);
                  setNewCardTitle('');
                }}
                className="px-3 py-1.5 text-gray-700 text-sm font-medium rounded hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Card Button (when form is not shown) */}
      {!isAddingCard && (
        <div className="p-2 border-t">
          <button
            onClick={() => setIsAddingCard(true)}
            disabled={isLoading}
            className="w-full text-left text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-2 rounded text-sm font-medium flex items-center gap-2"
          >
            <PlusIcon size={16} />
            Add a card
          </button>
        </div>
      )}
    </div>
  );
}