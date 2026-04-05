import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { InMemoryStore } from '@/lib/store';
import { Board, UserRole } from '@/lib/types';

const store = InMemoryStore.getInstance();

interface RouteParams {
  params: {
    boardId: string;
  };
}

// GET /api/boards/[boardId] - Get board details
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

    // Get columns for this board
    const columns = store.getColumnsByBoardId(params.boardId);
    
    // Get tasks for each column
    const boardWithColumns = {
      ...board,
      columns: columns.map(column => ({
        ...column,
        tasks: store.getTasksByColumnId(column.id)
      }))
    };

    return NextResponse.json(boardWithColumns);
  } catch (error) {
    console.error('Error fetching board:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/boards/[boardId] - Update board
export async function PUT(
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

    // Check if user has permission to update the board
    const project = store.getProject(board.projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const isProjectAdmin = project.teamMembers.some(
      member => member.userId === user.id && member.role === 'admin'
    );
    
    if (!isProjectAdmin && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const updates = await request.json();
    
    // Validate required fields
    if (!updates.name || updates.name.trim() === '') {
      return NextResponse.json(
        { error: 'Board name is required' },
        { status: 400 }
      );
    }

    // Update board
    const updatedBoard = store.updateBoard(params.boardId, {
      ...updates,
      updatedAt: new Date()
    });

    // Log activity
    store.createActivityLog({
      id: crypto.randomUUID(),
      type: 'board_updated',
      userId: user.id,
      projectId: board.projectId,
      boardId: board.id,
      description: `Board "${board.name}" was updated`,
      metadata: {
        oldName: board.name,
        newName: updates.name,
        updatedBy: user.name
      },
      createdAt: new Date()
    });

    return NextResponse.json(updatedBoard);
  } catch (error) {
    console.error('Error updating board:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/boards/[boardId] - Delete board
export async function DELETE(
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

    // Check if user has permission to delete the board
    const project = store.getProject(board.projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const isProjectAdmin = project.teamMembers.some(
      member => member.userId === user.id && member.role === 'admin'
    );
    
    if (!isProjectAdmin && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Delete all columns and tasks associated with this board
    const columns = store.getColumnsByBoardId(params.boardId);
    
    // Delete all tasks in each column
    columns.forEach(column => {
      const tasks = store.getTasksByColumnId(column.id);
      tasks.forEach(task => {
        store.deleteTask(task.id);
      });
      store.deleteColumn(column.id);
    });

    // Delete the board
    store.deleteBoard(params.boardId);

    // Log activity
    store.createActivityLog({
      id: crypto.randomUUID(),
      type: 'board_deleted',
      userId: user.id,
      projectId: board.projectId,
      description: `Board "${board.name}" was deleted`,
      metadata: {
        boardName: board.name,
        deletedBy: user.name
      },
      createdAt: new Date()
    });

    return NextResponse.json(
      { message: 'Board deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting board:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}