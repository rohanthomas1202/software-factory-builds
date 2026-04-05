import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { InMemoryStore } from '@/lib/store';
import { TaskStatus } from '@/lib/types';

const store = InMemoryStore.getInstance();

interface RouteParams {
  params: {
    taskId: string;
  };
}

// POST /api/tasks/[taskId]/move - Move task to a different column
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

    const { taskId } = params;
    const task = store.getTask(taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { columnId, position } = body;

    if (!columnId) {
      return NextResponse.json(
        { error: 'columnId is required' },
        { status: 400 }
      );
    }

    // Check if target column exists
    const targetColumn = store.getColumn(columnId);
    if (!targetColumn) {
      return NextResponse.json(
        { error: 'Target column not found' },
        { status: 404 }
      );
    }

    // Check if target column belongs to the same board
    if (targetColumn.boardId !== task.boardId) {
      return NextResponse.json(
        { error: 'Target column does not belong to the same board' },
        { status: 400 }
      );
    }

    // Check if user has access to move the task
    const board = store.getBoard(task.boardId);
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

    const isTeamMember = project.teamMembers.some(member => member.userId === user.id);
    const isAssignee = task.assigneeId === user.id;
    
    // Only allow moves if user is admin, assignee, or team member
    if (user.role !== 'admin' && !isAssignee && !isTeamMember) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const oldColumnId = task.columnId;
    const oldStatus = task.status;

    // Determine new status based on column
    let newStatus: TaskStatus = task.status;
    const columnName = targetColumn.name.toLowerCase();
    
    if (columnName.includes('todo') || columnName.includes('backlog')) {
      newStatus = 'todo';
    } else if (columnName.includes('progress') || columnName.includes('doing')) {
      newStatus = 'in_progress';
    } else if (columnName.includes('review') || columnName.includes('testing')) {
      newStatus = 'review';
    } else if (columnName.includes('done') || columnName.includes('complete')) {
      newStatus = 'done';
    }

    // Update the task
    const updatedTask = store.updateTask(taskId, {
      columnId,
      status: newStatus,
      updatedAt: new Date(),
    });

    if (!updatedTask) {
      return NextResponse.json(
        { error: 'Failed to move task' },
        { status: 500 }
      );
    }

    // Reorder tasks in the target column if position is specified
    if (position !== undefined && typeof position === 'number') {
      const columnTasks = store.getTasks().filter(t => t.columnId === columnId && t.id !== taskId);
      columnTasks.sort((a, b) => {
        // This is a simplified ordering - in a real app, you'd have a proper order field
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      
      // Insert at specified position
      columnTasks.splice(position, 0, updatedTask);
      
      // Update order for all tasks in the column
      // Note: In a real implementation, you'd update an order field on each task
    }

    // Create activity log
    store.createActivityLog({
      userId: user.id,
      action: 'task_moved',
      entityType: 'task',
      entityId: taskId,
      details: {
        taskTitle: task.title,
        fromColumn: oldColumnId,
        toColumn: columnId,
        fromStatus: oldStatus,
        toStatus: newStatus,
      },
      timestamp: new Date(),
    });

    // Create notifications
    const notifyUserIds = new Set<string>();
    
    // Notify reporter if status changed significantly
    if (task.reporterId && task.reporterId !== user.id && newStatus !== oldStatus) {
      if (newStatus === 'done' || oldStatus === 'done') {
        notifyUserIds.add(task.reporterId);
      }
    }
    
    // Notify assignee if they're not the mover and column changed
    if (task.assigneeId && task.assigneeId !== user.id && columnId !== oldColumnId) {
      notifyUserIds.add(task.assigneeId);
    }

    // Create notifications
    notifyUserIds.forEach(userId => {
      let notificationType = 'task_moved';
      let title = 'Task Moved';
      let message = `${user.name} moved task "${task.title}" from ${oldColumnId} to ${columnId}`;

      if (newStatus === 'done') {
        notificationType = 'task_completed';
        title = 'Task Completed';
        message = `${user.name} marked task "${task.title}" as done`;
      } else if (oldStatus === 'done' && newStatus !== 'done') {
        notificationType = 'task_reopened';
        title = 'Task Reopened';
        message = `${user.name} reopened task "${task.title}"`;
      }

      store.createNotification({
        userId,
        type: notificationType,
        title,
        message,
        read: false,
        createdAt: new Date(),
        metadata: {
          taskId: taskId,
          boardId: task.boardId,
          fromColumn: oldColumnId,
          toColumn: columnId,
          moverId: user.id,
        },
      });
    });

    return NextResponse.json({ 
      task: updatedTask,
      moved: true,
      fromColumn: oldColumnId,
      toColumn: columnId,
      fromStatus: oldStatus,
      toStatus: newStatus,
    }, { status: 200 });
  } catch (error) {
    console.error('Error moving task:', error);
    return NextResponse.json(
      { error: 'Failed to move task' },
      { status: 500 }
    );
  }
}