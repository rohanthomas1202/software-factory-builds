import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { DashboardStats, InvoiceStatus } from '@/lib/types';
import { getUserInvoices } from '@/lib/store';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allInvoices = getUserInvoices(user.id);
    
    // Lazy overdue updates: update any sent invoices past due_date to overdue
    const now = new Date();
    for (const invoice of allInvoices) {
      if (
        invoice.status === 'sent' &&
        invoice.dueDate &&
        new Date(invoice.dueDate) < now
      ) {
        invoice.status = 'overdue';
      }
    }

    // Re-fetch invoices after updates
    const updatedInvoices = getUserInvoices(user.id);
    
    // Calculate stats
    let outstandingTotal = 0;
    let paidThisMonth = 0;
    let overdueCount = 0;
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    for (const invoice of updatedInvoices) {
      if (invoice.status === 'sent' || invoice.status === 'overdue') {
        outstandingTotal += invoice.totalCents;
      }
      
      if (invoice.status === 'overdue') {
        overdueCount++;
      }
      
      if (invoice.status === 'paid' && invoice.paymentDate) {
        const paymentDate = new Date(invoice.paymentDate);
        if (paymentDate.getMonth() === thisMonth && paymentDate.getFullYear() === thisYear) {
          paidThisMonth += invoice.totalCents;
        }
      }
    }

    // Get recent invoices (5 most recent, excluding drafts)
    const recentInvoices = updatedInvoices
      .filter(inv => inv.status !== 'draft')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const stats: DashboardStats = {
      outstandingTotal,
      paidThisMonth,
      overdueCount,
      totalInvoices: updatedInvoices.length,
      recentInvoices,
      updatedAt: now.toISOString()
    };

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}