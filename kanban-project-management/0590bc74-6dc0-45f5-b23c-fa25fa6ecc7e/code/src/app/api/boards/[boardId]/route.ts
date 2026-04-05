/**
 * Board API Routes
 * GET /api/boards/[boardId] - Get board details with columns and tasks
 * PUT /api/boards/[boardId] - Update board
 * DELETE /api/boards/[boardId] - Delete board
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { Board, Column, Task } from '@/lib/types';

interface RouteParams {
  params: {
    boardId: string;
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

    const { boardId } = params;
    const board = store.boards.get(boardId);

    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      );
    }

    // Check if user has access to the project
    const project = store.projects.get(board.projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.ownerId !== user.id && !project.memberIds.includes(user.id)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get columns with tasks
    const columns = board.columnIds
      .map(columnId => store.columns.get(columnId))
      .filter((col): col is Column => col !== undefined)
      .sort((a, b) => a.order - b.order)
      .map(column => {
        const tasks = column.taskIds
          .map(taskId => store.tasks.get(taskId))
          .filter((task): task is Task => task !== undefined)
          .sort((a, b) => a.order - b.order);

        return {
          ...column,
          tasks
        };
      });

    // Get project details
    const projectDetails = {
      id: project.id,
      name: project.name,
      color: project.color
    };

    return NextResponse.json({
      success: true,
      data: {
        ...board,
        columns,
        project: projectDetails
      }
    });
  } catch (error) {
    console.error('Error fetching board:', error);
    return NextResponse.json(
      { error: 'Failed to fetch board' },
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

    const { boardId } = params;
    const board = store.boards.get(boardId);

    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      );
    }

    // Check if user has access to the project
    const project = store.projects.get(board.projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.ownerId !== user.id && !project.memberIds.includes(user.id)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    // Validate input
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Board name is required' },
          { status: 400 }
        );
      }
      if (name.length > 100) {
        return NextResponse.json(
          { error: 'Board name must be less than 100 characters' },
          { status: 400 }
        );
      }
    }

    if (description !== undefined && description.length > 500) {
      return NextResponse.json(
        { error: 'Description must be less than 500 characters' },
        { status: 400 }
      );
    }

    // Update board
    const updatedBoard: Board = {
      ...board,
      name: name?.trim() || board.name,
      description: description?.trim() || board.description,
      updatedAt: new Date()
    };

    store.boards.set(boardId, updatedBoard);

    // Update project's updatedAt
    project.updatedAt = new Date();
    store.projects.set(project.id, project);

    return NextResponse.json({
      success: true,
      data: updatedBoard,
      message: 'Board updated successfully'
    });
  } catch (error) {
    console.error('Error updating board:', error);
    return NextResponse.json(
      { error: 'Failed to update board' },
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

    const { boardId } = params;
    const board = store.boards.get(boardId);

    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      );
    }

    // Check if user has access to the project
    const project = store.projects.get(board.projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.ownerId !== user.id && !project.memberIds.includes(user.id)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete all columns and their tasks
    board.columnIds.forEach(columnId => {
      const column = store.columns.get(columnId);
      if (column) {
        // Delete tasks for this column
        column.taskIds.forEach(taskId => {
          const task = store.tasks.get(taskId);
          if (task) {
            // Delete comments for this task
            task.commentIds.forEach(commentId => {
              store.comments.delete(commentId);
            });
            store.tasks.delete(taskId);
          }
        });
        store.columns.delete(columnId);
      }
    });

    // Delete the board
    store.boards.delete(boardId);

    // Update project's updatedAt
    project.updatedAt = new Date();
    store.projects.set(project.id, project);

    return NextResponse.json({
      success: true,
      message: 'Board deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting board:', error);
    return NextResponse.json(
      { error: 'Failed to delete board' },
      { status: 500 }
    );
  }
}