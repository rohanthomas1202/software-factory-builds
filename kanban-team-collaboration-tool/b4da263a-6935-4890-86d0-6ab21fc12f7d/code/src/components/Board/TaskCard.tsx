'use client';

import { useState, useRef } from 'react';
import { Task, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/UI/Avatar';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { 
  GripVertical, 
  MoreVertical, 
  Clock, 
  User as UserIcon,
  Flag,
  MessageSquare,
  Paperclip,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Copy,
  Archive,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { TaskDetailsModal } from './TaskDetailsModal';
import { DragItem } from '@/hooks/useDragAndDrop';

interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDuplicate?: (task: Task) => void;
  onArchive?: (taskId: string) => void;
  isDragging?: boolean;
  isOver?: boolean;
  onDragStart?: (item: DragItem) => void;
  onDragEnd?: () => void;
  assignees?: User[];
  showDetails?: boolean;
}

export function TaskCard({
  task,
  onUpdate,
  onDelete,
  onDuplicate,
  onArchive,
  isDragging = false,
  isOver = false,
  onDragStart,
  onDragEnd,
  assignees = [],
  showDetails = false
}: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [isCompleted, setIsCompleted] = useState(task.status === 'completed');
  const menuRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const priorityColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
  };

  const priorityIcons = {
    low: <Flag className="w-3 h-3" />,
    medium: <Flag className="w-3 h-3" />,
    high: <Flag className="w-3 h-3" />,
    critical: <Flag className="w-3 h-3" />
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart({
        type: 'task',
        id: task.id,
        columnId: task.columnId,
        data: task
      });
    }
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    if (onDragEnd) {
      onDragEnd();
    }
  };

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== task.title) {
      onUpdate({ ...task, title: editedTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(task.title);
      setIsEditing(false);
    }
  };

  const handleToggleComplete = () => {
    const newStatus = isCompleted ? 'in-progress' : 'completed';
    setIsCompleted(!isCompleted);
    onUpdate({ ...task, status: newStatus });
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(task);
    }
    setShowMenu(false);
  };

  const handleArchive = () => {
    if (onArchive) {
      onArchive(task.id);
    }
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
    setShowMenu(false);
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date < today) {
      return `Overdue ${format(date, 'MMM d')}`;
    } else {
      return format(date, 'MMM d');
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  const taskAssignees = assignees.filter(user => 
    task.assigneeIds?.includes(user.id)
  );

  return (
    <>
      <div
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={cn(
          'group relative bg-white dark:bg-gray-800 rounded-lg border shadow-sm transition-all duration-200',
          'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600',
          isDragging && 'opacity-50 scale-95',
          isOver && 'ring-2 ring-blue-500 ring-opacity-50',
          isCompleted && 'opacity-75',
          task.status === 'completed' && 'border-green-200 dark:border-green-800'
        )}
      >
        {/* Drag handle */}
        <div className="absolute left-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
        </div>

        {/* Task content */}
        <div className="p-4 pl-8">
          {/* Header with title and menu */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="w-full px-2 py-1 text-sm font-medium bg-transparent border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <h3
                  className={cn(
                    'text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400',
                    isCompleted && 'line-through text-gray-500 dark:text-gray-400'
                  )}
                  onClick={() => setShowDetailsModal(true)}
                  onDoubleClick={() => setIsEditing(true)}
                >
                  {task.title}
                </h3>
              )}
            </div>

            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>

              {showMenu && (
                <div className="absolute right-0 top-6 z-10 w-48 bg-white dark:bg-gray-800 border rounded-lg shadow-lg py-1">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={handleToggleComplete}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {isCompleted ? (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Mark as In Progress
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Complete
                      </>
                    )}
                  </button>
                  {onDuplicate && (
                    <button
                      onClick={handleDuplicate}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </button>
                  )}
                  {onArchive && (
                    <button
                      onClick={handleArchive}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </button>
                  )}
                  <div className="border-t my-1" />
                  <button
                    onClick={handleDelete}
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description preview */}
          {task.description && showDetails && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Task metadata */}
          <div className="space-y-2">
            {/* Priority and status */}
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs font-medium',
                  priorityColors[task.priority]
                )}
              >
                <span className="flex items-center gap-1">
                  {priorityIcons[task.priority]}
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              </Badge>

              {task.status && task.status !== 'todo' && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs font-medium',
                    task.status === 'completed' && 'bg-green-100 text-green-800 border-green-200',
                    task.status === 'in-progress' && 'bg-blue-100 text-blue-800 border-blue-200',
                    task.status === 'review' && 'bg-purple-100 text-purple-800 border-purple-200'
                  )}
                >
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </Badge>
              )}
            </div>

            {/* Due date */}
            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs">
                <Clock className={cn(
                  'w-3 h-3',
                  isOverdue ? 'text-red-500' : 'text-gray-400'
                )} />
                <span className={cn(
                  'font-medium',
                  isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                )}>
                  {formatDueDate(task.dueDate)}
                </span>
              </div>
            )}

            {/* Assignees */}
            {taskAssignees.length > 0 && (
              <div className="flex items-center gap-1">
                <UserIcon className="w-3 h-3 text-gray-400" />
                <div className="flex -space-x-2">
                  {taskAssignees.slice(0, 3).map((assignee) => (
                    <Avatar
                      key={assignee.id}
                      src={assignee.avatar}
                      alt={assignee.name}
                      size="xs"
                      className="border-2 border-white dark:border-gray-800"
                    />
                  ))}
                  {taskAssignees.length > 3 && (
                    <div className="flex items-center justify-center w-6 h-6 text-xs font-medium text-gray-600 bg-gray-100 border-2 border-white dark:border-gray-800 rounded-full">
                      +{taskAssignees.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Task stats */}
            <div className="flex items-center gap-3 pt-2 border-t">
              {task.commentCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MessageSquare className="w-3 h-3" />
                  <span>{task.commentCount}</span>
                </div>
              )}
              {task.attachmentCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Paperclip className="w-3 h-3" />
                  <span>{task.attachmentCount}</span>
                </div>
              )}
              {task.watcherIds && task.watcherIds.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Eye className="w-3 h-3" />
                  <span>{task.watcherIds.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Click overlay for details */}
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={() => setShowDetailsModal(true)}
        />
      </div>

      {/* Task Details Modal */}
      {showDetailsModal && (
        <TaskDetailsModal
          task={task}
          assignees={assignees}
          onClose={() => setShowDetailsModal(false)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </>
  );
}