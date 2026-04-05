import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { store } from '@/lib/store';
import { generateId } from '@/lib/store';
import { Client } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    const searchParams = request.nextUrl.searchParams;
    const includeArchived = searchParams.get('includeArchived') === 'true';
    
    let clients = store.clients.filter(client => client.userId === user.id);
    
    if (!includeArchived) {
      clients = clients.filter(client => !client.archived);
    }
    
    return NextResponse.json({ data: clients });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authentication failed' },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    const body = await request.json();
    const { name, email, billingAddress } = body;
    
    if (!name || !email || !billingAddress) {
      return NextResponse.json(
        { error: 'Name, email, and billing address are required' },
        { status: 400 }
      );
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    const newClient: Client = {
      id: generateId(),
      userId: user.id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      billingAddress: billingAddress.trim(),
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    store.clients.push(newClient);
    
    return NextResponse.json(
      { data: newClient },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}