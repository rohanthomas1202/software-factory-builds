import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { verifyInvoiceToken } from '@/lib/token';
import { getInvoiceWithRelations } from '@/lib/store';
import { Invoice } from '@/lib/types';

interface RouteParams {
  params: { token: string };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { token } = params;
    
    // Verify the token
    const payload = verifyInvoiceToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired invoice link' },
        { status: 401 }
      );
    }

    const { invoiceId, userId } = payload;
    
    // Get the invoice (no auth required for public view)
    const invoice = store.invoices.find(
      (inv) => inv.id === invoiceId && inv.userId === userId
    );

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Update viewedAt timestamp if not already set
    if (!invoice.viewedAt) {
      invoice.viewedAt = new Date().toISOString();
      invoice.updatedAt = new Date().toISOString();
      
      // Also log the view
      store.invoiceViews.push({
        id: `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        invoiceId: invoice.id,
        viewedAt: invoice.viewedAt,
        userAgent: request.headers.get('user-agent') || 'unknown',
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
    }

    // Get invoice with relations (client, user, tax rate)
    const invoiceWithRelations = getInvoiceWithRelations(invoice.id);

    // Return minimal public data (no sensitive fields)
    const publicInvoice = {
      id: invoiceWithRelations.id,
      invoiceNumber: invoiceWithRelations.invoiceNumber,
      status: invoiceWithRelations.status,
      issueDate: invoiceWithRelations.issueDate,
      dueDate: invoiceWithRelations.dueDate,
      lineItems: invoiceWithRelations.lineItems,
      subtotalCents: invoiceWithRelations.subtotalCents,
      discountAmountCents: invoiceWithRelations.discountAmountCents,
      taxAmountCents: invoiceWithRelations.taxAmountCents,
      totalCents: invoiceWithRelations.totalCents,
      notes: invoiceWithRelations.notes,
      client: invoiceWithRelations.client,
      taxRate: invoiceWithRelations.taxRate,
      user: {
        id: invoiceWithRelations.user.id,
        businessName: invoiceWithRelations.user.businessName,
        email: invoiceWithRelations.user.email,
        address: invoiceWithRelations.user.address,
        phone: invoiceWithRelations.user.phone,
      },
      viewedAt: invoiceWithRelations.viewedAt,
      sentAt: invoiceWithRelations.sentAt,
      paidAt: invoiceWithRelations.paidAt,
    };

    return NextResponse.json(
      { data: publicInvoice },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching public invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}