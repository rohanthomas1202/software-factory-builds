/**
 * Comments API Routes
 * GET /api/comments - List comments for a task (requires taskId query param)
 * POST /api/comments - Create new comment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { Comment } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify task exists and user has access
    const task = store.getTask(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Get board to check project access
    const column = store.getColumn(task.columnId);
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

    const project = store.getProject(board.projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has access to the project
    const hasAccess = project.teamMembers.some(member => member.userId === user.id);
    if (!hasAccess && project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get all comments for the task
    const comments = store.getCommentsByTaskId(taskId);

    // Sort by creation date (newest first)
    const sortedComments = comments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      data: sortedComments,
      count: sortedComments.length,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { taskId, content } = body;

    // Validate input
    if (!taskId || !content?.trim()) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: {
            taskId: !taskId ? 'Task ID is required' : undefined,
            content: !content?.trim() ? 'Comment content is required' : undefined,
          }
        },
        { status: 400 }
      );
    }

    // Verify task exists
    const task = store.getTask(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Get board to check project access
    const column = store.getColumn(task.columnId);
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

    const project = store.getProject(board.projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has access to the project
    const hasAccess = project.teamMembers.some(member => member.userId === user.id);
    if (!hasAccess && project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Create new comment
    const commentId = uuidv4();
    const now = new Date();
    
    const newComment: Comment = {
      id: commentId,
      taskId,
      userId: user.id,
      content: content.trim(),
      createdAt: now,
      updatedAt: now,
    };

    store.createComment(newComment);

    // Update task's updatedAt timestamp
    store.updateTask(taskId, { updatedAt: now });

    return NextResponse.json({
      success: true,
      data: newComment,
      message: 'Comment created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}