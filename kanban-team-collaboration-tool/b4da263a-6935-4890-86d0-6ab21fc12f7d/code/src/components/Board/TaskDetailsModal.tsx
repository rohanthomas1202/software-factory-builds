'use client';

import { useState, useEffect, useRef } from 'react';
import { Task, User, TaskPriority, Comment, Attachment } from '@/lib/types';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Textarea } from '@/components/UI/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/Select';
import { Avatar } from '@/components/UI/Avatar';
import { Badge } from '@/components/UI/Badge';
import { Separator } from '@/components/UI/Separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/Tabs';
import { cn } from '@/lib/utils';
import { 
  X, 
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
  XCircle,
  Calendar,
  Tag,
  Link,
  MoreVertical,
  Send,
  Image,
  File,
  Download,
  ExternalLink,
  Users,
  AlertCircle,
  CheckSquare,
  Square
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useClickOutside } from '@/hooks/useClickOutside';
import { toast } from 'react-hot-toast';

interface TaskDetailsModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDuplicate?: (task: Task) => void;
  onArchive?: (taskId: string) => void;
  assignees?: User[];
  allUsers?: User[];
}

export function TaskDetailsModal({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
  onArchive,
  assignees = [],
  allUsers = []
}: TaskDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [activeTab, setActiveTab] = useState('details');
  const [newComment, setNewComment] = useState('');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([
    { id: '1', name: 'design_spec.pdf', size: '2.4 MB', type: 'pdf', uploadedAt: new Date('2024-01-15') },
    { id: '2', name: 'wireframe.png', size: '1.8 MB', type: 'image', uploadedAt: new Date('2024-01-14') },
    { id: '3', name: 'requirements.docx', size: '3.2 MB', type: 'document', uploadedAt: new Date('2024-01-13') },
  ]);
  const [comments, setComments] = useState<Comment[]>([
    { id: '1', userId: '1', content: 'Can we add more details about the acceptance criteria?', createdAt: new Date('2024-01-14'), user: { id: '1', name: 'Alex Johnson', email: 'alex@example.com', avatar: 'AJ' } },
    { id: '2', userId: '2', content: 'I\'ve updated the design based on feedback. Please review.', createdAt: new Date('2024-01-13'), user: { id: '2', name: 'Sarah Miller', email: 'sarah@example.com', avatar: 'SM' } },
  ]);

  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(assigneeDropdownRef, () => setShowAssigneeDropdown(false));
  useClickOutside(priorityDropdownRef, () => setShowPriorityDropdown(false));
  useClickOutside(statusDropdownRef, () => setShowStatusDropdown(false));

  const priorityColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
  };

  const priorityIcons = {
    low: <Flag className="w-4 h-4 text-green-600" />,
    medium: <Flag className="w-4 h-4 text-yellow-600" />,
    high: <Flag className="w-4 h-4 text-orange-600" />,
    critical: <Flag className="w-4 h-4 text-red-600" />
  };

  const statusColors = {
    backlog: 'bg-gray-100 text-gray-800 border-gray-200',
    todo: 'bg-blue-100 text-blue-800 border-blue-200',
    'in-progress': 'bg-purple-100 text-purple-800 border-purple-200',
    review: 'bg-amber-100 text-amber-800 border-amber-200',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  };

  const statusIcons = {
    backlog: <Square className="w-4 h-4" />,
    todo: <Square className="w-4 h-4" />,
    'in-progress': <AlertCircle className="w-4 h-4" />,
    review: <Eye className="w-4 h-4" />,
    completed: <CheckSquare className="w-4 h-4" />
  };

  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  const handleSave = () => {
    onUpdate(editedTask);
    setIsEditing(false);
    toast.success('Task updated successfully');
  };

  const handleCancel = () => {
    setEditedTask(task);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
      onClose();
      toast.success('Task deleted successfully');
    }
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(task);
      onClose();
      toast.success('Task duplicated successfully');
    }
  };

  const handleArchive = () => {
    if (onArchive) {
      onArchive(task.id);
      onClose();
      toast.success('Task archived successfully');
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        userId: 'current-user',
        content: newComment,
        createdAt: new Date(),
        user: { id: 'current-user', name: 'You', email: 'you@example.com', avatar: 'Y' }
      };
      setComments([newCommentObj, ...comments]);
      setNewComment('');
      toast.success('Comment added');
    }
  };

  const handleAddAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const newAttachment: Attachment = {
        id: Date.now().toString(),
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.type.startsWith('image/') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'document',
        uploadedAt: new Date()
      };
      setAttachments([newAttachment, ...attachments]);
      toast.success('Attachment added');
    }
  };

  const handleAssigneeSelect = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      const isAlreadyAssigned = editedTask.assigneeIds?.includes(userId);
      let newAssigneeIds = [...(editedTask.assigneeIds || [])];
      
      if (isAlreadyAssigned) {
        newAssigneeIds = newAssigneeIds.filter(id => id !== userId);
      } else {
        newAssigneeIds.push(userId);
      }
      
      setEditedTask({ ...editedTask, assigneeIds: newAssigneeIds });
      setShowAssigneeDropdown(false);
    }
  };

  const handlePrioritySelect = (priority: TaskPriority) => {
    setEditedTask({ ...editedTask, priority });
    setShowPriorityDropdown(false);
  };

  const handleStatusSelect = (status: Task['status']) => {
    setEditedTask({ ...editedTask, status });
    setShowStatusDropdown(false);
  };

  const getAssigneeById = (userId: string) => {
    return allUsers.find(user => user.id === userId);
  };

  const assignedUsers = editedTask.assigneeIds?.map(id => getAssigneeById(id)).filter(Boolean) as User[] || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Task" : "Task Details"}
      size="lg"
      className="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <Input
                value={editedTask.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                className="text-2xl font-bold mb-2"
                placeholder="Task title"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
            )}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Created {formatDistanceToNow(task.createdAt, { addSuffix: true })}</span>
              </div>
              {task.dueDate && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Due {format(task.dueDate, 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDuplicate}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleArchive}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
            {isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="w-4 h-4 mr-2" />
              Comments ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="attachments">
              <Paperclip className="w-4 h-4 mr-2" />
              Attachments ({attachments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              {isEditing ? (
                <Textarea
                  value={editedTask.description || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                  placeholder="Add a description..."
                  rows={4}
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {task.description || 'No description provided.'}
                </p>
              )}
            </div>

            {/* Task Properties */}
            <div className="grid grid-cols-2 gap-6">
              {/* Assignees */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Assignees</h3>
                <div className="relative" ref={assigneeDropdownRef}>
                  <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md">
                    {assignedUsers.map(user => (
                      <div key={user.id} className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-md">
                        <Avatar size="sm" name={user.name} />
                        <span className="text-sm">{user.name}</span>
                        {isEditing && (
                          <button
                            onClick={() => handleAssigneeSelect(user.id)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <button
                        onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                      >
                        <Users className="w-4 h-4" />
                        Add assignee
                      </button>
                    )}
                  </div>
                  {isEditing && showAssigneeDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {allUsers.map(user => (
                        <div
                          key={user.id}
                          onClick={() => handleAssigneeSelect(user.id)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer",
                            assignedUsers.some(u => u.id === user.id) && "bg-blue-50"
                          )}
                        >
                          <Avatar size="sm" name={user.name} />
                          <span className="text-sm">{user.name}</span>
                          {assignedUsers.some(u => u.id === user.id) && (
                            <CheckCircle className="w-4 h-4 text-blue-600 ml-auto" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Priority</h3>
                <div className="relative" ref={priorityDropdownRef}>
                  {isEditing ? (
                    <button
                      onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 border rounded-md w-full text-left",
                        priorityColors[editedTask.priority]
                      )}
                    >
                      {priorityIcons[editedTask.priority]}
                      <span className="capitalize">{editedTask.priority}</span>
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    </button>
                  ) : (
                    <Badge className={cn("capitalize", priorityColors[task.priority])}>
                      {priorityIcons[task.priority]}
                      {task.priority}
                    </Badge>
                  )}
                  {isEditing && showPriorityDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
                      {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map(priority => (
                        <div
                          key={priority}
                          onClick={() => handlePrioritySelect(priority)}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {priorityIcons[priority]}
                          <span className="capitalize">{priority}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
                <div className="relative" ref={statusDropdownRef}>
                  {isEditing ? (
                    <button
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 border rounded-md w-full text-left",
                        statusColors[editedTask.status]
                      )}
                    >
                      {statusIcons[editedTask.status]}
                      <span className="capitalize">{editedTask.status.replace('-', ' ')}</span>
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    </button>
                  ) : (
                    <Badge className={cn("capitalize", statusColors[task.status])}>
                      {statusIcons[task.status]}
                      {task.status.replace('-', ' ')}
                    </Badge>
                  )}
                  {isEditing && showStatusDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
                      {(['backlog', 'todo', 'in-progress', 'review', 'completed'] as Task['status'][]).map(status => (
                        <div
                          key={status}
                          onClick={() => handleStatusSelect(status)}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {statusIcons[status]}
                          <span className="capitalize">{status.replace('-', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Due Date</h3>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editedTask.dueDate ? format(editedTask.dueDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setEditedTask({ 
                      ...editedTask, 
                      dueDate: e.target.value ? new Date(e.target.value) : undefined 
                    })}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4" />
                    {task.dueDate ? format(task.dueDate, 'MMM d, yyyy') : 'No due date'}
                  </div>
                )}
              </div>
            </div>

            {/* Tags/Labels */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Labels</h3>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {editedTask.labels?.map((label, index) => (
                    <div key={index} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                      <Tag className="w-3 h-3" />
                      <span className="text-sm">{label}</span>
                      <button
                        onClick={() => {
                          const newLabels = [...(editedTask.labels || [])];
                          newLabels.splice(index, 1);
                          setEditedTask({ ...editedTask, labels: newLabels });
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const label = prompt('Enter label name:');
                      if (label) {
                        setEditedTask({
                          ...editedTask,
                          labels: [...(editedTask.labels || []), label]
                        });
                      }
                    }}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Tag className="w-3 h-3" />
                    Add label
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {task.labels?.map((label, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {label}
                    </Badge>
                  )) || <span className="text-gray-500">No labels</span>}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            {/* Add comment */}
            <div className="space-y-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
              />
              <div className="flex justify-end">
                <Button onClick={handleAddComment}>
                  <Send className="w-4 h-4 mr-2" />
                  Post Comment
                </Button>
              </div>
            </div>

            <Separator />

            {/* Comments list */}
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar size="sm" name={comment.user.name} />
                      <div>
                        <p className="text-sm font-medium">{comment.user.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-700 ml-10">{comment.content}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4">
            {/* Upload attachment */}
            <div>
              <label className="block">
                <input
                  type="file"
                  onChange={handleAddAttachment}
                  className="hidden"
                  multiple
                />
                <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-md hover:border-gray-400 cursor-pointer">
                  <Paperclip className="w-5 h-5" />
                  <span className="text-sm font-medium">Click to upload or drag and drop</span>
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-1">Supports images, PDFs, and documents up to 10MB</p>
            </div>

            {/* Attachments list */}
            <div className="space-y-2">
              {attachments.map(attachment => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {attachment.type === 'image' ? (
                      <Image className="w-8 h-8 text-blue-600" />
                    ) : attachment.type === 'pdf' ? (
                      <File className="w-8 h-8 text-red-600" />
                    ) : (
                      <File className="w-8 h-8 text-gray-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{attachment.name}</p>
                      <p className="text-xs text-gray-500">
                        {attachment.size} • {format(attachment.uploadedAt, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-500">
            Last updated {formatDistanceToNow(task.updatedAt, { addSuffix: true })}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Task
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}