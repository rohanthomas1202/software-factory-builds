'use client';

import { useState, useEffect } from 'react';
import { Task, Comment, User, TaskPriority } from '@/lib/types';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Textarea } from '@/components/UI/Textarea';
import { Avatar } from '@/components/UI/Avatar';
import { Badge } from '@/components/UI/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/Select';
import { Label } from '@/components/UI/Label';
import { Calendar } from '@/components/UI/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/UI/DropdownMenu';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import {
  CalendarIcon,
  Clock,
  Flag,
  MessageSquare,
  Paperclip,
  User as UserIcon,
  MoreVertical,
  Edit2,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  Download,
} from 'lucide-react';

export interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onTaskUpdated: (updatedTask: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

export function TaskDetailModal({
  isOpen,
  onClose,
  task,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setAssigneeId(task.assigneeId || '');
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      fetchComments();
      fetchAvailableUsers();
    }
  }, [task]);

  const fetchComments = async () => {
    if (!task) return;

    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const fetchAvailableUsers = async () => {
    if (!task) return;

    try {
      const response = await fetch(`/api/boards/${task.boardId}/users`);
      if (response.ok) {
        const users = await response.json();
        setAvailableUsers(users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSave = async () => {
    if (!task) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          priority,
          assigneeId: assigneeId || undefined,
          dueDate: dueDate?.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const updatedTask = await response.json();
      onTaskUpdated(updatedTask);
      setIsEditing(false);
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      onTaskDeleted(task.id);
      onClose();
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddComment = async () => {
    if (!task || !newComment.trim()) return;

    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const newCommentData = await response.json();
      setComments([...comments, newCommentData]);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleCancel = () => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setAssigneeId(task.assigneeId || '');
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
    }
    setIsEditing(false);
  };

  const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-green-500' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { value: 'high', label: 'High', color: 'bg-orange-500' },
    { value: 'critical', label: 'Critical', color: 'bg-red-500' },
  ];

  const getAssignee = () => {
    return availableUsers.find(user => user.id === assigneeId);
  };

  if (!task) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : task.title}
      description={isEditing ? 'Update task details' : `Created ${formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Task Details */}
        <div className="space-y-4">
          {isEditing ? (
            <>
              <div>
                <Label htmlFor="edit-title" required>
                  Title
                </Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task description"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select value={priority} onValueChange={(value: TaskPriority) => setPriority(value)}>
                    <SelectTrigger id="edit-priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${option.color}`} />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-assignee">Assignee</Label>
                  <Select value={assigneeId} onValueChange={setAssigneeId}>
                    <SelectTrigger id="edit-assignee">
                      <SelectValue placeholder="Unassigned">
                        {assigneeId ? (
                          <div className="flex items-center gap-2">
                            <Avatar user={getAssignee()} size="xs" />
                            <span>{getAssignee()?.name}</span>
                          </div>
                        ) : (
                          'Unassigned'
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <Avatar user={user} size="xs" />
                            <span>{user.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dueDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, 'PPP') : 'No due date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{task.title}</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="space-y-1">
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Flag className="h-4 w-4" />
                    Priority
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      priority === 'low' && 'bg-green-50 text-green-700 border-green-200',
                      priority === 'medium' && 'bg-yellow-50 text-yellow-700 border-yellow-200',
                      priority === 'high' && 'bg-orange-50 text-orange-700 border-orange-200',
                      priority === 'critical' && 'bg-red-50 text-red-700 border-red-200'
                    )}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <UserIcon className="h-4 w-4" />
                    Assignee
                  </div>
                  <div className="flex items-center gap-2">
                    {assigneeId ? (
                      <>
                        <Avatar user={getAssignee()} size="sm" />
                        <span className="text-sm font-medium">{getAssignee()?.name}</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">Unassigned</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    Due Date
                  </div>
                  <div className="text-sm font-medium">
                    {dueDate ? format(dueDate, 'MMM d, yyyy') : 'No due date'}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Created
                  </div>
                  <div className="text-sm font-medium">
                    {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Comments Section */}
        <div className="pt-6 border-t">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments ({comments.length})
          </h4>

          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar user={comment.author} size="sm" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{comment.author.name}</span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))}

            <div className="pt-4">
              <div className="flex gap-3">
                <Avatar size="sm" />
                <div className="flex-1 space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      size="sm"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}