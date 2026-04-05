import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { store } from '@/lib/store';

interface RouteParams {
  params: { id: string };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    
    const client = store.clients.find(
      c => c.id === params.id && c.userId === user.id
    );
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ data: client });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authentication failed' },
      { status: 401 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    
    const clientIndex = store.clients.findIndex(
      c => c.id === params.id && c.userId === user.id
    );
    
    if (clientIndex === -1) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    const client = store.clients[clientIndex];
    
    if (client.archived) {
      return NextResponse.json(
        { error: 'Cannot modify archived client' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { name, email, billingAddress } = body;
    
    if (!name && !email && !billingAddress) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      );
    }
    
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
      store.clients[clientIndex].email = email.trim().toLowerCase();
    }
    
    if (name) {
      store.clients[clientIndex].name = name.trim();
    }
    
    if (billingAddress) {
      store.clients[clientIndex].billingAddress = billingAddress.trim();
    }
    
    store.clients[clientIndex].updatedAt = new Date();
    
    return NextResponse.json({ data: store.clients[clientIndex] });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    
    const clientIndex = store.clients.findIndex(
      c => c.id === params.id && c.userId === user.id
    );
    
    if (clientIndex === -1) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    const client = store.clients[clientIndex];
    
    if (client.archived) {
      return NextResponse.json(
        { error: 'Client is already archived' },
        { status: 400 }
      );
    }
    
    const hasInvoices = store.invoices.some(
      invoice => invoice.clientId === params.id
    );
    
    if (hasInvoices) {
      return NextResponse.json(
        { error: 'Cannot archive client with existing invoices' },
        { status: 400 }
      );
    }
    
    store.clients[clientIndex].archived = true;
    store.clients[clientIndex].updatedAt = new Date();
    
    return NextResponse.json({ 
      data: { 
        message: 'Client archived successfully',
        client: store.clients[clientIndex]
      } 
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to archive client' },
      { status: 500 }
    );
  }
}