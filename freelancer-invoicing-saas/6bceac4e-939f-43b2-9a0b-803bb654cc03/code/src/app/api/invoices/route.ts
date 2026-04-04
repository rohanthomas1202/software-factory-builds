```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { store } from '@/lib/store'
import { CreateInvoiceRequest, InvoiceStatus } from '@/types'

// GET /api/invoices - Get all invoices for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as InvoiceStatus | null
    const clientId = searchParams.get('clientId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get invoices with optional filtering
    const invoices = await store.getInvoices(session.userId, {
      status,
      clientId,
      limit,
      offset
    })

    // Get total count for pagination
    const total = await store.getInvoiceCount(session.userId, { status, clientId })

    return NextResponse.json({
      invoices,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + invoices.length < total
      }
    })
  } catch (error) {
    console.error('Failed to fetch invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body: CreateInvoiceRequest = await request.json()

    // Validate required fields
    if (!body.clientId || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Client ID and at least one item are required' },
        { status: 400 }
      )
    }

    // Validate client exists and belongs to user
    const client = await store.getClient(body.clientId)
    if (!client || client.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Client not found or access denied' },
        { status: 404 }
      )
    }

    // Validate items
    for (const item of body.items) {
      if (!item.description || item.quantity <= 0 || item.unitPrice < 0) {
        return NextResponse.json(
          { error: 'Invalid item data' },
          { status: 400 }
        )
      }
    }

    // Validate dates
    if (body.dueDate && new Date(body.dueDate) < new Date(body.issueDate || new Date())) {
      return NextResponse.json(
        { error: 'Due date must be after issue date' },
        { status: 400 }
      )
    }

    // Create invoice
    const invoice = await store.createInvoice(session.userId, body)

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Failed to create invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
```