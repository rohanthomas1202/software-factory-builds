'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Comment } from '@/types';
import { 
  Send, 
  Heart, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Reply, 
  Flag, 
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Check,
  X
} from 'lucide-react';

interface CommentSectionProps {
  recipeId: string;
  initialComments?: Comment[];
  className?: string;
}

export function CommentSection({ recipeId, initialComments = [], className }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialComments.length > 0) {
      setComments(initialComments);
    } else {
      loadComments();
    }
  }, [recipeId, initialComments]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/recipes/${recipeId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to comment',
        type: 'warning',
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: 'Empty Comment',
        description: 'Please write a comment before submitting',
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/recipes/${recipeId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          parentId: replyingTo || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
        setReplyingTo(null);
        toast({
          title: 'Success',
          description: 'Comment added successfully',
          type: 'success',
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add comment');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add comment',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast({
        title: 'Empty Comment',
        description: 'Comment cannot be empty',
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/recipes/${recipeId}/comments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          content: editContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => prev.map(comment =>
          comment.id === commentId ? data.comment : comment
        ));
        setEditingComment(null);
        setEditContent('');
        toast({
          title: 'Success',
          description: 'Comment updated successfully',
          type: 'success',
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update comment');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update comment',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/recipes/${recipeId}/comments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });

      if (response.ok) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
        toast({
          title: 'Success',
          description: 'Comment deleted successfully',
          type: 'success',
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete comment');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete comment',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to like comments',
        type: 'warning',
      });
      return;
    }

    try {
      const response = await fetch(`/api/recipes/${recipeId}/comments/${commentId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => prev.map(comment =>
          comment.id === commentId ? data.comment : comment
        ));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to like comment',
        type: 'error',
      });
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    setShowReplyForm(commentId);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setShowReplyForm(null);
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const renderComment = (comment: Comment, depth = 0) => {
    const isOwner = user?.id === comment.authorId;
    const isEditing = editingComment === comment.id;
    const isReplying = showReplyForm === comment.id;

    return (
      <div
        key={comment.id}
        className={cn(
          'space-y-3',
          depth > 0 && 'ml-8 pl-4 border-l-2 border-gray-200 dark:border-gray-700'
        )}
      >
        <div className="flex items-start gap-3">
          <Avatar
            src={comment.authorAvatar}
            alt={comment.authorName}
            size="sm"
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {comment.authorName}
                </span>
                {comment.authorId === user?.id && (
                  <Badge variant="primary" size="sm" rounded="full">
                    You
                  </Badge>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              {isOwner && !isEditing && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStartEdit(comment)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteComment(comment.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="w-full"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpdateComment(comment.id)}
                    isLoading={isSubmitting}
                    disabled={!editContent.trim()}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {comment.content}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLikeComment(comment.id)}
                    className={cn(
                      'h-8 px-2',
                      comment.likes?.includes(user?.id || '') && 'text-red-500'
                    )}
                  >
                    <Heart className="h-4 w-4 mr-1" />
                    {comment.likes?.length || 0}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReply(comment.id)}
                    className="h-8 px-2"
                  >
                    <Reply className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                  {!isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-gray-500 hover:text-gray-700"
                    >
                      <Flag className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </>
            )}

            {isReplying && (
              <div className="mt-4 pl-4 border-l-2 border-primary-300 dark:border-primary-700">
                <Textarea
                  ref={textareaRef}
                  placeholder="Write your reply..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  className="w-full"
                />
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={handleSubmitComment}
                    isLoading={isSubmitting}
                    disabled={!newComment.trim()}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelReply}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-4">
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Comments ({comments.length})
          </h3>
        </div>
        <Badge variant="primary">
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </Badge>
      </div>

      {/* New Comment Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <Avatar
            src={user?.avatarUrl}
            alt={user?.displayName}
            size="md"
          />
          <div className="flex-1">
            <Textarea
              placeholder="Share your thoughts about this recipe..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="w-full"
              disabled={!isAuthenticated}
            />
            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {!isAuthenticated ? (
                  <span>Please log in to comment</span>
                ) : (
                  <span>Press Enter to submit</span>
                )}
              </div>
              <Button
                onClick={handleSubmitComment}
                isLoading={isSubmitting}
                disabled={!isAuthenticated || !newComment.trim() || isSubmitting}
                leftIcon={<Send className="h-4 w-4" />}
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              No comments yet
            </h4>
            <p className="text-gray-500 dark:text-gray-400">
              Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  );
}