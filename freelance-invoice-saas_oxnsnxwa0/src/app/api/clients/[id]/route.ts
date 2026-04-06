import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { clientStore, invoiceStore } from '@/lib/store';
import { Client, ClientRequest } from '@/lib/types';

interface RouteParams {
  params: { id: string };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const client = clientStore.findById(params.id);
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    if (client.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    return NextResponse.json({ data: client });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to fetch client:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const client = clientStore.findById(params.id);
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    if (client.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
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
    
    const updatedClient = clientStore.update(params.id, {
      ...client,
      ...clientData,
      updatedAt: Date.now()
    });
    
    return NextResponse.json({ data: updatedClient });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to update client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await requireAuth();
    const client = clientStore.findById(params.id);
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    if (client.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Check for unpaid invoices
    const allInvoices = invoiceStore.getAll();
    const blockingInvoices = allInvoices.filter(invoice => 
      invoice.clientId === params.id && 
      invoice.userId === user.id &&
      !['paid', 'void'].includes(invoice.status)
    );
    
    if (blockingInvoices.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete client with unpaid invoices', 
        data: {
          canDelete: false,
          blockingInvoiceIds: blockingInvoices.map(inv => inv.id)
        }
      }, { status: 409 });
    }
    
    clientStore.delete(params.id);
    
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to delete client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}