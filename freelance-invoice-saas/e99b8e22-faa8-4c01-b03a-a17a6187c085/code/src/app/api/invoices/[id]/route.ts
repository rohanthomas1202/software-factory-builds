import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { 
  invoiceStore, 
  invoiceItemStore, 
  getInvoiceWithItems, 
  clientStore 
} from '@/lib/store';
import { InvoiceRequest } from '@/lib/types';
import { calculateInvoiceTotals } from '@/lib/invoice-utils';

interface RouteParams {
  params: { id: string };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const user = await requireAuth();
    
    const invoice = getInvoiceWithItems(params.id);
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    if (invoice.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ data: invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const user = await requireAuth();
    
    const existingInvoice = invoiceStore.findById(params.id);
    
    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    if (existingInvoice.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Only allow updates for draft invoices
    if (existingInvoice.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft invoices can be updated' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.clientId || !body.issueDate || !body.dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, issueDate, dueDate' },
        { status: 400 }
      );
    }
    
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
    
    // Get client to ensure it exists and belongs to user
    const client = clientStore.findById(body.clientId);
    if (!client || client.userId !== user.id) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 400 }
      );
    }
    
    // Get tax rates for the user to calculate totals
    const taxRates = Array.from(invoiceItemStore.getAll())
      .map(item => {
        if (item.taxRateId) {
          // In a real app, we'd fetch tax rate details
          // For now, we'll use a placeholder
          return {
            id: item.taxRateId,
            userId: user.id,
            name: 'Tax',
            rate: 0.1, // Default 10%
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
        }
        return null;
      })
      .filter(Boolean);
    
    // Calculate new totals
    const totals = calculateInvoiceTotals(
      items.map(item => ({
        ...item,
        id: 'temp',
        invoiceId: params.id,
        sortOrder: item.sortOrder || 0,
        createdAt: Date.now()
      })),
      taxRates
    );
    
    // Update the invoice
    const updatedInvoice = invoiceStore.update(params.id, {
      ...existingInvoice,
      clientId: body.clientId,
      issueDate: body.issueDate,
      dueDate: body.dueDate,
      paymentTerms: body.paymentTerms || existingInvoice.paymentTerms,
      notes: body.notes || existingInvoice.notes,
      terms: body.terms || existingInvoice.terms,
      currency: body.currency || existingInvoice.currency,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      total: totals.total,
      updatedAt: Date.now()
    });
    
    if (!updatedInvoice) {
      return NextResponse.json(
        { error: 'Failed to update invoice' },
        { status: 500 }
      );
    }
    
    // Delete existing line items
    const existingItems = Array.from(invoiceItemStore.getAll())
      .filter(item => item.invoiceId === params.id);
    
    for (const item of existingItems) {
      invoiceItemStore.delete(item.id);
    }
    
    // Create new line items
    const newItems = items.map((item, index) => {
      return invoiceItemStore.create({
        ...item,
        invoiceId: params.id,
        sortOrder: item.sortOrder || index,
        createdAt: Date.now()
      });
    });
    
    return NextResponse.json({
      data: {
        ...updatedInvoice,
        items: newItems
      }
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const user = await requireAuth();
    
    const invoice = invoiceStore.findById(params.id);
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    if (invoice.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Only allow deletion of draft invoices (void them instead)
    if (invoice.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft invoices can be deleted' },
        { status: 400 }
      );
    }
    
    // Delete the invoice
    const deleted = invoiceStore.delete(params.id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete invoice' },
        { status: 500 }
      );
    }
    
    // Delete associated line items
    const items = Array.from(invoiceItemStore.getAll())
      .filter(item => item.invoiceId === params.id);
    
    for (const item of items) {
      invoiceItemStore.delete(item.id);
    }
    
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}