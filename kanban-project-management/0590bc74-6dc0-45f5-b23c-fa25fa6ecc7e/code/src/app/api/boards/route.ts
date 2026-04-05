/**
 * Boards API Routes
 * GET /api/boards - List boards for current user
 * POST /api/boards - Create new board
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { Board, Column } from '@/lib/types';
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

    // Get projectId from query params
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter is required' },
        { status: 400 }
      );
    }

    // Check if user has access to the project
    const project = store.projects.get(projectId);
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

    // Get all boards for the project
    const allBoards = Array.from(store.boards.values());
    const projectBoards = allBoards
      .filter(board => board.projectId === projectId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Get columns for each board
    const boardsWithColumns = projectBoards.map(board => {
      const columns = board.columnIds
        .map(columnId => store.columns.get(columnId))
        .filter((col): col is Column => col !== undefined)
        .sort((a, b) => a.order - b.order);

      return {
        ...board,
        columns
      };
    });

    return NextResponse.json({
      success: true,
      data: boardsWithColumns,
      count: boardsWithColumns.length
    });
  } catch (error) {
    console.error('Error fetching boards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch boards' },
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
    const { name, description, projectId } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Board name is required' },
        { status: 400 }
      );
    }

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Board name must be less than 100 characters' },
        { status: 400 }
      );
    }

    if (description && description.length > 500) {
      return NextResponse.json(
        { error: 'Description must be less than 500 characters' },
        { status: 400 }
      );
    }

    // Check if project exists and user has access
    const project = store.projects.get(projectId);
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

    // Create board
    const boardId = uuidv4();
    const now = new Date();
    
    const board: Board = {
      id: boardId,
      name: name.trim(),
      description: description?.trim() || '',
      projectId: projectId,
      columnIds: [],
      createdAt: now,
      updatedAt: now
    };

    // Save to store
    store.boards.set(boardId, board);

    // Create default columns
    const defaultColumns = [
      { name: 'Backlog', color: 'gray' },
      { name: 'To Do', color: 'blue' },
      { name: 'In Progress', color: 'yellow' },
      { name: 'Review', color: 'purple' },
      { name: 'Done', color: 'green' }
    ];

    const columnIds: string[] = [];
    defaultColumns.forEach((col, index) => {
      const columnId = uuidv4();
      const column: Column = {
        id: columnId,
        name: col.name,
        color: col.color,
        boardId: boardId,
        taskIds: [],
        order: index,
        createdAt: now,
        updatedAt: now
      };
      store.columns.set(columnId, column);
      columnIds.push(columnId);
    });

    // Update board with column IDs
    board.columnIds = columnIds;
    store.boards.set(boardId, board);

    // Update project's updatedAt
    project.updatedAt = now;
    store.projects.set(projectId, project);

    return NextResponse.json({
      success: true,
      data: board,
      message: 'Board created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating board:', error);
    return NextResponse.json(
      { error: 'Failed to create board' },
      { status: 500 }
    );
  }
}