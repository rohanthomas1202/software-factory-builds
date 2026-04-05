/**
 * Task API Routes
 * GET /api/tasks/[taskId] - Get task details
 * PUT /api/tasks/[taskId] - Update task
 * DELETE /api/tasks/[taskId] - Delete task
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { Task, TaskPriority, TaskStatus } from '@/lib/types';

interface RouteParams {
  params: {
    taskId: string;
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

    const { taskId } = params;
    const task = store.getTask(taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Verify user has access to the task
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
    if (!project.teamMembers.includes(user.id) && project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get assignee and reporter details
    const assignee = task.assigneeId ? store.getUser(task.assigneeId) : null;
    const reporter = store.getUser(task.reporterId);

    return NextResponse.json({
      success: true,
      data: {
        ...task,
        assignee,
        reporter,
      },
    });
  } catch (error) {
    console.error('Error fetching task:', error);
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

    const { taskId } = params;
    const task = store.getTask(taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Verify user has access to the task
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

    // Check if user has permission to modify tasks
    if (!project.teamMembers.includes(user.id) && project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      assigneeId, 
      priority, 
      status, 
      dueDate, 
      labels,
      order 
    } = body;

    // Validate input
    const updates: Partial<Task> = {};
    
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Title must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      updates.description = typeof description === 'string' ? description.trim() : '';
    }

    if (assigneeId !== undefined) {
      if (assigneeId === null) {
        updates.assigneeId = null;
      } else {
        const assignee = store.getUser(assigneeId);
        if (!assignee) {
          return NextResponse.json(
            { error: 'Assignee not found' },
            { status: 400 }
          );
        }
        // Check if assignee is a team member
        if (!project.teamMembers.includes(assigneeId) && assigneeId !== project.ownerId) {
          return NextResponse.json(
            { error: 'Assignee must be a team member' },
            { status: 400 }
          );
        }
        updates.assigneeId = assigneeId;
      }
    }

    if (priority !== undefined) {
      const validPriorities: TaskPriority[] = ['low', 'medium', 'high', 'critical'];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          { error: 'Invalid priority value' },
          { status: 400 }
        );
      }
      updates.priority = priority;
    }

    if (status !== undefined) {
      const validStatuses: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    if (dueDate !== undefined) {
      if (dueDate === null) {
        updates.dueDate = undefined;
      } else {
        const parsedDate = new Date(dueDate);
        if (isNaN(parsedDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid due date format' },
            { status: 400 }
          );
        }
        updates.dueDate = parsedDate;
      }
    }

    if (labels !== undefined) {
      if (!Array.isArray(labels)) {
        return NextResponse.json(
          { error: 'Labels must be an array' },
          { status: 400 }
        );
      }
      updates.labels = labels.filter((l): l is string => typeof l === 'string');
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

    const updatedTask = store.updateTask(taskId, updates);
    
    if (!updatedTask) {
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully',
    });
  } catch (error) {
    console.error('Error updating task:', error);
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

    const { taskId } = params;
    const task = store.getTask(taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Verify user has access to the task
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

    // Check if user has permission to delete tasks
    if (!project.teamMembers.includes(user.id) && project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete all comments associated with this task
    const comments = store.getCommentsByTaskId(taskId);
    comments.forEach(comment => {
      store.deleteComment(comment.id);
    });

    const success = store.deleteTask(taskId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete task' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}