import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { InMemoryStore } from '@/lib/store';
import { Comment, UserRole } from '@/lib/types';

const store = InMemoryStore.getInstance();

interface RouteParams {
  params: {
    taskId: string;
  };
}

// GET /api/tasks/[taskId]/comments - Get all comments for a task
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

    // Get all comments for the task
    const comments = task.comments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[taskId]/comments - Add a comment to a task
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
    const { content, attachments = [] } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Create comment
    const comment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      userId: user.id,
      content: content.trim(),
      attachments,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add comment to task
    task.comments.push(comment);
    task.updatedAt = new Date();

    // Add activity log entry
    task.activityLog.push({
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      type: 'comment_added',
      description: `${user.name} added a comment`,
      timestamp: new Date(),
      metadata: {
        commentId: comment.id,
        contentPreview: content.length > 50 ? content.substring(0, 50) + '...' : content
      }
    });

    // Create notifications for:
    // 1. Task assignee (if not the commenter)
    if (task.assigneeId && task.assigneeId !== user.id) {
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: task.assigneeId,
        type: 'task_commented',
        title: 'New Comment',
        message: `${user.name} commented on "${task.title}"`,
        read: false,
        createdAt: new Date(),
        metadata: {
          taskId: task.id,
          commentId: comment.id,
          boardId: board.id,
          projectId: project.id
        }
      };
      store.createNotification(notification);
    }

    // 2. Task creator (if not the commenter and not the assignee)
    if (task.createdBy !== user.id && task.createdBy !== task.assigneeId) {
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: task.createdBy,
        type: 'task_commented',
        title: 'New Comment',
        message: `${user.name} commented on "${task.title}"`,
        read: false,
        createdAt: new Date(),
        metadata: {
          taskId: task.id,
          commentId: comment.id,
          boardId: board.id,
          projectId: project.id
        }
      };
      store.createNotification(notification);
    }

    // 3. Other commenters on the task (excluding the current commenter)
    const otherCommenters = new Set(
      task.comments
        .filter(c => c.userId !== user.id)
        .map(c => c.userId)
    );
    
    otherCommenters.forEach(commenterId => {
      if (commenterId !== task.assigneeId && commenterId !== task.createdBy) {
        const notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: commenterId,
          type: 'task_commented',
          title: 'New Comment',
          message: `${user.name} also commented on "${task.title}"`,
          read: false,
          createdAt: new Date(),
          metadata: {
            taskId: task.id,
            commentId: comment.id,
            boardId: board.id,
            projectId: project.id
          }
        };
        store.createNotification(notification);
      }
    });

    store.updateTask(taskId, task);

    return NextResponse.json(
      { comment, message: 'Comment added successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}