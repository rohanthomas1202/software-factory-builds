import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getInvoiceWithItems } from '@/lib/store';
import { getInvoicePdfUrl } from '@/lib/pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const user = await requireAuth();
    const invoiceId = params.id;

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

    // Check if invoice has a token (required for public URL)
    if (!invoice.token) {
      return NextResponse.json(
        { error: 'Invoice does not have a public URL. Send the invoice first to generate a shareable link.' },
        { status: 400 }
      );
    }

    // Generate PDF URL
    const pdfUrl = getInvoicePdfUrl(invoice);

    return NextResponse.json({
      data: {
        url: pdfUrl,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        expiresAt: null, // Public URLs don't expire in this implementation
        downloadUrl: `/api/invoices/view/${invoice.token}?download=1`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF URL:', error);
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