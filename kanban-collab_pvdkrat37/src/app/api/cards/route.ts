import { NextRequest } from 'next/server';
import { createCard, findColumnById, findUserById } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';
import { Card } from '@/lib/types';
import { rebalanceRanks } from '@/lib/rank';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { columnId, title, description, assignedTo } = body;

    if (!columnId || !title?.trim()) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const column = findColumnById(columnId);
    if (!column) {
      return Response.json({ error: 'Column not found' }, { status: 404 });
    }

    if (assignedTo && !findUserById(assignedTo)) {
      return Response.json({ error: 'Assigned user not found' }, { status: 400 });
    }

    // Get existing cards in column for ranking
    const existingCards = require('@/lib/store').findCardsByColumnId(columnId);
    const ranks = existingCards.map(c => c.rank.toString());
    const newRanks = rebalanceRanks([...ranks, '']);
    const newRank = newRanks[newRanks.length - 1];

    const cardData: Omit<Card, 'id' | 'createdAt' | 'updatedAt'> = {
      columnId,
      title: title.trim(),
      description: description?.trim() || '',
      rank: parseFloat(newRank),
      createdBy: user.id,
      assignedTo: assignedTo || user.id,
      dueDate: 0,
    };

    const card = createCard(cardData);
    return Response.json({ data: card }, { status: 201 });
  } catch (error) {
    console.error('Error creating card:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';