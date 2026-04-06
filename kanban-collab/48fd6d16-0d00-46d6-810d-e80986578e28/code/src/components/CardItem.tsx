'use client';

import { Card } from '@/lib/types';
import { CalendarIcon, UserIcon, FlagIcon } from 'lucide-react';
import { format } from 'date-fns';

interface CardItemProps {
  card: Card;
  onEdit: () => void;
}

export default function CardItem({ card, onEdit }: CardItemProps) {
  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  const getPriorityLabel = (priority: Card['priority']) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const handleClick = () => {
    onEdit();
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
      draggable
    >
      {/* Title */}
      <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
        {card.title}
      </h4>

      {/* Description Preview */}
      {card.description && (
        <p className="text-gray-600 text-xs mb-3 line-clamp-2">
          {card.description}
        </p>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Priority */}
        {card.priority && card.priority !== 'medium' && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${priorityColors[card.priority]}`}
          >
            <FlagIcon size={10} />
            {getPriorityLabel(card.priority)}
          </span>
        )}

        {/* Due Date */}
        {card.dueDate && (
          <span className="inline-flex items-center gap-1 text-gray-600 text-xs">
            <CalendarIcon size={12} />
            {format(new Date(card.dueDate), 'MMM d')}
          </span>
        )}

        {/* Assignee */}
        {card.assigneeId && (
          <span className="inline-flex items-center gap-1 text-gray-600 text-xs">
            <UserIcon size={12} />
            Assigned
          </span>
        )}

        {/* Updated timestamp */}
        <span className="text-gray-400 text-xs ml-auto">
          {format(new Date(card.updatedAt), 'MMM d')}
        </span>
      </div>
    </div>
  );
}