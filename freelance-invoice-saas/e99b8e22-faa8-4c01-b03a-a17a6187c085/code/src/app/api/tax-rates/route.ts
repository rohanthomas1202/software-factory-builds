import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { taxRateStore } from '@/lib/store';
import { TaxRate } from '@/lib/types';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const user = await requireAuth();
    
    const taxRates = taxRateStore.getAll()
      .filter((rate: TaxRate) => rate.userId === user.id && rate.isActive)
      .sort((a: TaxRate, b: TaxRate) => a.name.localeCompare(b.name));
    
    return NextResponse.json({ data: taxRates }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to fetch tax rates:', error);
    return NextResponse.json({ error: 'Failed to fetch tax rates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const user = await requireAuth();
    const body = await request.json();
    
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    if (typeof body.rate !== 'number' || body.rate < 0 || body.rate > 100) {
      return NextResponse.json({ error: 'Rate must be a number between 0 and 100' }, { status: 400 });
    }
    
    const taxRateData = {
      userId: user.id,
      name: body.name.trim(),
      rate: Number(body.rate.toFixed(2)),
      isActive: body.isActive !== false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    const taxRate = taxRateStore.create(taxRateData);
    
    return NextResponse.json({ data: taxRate }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to create tax rate:', error);
    return NextResponse.json({ error: 'Failed to create tax rate' }, { status: 500 });
  }
}