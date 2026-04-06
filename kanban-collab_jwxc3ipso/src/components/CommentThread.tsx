'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { User, Comment } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, MoreVertical, Trash2, Edit, Check, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommentThreadProps {
  cardId: string;
  workspaceId: string;
  currentUser: User;
}

interface EnrichedComment extends Comment {
  author: User;
}

export default function CommentThread({ cardId, workspaceId, currentUser }: CommentThreadProps) {
  const [comments, setComments] = useState<EnrichedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [workspaceMembers, setWorkspaceMembers] = useState<User[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cards/${cardId}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      setComments(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  const fetchWorkspaceMembers = useCallback(async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (!response.ok) return;
      const data = await response.json();
      setWorkspaceMembers(data.data?.map((m: any) => m.user) || []);
    } catch (err) {
      console.error('Failed to fetch workspace members:', err);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchComments();
    fetchWorkspaceMembers();
  }, [fetchComments, fetchWorkspaceMembers]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/cards/${cardId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to post comment');
      }

      const data = await response.json();
      setComments(prev => [data.data, ...prev]);
      setNewComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update comment');
      }

      const data = await response.json();
      setComments(prev =>
        prev.map(comment => (comment.id === commentId ? data.data : comment))
      );
      setEditingCommentId(null);
      setEditContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete comment');
      }

      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);

    // Check for @ mention
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1 && /\s$/.test(textBeforeCursor.substring(lastAtIndex + 1)) === false) {
      const searchTerm = textBeforeCursor.substring(lastAtIndex + 1);
      setMentionSearch(searchTerm);
      setMentionPosition(lastAtIndex);
      setShowMentionDropdown(true);
    } else {
      setShowMentionDropdown(false);
    }
  };

  const insertMention = (userId: string, name: string) => {
    const beforeMention = newComment.substring(0, mentionPosition);
    const afterMention = newComment.substring(mentionPosition + mentionSearch.length + 1);
    const mentionText = `@{${userId}}`;
    setNewComment(beforeMention + mentionText + ' ' + afterMention);
    setShowMentionDropdown(false);
    setMentionSearch('');
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPos = beforeMention.length + mentionText.length + 1;
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const filteredMembers = workspaceMembers.filter(member =>
    member.name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    member.email.toLowerCase().includes(mentionSearch.toLowerCase())
  ).filter(member => member.id !== currentUser.id);

  const renderCommentContent = (content: string) => {
    const parts = content.split(/(@\{[a-zA-Z0-9-]+\})/g);
    return parts.map((part, index) => {
      const match = part.match(/@\{([a-zA-Z0-9-]+)\}/);
      if (match) {
        const userId = match[1];
        const member = workspaceMembers.find(m => m.id === userId);
        return (
          <span
            key={index}
            className="inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-sm font-medium text-blue-800"
          >
            @{member?.name || 'Unknown'}
          </span>
        );
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => {
            setError(null);
            fetchComments();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={newComment}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment... Use @ to mention someone"
          className="min-h-[100px] resize-none pr-10"
          disabled={submitting}
        />
        <Button
          size="icon"
          className="absolute bottom-2 right-2 h-8 w-8"
          onClick={handleSubmitComment}
          disabled={!newComment.trim() || submitting}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>

        {showMentionDropdown && filteredMembers.length > 0 && (
          <div
            ref={mentionDropdownRef}
            className="absolute bottom-full left-0 z-10 mb-1 w-48 rounded-md border bg-white shadow-lg"
          >
            {filteredMembers.map(member => (
              <button
                key={member.id}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100"
                onClick={() => insertMention(member.id, member.name)}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.avatarUrl} />
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 truncate">
                  <div className="text-sm font-medium">{member.name}</div>
                  <div className="text-xs text-gray-500">{member.email}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No comments yet. Start the conversation!
          </div>
        ) : (
          comments.map(comment => (
            <div
              key={comment.id}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.author.avatarUrl} />
                    <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{comment.author.name}</div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                      {comment.updatedAt !== comment.createdAt && ' (edited)'}
                    </div>
                  </div>
                </div>

                {comment.authorId === currentUser.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setEditContent(comment.content);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {editingCommentId === comment.id ? (
                <div className="mt-4 space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditContent('');
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateComment(comment.id)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 whitespace-pre-wrap text-gray-700">
                  {renderCommentContent(comment.content)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}