import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { store } from '@/lib/store';
import { InvoiceStatus, LineItem, Discount } from '@/lib/types';
import { 
  calculateInvoiceTotals, 
  validateLineItems,
  parseCurrencyToCents,
  validateInvoiceCalculations 
} from '@/lib/calculations';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoice = store.invoices.find(inv => inv.id === params.id && inv.createdBy === user.id);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const client = store.clients.find(c => c.id === invoice.clientId && c.createdBy === user.id);
    const taxRate = store.taxRates.find(tr => tr.id === invoice.taxRateId && tr.createdBy === user.id);

    return NextResponse.json({ 
      data: {
        invoice,
        client: client || null,
        taxRate: taxRate || null
      }
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceIndex = store.invoices.findIndex(inv => inv.id === params.id && inv.createdBy === user.id);
    if (invoiceIndex === -1) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const existingInvoice = store.invoices[invoiceIndex];

    if (existingInvoice.status !== 'draft') {
      return NextResponse.json({ 
        error: 'Only draft invoices can be edited' 
      }, { status: 409 });
    }

    const body = await request.json();
    const { clientId, lineItems, discount, taxRateId, dueDate, notes } = body;

    const updateData: Partial<Invoice> = {};
    
    if (clientId !== undefined) {
      const client = store.clients.find(c => c.id === clientId && c.createdBy === user.id);
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      updateData.clientId = clientId;
    }

    let taxRate = store.taxRates.find(tr => tr.id === existingInvoice.taxRateId);
    if (taxRateId !== undefined) {
      const newTaxRate = store.taxRates.find(tr => tr.id === taxRateId && tr.createdBy === user.id);
      if (!newTaxRate) {
        return NextResponse.json({ error: 'Tax rate not found' }, { status: 404 });
      }
      taxRate = newTaxRate;
      updateData.taxRateId = taxRateId;
    }

    let validatedLineItems = existingInvoice.lineItems;
    if (lineItems !== undefined) {
      if (!Array.isArray(lineItems) || lineItems.length === 0) {
        return NextResponse.json({ error: 'Invoice must have at least one line item' }, { status: 400 });
      }

      const lineItemValidation = validateLineItems(lineItems);
      if (lineItemValidation.length > 0) {
        return NextResponse.json({ error: `Invalid line items: ${lineItemValidation.join(', ')}` }, { status: 400 });
      }

      validatedLineItems = lineItems.map((item: any) => ({
        id: item.id || `item-${Date.now()}-${Math.random()}`,
        description: item.description,
        quantity: item.quantity,
        unitPriceCents: parseCurrencyToCents(item.unitPrice.toString()),
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    }

    let validatedDiscount = existingInvoice.discount;
    if (discount !== undefined) {
      validatedDiscount = {
        type: discount.type,
        valueCents: discount.type === 'fixed' ? parseCurrencyToCents(discount.value.toString()) : discount.value
      };
    }

    const calculations = calculateInvoiceTotals(validatedLineItems, validatedDiscount, taxRate!);

    const updatedInvoice: Invoice = {
      ...existingInvoice,
      ...updateData,
      lineItems: validatedLineItems,
      discount: validatedDiscount,
      subtotalCents: calculations.subtotalCents,
      discountAmountCents: calculations.discountAmountCents,
      taxAmountCents: calculations.taxAmountCents,
      totalCents: calculations.totalCents,
      dueDate: dueDate !== undefined ? dueDate : existingInvoice.dueDate,
      notes: notes !== undefined ? notes : existingInvoice.notes,
      updatedAt: new Date().toISOString()
    };

    const validation = validateInvoiceCalculations({
      subtotalCents: updatedInvoice.subtotalCents,
      discountAmountCents: updatedInvoice.discountAmountCents,
      taxAmountCents: updatedInvoice.taxAmountCents,
      totalCents: updatedInvoice.totalCents,
      lineItems: updatedInvoice.lineItems,
      discount: updatedInvoice.discount,
      taxRate: taxRate!
    });

    if (!validation) {
      return NextResponse.json({ error: 'Invalid invoice calculations' }, { status: 400 });
    }

    store.invoices[invoiceIndex] = updatedInvoice;

    return NextResponse.json({ data: updatedInvoice });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceIndex = store.invoices.findIndex(inv => inv.id === params.id && inv.createdBy === user.id);
    if (invoiceIndex === -1) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = store.invoices[invoiceIndex];

    if (invoice.status !== 'draft') {
      return NextResponse.json({ 
        error: 'Only draft invoices can be deleted' 
      }, { status: 409 });
    }

    store.invoices.splice(invoiceIndex, 1);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}