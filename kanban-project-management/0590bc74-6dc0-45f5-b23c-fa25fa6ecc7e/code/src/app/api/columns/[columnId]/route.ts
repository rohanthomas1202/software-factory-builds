/**
 * Column API Routes
 * GET /api/columns/[columnId] - Get column details
 * PUT /api/columns/[columnId] - Update column
 * DELETE /api/columns/[columnId] - Delete column
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { Column } from '@/lib/types';

interface RouteParams {
  params: {
    columnId: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { columnId } = params;
    const column = store.getColumn(columnId);

    if (!column) {
      return NextResponse.json(
        { error: 'Column not found' },
        { status: 404 }
      );
    }

    // Verify user has access to the board
    const board = store.getBoard(column.boardId);
    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      );
    }

    const project = store.getProject(board.projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has access to the project
    if (!project.teamMembers.includes(user.id) && project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: column,
    });
  } catch (error) {
    console.error('Error fetching column:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { columnId } = params;
    const column = store.getColumn(columnId);

    if (!column) {
      return NextResponse.json(
        { error: 'Column not found' },
        { status: 404 }
      );
    }

    // Verify user has access to the board
    const board = store.getBoard(column.boardId);
    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      );
    }

    const project = store.getProject(board.projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to modify the board
    if (!project.teamMembers.includes(user.id) && project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, color, order } = body;

    // Validate input
    const updates: Partial<Column> = {};
    
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    if (color !== undefined) {
      if (typeof color !== 'string' || !/^#[0-9A-F]{6}$/i.test(color)) {
        return NextResponse.json(
          { error: 'Color must be a valid hex color code' },
          { status: 400 }
        );
      }
      updates.color = color;
    }

    if (order !== undefined) {
      if (typeof order !== 'number' || order < 0) {
        return NextResponse.json(
          { error: 'Order must be a non-negative number' },
          { status: 400 }
        );
      }
      updates.order = order;
    }

    updates.updatedAt = new Date();

    const updatedColumn = store.updateColumn(columnId, updates);
    
    if (!updatedColumn) {
      return NextResponse.json(
        { error: 'Failed to update column' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedColumn,
      message: 'Column updated successfully',
    });
  } catch (error) {
    console.error('Error updating column:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { columnId } = params;
    const column = store.getColumn(columnId);

    if (!column) {
      return NextResponse.json(
        { error: 'Column not found' },
        { status: 404 }
      );
    }

    // Verify user has access to the board
    const board = store.getBoard(column.boardId);
    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      );
    }

    const project = store.getProject(board.projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to modify the board
    if (!project.teamMembers.includes(user.id) && project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if column has tasks
    const tasks = store.getTasksByColumnId(columnId);
    if (tasks.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete column with tasks. Move or delete tasks first.',
          taskCount: tasks.length
        },
        { status: 400 }
      );
    }

    const success = store.deleteColumn(columnId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete column' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Column deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting column:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}