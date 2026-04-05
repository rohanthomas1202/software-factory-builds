import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { InMemoryStore } from '@/lib/store';
import { Column, UserRole } from '@/lib/types';

const store = InMemoryStore.getInstance();

interface RouteParams {
  params: {
    columnId: string;
  };
}

// GET /api/columns/[columnId] - Get column details
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

    const column = store.getColumn(params.columnId);
    if (!column) {
      return NextResponse.json(
        { error: 'Column not found' },
        { status: 404 }
      );
    }

    const board = store.getBoard(column.boardId);
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

    // Get tasks for this column
    const tasks = store.getTasksByColumnId(params.columnId);
    
    const columnWithTasks = {
      ...column,
      tasks
    };

    return NextResponse.json(columnWithTasks);
  } catch (error) {
    console.error('Error fetching column:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/columns/[columnId] - Update column
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

    const column = store.getColumn(params.columnId);
    if (!column) {
      return NextResponse.json(
        { error: 'Column not found' },
        { status: 404 }
      );
    }

    const board = store.getBoard(column.boardId);
    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update the column
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

    const updates = await request.json();
    
    // Validate required fields
    if (updates.name !== undefined && updates.name.trim() === '') {
      return NextResponse.json(
        { error: 'Column name cannot be empty' },
        { status: 400 }
      );
    }

    // Update column
    const updatedColumn = store.updateColumn(params.columnId, {
      ...updates,
      updatedAt: new Date()
    });

    // Log activity
    store.createActivityLog({
      id: crypto.randomUUID(),
      type: 'column_updated',
      userId: user.id,
      projectId: board.projectId,
      boardId: board.id,
      columnId: column.id,
      description: `Column "${column.name}" was updated`,
      metadata: {
        oldName: column.name,
        newName: updates.name || column.name,
        updatedBy: user.name
      },
      createdAt: new Date()
    });

    return NextResponse.json(updatedColumn);
  } catch (error) {
    console.error('Error updating column:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/columns/[columnId] - Delete column
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

    const column = store.getColumn(params.columnId);
    if (!column) {
      return NextResponse.json(
        { error: 'Column not found' },
        { status: 404 }
      );
    }

    const board = store.getBoard(column.boardId);
    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete the column
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

    // Get all tasks in this column
    const tasks = store.getTasksByColumnId(params.columnId);
    
    // Delete all tasks in this column
    tasks.forEach(task => {
      store.deleteTask(task.id);
    });

    // Delete the column
    store.deleteColumn(params.columnId);

    // Reorder remaining columns
    const remainingColumns = store.getColumnsByBoardId(board.id);
    remainingColumns.sort((a, b) => a.position - b.position);
    
    remainingColumns.forEach((col, index) => {
      if (col.position !== index + 1) {
        store.updateColumn(col.id, { position: index + 1 });
      }
    });

    // Log activity
    store.createActivityLog({
      id: crypto.randomUUID(),
      type: 'column_deleted',
      userId: user.id,
      projectId: board.projectId,
      boardId: board.id,
      description: `Column "${column.name}" was deleted`,
      metadata: {
        columnName: column.name,
        deletedBy: user.name,
        taskCount: tasks.length
      },
      createdAt: new Date()
    });

    return NextResponse.json(
      { message: 'Column deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting column:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}