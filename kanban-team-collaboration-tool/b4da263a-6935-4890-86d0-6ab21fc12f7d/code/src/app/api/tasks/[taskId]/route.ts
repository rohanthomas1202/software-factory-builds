import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { InMemoryStore } from '@/lib/store';
import { Task, UserRole, TaskPriority, TaskStatus } from '@/lib/types';

const store = InMemoryStore.getInstance();

interface RouteParams {
  params: {
    taskId: string;
  };
}

// GET /api/tasks/[taskId] - Get task details
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

    const { taskId } = params;
    const task = store.getTask(taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check if user has access to task
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

    const hasAccess = project.teamMembers.some(member => member.userId === user.id) ||
                     project.createdBy === user.id;
    
    if (!hasAccess && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[taskId] - Update task
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

    const { taskId } = params;
    const task = store.getTask(taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check if user has access to task
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

    const hasAccess = project.teamMembers.some(member => member.userId === user.id) ||
                     project.createdBy === user.id;
    
    if (!hasAccess && user.role !== 'admin') {
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
      dueDate,
      tags,
      attachments
    } = body;

    // Validate assignee if specified
    if (assigneeId !== undefined) {
      if (assigneeId === null) {
        // Clearing assignee is allowed
      } else {
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
    }

    // Validate priority if specified
    if (priority !== undefined) {
      const validPriorities: TaskPriority[] = ['low', 'medium', 'high', 'critical'];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          { error: 'Invalid priority' },
          { status: 400 }
        );
      }
    }

    // Track changes for activity log
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

    if (title !== undefined && title !== task.title) {
      changes.push({ field: 'title', oldValue: task.title, newValue: title });
      task.title = title;
    }

    if (description !== undefined && description !== task.description) {
      changes.push({ field: 'description', oldValue: task.description, newValue: description });
      task.description = description;
    }

    if (assigneeId !== undefined && assigneeId !== task.assigneeId) {
      changes.push({ field: 'assignee', oldValue: task.assigneeId, newValue: assigneeId });
      
      // Create notification for new assignee if different from current user
      if (assigneeId && assigneeId !== user.id) {
        const notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: assigneeId,
          type: 'task_assigned',
          title: 'Task Assigned',
          message: `${user.name} assigned you to "${task.title}"`,
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
      
      // Create notification for old assignee if they were removed
      if (task.assigneeId && task.assigneeId !== assigneeId && task.assigneeId !== user.id) {
        const notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: task.assigneeId,
          type: 'task_unassigned',
          title: 'Task Unassigned',
          message: `${user.name} removed you from "${task.title}"`,
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
      
      task.assigneeId = assigneeId;
    }

    if (priority !== undefined && priority !== task.priority) {
      changes.push({ field: 'priority', oldValue: task.priority, newValue: priority });
      task.priority = priority as TaskPriority;
    }

    if (dueDate !== undefined) {
      const newDueDate = dueDate ? new Date(dueDate) : null;
      if ((!task.dueDate && newDueDate) || 
          (task.dueDate && !newDueDate) || 
          (task.dueDate && newDueDate && task.dueDate.getTime() !== newDueDate.getTime())) {
        changes.push({ field: 'dueDate', oldValue: task.dueDate, newValue: newDueDate });
        task.dueDate = newDueDate;
      }
    }

    if (tags !== undefined) {
      changes.push({ field: 'tags', oldValue: task.tags, newValue: tags });
      task.tags = tags;
    }

    if (attachments !== undefined) {
      changes.push({ field: 'attachments', oldValue: task.attachments, newValue: attachments });
      task.attachments = attachments;
    }

    // Update timestamp
    task.updatedAt = new Date();

    // Add activity log entries for each change
    changes.forEach(change => {
      task.activityLog.push({
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        type: 'task_updated',
        description: `${change.field} changed from "${change.oldValue}" to "${change.newValue}"`,
        timestamp: new Date(),
        metadata: {
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue
        }
      });
    });

    // If no changes were made, still update the timestamp
    if (changes.length === 0) {
      task.updatedAt = new Date();
    }

    store.updateTask(taskId, task);

    return NextResponse.json({
      task,
      message: 'Task updated successfully',
      changes: changes.length
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[taskId] - Delete task
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

    const { taskId } = params;
    const task = store.getTask(taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Check if user has access to task
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

    const hasAccess = project.teamMembers.some(member => member.userId === user.id) ||
                     project.createdBy === user.id;
    
    if (!hasAccess && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Create notification for assignee if they exist and are not the deleter
    if (task.assigneeId && task.assigneeId !== user.id) {
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: task.assigneeId,
        type: 'task_deleted',
        title: 'Task Deleted',
        message: `${user.name} deleted "${task.title}"`,
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

    store.deleteTask(taskId);

    return NextResponse.json({
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}