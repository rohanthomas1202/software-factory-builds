'use client';

import { useState } from 'react';
import type { Card } from '@/lib/types';
import CardModal from './CardModal';
import { UserCircleIcon } from '@heroicons/react/24/outline';

interface CardTileProps {
  card: Card;
  onDragStart: () => void;
  onUpdate: (updates: Partial<Card>) => void;
  currentUserId: string;
  isLoading?: boolean;
}

export default function CardTile({
  card,
  onDragStart,
  onUpdate,
  currentUserId,
  isLoading = false,
}: CardTileProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', card.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart();
  };

  const handleClick = () => {
    setIsModalOpen(true);
  };

  const handleUpdate = async (updates: Partial<Card>) => {
    setIsUpdating(true);
    try {
      await onUpdate(updates);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDueDate = (timestamp: number) => {
    const now = Date.now();
    const diff = timestamp - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) {
      return { text: `Overdue ${Math.abs(days)}d`, color: 'text-red-600 bg-red-50' };
    } else if (days === 0) {
      return { text: 'Today', color: 'text-orange-600 bg-orange-50' };
    } else if (days === 1) {
      return { text: 'Tomorrow', color: 'text-orange-600 bg-orange-50' };
    } else if (days <= 7) {
      return { text: `${days}d`, color: 'text-yellow-600 bg-yellow-50' };
    } else {
      return { text: `${days}d`, color: 'text-green-600 bg-green-50' };
    }
  };

  const dueDateInfo = card.dueDate ? formatDueDate(card.dueDate) : null;

  return (
    <>
      <div
        draggable={!isLoading && !isUpdating}
        onDragStart={handleDragStart}
        onClick={handleClick}
        className={`p-3 bg-white border rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-all ${
          isLoading || isUpdating
            ? 'opacity-50 cursor-not-allowed border-blue-300'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-gray-900 line-clamp-2">{card.title}</h4>
            {dueDateInfo && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${dueDateInfo.color}`}>
                {dueDateInfo.text}
              </span>
            )}
          </div>
          
          {card.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{card.description}</p>
          )}
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1">
              <UserCircleIcon className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">
                {card.assignedTo === currentUserId ? 'You' : 'Assigned'}
              </span>
            </div>
            
            {(isLoading || isUpdating) && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-xs text-blue-600">
                  {isLoading ? 'Moving...' : 'Updating...'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <CardModal
          cardId={card.id}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentUserId={currentUserId}
          workspaceId="" // Will be fetched in the modal
          onUpdate={handleUpdate}
        />
      )}
    </>
  );
}