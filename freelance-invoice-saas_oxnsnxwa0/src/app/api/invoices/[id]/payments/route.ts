import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { invoiceStore, paymentStore } from '@/lib/store';
import { getInvoiceWithItems } from '@/lib/store';
import { type Payment, type Invoice } from '@/lib/types';

interface PaymentRequest {
  amount: number;
  currency: string;
  method: string;
  reference: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const user = await requireAuth();
    const invoiceId = params.id;

    // Parse request body
    const body: PaymentRequest = await request.json();

    // Validate request
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Payment amount must be greater than 0' },
        { status: 400 }
      );
    }
    if (!body.currency) {
      return NextResponse.json(
        { error: 'Currency is required' },
        { status: 400 }
      );
    }
    if (!body.method) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      );
    }

    // Get invoice
    const invoiceData = getInvoiceWithItems(invoiceId);
    if (!invoiceData) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const { invoice } = invoiceData;

    // Check ownership
    if (invoice.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if payment amount is sufficient
    if (body.amount < invoice.total) {
      return NextResponse.json(
        { 
          error: 'Payment amount is less than invoice total',
          requiredAmount: invoice.total,
          providedAmount: body.amount,
          shortfall: invoice.total - body.amount
        },
        { status: 400 }
      );
    }

    // Create payment record
    const paymentId = crypto.randomUUID();
    const payment: Payment = {
      id: paymentId,
      invoiceId,
      amount: body.amount,
      currency: body.currency,
      method: body.method,
      reference: body.reference || `manual_${Date.now()}`,
      paidAt: Date.now(),
      createdAt: Date.now(),
    };

    paymentStore.create(payment);

    // Update invoice status if full payment
    let updatedInvoice: Invoice | null = null;
    if (body.amount >= invoice.total && invoice.status !== 'paid') {
      updatedInvoice = {
        ...invoice,
        status: 'paid' as const,
        paidAt: Date.now(),
        updatedAt: Date.now(),
      };
      invoiceStore.update(invoiceId, updatedInvoice);
    }

    return NextResponse.json({
      data: {
        payment,
        invoice: updatedInvoice || invoice,
        message: body.amount >= invoice.total 
          ? 'Payment recorded and invoice marked as paid' 
          : 'Payment recorded (partial)',
      },
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}