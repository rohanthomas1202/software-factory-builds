'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Spinner } from '@/components/ui/Spinner'
import { PriorityBadge } from './PriorityBadge'
import { AssigneePicker } from './AssigneePicker'
import { DueDatePicker } from './DueDatePicker'
import { CommentThread } from './CommentThread'
import { Task, User, Comment, TaskPriority, TaskStatus } from '@/lib/types'
import { toast } from '@/components/ui/Toast'
import { 
  Calendar, 
  User as UserIcon, 
  Tag, 
  Clock, 
  Paperclip, 
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Edit2,
  Save,
  X,
  Trash2,
  MoreVertical,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Copy,
  Share2,
  Download,
  Printer
} from 'lucide-react'
import { Dropdown } from '@/components/ui/Dropdown'
import { formatRelativeTime, formatDate } from '@/lib/utils'

interface TaskDetailProps {
  taskId: string
  onClose?: () => void
  onTaskUpdate?: (task: Task) => void
  onTaskDelete?: (taskId: string) => void
  className?: string
}

export function TaskDetail({ taskId, onClose, onTaskUpdate, onTaskDelete, className }: TaskDetailProps) {
  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editedTask, setEditedTask] = useState<Partial<Task>>({})
  const [teamMembers, setTeamMembers] = useState<User[]>([])

  // Fetch task details
  useEffect(() => {
    fetchTask()
    fetchTeamMembers()
  }, [taskId])

  const fetchTask = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/tasks/${taskId}`)
      if (!response.ok) throw new Error('Failed to fetch task')
      const data = await response.json()
      setTask(data.task)
      setEditedTask(data.task)
    } catch (error) {
      console.error('Error fetching task:', error)
      toast.error('Failed to load task details')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team')
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data.members || [])
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const handleSave = async () => {
    if (!task || !editedTask) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedTask)
      })

      if (!response.ok) throw new Error('Failed to update task')

      const data = await response.json()
      setTask(data.task)
      setEditedTask(data.task)
      setIsEditing(false)
      onTaskUpdate?.(data.task)
      toast.success('Task updated successfully')
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!task) return

    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete task')

      toast.success('Task deleted successfully')
      onTaskDelete?.(taskId)
      onClose?.()
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAssigneeChange = (assigneeId: string | null) => {
    setEditedTask(prev => ({ ...prev, assigneeId }))
  }

  const handleDueDateChange = (date: Date | null) => {
    setEditedTask(prev => ({ ...prev, dueDate: date || undefined }))
  }

  const handlePriorityChange = (priority: TaskPriority) => {
    setEditedTask(prev => ({ ...prev, priority }))
  }

  const handleStatusChange = (status: TaskStatus) => {
    setEditedTask(prev => ({ ...prev, status }))
  }

  const handleCommentAdded = (comment: Comment) => {
    setTask(prev => prev ? {
      ...prev,
      comments: [...prev.comments, comment]
    } : null)
  }

  const handleCommentDeleted = (commentId: string) => {
    setTask(prev => prev ? {
      ...prev,
      comments: prev.comments.filter(c => c.id !== commentId)
    } : null)
  }

  const copyTaskLink = () => {
    const url = `${window.location.origin}/board/${task?.boardId}?task=${taskId}`
    navigator.clipboard.writeText(url)
    toast.success('Task link copied to clipboard')
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className={cn('p-8 text-center', className)}>
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Task not found</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">The task you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button variant="outline" onClick={onClose}>
          Go Back
        </Button>
      </div>
    )
  }

  const assignee = teamMembers.find(member => member.id === task.assigneeId)
  const createdBy = teamMembers.find(member => member.id === task.createdById)

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b dark:border-gray-800">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {isEditing ? (
              <Input
                value={editedTask.title || ''}
                onChange={(e) => setEditedTask(prev => ({ ...prev, title: e.target.value }))}
                className="text-2xl font-bold"
                autoFocus
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{task.title}</h2>
            )}
            <div className="flex items-center gap-2">
              <PriorityBadge priority={task.priority} size="lg" />
              <Badge variant={task.status === 'completed' ? 'success' : 'secondary'}>
                {task.status}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              #{task.id.slice(0, 8)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Created {formatRelativeTime(task.createdAt)}
            </span>
            {task.updatedAt && task.updatedAt !== task.createdAt && (
              <span className="flex items-center gap-1">
                <Edit2 className="h-4 w-4" />
                Updated {formatRelativeTime(task.updatedAt)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dropdown
            trigger={
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            }
          >
            <Dropdown.Item onClick={() => setIsEditing(!isEditing)}>
              <Edit2 className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancel Edit' : 'Edit Task'}
            </Dropdown.Item>
            <Dropdown.Item onClick={copyTaskLink}>
              <LinkIcon className="h-4 w-4 mr-2" />
              Copy Link
            </Dropdown.Item>
            <Dropdown.Item>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Dropdown.Item>
            <Dropdown.Item>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Dropdown.Item>
            <Dropdown.Item>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Dropdown.Item>
            <Dropdown.Separator />
            <Dropdown.Item 
              onClick={handleDelete}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Task
            </Dropdown.Item>
          </Dropdown>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Description</h3>
                {!isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
              {isEditing ? (
                <Textarea
                  value={editedTask.description || ''}
                  onChange={(e) => setEditedTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add a detailed description..."
                  rows={6}
                  className="mb-4"
                />
              ) : (
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  {task.description ? (
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{task.description}</p>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-500 italic">No description provided</p>
                  )}
                </div>
              )}
            </div>

            {/* Comments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Comments ({task.comments.length})
                </h3>
              </div>
              <CommentThread
                taskId={taskId}
                comments={task.comments}
                onCommentAdded={handleCommentAdded}
                onCommentDeleted={handleCommentDeleted}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Details */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Task Details</h3>
              
              {/* Assignee */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Assignee
                  </span>
                  {isEditing && (
                    <Button variant="ghost" size="sm" onClick={() => handleAssigneeChange(null)}>
                      Clear
                    </Button>
                  )}
                </div>
                {isEditing ? (
                  <AssigneePicker
                    users={teamMembers}
                    selectedUserId={editedTask.assigneeId || null}
                    onSelect={handleAssigneeChange}
                  />
                ) : assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar src={assignee.avatar} fallback={assignee.name} size="sm" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-500 italic">Unassigned</span>
                )}
              </div>

              {/* Due Date */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Due Date
                  </span>
                  {isEditing && editedTask.dueDate && (
                    <Button variant="ghost" size="sm" onClick={() => handleDueDateChange(null)}>
                      Clear
                    </Button>
                  )}
                </div>
                {isEditing ? (
                  <DueDatePicker
                    selectedDate={editedTask.dueDate ? new Date(editedTask.dueDate) : null}
                    onSelect={handleDueDateChange}
                  />
                ) : task.dueDate ? (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className={cn(
                      'text-sm',
                      new Date(task.dueDate) < new Date() && task.status !== 'completed'
                        ? 'text-red-600 dark:text-red-400 font-medium'
                        : 'text-gray-900 dark:text-gray-100'
                    )}>
                      {formatDate(task.dueDate)}
                      {new Date(task.dueDate) < new Date() && task.status !== 'completed' && ' (Overdue)'}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-500 italic">No due date</span>
                )}
              </div>

              {/* Priority */}
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  Priority
                </span>
                {isEditing ? (
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map((priority) => (
                      <Button
                        key={priority}
                        variant={editedTask.priority === priority ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePriorityChange(priority)}
                        className="capitalize"
                      >
                        {priority}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <PriorityBadge priority={task.priority} />
                )}
              </div>

              {/* Status */}
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  Status
                </span>
                {isEditing ? (
                  <div className="flex gap-2 flex-wrap">
                    {(['todo', 'in_progress', 'review', 'completed'] as TaskStatus[]).map((status) => (
                      <Button
                        key={status}
                        variant={editedTask.status === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusChange(status)}
                        className="capitalize"
                      >
                        {status.replace('_', ' ')}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <Badge variant={task.status === 'completed' ? 'success' : 'secondary'} className="capitalize">
                    {task.status.replace('_', ' ')}
                  </Badge>
                )}
              </div>

              {/* Created By */}
              {createdBy && (
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                    <UserIcon className="h-4 w-4" />
                    Created By
                  </span>
                  <div className="flex items-center gap-2">
                    <Avatar src={createdBy.avatar} fallback={createdBy.name} size="sm" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{createdBy.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Attachments</h3>
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {task.attachments && task.attachments.length > 0 ? (
                  task.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                          {attachment.name}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-500 italic text-center py-2">
                    No attachments
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {isEditing && (
        <div className="flex items-center justify-between p-6 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            All changes are saved automatically when you click Save
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}