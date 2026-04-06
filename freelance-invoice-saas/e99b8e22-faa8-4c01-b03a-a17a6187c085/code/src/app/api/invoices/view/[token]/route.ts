import { NextRequest, NextResponse } from 'next/server';
import { invoiceStore, invoiceItemStore, clientStore, userStore } from '@/lib/store';
import { getInvoiceWithItems } from '@/lib/store';
import type { Invoice, Client, User, InvoiceItem } from '@/lib/types';

type RouteParams = {
  params: {
    token: string;
  };
};

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find invoice by token
    const allInvoices = invoiceStore.getAll();
    const invoice = allInvoices.find((inv: Invoice) => inv.token === token);

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Transition status Sent → Viewed idempotently
    if (invoice.status === 'sent' && !invoice.viewedAt) {
      const now = Date.now();
      invoiceStore.update(invoice.id, {
        status: 'sent', // Keep as sent, just mark viewedAt
        viewedAt: now,
        updatedAt: now,
      });
    }

    // Get related data
    const client = clientStore.findById(invoice.clientId);
    const user = userStore.findById(invoice.userId);
    const items = invoiceItemStore.getAll().filter((item: InvoiceItem) => item.invoiceId === invoice.id);

    if (!client || !user) {
      return NextResponse.json(
        { error: 'Related data not found' },
        { status: 500 }
      );
    }

    // Return invoice with items (client and user for public view)
    return NextResponse.json({
      data: {
        invoice: {
          ...invoice,
          items: items,
        },
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
          companyName: client.companyName,
          billingAddress: client.billingAddress,
        },
        user: {
          id: user.id,
          businessName: user.businessName,
          businessAddress: user.businessAddress,
          businessLogo: user.businessLogo,
          currency: user.currency,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching invoice by token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';