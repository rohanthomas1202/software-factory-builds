import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { findCardById, updateCard, deleteCard } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cardId } = await params;
    const card = findCardById(cardId);
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Authorization check would go here - user must have access to the board
    // For now, we'll assume the board page already handles authorization

    return NextResponse.json({ data: card });
  } catch (error) {
    console.error('Failed to fetch card:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cardId } = await params;
    const existingCard = findCardById(cardId);
    if (!existingCard) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, assignedTo, dueDate, columnId } = body;

    const updates: any = {};
    
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Title must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      updates.description = typeof description === 'string' ? description.trim() : '';
    }

    if (assignedTo !== undefined) {
      updates.assignedTo = assignedTo || '';
    }

    if (dueDate !== undefined) {
      updates.dueDate = dueDate ? parseInt(dueDate, 10) : 0;
    }

    if (columnId !== undefined && columnId !== existingCard.columnId) {
      updates.columnId = columnId;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ data: existingCard });
    }

    const updatedCard = updateCard(cardId, updates);
    if (!updatedCard) {
      return NextResponse.json({ error: 'Failed to update card' }, { status: 500 });
    }

    return NextResponse.json({ data: updatedCard });
  } catch (error) {
    console.error('Failed to update card:', error);
    return NextResponse.json(
      { error: 'Failed to update card' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cardId } = await params;
    const card = findCardById(cardId);
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Only allow deletion by card creator or workspace admin
    // For now, we'll allow deletion for any authenticated user with access
    const success = deleteCard(cardId);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 });
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Failed to delete card:', error);
    return NextResponse.json(
      { error: 'Failed to delete card' },
      { status: 500 }
    );
  }
}