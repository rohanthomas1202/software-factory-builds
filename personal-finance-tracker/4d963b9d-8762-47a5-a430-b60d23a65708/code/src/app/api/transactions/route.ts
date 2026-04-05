import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { createTransaction, getTransactionsByUserId } from '@/lib/store';
import { 
  validateTransactionAmount, 
  isValidCategoryId, 
  isValidNote 
} from '@/lib/validation';
import { TransactionType, CreateTransactionRequest } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');
    const startDateStr = searchParams.get('start_date');
    const endDateStr = searchParams.get('end_date');
    const type = searchParams.get('type') as TransactionType | null;
    const page = parseInt(searchParams.get('page') || '1');

    // Build filters
    const filters: {
      startDate?: Date;
      endDate?: Date;
      categoryId?: string;
      type?: TransactionType;
    } = {};

    if (categoryId) {
      filters.categoryId = categoryId;
    }

    if (startDateStr) {
      const startDate = new Date(startDateStr);
      if (!isNaN(startDate.getTime())) {
        filters.startDate = startDate;
      }
    }

    if (endDateStr) {
      const endDate = new Date(endDateStr);
      if (!isNaN(endDate.getTime())) {
        filters.endDate = endDate;
      }
    }

    if (type && (type === 'INCOME' || type === 'EXPENSE')) {
      filters.type = type;
    }

    // Get all transactions for user with filters
    const allTransactions = getTransactionsByUserId(session.userId, filters);
    
    // Pagination: 50 per page
    const pageSize = 50;
    const totalPages = Math.ceil(allTransactions.length / pageSize);
    const validPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (validPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

    return Response.json({
      data: {
        transactions: paginatedTransactions,
        totalPages: totalPages || 1,
        currentPage: validPage,
        totalCount: allTransactions.length
      }
    });
  } catch (error) {
    console.error('GET /api/transactions error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body: CreateTransactionRequest = await request.json();

    // Validate required fields
    if (!body.amount || !body.transactionDate || !body.type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: amount, transactionDate, type' }),
        { status: 400 }
      );
    }

    // Validate type
    if (body.type !== 'INCOME' && body.type !== 'EXPENSE') {
      return new Response(
        JSON.stringify({ error: 'type must be INCOME or EXPENSE' }),
        { status: 400 }
      );
    }

    // Validate amount
    let amountCents: number;
    try {
      amountCents = validateTransactionAmount(body.amount);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount format' }),
        { status: 400 }
      );
    }

    // Validate categoryId
    if (body.type === 'EXPENSE' && !body.categoryId) {
      return new Response(
        JSON.stringify({ error: 'categoryId is required for EXPENSE transactions' }),
        { status: 400 }
      );
    }

    if (body.categoryId && !isValidCategoryId(body.categoryId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid categoryId' }),
        { status: 400 }
      );
    }

    // Validate note
    if (body.note && !isValidNote(body.note)) {
      return new Response(
        JSON.stringify({ error: 'Note must be a string or null' }),
        { status: 400 }
      );
    }

    // Parse transaction date
    const transactionDate = new Date(body.transactionDate);
    if (isNaN(transactionDate.getTime())) {
      return new Response(
        JSON.stringify({ error: 'Invalid transactionDate format' }),
        { status: 400 }
      );
    }

    // Create transaction
    const transaction = createTransaction({
      userId: session.userId,
      amountCents,
      transactionDate,
      type: body.type,
      categoryId: body.categoryId,
      note: body.note || null,
      createdAt: new Date(),
    });

    return new Response(
      JSON.stringify({ data: transaction }),
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/transactions error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}