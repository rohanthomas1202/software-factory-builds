```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { store } from '@/lib/store'
import { UpdateInvoiceRequest } from '@/types'

// GET /api/invoices/[id] - Get a specific invoice
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

    const invoice = await store.getInvoice(params.id)

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Check if invoice belongs to user
    if (invoice.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get client details
    const client = await store.getClient(invoice.clientId)
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...invoice,
      client
    })
  } catch (error) {
    console.error('Failed to fetch invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

// PUT /api/invoices/[id] - Update an invoice
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

    const invoice = await store.getInvoice(params.id)

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Check if invoice belongs to user
    if (invoice.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Cannot update sent or paid invoices
    if (invoice.status === 'sent' || invoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Cannot update sent or paid invoices' },
        { status: 400 }
      )
    }

    const body: UpdateInvoiceRequest = await request.json()

    // Validate items if provided
    if (body.items) {
      for (const item of body.items) {
        if (!item.description || item.quantity <= 0 || item.unitPrice < 0) {
          return NextResponse.json(
            { error: 'Invalid item data' },
            { status: 400 }
          )
        }
      }
    }

    // Validate dates
    if (body.dueDate && new Date(body.dueDate) < new Date(body.issueDate || invoice.issueDate)) {
      return NextResponse.json(
        { error: 'Due date must be after issue date' },
        { status: 400 }
      )
    }

    // Update invoice
    const updatedInvoice = await store.updateInvoice(params.id, body)

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error('Failed to update invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

// DELETE /api/invoices/[id] - Delete an invoice
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

    const invoice = await store.getInvoice(params.id)

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Check if invoice belongs to user
    if (invoice.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Cannot delete sent or paid invoices
    if (invoice.status === 'sent' || invoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Cannot delete sent or paid invoices' },
        { status: 400 }
      )
    }

    await store.deleteInvoice(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}
```