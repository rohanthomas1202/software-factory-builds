import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { CreateColumnInput } from '@/lib/types';
import { LexoRank } from '@/lib/lexorank';
import { WSServer } from '@/lib/ws-server';

export async function POST(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const boardId = params.boardId;
    const board = store.boards.findById(boardId);
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
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Column name is required' }, { status: 400 });
    }

    const columns = store.columns.findByBoard(boardId);
    let position = LexoRank.middle().toString();

    if (columns.length > 0) {
      const lastColumn = columns[columns.length - 1];
      const lastRank = LexoRank.parse(lastColumn.position);
      position = lastRank.genNext().toString();
    }

    const columnInput: CreateColumnInput = {
      boardId,
      name: name.trim(),
      position,
    };

    const column = store.columns.create(columnInput);

    WSServer.broadcastToBoard(boardId, {
      type: 'column.created',
      payload: { column },
    });

    return NextResponse.json({ data: column }, { status: 201 });
  } catch (error) {
    console.error('Failed to create column:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}