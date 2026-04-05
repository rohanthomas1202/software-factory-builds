import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { InMemoryStore } from '@/lib/store';
import { Task, UserRole, TaskPriority, TaskStatus } from '@/lib/types';

const store = InMemoryStore.getInstance();

// GET /api/tasks - Get tasks with optional filtering
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const boardId = searchParams.get('boardId');
    const columnId = searchParams.get('columnId');
    const assigneeId = searchParams.get('assigneeId');
    const priority = searchParams.get('priority') as TaskPriority | null;
    const status = searchParams.get('status') as TaskStatus | null;
    const search = searchParams.get('search');

    // Get all tasks
    let tasks = store.getTasks();

    // Filter by project if specified
    if (projectId) {
      const project = store.getProject(projectId);
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      
      // Check if user has access to project
      const hasAccess = project.teamMembers.some(member => member.userId === user.id) ||
                       project.createdBy === user.id;
      
      if (!hasAccess && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      // Get all boards in project
      const projectBoards = store.getBoards().filter(board => board.projectId === projectId);
      const boardIds = projectBoards.map(board => board.id);
      
      // Get all columns in those boards
      const columns = store.getColumns().filter(column => boardIds.includes(column.boardId));
      const columnIds = columns.map(column => column.id);
      
      // Filter tasks by those columns
      tasks = tasks.filter(task => columnIds.includes(task.columnId));
    }

    // Filter by board if specified
    if (boardId) {
      const board = store.getBoard(boardId);
      if (!board) {
        return NextResponse.json(
          { error: 'Board not found' },
          { status: 404 }
        );
      }

      // Check if user has access to board
      const project = store.getProject(board.projectId);
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }

      const hasAccess = project.teamMembers.some(member => member.userId === user.id) ||
                       project.createdBy === user.id;
      
      if (!hasAccess && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      // Get all columns in board
      const columns = store.getColumns().filter(column => column.boardId === boardId);
      const columnIds = columns.map(column => column.id);
      
      // Filter tasks by those columns
      tasks = tasks.filter(task => columnIds.includes(task.columnId));
    }

    // Filter by column if specified
    if (columnId) {
      const column = store.getColumn(columnId);
      if (!column) {
        return NextResponse.json(
          { error: 'Column not found' },
          { status: 404 }
        );
      }

      // Check if user has access to column's board
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

      const hasAccess = project.teamMembers.some(member => member.userId === user.id) ||
                       project.createdBy === user.id;
      
      if (!hasAccess && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      tasks = tasks.filter(task => task.columnId === columnId);
    }

    // Filter by assignee if specified
    if (assigneeId) {
      tasks = tasks.filter(task => task.assigneeId === assigneeId);
    }

    // Filter by priority if specified
    if (priority) {
      tasks = tasks.filter(task => task.priority === priority);
    }

    // Filter by status if specified
    if (status) {
      tasks = tasks.filter(task => task.status === status);
    }

    // Search in title and description
    if (search) {
      const searchLower = search.toLowerCase();
      tasks = tasks.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort by position within column
    tasks.sort((a, b) => a.position - b.position);

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      columnId,
      assigneeId,
      priority = 'medium',
      dueDate,
      tags = [],
      attachments = []
    } = body;

    // Validate required fields
    if (!title || !columnId) {
      return NextResponse.json(
        { error: 'Title and columnId are required' },
        { status: 400 }
      );
    }

    // Validate column exists
    const column = store.getColumn(columnId);
    if (!column) {
      return NextResponse.json(
        { error: 'Column not found' },
        { status: 404 }
      );
    }

    // Check if user has access to column's board
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

    const hasAccess = project.teamMembers.some(member => member.userId === user.id) ||
                     project.createdBy === user.id;
    
    if (!hasAccess && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Validate assignee if specified
    if (assigneeId) {
      const assignee = store.getUser(assigneeId);
      if (!assignee) {
        return NextResponse.json(
          { error: 'Assignee not found' },
          { status: 404 }
        );
      }

      // Check if assignee is a team member
      const isTeamMember = project.teamMembers.some(member => member.userId === assigneeId);
      if (!isTeamMember) {
        return NextResponse.json(
          { error: 'Assignee must be a team member' },
          { status: 400 }
        );
      }
    }

    // Validate priority
    const validPriorities: TaskPriority[] = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority' },
        { status: 400 }
      );
    }

    // Get tasks in column to determine position
    const tasksInColumn = store.getTasks().filter(task => task.columnId === columnId);
    const position = tasksInColumn.length;

    // Create task
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description: description || '',
      columnId,
      assigneeId: assigneeId || null,
      createdBy: user.id,
      priority: priority as TaskPriority,
      status: column.defaultStatus || 'todo',
      dueDate: dueDate ? new Date(dueDate) : null,
      tags,
      attachments,
      position,
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: [],
      activityLog: []
    };

    // Add activity log entry
    task.activityLog.push({
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      type: 'task_created',
      description: `Task "${title}" created`,
      timestamp: new Date(),
      metadata: {
        columnId,
        priority,
        assigneeId
      }
    });

    // Create notification for assignee if assigned
    if (assigneeId && assigneeId !== user.id) {
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: assigneeId,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `${user.name} assigned you to "${title}"`,
        read: false,
        createdAt: new Date(),
        metadata: {
          taskId: task.id,
          boardId: board.id,
          projectId: project.id
        }
      };
      store.createNotification(notification);
    }

    store.createTask(task);

    return NextResponse.json(
      { task, message: 'Task created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}