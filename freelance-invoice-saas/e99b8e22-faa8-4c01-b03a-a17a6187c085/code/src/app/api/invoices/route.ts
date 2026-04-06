import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createInvoiceWithItems, getInvoicesByUser } from '@/lib/store';
import { InvoiceRequest } from '@/lib/types';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await requireAuth();
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    
    let invoices = getInvoicesByUser(user.id);
    
    if (status) {
      invoices = invoices.filter((invoice) => invoice.status === status);
    }
    
    if (clientId) {
      invoices = invoices.filter((invoice) => invoice.clientId === clientId);
    }
    
    // Sort by created date descending (newest first)
    invoices.sort((a, b) => b.createdAt - a.createdAt);
    
    return NextResponse.json({ data: invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch invoices' },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const user = await requireAuth();
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.clientId || !body.issueDate || !body.dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, issueDate, dueDate' },
        { status: 400 }
      );
    }
    
    // Ensure status is draft for new invoices
    const invoiceData: Omit<InvoiceRequest, 'items'> = {
      clientId: body.clientId,
      issueDate: body.issueDate,
      dueDate: body.dueDate,
      paymentTerms: body.paymentTerms || 30,
      notes: body.notes || '',
      terms: body.terms || '',
      currency: body.currency || user.currency,
      status: 'draft' // Always create as draft
    };
    
    // Validate items if provided
    const items = body.items || [];
    if (items.length === 0) {
      return NextResponse.json(
        { error: 'At least one line item is required' },
        { status: 400 }
      );
    }
    
    // Validate each item
    for (const item of items) {
      if (!item.description || item.quantity == null || item.rate == null) {
        return NextResponse.json(
          { error: 'Each line item must have description, quantity, and rate' },
          { status: 400 }
        );
      }
      if (item.quantity <= 0 || item.rate < 0) {
        return NextResponse.json(
          { error: 'Quantity must be positive and rate must be non-negative' },
          { status: 400 }
        );
      }
    }
    
    const invoice = createInvoiceWithItems(user.id, invoiceData, items);
    
    return NextResponse.json(
      { data: invoice },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create invoice' },
      { status: 500 }
    );
  }
}