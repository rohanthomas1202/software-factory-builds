import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { CreateCardInput, Priority } from '@/lib/types';
import { LexoRank } from '@/lib/lexorank';
import { WSServer } from '@/lib/ws-server';

export async function POST(
  request: NextRequest,
  { params }: { params: { columnId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const columnId = params.columnId;
    const column = store.columns.findById(columnId);
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
    const { title, description = '', assigneeId = null, dueDate = null, priority = 'medium' as Priority } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Card title is required' }, { status: 400 });
    }

    if (title.length > 255) {
      return NextResponse.json({ error: 'Card title must be 255 characters or less' }, { status: 400 });
    }

    if (description.length > 10000) {
      return NextResponse.json({ error: 'Description must be 10,000 characters or less' }, { status: 400 });
    }

    if (assigneeId && typeof assigneeId !== 'string') {
      return NextResponse.json({ error: 'Invalid assigneeId' }, { status: 400 });
    }

    if (assigneeId) {
      const assignee = store.users.findById(assigneeId);
      if (!assignee) {
        return NextResponse.json({ error: 'Assignee not found' }, { status: 400 });
      }
    }

    let parsedDueDate: number | null = null;
    if (dueDate !== null) {
      if (typeof dueDate === 'string') {
        const timestamp = Date.parse(dueDate);
        if (isNaN(timestamp)) {
          return NextResponse.json({ error: 'Invalid due date format' }, { status: 400 });
        }
        parsedDueDate = timestamp;
      } else if (typeof dueDate === 'number') {
        parsedDueDate = dueDate;
      } else {
        return NextResponse.json({ error: 'Invalid due date format' }, { status: 400 });
      }
    }

    const validPriorities: Priority[] = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority value' }, { status: 400 });
    }

    const cards = store.cards.findByColumn(columnId);
    let position = LexoRank.middle().toString();

    if (cards.length > 0) {
      const lastCard = cards[cards.length - 1];
      const lastRank = LexoRank.parse(lastCard.position);
      position = lastRank.genNext().toString();
    }

    const cardInput: CreateCardInput = {
      columnId,
      title: title.trim(),
      description: description.trim(),
      assigneeId,
      dueDate: parsedDueDate,
      priority,
      position,
    };

    const card = store.cards.create(cardInput);

    WSServer.broadcastToBoard(board.id, {
      type: 'card.created',
      payload: { card },
    });

    return NextResponse.json({ data: card }, { status: 201 });
  } catch (error) {
    console.error('Failed to create card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}