"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, Edit2, Trash2, Check, X, Loader2, MoreVertical } from "lucide-react";
import { Comment, User as UserType } from "@/lib/types";
import { useToast } from "@/hooks/useToast";
import { format } from "date-fns";

interface CommentSectionProps {
  cardId: string;
  currentUserId: string;
  workspaceId: string;
}

interface CommentWithUser extends Comment {
  user?: UserType;
}

export default function CommentSection({
  cardId,
  currentUserId,
  workspaceId,
}: CommentSectionProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [users, setUsers] = useState<Record<string, UserType>>({});
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchUsers = useCallback(async (userIds: string[]) => {
    try {
      const response = await fetch(`/api/users/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds }),
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      const result = await response.json();
      if (result.data) {
        const usersMap: Record<string, UserType> = {};
        result.data.forEach((user: UserType) => {
          usersMap[user.id] = user;
        });
        setUsers(usersMap);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }, []);

  const fetchComments = useCallback(async (pageNum: number) => {
    if (!cardId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/cards/${cardId}/comments?page=${pageNum}&limit=20`);
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      const result = await response.json();
      if (result.data) {
        const newComments = result.data.comments;
        
        if (pageNum === 1) {
          setComments(newComments);
        } else {
          setComments(prev => [...prev, ...newComments]);
        }
        
        setHasMore(result.data.hasMore);
        
        // Fetch user info for new comments
        const userIds = newComments
          .map((c: Comment) => c.userId)
          .filter((id: string) => !users[id]);
        if (userIds.length > 0) {
          fetchUsers(userIds);
        }
      }
    } catch (error) {
      toast({
        message: "Failed to load comments",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [cardId, users, fetchUsers, toast]);

  useEffect(() => {
    fetchComments(1);
  }, [cardId, fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/cards/${cardId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to post comment");
      }

      const result = await response.json();
      if (result.data) {
        setNewComment("");
        fetchComments(1); // Refresh comments from first page
        toast({
          message: "Comment added",
          type: "success",
        });
      }
    } catch (error) {
      toast({
        message: "Failed to post comment",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return;
    
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update comment");
      }

      const result = await response.json();
      if (result.data) {
        setComments(comments.map(c => 
          c.id === commentId ? { ...c, ...result.data } : c
        ));
        setEditingCommentId(null);
        toast({
          message: "Comment updated",
          type: "success",
        });
      }
    } catch (error) {
      toast({
        message: "Failed to update comment",
        type: "error",
      });
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }

      setComments(comments.filter(c => c.id !== commentId));
      toast({
        message: "Comment deleted",
        type: "success",
      });
    } catch (error) {
      toast({
        message: "Failed to delete comment",
        type: "error",
      });
    }
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchComments(nextPage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Comment form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
          rows={3}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Post Comment
              </>
            )}
          </button>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.map((comment) => {
          const user = users[comment.userId];
          const isOwner = comment.userId === currentUserId;
          
          return (
            <div key={comment.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  {user ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-2">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200 mr-2" />
                      <div className="text-gray-500">Loading user...</div>
                    </div>
                  )}
                </div>
                
                {isOwner && (
                  <div className="flex items-center space-x-1">
                    {editingCommentId === comment.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(comment.id)}
                          className="p-1 hover:bg-green-100 rounded"
                          title="Save"
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </button>
                        <button
                          onClick={() => setEditingCommentId(null)}
                          className="p-1 hover:bg-red-100 rounded"
                          title="Cancel"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditContent(comment.content);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="p-1 hover:bg-red-100 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {editingCommentId === comment.id ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
              )}
            </div>
          );
        })}
        
        {comments.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        )}
        
        {hasMore && (
          <div className="text-center">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </span>
              ) : (
                "Load more comments"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}