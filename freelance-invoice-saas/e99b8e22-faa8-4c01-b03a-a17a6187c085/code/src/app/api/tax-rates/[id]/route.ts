import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { taxRateStore, invoiceItemStore } from '@/lib/store';
import { TaxRate } from '@/lib/types';

interface RouteParams {
  params: { id: string };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const user = await requireAuth();
    const taxRate = taxRateStore.findById(params.id);
    
    if (!taxRate) {
      return NextResponse.json({ error: 'Tax rate not found' }, { status: 404 });
    }
    
    if (taxRate.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    return NextResponse.json({ data: taxRate }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to fetch tax rate:', error);
    return NextResponse.json({ error: 'Failed to fetch tax rate' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const user = await requireAuth();
    const taxRate = taxRateStore.findById(params.id);
    
    if (!taxRate) {
      return NextResponse.json({ error: 'Tax rate not found' }, { status: 404 });
    }
    
    if (taxRate.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const body = await request.json();
    
    if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length === 0)) {
      return NextResponse.json({ error: 'Name must be a non-empty string' }, { status: 400 });
    }
    
    if (body.rate !== undefined && (typeof body.rate !== 'number' || body.rate < 0 || body.rate > 100)) {
      return NextResponse.json({ error: 'Rate must be a number between 0 and 100' }, { status: 400 });
    }
    
    const updateData: Partial<TaxRate> = {
      ...body,
      updatedAt: Date.now()
    };
    
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.rate !== undefined) updateData.rate = Number(body.rate.toFixed(2));
    
    const updatedTaxRate = taxRateStore.update(params.id, updateData);
    
    return NextResponse.json({ data: updatedTaxRate }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to update tax rate:', error);
    return NextResponse.json({ error: 'Failed to update tax rate' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const user = await requireAuth();
    const taxRate = taxRateStore.findById(params.id);
    
    if (!taxRate) {
      return NextResponse.json({ error: 'Tax rate not found' }, { status: 404 });
    }
    
    if (taxRate.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Check if tax rate is in use
    const itemsUsingTaxRate = invoiceItemStore.getAll()
      .filter((item) => item.taxRateId === params.id);
    
    if (itemsUsingTaxRate.length > 0) {
      const blockingInvoiceIds = [...new Set(itemsUsingTaxRate.map(item => item.invoiceId))];
      return NextResponse.json(
        { 
          error: 'Tax rate is in use by invoice items',
          blockingInvoiceIds
        },
        { status: 409 }
      );
    }
    
    // Soft delete by marking as inactive
    const updatedTaxRate = taxRateStore.update(params.id, {
      isActive: false,
      updatedAt: Date.now()
    });
    
    return NextResponse.json({ data: updatedTaxRate }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to delete tax rate:', error);
    return NextResponse.json({ error: 'Failed to delete tax rate' }, { status: 500 });
  }
}