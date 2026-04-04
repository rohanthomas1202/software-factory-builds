```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { store } from '@/lib/store'
import { InvoiceStatus } from '@/types'

// PATCH /api/invoices/[id]/status - Update invoice status
export async function PATCH(
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

    const body = await request.json()
    const { status, paymentDate, paymentMethod, notes } = body

    if (!status || !Object.values(InvoiceStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Validate status transitions
    const validTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
      draft: ['sent'],
      sent: ['paid', 'overdue', 'cancelled'],
      paid: ['refunded'],
      overdue: ['paid', 'cancelled'],
      cancelled: [],
      refunded: []
    }

    if (!validTransitions[invoice.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${invoice.status} to ${status}` },
        { status: 400 }
      )
    }

    // Additional validation for paid status
    if (status === 'paid') {
      if (!paymentDate) {
        return NextResponse.json(
          { error: 'Payment date is required for paid status' },
          { status: 400 }
        )
      }

      // Validate payment date is not in the future
      if (new Date(paymentDate) > new Date()) {
        return NextResponse.json(
          { error: 'Payment date cannot be in the future' },
          { status: 400 }
        )
      }
    }

    // Update invoice status
    const updateData: any = { status }
    
    if (status === 'paid') {
      updateData.paymentDate = paymentDate
      updateData.paymentMethod = paymentMethod || 'other'
      updateData.notes = notes
    } else if (status === 'cancelled') {
      updateData.cancelledAt = new Date().toISOString()
      updateData.cancellationReason = notes
    }

    const updatedInvoice = await store.updateInvoice(params.id, updateData)

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error('Failed to update invoice status:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice status' },
      { status: 500 }
    )
  }
}
```