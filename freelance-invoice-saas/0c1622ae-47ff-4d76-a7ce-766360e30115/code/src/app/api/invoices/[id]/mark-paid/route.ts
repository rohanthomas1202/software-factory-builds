import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { Invoice, InvoiceStatus } from '@/lib/types';
import { requireAuth } from '@/lib/auth';
import { getInvoiceWithRelations } from '@/lib/store';

interface RouteParams {
  params: { id: string };
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const invoiceId = params.id;
    const invoice = store.invoices.find(
      (inv) => inv.id === invoiceId && inv.userId === user.id
    );

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found or access denied' },
        { status: 404 }
      );
    }

    // Check if invoice can be marked as paid
    const allowedStatuses: InvoiceStatus[] = ['sent', 'overdue'];
    if (!allowedStatuses.includes(invoice.status)) {
      return NextResponse.json(
        { 
          error: `Cannot mark invoice as paid from status: ${invoice.status}. 
          Invoice must be 'sent' or 'overdue'.` 
        },
        { status: 400 }
      );
    }

    // Update invoice
    invoice.status = 'paid';
    invoice.paidAt = new Date().toISOString();
    invoice.updatedAt = new Date().toISOString();

    // Record payment in store
    const payment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      invoiceId: invoice.id,
      userId: user.id,
      amountCents: invoice.totalCents,
      paymentMethod: 'manual', // Default for manual mark as paid
      reference: `PAY-${invoice.invoiceNumber}`,
      paidAt: invoice.paidAt,
      createdAt: new Date().toISOString(),
    };

    store.payments.push(payment);

    // Get updated invoice with relations for response
    const updatedInvoice = getInvoiceWithRelations(invoice.id);

    return NextResponse.json(
      { data: updatedInvoice },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}