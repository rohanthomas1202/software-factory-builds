/**
 * Columns API Routes
 * GET /api/columns - List columns for a board (requires boardId query param)
 * POST /api/columns - Create new column
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { Column } from '@/lib/types';
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
    const boardId = searchParams.get('boardId');

    if (!boardId) {
      return NextResponse.json(
        { error: 'boardId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify user has access to the board
    const board = store.getBoard(boardId);
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

    const columns = store.getColumnsByBoardId(boardId);
    
    // Sort columns by order
    const sortedColumns = columns.sort((a, b) => a.order - b.order);

    return NextResponse.json({
      success: true,
      data: sortedColumns,
    });
  } catch (error) {
    console.error('Error fetching columns:', error);
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
    const { name, boardId, color } = body;

    // Validate input
    if (!name || !boardId) {
      return NextResponse.json(
        { error: 'Name and boardId are required' },
        { status: 400 }
      );
    }

    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name must be a non-empty string' },
        { status: 400 }
      );
    }

    // Verify board exists and user has access
    const board = store.getBoard(boardId);
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

    // Check if user has permission to modify the board
    if (!project.teamMembers.includes(user.id) && project.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get existing columns to determine order
    const existingColumns = store.getColumnsByBoardId(boardId);
    const maxOrder = existingColumns.length > 0 
      ? Math.max(...existingColumns.map(col => col.order))
      : -1;

    const column: Column = {
      id: uuidv4(),
      name: name.trim(),
      boardId,
      color: color || '#3B82F6',
      order: maxOrder + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const success = store.createColumn(column);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to create column' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: column,
      message: 'Column created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating column:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}