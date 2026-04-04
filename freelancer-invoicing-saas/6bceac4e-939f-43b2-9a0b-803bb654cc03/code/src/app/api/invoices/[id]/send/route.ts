```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { store } from '@/lib/store'

// POST /api/invoices/[id]/send - Send an invoice to client
export async function POST(
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

    // Can only send draft invoices
    if (invoice.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft invoices can be sent' },
        { status: 400 }
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

    // Get user details
    const user = await store.getUser(session.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // In a real application, you would:
    // 1. Generate PDF
    // 2. Send email with PDF attachment
    // 3. Update invoice status to 'sent'
    // 4. Record sent date
    // 5. Send notification to user

    // For now, we'll just update the status and record the sent date
    const updatedInvoice = await store.updateInvoice(params.id, {
      status: 'sent',
      sentDate: new Date().toISOString()
    })

    // Simulate sending email (in production, use a service like SendGrid, Resend, etc.)
    console.log(`Invoice #${invoice.invoiceNumber} sent to ${client.email}`)
    console.log('Client:', client)
    console.log('User:', user)
    console.log('Invoice details:', invoice)

    return NextResponse.json({
      success: true,
      message: 'Invoice sent successfully',
      invoice: updatedInvoice
    })
  } catch (error) {
    console.error('Failed to send invoice:', error)
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    )
  }
}
```