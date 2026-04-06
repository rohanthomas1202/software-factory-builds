import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { UpdateCommentInput } from '@/lib/types';

async function validateCommentAccess(commentId: string, userId: string) {
  const comment = store.comments.findById(commentId);
  if (!comment) {
    return { error: 'Comment not found', status: 404 };
  }

  if (comment.authorId !== userId) {
    return { error: 'Not authorized to modify this comment', status: 403 };
  }

  const card = store.cards.findById(comment.cardId);
  if (!card) {
    return { error: 'Card not found', status: 404 };
  }

  const column = store.columns.findById(card.columnId);
  if (!column) {
    return { error: 'Column not found', status: 404 };
  }

  const board = store.boards.findById(column.boardId);
  if (!board) {
    return { error: 'Board not found', status: 404 };
  }

  const project = store.projects.findById(board.projectId);
  if (!project) {
    return { error: 'Project not found', status: 404 };
  }

  const member = store.workspaceMembers.findByUserAndWorkspace(userId, project.workspaceId);
  if (!member) {
    return { error: 'Not a workspace member', status: 403 };
  }

  return { comment, card, column, board, project, member };
}

function parseMentions(content: string): string[] {
  const mentionRegex = /@\{([a-zA-Z0-9-]+)\}/g;
  const matches = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessCheck = await validateCommentAccess(params.commentId, user.id);
    if ('error' in accessCheck) {
      return Response.json({ error: accessCheck.error }, { status: accessCheck.status });
    }

    const { comment, project } = accessCheck;
    const body = await request.json();
    const updateData: UpdateCommentInput = {};

    if (body.content !== undefined) {
      if (typeof body.content !== 'string' || body.content.trim().length === 0) {
        return Response.json({ error: 'Content cannot be empty' }, { status: 400 });
      }
      updateData.content = body.content.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updatedComment = store.comments.update(params.commentId, updateData);

    // Update mentions and notifications
    if (updateData.content) {
      // Delete existing notifications for this comment
      const existingNotifications = store.notifications.findByCommentId(params.commentId);
      for (const notification of existingNotifications) {
        store.notifications.delete(notification.id);
      }

      // Create new notifications for mentions
      const mentionedUserIds = parseMentions(updatedComment.content);
      const workspaceMembers = store.workspaceMembers.findByWorkspaceId(project.workspaceId);
      const validMentionedUserIds = mentionedUserIds.filter(userId => 
        workspaceMembers.some(m => m.userId === userId && userId !== user.id)
      );

      for (const mentionedUserId of validMentionedUserIds) {
        store.notifications.create({
          userId: mentionedUserId,
          commentId: updatedComment.id,
          cardId: updatedComment.cardId,
          read: false
        });
      }
    }

    const enrichedComment = {
      ...updatedComment,
      author: user
    };

    return Response.json({ data: enrichedComment });
  } catch (error) {
    console.error('Failed to update comment:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessCheck = await validateCommentAccess(params.commentId, user.id);
    if ('error' in accessCheck) {
      return Response.json({ error: accessCheck.error }, { status: accessCheck.status });
    }

    // Delete associated notifications
    const notifications = store.notifications.findByCommentId(params.commentId);
    for (const notification of notifications) {
      store.notifications.delete(notification.id);
    }

    store.comments.delete(params.commentId);
    
    return Response.json({ data: { success: true } });
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}