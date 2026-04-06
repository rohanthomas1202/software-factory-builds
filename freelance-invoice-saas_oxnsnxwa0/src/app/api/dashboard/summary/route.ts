import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { invoiceStore } from '@/lib/store';
import { getOverdueInvoicesForUser, calculateTotalOverdueAmount } from '@/lib/overdue';
import type { Invoice } from '@/lib/types';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all invoices for the user
    const allInvoices = invoiceStore.getAll();
    const userInvoices = allInvoices.filter((inv: Invoice) => inv.userId === user.id);

    // Calculate totals
    let totalPaid = 0;
    let outstandingBalance = 0;

    userInvoices.forEach((invoice: Invoice) => {
      if (invoice.status === 'paid') {
        totalPaid += invoice.total;
      } else if (invoice.status === 'sent' || invoice.status === 'overdue') {
        outstandingBalance += invoice.total;
      }
    });

    // Get overdue data
    const overdueInvoices = getOverdueInvoicesForUser(user.id);
    const overdueCount = overdueInvoices.length;

    // You could also calculate total overdue amount from the overdue module
    const totalOverdueAmount = calculateTotalOverdueAmount(user.id);

    return NextResponse.json({
      data: {
        totalPaid,
        outstandingBalance,
        overdueCount,
        totalOverdueAmount,
        currency: user.currency,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';