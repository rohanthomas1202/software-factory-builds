import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createCard, findColumnById, findCardsByColumnId } from '@/lib/store';
import { getRankBetween } from '@/lib/rank';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { columnId } = await params;
    const column = findColumnById(columnId);
    if (!column) {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 });
    }

    // Authorization check - user must have access to the board that contains this column
    // We'll need to check board membership through the workspace
    // For now, we'll assume authorization is handled at the board level

    const body = await request.json();
    const { title, description, assignedTo, dueDate } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Get existing cards in column to calculate rank
    const existingCards = findCardsByColumnId(columnId);
    const lastRank = existingCards.length > 0 
      ? existingCards[existingCards.length - 1].rank 
      : null;

    const rank = getRankBetween(lastRank, null);

    const card = createCard({
      columnId,
      title: title.trim(),
      description: description?.trim() || '',
      rank,
      createdBy: user.id,
      assignedTo: assignedTo || '',
      dueDate: dueDate ? parseInt(dueDate, 10) : 0,
    });

    return NextResponse.json({ data: card }, { status: 201 });
  } catch (error) {
    console.error('Failed to create card:', error);
    return NextResponse.json(
      { error: 'Failed to create card' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { columnId } = await params;
    const column = findColumnById(columnId);
    if (!column) {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 });
    }

    const cards = findCardsByColumnId(columnId);
    return NextResponse.json({ data: cards });
  } catch (error) {
    console.error('Failed to fetch cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}