import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateInvoicePdf, logEmailSend } from '@/lib/pdf';
import { signInvoiceToken } from '@/lib/token';
import { store } from '@/lib/store';
import { Invoice } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const invoiceId = params.id;
    const invoice = store.invoices.find(inv => inv.id === invoiceId && inv.userId === user.id);

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (invoice.status !== 'draft') {
      return NextResponse.json(
        { error: 'Invoice must be in draft status to send' },
        { status: 400 }
      );
    }

    // Transition status to 'sent'
    invoice.status = 'sent';
    invoice.sentAt = new Date();
    invoice.updatedAt = new Date();

    // Generate PDF
    const client = store.clients.find(c => c.id === invoice.clientId);
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const taxRate = store.taxRates.find(t => t.id === invoice.taxRateId);
    if (!taxRate) {
      return NextResponse.json(
        { error: 'Tax rate not found' },
        { status: 404 }
      );
    }

    const pdfResult = generateInvoicePdf(invoice, client, user, taxRate);
    invoice.pdfUrl = pdfResult.pdfUrl;

    // Create a public token for viewing
    const signedToken = signInvoiceToken(invoiceId, user.id);

    // Simulate sending email and log it
    const emailLog = logEmailSend(
      invoiceId,
      user.id,
      client.email,
      'sent',
      undefined,
      signedToken.token
    );

    return NextResponse.json({
      data: {
        invoice,
        emailLog,
        publicToken: signedToken.token,
        expiresAt: signedToken.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error sending invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}