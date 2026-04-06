import { NextRequest } from 'next/server';
import { 
  findBoardById, 
  updateBoard, 
  deleteBoard,
  findColumnsByBoardId,
  findCardsByColumnId
} from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';
import { Column, Card } from '@/lib/types';

type RouteParams = {
  params: Promise<{ boardId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { boardId } = await params;
    const board = findBoardById(boardId);
    
    if (!board) {
      return Response.json({ error: 'Board not found' }, { status: 404 });
    }

    // Get columns for this board
    const columns = findColumnsByBoardId(boardId);
    
    // Get cards for each column
    const columnsWithCards = columns.map((column: Column) => {
      const cards = findCardsByColumnId(column.id);
      return {
        ...column,
        cards: cards.sort((a: Card, b: Card) => a.rank - b.rank)
      };
    });

    return Response.json({ 
      data: {
        ...board,
        columns: columnsWithCards.sort((a, b) => a.rank - b.rank)
      }
    });
  } catch (error) {
    console.error('Failed to fetch board:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { boardId } = await params;
    const board = findBoardById(boardId);
    
    if (!board) {
      return Response.json({ error: 'Board not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description } = body;

    // Validate input
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return Response.json({ error: 'Name must be a non-empty string' }, { status: 400 });
    }

    if (description !== undefined && typeof description !== 'string') {
      return Response.json({ error: 'Description must be a string' }, { status: 400 });
    }

    const updates: Partial<typeof board> = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();

    const updatedBoard = updateBoard(boardId, updates);
    
    if (!updatedBoard) {
      return Response.json({ error: 'Failed to update board' }, { status: 500 });
    }

    return Response.json({ data: updatedBoard });
  } catch (error) {
    console.error('Failed to update board:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { boardId } = await params;
    const board = findBoardById(boardId);
    
    if (!board) {
      return Response.json({ error: 'Board not found' }, { status: 404 });
    }

    // Delete columns and their cards
    const columns = findColumnsByBoardId(boardId);
    for (const column of columns) {
      const cards = findCardsByColumnId(column.id);
      // Note: We don't have deleteCard function in store yet, so we can't delete cards
      // For MVP, we'll just delete the board and leave orphaned cards
      // In a real app, we would cascade delete
    }

    const success = deleteBoard(boardId);
    
    if (!success) {
      return Response.json({ error: 'Failed to delete board' }, { status: 500 });
    }

    return Response.json({ data: { success: true } });
  } catch (error) {
    console.error('Failed to delete board:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}