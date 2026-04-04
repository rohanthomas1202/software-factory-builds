import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { store } from '@/lib/store'
import { UpdateClientRequest } from '@/types'

// GET /api/clients/[id] - Get a specific client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const client = await store.getClientById(params.id)

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Verify the client belongs to the current user
    if (client.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/clients/[id] - Update a client
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const client = await store.getClientById(params.id)

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Verify the client belongs to the current user
    if (client.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body: UpdateClientRequest = await request.json()

    // Validate email if provided
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }

      // Check if another client with same email already exists for this user
      const existingClients = await store.getClientsByUserId(session.userId)
      const duplicateClient = existingClients.find(
        c => c.id !== params.id && c.email?.toLowerCase() === body.email?.toLowerCase()
      )

      if (duplicateClient) {
        return NextResponse.json(
          { error: 'Another client with this email already exists' },
          { status: 409 }
        )
      }
    }

    // Update the client
    const updatedClient = await store.updateClient(params.id, body)

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/clients/[id] - Delete a client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const client = await store.getClientById(params.id)

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Verify the client belongs to the current user
    if (client.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check if client has any invoices
    const userInvoices = await store.getInvoicesByUserId(session.userId)
    const clientInvoices = userInvoices.filter(invoice => invoice.clientId === params.id)

    if (clientInvoices.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete client with existing invoices',
          invoiceCount: clientInvoices.length
        },
        { status: 400 }
      )
    }

    // Delete the client
    await store.deleteClient(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}