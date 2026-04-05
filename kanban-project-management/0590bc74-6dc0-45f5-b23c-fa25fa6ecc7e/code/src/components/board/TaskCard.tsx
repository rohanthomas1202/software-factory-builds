'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Task } from '@/lib/types'
import { 
  GripVertical, 
  MoreVertical, 
  Clock, 
  MessageSquare,
  Paperclip,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Tag
} from 'lucide-react'
import { Dropdown } from '@/components/ui/Dropdown'
import { formatRelativeTime } from '@/lib/utils'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'

interface TaskCardProps {
  task: Task
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>
  onDelete: (taskId: string) => Promise<void>
  onDragStart: () => void
}

export function TaskCard({ task, onUpdate, onDelete, onDragStart }: TaskCardProps) {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const priorityColors = {
    low: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
    critical: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
  }

  const statusColors = {
    todo: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
    in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    review: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
    done: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
  }

  const handleStatusChange = async (newStatus: Task['status']) => {
    await onUpdate(task.id, { status: newStatus })
  }

  const handlePriorityChange = async (newPriority: Task['priority']) => {
    await onUpdate(task.id, { priority: newPriority })
  }

  const handleDelete = () => {
    onDelete(task.id)
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id)
    onDragStart()
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'

  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsDetailModalOpen(true)}
        className={cn(
          'group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer',
          isOverdue && 'border-red-300 dark:border-red-700/50',
          task.status === 'done' && 'opacity-75'
        )}
      >
        {/* Drag Handle */}
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
        </div>

        {/* Task Content */}
        <div className="p-4 pl-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={cn(
                  'font-medium text-gray-900 dark:text-white',
                  task.status === 'done' && 'line-through text-gray-500 dark:text-gray-400'
                )}>
                  {task.title}
                </h4>
                {isOverdue && (
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                )}
              </div>
              
              {task.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                  {task.description}
                </p>
              )}
            </div>
            
            <Dropdown
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity',
                    isHovered && 'opacity-100'
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              }
              align="end"
            >
              <Dropdown.Label>Change Status</Dropdown.Label>
              <Dropdown.Item onClick={() => handleStatusChange('todo')}>
                <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
                To Do
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleStatusChange('in_progress')}>
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                In Progress
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleStatusChange('review')}>
                <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                Review
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleStatusChange('done')}>
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                Done
              </Dropdown.Item>
              
              <Dropdown.Separator />
              
              <Dropdown.Label>Change Priority</Dropdown.Label>
              <Dropdown.Item onClick={() => handlePriorityChange('low')}>
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                Low
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handlePriorityChange('medium')}>
                <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                Medium
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handlePriorityChange('high')}>
                <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                High
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handlePriorityChange('critical')}>
                <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                Critical
              </Dropdown.Item>
              
              <Dropdown.Separator />
              <Dropdown.Item 
                onClick={handleDelete}
                className="text-red-600 dark:text-red-400"
              >
                Delete Task
              </Dropdown.Item>
            </Dropdown>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {task.tags.slice(0, 3).map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs px-2 py-0.5"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  +{task.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Priority Badge */}
              <Badge className={cn('text-xs', priorityColors[task.priority])}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </Badge>
              
              {/* Status Badge */}
              <Badge className={cn('text-xs', statusColors[task.status])}>
                {task.status.replace('_', ' ').charAt(0).toUpperCase() + task.status.replace('_', ' ').slice(1)}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Due Date */}
              {task.dueDate && (
                <div className={cn(
                  'flex items-center gap-1 text-xs',
                  isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                )}>
                  <Calendar className="h-3 w-3" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </div>
              )}
              
              {/* Comments */}
              {task.comments && task.comments.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <MessageSquare className="h-3 w-3" />
                  {task.comments.length}
                </div>
              )}
              
              {/* Attachments */}
              {task.attachments && task.attachments.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Paperclip className="h-3 w-3" />
                  {task.attachments.length}
                </div>
              )}
            </div>
          </div>

          {/* Assignee & Time */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {task.assignee ? (
                <Avatar
                  src={task.assignee.avatar}
                  fallback={task.assignee.name.charAt(0)}
                  size="sm"
                  status="online"
                />
              ) : (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <User className="h-3 w-3" />
                  Unassigned
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {formatRelativeTime(new Date(task.updatedAt))}
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        {task.status === 'in_progress' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-b-lg" />
        )}
        {task.status === 'done' && (
          <div className="absolute top-3 right-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={task.id}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onTaskUpdate={onUpdate}
        onTaskDelete={onDelete}
      />
    </>
  )
}