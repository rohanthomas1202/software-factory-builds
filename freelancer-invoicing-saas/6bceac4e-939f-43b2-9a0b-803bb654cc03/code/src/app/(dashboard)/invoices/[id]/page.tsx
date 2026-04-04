```typescript
import React from 'react'
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { store } from '@/lib/store'
import PageHeader from '@/components/layout/PageHeader'
import InvoicePreview from '@/components/invoices/InvoicePreview'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { format } from 'date-fns'
import { 
  ArrowLeft, 
  Edit, 
  Send, 
  Download, 
  Printer, 
  Mail, 
  CheckCircle, 
  Clock,
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import InvoiceStatusBadge from '@/components/invoices/InvoiceStatusBadge'
import { formatCurrency } from '@/lib/utils'

export const metadata = {
  title: 'Invoice Details - InvoiceFlow',
  description: 'View and manage invoice details',
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  const invoice = await store.getInvoice(params.id)

  if (!invoice) {
    notFound()
  }

  // Check if invoice belongs to user
  if (invoice.userId !== session.userId) {
    redirect('/invoices')
  }

  // Fetch client details
  const client = await store.getClient(invoice.clientId)
  if (!client) {
    notFound()
  }

  // Fetch user details
  const user = await store.getUser(session.userId)
  if (!user) {
    redirect('/login')
  }

  const canEdit = invoice.status === 'draft'
  const canSend = invoice.status === 'draft'
  const canMarkAsPaid = invoice.status === 'sent' || invoice.status === 'overdue'

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice #${invoice.invoiceNumber}`}
        description={invoice.title || 'Invoice details'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Invoices', href: '/invoices' },
          { label: `Invoice #${invoice.invoiceNumber}`, href: `/invoices/${invoice.id}` }
        ]}
      >
        <div className="flex items-center gap-2">
          <Link href="/invoices">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          {canEdit && (
            <Link href={`/invoices/${invoice.id}/edit`}>
              <Button className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
          {canSend && (
            <Button className="gap-2 bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4" />
              Send Invoice
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Invoice Preview */}
        <div className="lg:col-span-2">
          <InvoicePreview 
            invoice={invoice}
            client={client}
            user={user}
          />
        </div>

        {/* Right Column - Actions & Details */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Invoice Status</h3>
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
                
                {invoice.status === 'draft' && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">This invoice is in draft mode</span>
                  </div>
                )}

                {invoice.status === 'sent' && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Sent on {format(new Date(invoice.sentDate!), 'MMM dd, yyyy')}</span>
                  </div>
                )}

                {invoice.status === 'paid' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Paid on {format(new Date(invoice.paymentDate!), 'MMM dd, yyyy')}</span>
                  </div>
                )}

                {invoice.status === 'overdue' && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">This invoice is overdue</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Printer className="h-4 w-4" />
                  Print Invoice
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Mail className="h-4 w-4" />
                  Send Reminder
                </Button>
                {canMarkAsPaid && (
                  <Button className="w-full justify-start gap-2 bg-green-600 hover:bg-green-700">
                    <DollarSign className="h-4 w-4" />
                    Mark as Paid
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Invoice Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Invoice Number</span>
                  <span className="font-medium">#{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Issue Date</span>
                  <span className="font-medium">
                    {format(new Date(invoice.issueDate), 'MMM dd, yyyy')}
                  </span>
                </div>
                {invoice.dueDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Due Date</span>
                    <span className="font-medium">
                      {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Currency</span>
                  <span className="font-medium">{invoice.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tax Rate</span>
                  <span className="font-medium">{invoice.taxRate}%</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Discount</span>
                    <span className="font-medium">
                      {formatCurrency(invoice.discountAmount, invoice.currency)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Client Details */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Client</h3>
                <Link href={`/clients/${client.id}`}>
                  <Button size="sm" variant="ghost">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-2">
                <div className="font-medium">{client.name}</div>
                {client.email && (
                  <div className="text-sm text-muted-foreground">{client.email}</div>
                )}
                {client.phone && (
                  <div className="text-sm text-muted-foreground">{client.phone}</div>
                )}
                {client.address && (
                  <div className="text-sm text-muted-foreground">
                    {client.address.street}, {client.address.city}, {client.address.country}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
```