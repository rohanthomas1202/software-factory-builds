'use client';

import { useState, useRef } from 'react';
import { Column, Task } from '@/lib/types';
import { TaskCard } from './TaskCard';
import { AddTaskModal } from './AddTaskModal';
import { Button } from '@/components/UI/Button';
import { DragItem } from '@/hooks/useDragAndDrop';
import { cn } from '@/lib/utils';
import { 
  MoreVertical, 
  Plus, 
  GripVertical, 
  Trash2, 
  Edit2, 
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/UI/DropdownMenu';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onTaskAdded: () => void;
  onTaskUpdated: () => void;
  onColumnDelete: (columnId: string) => void;
  onColumnUpdate: (columnId: string, updates: Partial<Column>) => void;
  onDragStart: (item: DragItem) => void;
  isDragging: boolean;
  dragItem: DragItem | null;
}

export function KanbanColumn({
  column,
  tasks,
  onTaskAdded,
  onTaskUpdated,
  onColumnDelete,
  onColumnUpdate,
  onDragStart,
  isDragging,
  dragItem,
}: KanbanColumnProps) {
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const [editDescription, setEditDescription] = useState(column.description || '');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [taskLimit, setTaskLimit] = useState(column.taskLimit || 0);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleEditSubmit = () => {
    if (editName.trim()) {
      onColumnUpdate(column.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        taskLimit: taskLimit || undefined,
      });
      setIsEditing(false);
    }
  };

  const handleTaskLimitChange = (value: string) => {
    const num = parseInt(value);
    setTaskLimit(isNaN(num) ? 0 : Math.max(0, num));
  };

  const getTaskLimitColor = () => {
    if (taskLimit === 0) return 'text-muted-foreground';
    if (tasks.length >= taskLimit) return 'text-red-600 dark:text-red-400';
    if (tasks.length >= taskLimit * 0.8) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  const handleDragStart = (task: Task) => {
    onDragStart({
      id: task.id,
      type: 'task',
      data: task,
    });
  };

  const isTaskBeingDragged = (taskId: string) => {
    return dragItem?.type === 'task' && dragItem.id === taskId;
  };

  const getColumnColor = () => {
    const colors: Record<string, string> = {
      todo: 'border-blue-500/20 bg-blue-500/5',
      in_progress: 'border-amber-500/20 bg-amber-500/5',
      review: 'border-purple-500/20 bg-purple-500/5',
      done: 'border-emerald-500/20 bg-emerald-500/5',
    };
    return colors[column.status] || 'border-gray-500/20 bg-gray-500/5';
  };

  const getStatusText = () => {
    const statusMap: Record<string, string> = {
      todo: 'To Do',
      in_progress: 'In Progress',
      review: 'Review',
      done: 'Done',
    };
    return statusMap[column.status] || column.status;
  };

  return (
    <div className={cn(
      'flex flex-col h-full rounded-xl border transition-all duration-200',
      getColumnColor(),
      isDragging && dragItem?.type === 'task' && 'ring-1 ring-primary/50'
    )}>
      {/* Column Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            
            {isEditing ? (
              <div className="flex-1">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSubmit();
                    if (e.key === 'Escape') {
                      setIsEditing(false);
                      setEditName(column.name);
                      setEditDescription(column.description || '');
                    }
                  }}
                  className="w-full px-2 py-1 rounded border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{column.name}</h3>
                {column.description && (
                  <p className="text-sm text-muted-foreground mt-1">{column.description}</p>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-8 w-8 p-0"
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Column
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsCollapsed(!isCollapsed)}>
                    {isCollapsed ? (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Expand Column
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Collapse Column
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Task Limit
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={taskLimit}
                      onChange={(e) => handleTaskLimitChange(e.target.value)}
                      onBlur={() => {
                        if (taskLimit !== column.taskLimit) {
                          onColumnUpdate(column.id, { taskLimit: taskLimit || undefined });
                        }
                      }}
                      className="w-full px-2 py-1 text-sm rounded border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="No limit"
                    />
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this column? Tasks will be moved to the first available column.')) {
                        onColumnDelete(column.id);
                      }
                    }}
                    className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Column
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              column.status === 'todo' && 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
              column.status === 'in_progress' && 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
              column.status === 'review' && 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
              column.status === 'done' && 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
            )}>
              {getStatusText()}
            </span>
            
            {taskLimit > 0 && (
              <span className={cn('text-xs font-medium', getTaskLimitColor())}>
                {tasks.length}/{taskLimit}
              </span>
            )}
          </div>
          
          <span className="text-muted-foreground">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>
        
        {isEditing && (
          <div className="mt-3 space-y-2">
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Column description (optional)"
              className="w-full px-2 py-1 text-sm rounded border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleEditSubmit}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditName(column.name);
                  setEditDescription(column.description || '');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Task List */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                'transition-all duration-200',
                isTaskBeingDragged(task.id) && 'opacity-50 scale-95'
              )}
              draggable
              onDragStart={() => handleDragStart(task)}
            >
              <TaskCard
                task={task}
                onUpdate={onTaskUpdated}
                onDelete={onTaskUpdated}
              />
            </div>
          ))}
          
          {tasks.length === 0 && (
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">No tasks yet</p>
            </div>
          )}
        </div>
      )}

      {/* Add Task Button */}
      {!isCollapsed && (
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddTaskModal(true)}
            className="w-full justify-center gap-2 hover:bg-primary/5 hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSubmit={async (taskData) => {
          try {
            const response = await fetch('/api/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...taskData,
                columnId: column.id,
                boardId: column.boardId,
              }),
            });

            if (!response.ok) throw new Error('Failed to create task');
            
            onTaskAdded();
            setShowAddTaskModal(false);
          } catch (error) {
            console.error('Error creating task:', error);
            throw error;
          }
        }}
        columnId={column.id}
        boardId={column.boardId}
      />
    </div>
  );
}