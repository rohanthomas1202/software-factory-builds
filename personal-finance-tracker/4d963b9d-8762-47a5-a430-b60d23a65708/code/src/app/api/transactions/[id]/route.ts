import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { 
  getTransactionById, 
  updateTransaction, 
  deleteTransaction 
} from '@/lib/store';
import { 
  validateTransactionAmount, 
  isValidCategoryId, 
  isValidNote 
} from '@/lib/validation';
import { TransactionType, UpdateTransactionRequest } from '@/lib/types';

interface RouteParams {
  params: { id: string };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const transactionId = params.id;
    const existingTransaction = getTransactionById(transactionId);
    
    if (!existingTransaction) {
      return new Response(JSON.stringify({ error: 'Transaction not found' }), { status: 404 });
    }

    if (existingTransaction.userId !== session.userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const body: UpdateTransactionRequest = await request.json();

    // Build updates object
    const updates: Partial<{
      amountCents: number;
      transactionDate: Date;
      type: TransactionType;
      categoryId: string | null;
      note: string | null;
    }> = {};

    // Validate and set amount if provided
    if (body.amount !== undefined) {
      try {
        updates.amountCents = validateTransactionAmount(body.amount);
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Invalid amount format' }),
          { status: 400 }
        );
      }
    }

    // Validate and set transactionDate if provided
    if (body.transactionDate !== undefined) {
      const transactionDate = new Date(body.transactionDate);
      if (isNaN(transactionDate.getTime())) {
        return new Response(
          JSON.stringify({ error: 'Invalid transactionDate format' }),
          { status: 400 }
        );
      }
      updates.transactionDate = transactionDate;
    }

    // Validate and set type if provided
    if (body.type !== undefined) {
      if (body.type !== 'INCOME' && body.type !== 'EXPENSE') {
        return new Response(
          JSON.stringify({ error: 'type must be INCOME or EXPENSE' }),
          { status: 400 }
        );
      }
      updates.type = body.type;
    }

    // Validate and set categoryId if provided
    if (body.categoryId !== undefined) {
      if (body.categoryId && !isValidCategoryId(body.categoryId)) {
        return new Response(
          JSON.stringify({ error: 'Invalid categoryId' }),
          { status: 400 }
        );
      }
      updates.categoryId = body.categoryId;
    }

    // Validate and set note if provided
    if (body.note !== undefined) {
      if (body.note !== null && !isValidNote(body.note)) {
        return new Response(
          JSON.stringify({ error: 'Note must be a string or null' }),
          { status: 400 }
        );
      }
      updates.note = body.note;
    }

    // Validate EXPENSE requires categoryId
    const finalType = updates.type || existingTransaction.type;
    const finalCategoryId = updates.categoryId !== undefined ? updates.categoryId : existingTransaction.categoryId;
    
    if (finalType === 'EXPENSE' && !finalCategoryId) {
      return new Response(
        JSON.stringify({ error: 'categoryId is required for EXPENSE transactions' }),
        { status: 400 }
      );
    }

    // Apply updates
    const updatedTransaction = updateTransaction(transactionId, updates);
    
    if (!updatedTransaction) {
      return new Response(
        JSON.stringify({ error: 'Failed to update transaction' }),
        { status: 500 }
      );
    }

    return Response.json({ data: updatedTransaction });
  } catch (error) {
    console.error('PATCH /api/transactions/[id] error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const transactionId = params.id;
    const existingTransaction = getTransactionById(transactionId);
    
    if (!existingTransaction) {
      return new Response(JSON.stringify({ error: 'Transaction not found' }), { status: 404 });
    }

    if (existingTransaction.userId !== session.userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const success = deleteTransaction(transactionId);
    
    if (!success) {
      return new Response(
        JSON.stringify({ error: 'Failed to delete transaction' }),
        { status: 500 }
      );
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/transactions/[id] error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}