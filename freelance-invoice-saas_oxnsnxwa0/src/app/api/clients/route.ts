import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { clientStore } from '@/lib/store';
import { Client, ClientRequest } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const clients = clientStore.getAll().filter((client: Client) => client.userId === user.id);
    
    return NextResponse.json({ data: clients });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to fetch clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    
    if (!body.name || !body.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }
    
    // Email validation (RFC 5322 simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    
    const clientData: ClientRequest = {
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      companyName: body.companyName?.trim() || null,
      billingAddress: {
        street: body.billingAddress?.street?.trim() || '',
        city: body.billingAddress?.city?.trim() || '',
        state: body.billingAddress?.state?.trim() || '',
        postalCode: body.billingAddress?.postalCode?.trim() || '',
        country: body.billingAddress?.country?.trim() || 'US'
      }
    };
    
    const client = clientStore.create({
      ...clientData,
      userId: user.id,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    return NextResponse.json({ data: client }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to create client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}