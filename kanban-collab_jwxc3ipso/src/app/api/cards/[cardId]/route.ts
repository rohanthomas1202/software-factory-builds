import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { UpdateCardInput, Priority } from '@/lib/types';
import { LexoRank } from '@/lib/lexorank';
import { WSServer } from '@/lib/ws-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cardId = params.cardId;
    const card = store.cards.findById(cardId);
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const column = store.columns.findById(card.columnId);
    if (!column) {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 });
    }

    const board = store.boards.findById(column.boardId);
    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    const project = store.projects.findById(board.projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const workspace = store.workspaces.findById(project.workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const member = store.workspaceMembers.findByWorkspaceAndUser(workspace.id, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Not a workspace member' }, { status: 403 });
    }

    return NextResponse.json({ data: card });
  } catch (error) {
    console.error('Failed to fetch card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { cardId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cardId = params.cardId;
    const card = store.cards.findById(cardId);
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const column = store.columns.findById(card.columnId);
    if (!column) {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 });
    }

    const board = store.boards.findById(column.boardId);
    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    const project = store.projects.findById(board.projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const workspace = store.workspaces.findById(project.workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const member = store.workspaceMembers.findByWorkspaceAndUser(workspace.id, user.id);
    if (!member) {
      return NextResponse.json({ error: 'Not a workspace member' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, assigneeId, dueDate, priority, columnId, position } = body;

    const updates: UpdateCardInput = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json({ error: 'Card title must be a non-empty string' }, { status: 400 });
      }
      updates.title = title.trim();
      if (updates.title.length > 255) {
        return NextResponse.json({ error: 'Card title must be 255 characters or less' }, { status: 400 });
      }
    }

    if (description !== undefined) {
      if (typeof description !== 'string') {
        return NextResponse.json({ error: 'Description must be a string' }, { status: 400 });
      }
      updates.description = description.trim();
      if (updates.description.length > 10000) {
        return NextResponse.json({ error: 'Description must be 10,000 characters or less' }, { status: 400 });
      }
    }

    if (assigneeId !== undefined) {
      if (assigneeId === null) {
        updates.assigneeId = null;
      } else if (typeof assigneeId === 'string') {
        const assignee = store.users.findById(assigneeId);
        if (!assignee) {
          return NextResponse.json({ error: 'Assignee not found' }, { status: 400 });
        }
        updates.assigneeId = assigneeId;
      } else {
        return NextResponse.json({ error: 'Invalid assigneeId' }, { status: 400 });
      }
    }

    if (dueDate !== undefined) {
      if (dueDate === null) {
        updates.dueDate = null;
      } else if (typeof dueDate === 'string') {
        const timestamp = Date.parse(dueDate);
        if (isNaN(timestamp)) {
          return NextResponse.json({ error: 'Invalid due date format' }, { status: 400 });
        }
        updates.dueDate = timestamp;
      } else if (typeof dueDate === 'number') {
        updates.dueDate = dueDate;
      } else {
        return NextResponse.json({ error: 'Invalid due date format' }, { status: 400 });
      }
    }

    if (priority !== undefined) {
      const validPriorities: Priority[] = ['low', 'medium', 'high', 'critical'];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json({ error: 'Invalid priority value' }, { status: 400 });
      }
      updates.priority = priority;
    }

    let newColumnId = columnId;
    let newPosition = position;

    if (columnId !== undefined && columnId !== card.columnId) {
      const targetColumn = store.columns.findById(columnId);
      if (!targetColumn) {
        return NextResponse.json({ error: 'Target column not found' }, { status: 404 });
      }
      if (targetColumn.boardId !== column.boardId) {
        return NextResponse.json({ error: 'Cannot move card to a different board' }, { status: 400 });
      }
      newColumnId = columnId;
      if (position === undefined) {
        const targetCards = store.cards.findByColumn(columnId);
        if (targetCards.length > 0) {
          const lastCard = targetCards[targetCards.length - 1];
          const lastRank = LexoRank.parse(lastCard.position);
          newPosition = lastRank.genNext().toString();
        } else {
          newPosition = LexoRank.middle().toString();
        }
      }
    }

    if (position !== undefined && typeof position === 'string') {
      newPosition = position;
    }

    if (newColumnId) updates.columnId = newColumnId;
    if (newPosition) updates.position = newPosition;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedCard = store.cards.update(cardId, updates);

    WSServer.broadcastToBoard(board.id, {
      type: 'card.updated',
      payload: { card: updatedCard },
    });

    if (newColumnId && newColumnId !== card.columnId) {
      WSServer.broadcastToBoard(board.id, {
        type: 'card.moved',
        payload: {
          card: updatedCard,
          previousColumnId: card.columnId,
        },
      });
    }

    return NextResponse.json({ data: updatedCard });
  } catch (error) {
    console.error('Failed to update card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}