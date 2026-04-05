/**
 * POST /api/tasks/[taskId]/move
 * Move task to a different column and/or reorder within column
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';

interface RouteParams {
  params: {
    taskId: string;
  };
}

export async function POST(
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

    const body = await request.json();
    const { columnId, order } = body;

    // Validate input
    if (columnId === undefined && order === undefined) {
      return NextResponse.json(
        { error: 'Either columnId or order must be provided' },
        { status: 400 }
      );
    }

    // Get current column and verify access
    const currentColumn = store.getColumn(task.columnId);
    if (!currentColumn) {
      return NextResponse.json(
        { error: 'Current column not found' },
        { status: 404 }
      );
    }

    const board = store.getBoard(currentColumn.boardId);
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

    // Check if user has permission to move tasks
    if (!project.teamMembers.includes(user.id) && project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    let targetColumnId = task.columnId;
    let targetOrder = task.order;

    // Handle column move
    if (columnId !== undefined) {
      if (columnId !== task.columnId) {
        const newColumn = store.getColumn(columnId);
        if (!newColumn) {
          return NextResponse.json(
            { error: 'Target column not found' },
            { status: 404 }
          );
        }

        // Verify target column is in the same board
        if (newColumn.boardId !== currentColumn.boardId) {
          return NextResponse.json(
            { error: 'Cannot move task to a different board' },
            { status: 400 }
          );
        }

        targetColumnId = columnId;
        
        // When moving to a new column, place at the end by default
        const tasksInNewColumn = store.getTasksByColumnId(columnId);
        targetOrder = tasksInNewColumn.length;
      }
    }

    // Handle reordering
    if (order !== undefined) {
      if (typeof order !== 'number' || order < 0) {
        return NextResponse.json(
          { error: 'Order must be a non-negative number' },
          { status: 400 }
        );
      }
      targetOrder = order;
    }

    // Get all tasks in the target column (including the current task if moving within same column)
    const tasksInTargetColumn = store.getTasksByColumnId(targetColumnId);
    
    // Filter out the current task if it's in the same column
    const otherTasks = tasksInTargetColumn.filter(t => t.id !== taskId);
    
    // Validate order position
    if (targetOrder > otherTasks.length) {
      targetOrder = otherTasks.length;
    }

    // Update order of other tasks if needed
    const updates: Array<{ taskId: string; order: number }> = [];
    
    if (targetColumnId === task.columnId) {
      // Moving within same column
      const currentIndex = task.order;
      
      if (targetOrder > currentIndex) {
        // Moving down - decrease order of tasks between currentIndex + 1 and targetOrder
        for (const otherTask of otherTasks) {
          if (otherTask.order > currentIndex && otherTask.order <= targetOrder) {
            updates.push({ taskId: otherTask.id, order: otherTask.order - 1 });
          }
        }
      } else if (targetOrder < currentIndex) {
        // Moving up - increase order of tasks between targetOrder and currentIndex - 1
        for (const otherTask of otherTasks) {
          if (otherTask.order >= targetOrder && otherTask.order < currentIndex) {
            updates.push({ taskId: otherTask.id, order: otherTask.order + 1 });
          }
        }
      }
    } else {
      // Moving to different column
      // Increase order of tasks in target column that are at or after targetOrder
      for (const otherTask of otherTasks) {
        if (otherTask.order >= targetOrder) {
          updates.push({ taskId: otherTask.id, order: otherTask.order + 1 });
        }
      }
      
      // Decrease order of tasks in original column that are after current task's order
      const tasksInOriginalColumn = store.getTasksByColumnId(task.columnId);
      for (const otherTask of tasksInOriginalColumn) {
        if (otherTask.id !== taskId && otherTask.order > task.order) {
          updates.push({ taskId: otherTask.id, order: otherTask.order - 1 });
        }
      }
    }

    // Apply all updates
    for (const update of updates) {
      store.updateTask(update.taskId, { order: update.order });
    }

    // Update the task itself
    const updatedTask = store.updateTask(taskId, {
      columnId: targetColumnId,
      order: targetOrder,
      updatedAt: new Date(),
    });

    if (!updatedTask) {
      return NextResponse.json(
        { error: 'Failed to move task' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: 'Task moved successfully',
    });
  } catch (error) {
    console.error('Error moving task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}