import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { WSServer } from '@/lib/ws-server';

export async function PATCH(
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
    const { name } = body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Column name must be a non-empty string' }, { status: 400 });
      }
    }

    const updates: Partial<{ name: string }> = {};
    if (name !== undefined) updates.name = name.trim();

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedColumn = store.columns.update(columnId, updates);

    WSServer.broadcastToBoard(board.id, {
      type: 'column.updated',
      payload: { column: updatedColumn },
    });

    return NextResponse.json({ data: updatedColumn });
  } catch (error) {
    console.error('Failed to update column:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}