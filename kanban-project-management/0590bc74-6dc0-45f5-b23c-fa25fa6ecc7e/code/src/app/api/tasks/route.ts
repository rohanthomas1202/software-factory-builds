/**
 * Tasks API Routes
 * GET /api/tasks - List tasks for a column (requires columnId query param)
 * POST /api/tasks - Create new task
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { Task, TaskPriority, TaskStatus } from '@/lib/types';
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
    const columnId = searchParams.get('columnId');

    if (!columnId) {
      return NextResponse.json(
        { error: 'columnId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify column exists and user has access
    const column = store.getColumn(columnId);
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

    const tasks = store.getTasksByColumnId(columnId);
    
    // Sort tasks by order
    const sortedTasks = tasks.sort((a, b) => a.order - b.order);

    return NextResponse.json({
      success: true,
      data: sortedTasks,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
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
    const { 
      title, 
      description, 
      columnId, 
      assigneeId, 
      priority, 
      dueDate, 
      labels 
    } = body;

    // Validate required input
    if (!title || !columnId) {
      return NextResponse.json(
        { error: 'Title and columnId are required' },
        { status: 400 }
      );
    }

    if (typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title must be a non-empty string' },
        { status: 400 }
      );
    }

    // Verify column exists and user has access
    const column = store.getColumn(columnId);
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

    // Check if user has permission to create tasks
    if (!project.teamMembers.includes(user.id) && project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Validate assignee if provided
    if (assigneeId) {
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
    }

    // Validate priority
    const validPriorities: TaskPriority[] = ['low', 'medium', 'high', 'critical'];
    const taskPriority: TaskPriority = priority && validPriorities.includes(priority) 
      ? priority 
      : 'medium';

    // Validate due date
    let parsedDueDate: Date | undefined;
    if (dueDate) {
      parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid due date format' },
          { status: 400 }
        );
      }
    }

    // Get existing tasks to determine order
    const existingTasks = store.getTasksByColumnId(columnId);
    const maxOrder = existingTasks.length > 0 
      ? Math.max(...existingTasks.map(task => task.order))
      : -1;

    const task: Task = {
      id: uuidv4(),
      title: title.trim(),
      description: description?.trim() || '',
      columnId,
      assigneeId: assigneeId || null,
      reporterId: user.id,
      priority: taskPriority,
      status: 'todo' as TaskStatus,
      dueDate: parsedDueDate,
      labels: Array.isArray(labels) ? labels.filter((l): l is string => typeof l === 'string') : [],
      attachments: [],
      comments: [],
      order: maxOrder + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const success = store.createTask(task);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
      message: 'Task created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}