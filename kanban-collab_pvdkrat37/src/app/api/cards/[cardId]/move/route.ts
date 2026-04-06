import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  findCardById,
  updateCard,
  findColumnById,
  findCardsByColumnId,
} from '@/lib/store';
import { getRankBetween } from '@/lib/rank';

interface MoveCardRequest {
  columnId: string;
  position: number; // Index in the target column
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const card = findCardById(cardId);
    if (!card) {
      return Response.json({ error: 'Card not found' }, { status: 404 });
    }

    const body: MoveCardRequest = await request.json();
    const { columnId, position } = body;

    if (!columnId || typeof position !== 'number') {
      return Response.json(
        { error: 'columnId and position are required' },
        { status: 400 }
      );
    }

    const targetColumn = findColumnById(columnId);
    if (!targetColumn) {
      return Response.json({ error: 'Target column not found' }, { status: 404 });
    }

    // Get all cards in the target column
    const targetCards = findCardsByColumnId(columnId)
      .filter(c => c.id !== cardId) // Exclude current card if it's being moved within same column
      .sort((a, b) => a.rank.localeCompare(b.rank));

    // Calculate new rank
    let newRank: string;
    if (targetCards.length === 0) {
      // First card in column
      newRank = getRankBetween(null, null);
    } else if (position === 0) {
      // Move to top
      newRank = getRankBetween(null, targetCards[0].rank);
    } else if (position >= targetCards.length) {
      // Move to bottom
      newRank = getRankBetween(targetCards[targetCards.length - 1].rank, null);
    } else {
      // Move between two cards
      newRank = getRankBetween(
        targetCards[position - 1].rank,
        targetCards[position].rank
      );
    }

    // Update the card
    const updatedCard = updateCard(cardId, {
      columnId,
      rank: newRank,
    });

    if (!updatedCard) {
      return Response.json(
        { error: 'Failed to update card' },
        { status: 500 }
      );
    }

    return Response.json({ data: updatedCard });
  } catch (error) {
    console.error('Failed to move card:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';