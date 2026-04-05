import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { InMemoryStore } from '@/lib/store';
import { Column, UserRole } from '@/lib/types';

const store = InMemoryStore.getInstance();

interface RouteParams {
  params: {
    boardId: string;
  };
}

// GET /api/boards/[boardId]/columns - Get all columns for a board
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const board = store.getBoard(params.boardId);
    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      );
    }

    // Check if user has access to the board's project
    const project = store.getProject(board.projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const hasAccess = project.teamMembers.some(member => member.userId === user.id);
    if (!hasAccess && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const columns = store.getColumnsByBoardId(params.boardId);
    
    // Get tasks for each column
    const columnsWithTasks = columns.map(column => ({
      ...column,
      tasks: store.getTasksByColumnId(column.id)
    }));

    return NextResponse.json(columnsWithTasks);
  } catch (error) {
    console.error('Error fetching columns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/boards/[boardId]/columns - Create a new column
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const board = store.getBoard(params.boardId);
    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to create columns
    const project = store.getProject(board.projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const isProjectMember = project.teamMembers.some(member => member.userId === user.id);
    if (!isProjectMember && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Column name is required' },
        { status: 400 }
      );
    }

    // Get existing columns to determine position
    const existingColumns = store.getColumnsByBoardId(params.boardId);
    const maxPosition = existingColumns.length > 0 
      ? Math.max(...existingColumns.map(col => col.position))
      : 0;

    const newColumn: Column = {
      id: crypto.randomUUID(),
      name: body.name,
      description: body.description || '',
      color: body.color || '#3B82F6',
      position: maxPosition + 1,
      boardId: params.boardId,
      taskLimit: body.taskLimit || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    store.createColumn(newColumn);

    // Log activity
    store.createActivityLog({
      id: crypto.randomUUID(),
      type: 'column_created',
      userId: user.id,
      projectId: board.projectId,
      boardId: board.id,
      columnId: newColumn.id,
      description: `Column "${newColumn.name}" was created`,
      metadata: {
        columnName: newColumn.name,
        createdBy: user.name
      },
      createdAt: new Date()
    });

    return NextResponse.json(newColumn, { status: 201 });
  } catch (error) {
    console.error('Error creating column:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}