'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { toast } from '@/components/ui/Toast'
import { Comment, User } from '@/lib/types'
import { formatRelativeTime } from '@/lib/utils'
import { 
  Send, 
  Edit2, 
  Trash2, 
  MoreVertical, 
  Check, 
  X,
  Smile,
  Paperclip
} from 'lucide-react'

interface CommentThreadProps {
  comments: Comment[]
  currentUser: User
  users: User[]
  onAddComment: (content: string) => Promise<Comment | null>
  onUpdateComment: (commentId: string, content: string) => Promise<void>
  onDeleteComment: (commentId: string) => Promise<void>
  className?: string
}

export function CommentThread({
  comments,
  currentUser,
  users,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  className
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [showActionsFor, setShowActionsFor] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const sortedComments = [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId) || currentUser
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      await onAddComment(newComment.trim())
      setNewComment('')
      toast.success('Comment added')
    } catch (error) {
      toast.error('Failed to add comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditContent(comment.content)
    setShowActionsFor(null)
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditContent('')
  }

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    try {
      await onUpdateComment(commentId, editContent.trim())
      setEditingCommentId(null)
      setEditContent('')
      toast.success('Comment updated')
    } catch (error) {
      toast.error('Failed to update comment')
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      await onDeleteComment(commentId)
      setShowActionsFor(null)
      toast.success('Comment deleted')
    } catch (error) {
      toast.error('Failed to delete comment')
    }
  }

  const isCurrentUserComment = (comment: Comment) => {
    return comment.userId === currentUser.id
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [newComment])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <Avatar
            src={currentUser.avatar}
            fallback={currentUser.name.charAt(0)}
            size="sm"
          />
          <div className="flex-1">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full min-h-[80px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <button
                  type="button"
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Add emoji"
                >
                  <Smile className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Press Enter to add comment, Shift+Enter for new line
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <Spinner size="sm" className="mr-1" />
                ) : (
                  <Send className="w-4 h-4 mr-1" />
                )}
                Comment
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-6">
        {sortedComments.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
              <Send className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              No comments yet. Start the conversation!
            </p>
          </div>
        ) : (
          sortedComments.map((comment) => {
            const user = getUserById(comment.userId)
            const isEditing = editingCommentId === comment.id
            const showActions = showActionsFor === comment.id

            return (
              <div
                key={comment.id}
                className="group relative"
                onMouseEnter={() => !isEditing && setShowActionsFor(comment.id)}
                onMouseLeave={() => !isEditing && setShowActionsFor(null)}
              >
                <div className="flex gap-3">
                  <Avatar
                    src={user.avatar}
                    fallback={user.name.charAt(0)}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {user.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatRelativeTime(comment.createdAt)}
                        {comment.updatedAt !== comment.createdAt && ' (edited)'}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full min-h-[60px] p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSaveEdit(comment.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}

                    {/* Actions */}
                    {isCurrentUserComment(comment) && !isEditing && showActions && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleStartEdit(comment)}
                          className="h-7 px-2 text-xs"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleDelete(comment.id)}
                          className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Actions Menu (for mobile/alternative) */}
                  {isCurrentUserComment(comment) && !isEditing && !showActions && (
                    <div className="lg:hidden">
                      <button
                        onClick={() => setShowActionsFor(showActionsFor === comment.id ? null : comment.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}