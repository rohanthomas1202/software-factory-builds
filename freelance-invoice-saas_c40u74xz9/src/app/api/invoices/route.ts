import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { store } from '@/lib/store';
import { generateId, generateInvoiceNumber } from '@/lib/store';
import { Invoice, InvoiceStatus, LineItem, Discount, TaxRate } from '@/lib/types';
import { 
  calculateInvoiceTotals, 
  validateLineItems,
  parseCurrencyToCents,
  validateInvoiceCalculations 
} from '@/lib/calculations';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') as InvoiceStatus | null;
    const clientId = url.searchParams.get('clientId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let invoices = store.invoices.filter(inv => inv.createdBy === user.id);

    if (status) {
      invoices = invoices.filter(inv => inv.status === status);
    }

    if (clientId) {
      invoices = invoices.filter(inv => inv.clientId === clientId);
    }

    const sortedInvoices = invoices.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const paginatedInvoices = sortedInvoices.slice(offset, offset + limit);

    return NextResponse.json({ 
      data: {
        invoices: paginatedInvoices,
        pagination: {
          total: invoices.length,
          limit,
          offset,
          hasMore: offset + limit < invoices.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const requiredFields = ['clientId', 'lineItems', 'discount', 'taxRateId'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const { clientId, lineItems, discount, taxRateId, dueDate, notes } = body;

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return NextResponse.json({ error: 'Invoice must have at least one line item' }, { status: 400 });
    }

    const lineItemValidation = validateLineItems(lineItems);
    if (lineItemValidation.length > 0) {
      return NextResponse.json({ error: `Invalid line items: ${lineItemValidation.join(', ')}` }, { status: 400 });
    }

    const client = store.clients.find(c => c.id === clientId && c.createdBy === user.id);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const taxRate = store.taxRates.find(tr => tr.id === taxRateId && tr.createdBy === user.id);
    if (!taxRate) {
      return NextResponse.json({ error: 'Tax rate not found' }, { status: 404 });
    }

    const validatedLineItems: LineItem[] = lineItems.map((item: any) => ({
      id: generateId(),
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: parseCurrencyToCents(item.unitPrice.toString()),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    const validatedDiscount: Discount = {
      type: discount.type,
      valueCents: discount.type === 'fixed' ? parseCurrencyToCents(discount.value.toString()) : discount.value
    };

    const calculations = calculateInvoiceTotals(validatedLineItems, validatedDiscount, taxRate);

    const invoice: Invoice = {
      id: generateId(),
      invoiceNumber: generateInvoiceNumber(user.id),
      clientId,
      createdBy: user.id,
      status: 'draft',
      lineItems: validatedLineItems,
      discount: validatedDiscount,
      taxRateId,
      subtotalCents: calculations.subtotalCents,
      discountAmountCents: calculations.discountAmountCents,
      taxAmountCents: calculations.taxAmountCents,
      totalCents: calculations.totalCents,
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sentAt: null,
      paidAt: null
    };

    const validation = validateInvoiceCalculations({
      subtotalCents: invoice.subtotalCents,
      discountAmountCents: invoice.discountAmountCents,
      taxAmountCents: invoice.taxAmountCents,
      totalCents: invoice.totalCents,
      lineItems: invoice.lineItems,
      discount: invoice.discount,
      taxRate
    });

    if (!validation) {
      return NextResponse.json({ error: 'Invalid invoice calculations' }, { status: 400 });
    }

    store.invoices.push(invoice);

    return NextResponse.json({ data: invoice }, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}