import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { CreateCommentInput } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const card = store.cards.findById(params.cardId);
    if (!card) {
      return Response.json({ error: 'Card not found' }, { status: 404 });
    }

    // Get workspace through card → column → board → project
    const column = store.columns.findById(card.columnId);
    if (!column) {
      return Response.json({ error: 'Column not found' }, { status: 404 });
    }

    const board = store.boards.findById(column.boardId);
    if (!board) {
      return Response.json({ error: 'Board not found' }, { status: 404 });
    }

    const project = store.projects.findById(board.projectId);
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user is workspace member
    const member = store.workspaceMembers.findByUserAndWorkspace(user.id, project.workspaceId);
    if (!member) {
      return Response.json({ error: 'Not a workspace member' }, { status: 403 });
    }

    const comments = store.comments.findByCardId(params.cardId);
    const enrichedComments = comments.map(comment => ({
      ...comment,
      author: store.users.findById(comment.authorId)
    })).filter(comment => comment.author); // Remove if author not found

    return Response.json({ data: enrichedComments });
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function parseMentions(content: string): string[] {
  // Matches @{userId} patterns
  const mentionRegex = /@\{([a-zA-Z0-9-]+)\}/g;
  const matches = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const card = store.cards.findById(params.cardId);
    if (!card) {
      return Response.json({ error: 'Card not found' }, { status: 404 });
    }

    const column = store.columns.findById(card.columnId);
    if (!column) {
      return Response.json({ error: 'Column not found' }, { status: 404 });
    }

    const board = store.boards.findById(column.boardId);
    if (!board) {
      return Response.json({ error: 'Board not found' }, { status: 404 });
    }

    const project = store.projects.findById(board.projectId);
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user is workspace member
    const member = store.workspaceMembers.findByUserAndWorkspace(user.id, project.workspaceId);
    if (!member) {
      return Response.json({ error: 'Not a workspace member' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
      return Response.json({ error: 'Content is required' }, { status: 400 });
    }

    const commentInput: CreateCommentInput = {
      cardId: params.cardId,
      authorId: user.id,
      content: body.content.trim()
    };

    const comment = store.comments.create(commentInput);

    // Parse mentions and create notifications
    const mentionedUserIds = parseMentions(comment.content);
    const workspaceMembers = store.workspaceMembers.findByWorkspaceId(project.workspaceId);
    const validMentionedUserIds = mentionedUserIds.filter(userId => 
      workspaceMembers.some(m => m.userId === userId && userId !== user.id) // Don't notify self
    );

    for (const mentionedUserId of validMentionedUserIds) {
      store.notifications.create({
        userId: mentionedUserId,
        commentId: comment.id,
        cardId: comment.cardId,
        read: false
      });
    }

    const enrichedComment = {
      ...comment,
      author: user
    };

    return Response.json({ data: enrichedComment }, { status: 201 });
  } catch (error) {
    console.error('Failed to create comment:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}