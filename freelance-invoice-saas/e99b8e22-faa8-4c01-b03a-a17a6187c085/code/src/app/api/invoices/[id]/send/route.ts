import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { invoiceStore, clientStore } from '@/lib/store';
import { getInvoiceWithItems } from '@/lib/store';
import { type Invoice } from '@/lib/types';

// Simple in-memory email log for simulation
interface EmailLog {
  id: string;
  invoiceId: string;
  sentAt: number;
  recipientEmail: string;
  status: 'sent' | 'failed';
  error?: string;
}

const emailLogs: EmailLog[] = [];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const user = await requireAuth();
    const invoiceId = params.id;

    // Get invoice with items
    const invoiceData = getInvoiceWithItems(invoiceId);
    if (!invoiceData) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const { invoice, items, client } = invoiceData;

    // Check ownership
    if (invoice.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Validate invoice can be sent
    if (invoice.status !== 'draft') {
      return NextResponse.json(
        { error: `Invoice must be in draft status to send. Current status: ${invoice.status}` },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!client.email) {
      return NextResponse.json(
        { error: 'Client email is required to send invoice' },
        { status: 400 }
      );
    }

    // Generate token if not exists
    let token = invoice.token;
    if (!token) {
      token = crypto.randomUUID();
    }

    // Update invoice: status → sent, set sentAt, update token
    const updatedInvoice: Invoice = {
      ...invoice,
      status: 'sent' as const,
      sentAt: Date.now(),
      token,
      updatedAt: Date.now(),
    };

    invoiceStore.update(invoiceId, updatedInvoice);

    // Simulate email sending (log to EmailLog)
    const emailLog: EmailLog = {
      id: crypto.randomUUID(),
      invoiceId,
      sentAt: Date.now(),
      recipientEmail: client.email,
      status: 'sent',
    };
    emailLogs.push(emailLog);

    // Create placeholder Stripe payment link
    // In a real app, this would call Stripe API
    const paymentLink = `https://checkout.stripe.com/pay/${invoiceId}_${token}`;

    return NextResponse.json({
      data: {
        invoice: updatedInvoice,
        emailLog: {
          id: emailLog.id,
          sentAt: emailLog.sentAt,
          recipientEmail: emailLog.recipientEmail,
          status: emailLog.status,
        },
        paymentLink,
        message: 'Invoice sent successfully',
      },
    });
  } catch (error) {
    console.error('Error sending invoice:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}