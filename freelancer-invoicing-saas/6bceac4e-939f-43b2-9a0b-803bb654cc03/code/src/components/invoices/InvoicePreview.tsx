```typescript
'use client'

import React from 'react'
import { format } from 'date-fns'
import { Download, Mail, Printer, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Invoice, Client, User } from '@/types'
import { formatCurrency } from '@/lib/utils'
import InvoiceStatusBadge from './InvoiceStatusBadge'

interface InvoicePreviewProps {
  invoice: Invoice
  client: Client
  user: User
  onDownload?: () => void
  onPrint?: () => void
  onSend?: () => void
  onShare?: () => void
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  client,
  user,
  onDownload,
  onPrint,
  onSend,
  onShare
}) => {
  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0
    let totalTax = 0

    invoice.items.forEach(item => {
      const itemTotal = item.quantity * item.unitPrice
      const itemTax = itemTotal * (item.taxRate / 100)
      subtotal += itemTotal
      totalTax += itemTax
    })

    const total = subtotal + totalTax
    return { subtotal, totalTax, total }
  }

  const { subtotal, totalTax, total } = calculateTotals()

  // Format dates
  const formattedIssueDate = format(new Date(invoice.issueDate), 'MMM dd, yyyy')
  const formattedDueDate = format(new Date(invoice.dueDate), 'MMM dd, yyyy')

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <InvoiceStatusBadge status={invoice.status} />
          <span className="text-sm text-muted-foreground">
            #{invoice.invoiceNumber}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSend}
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Link
          </Button>
        </div>
      </div>

      {/* Invoice Preview */}
      <Card className="border-2">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-8 border-b">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">IF</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Invoice</h1>
                  <p className="text-muted-foreground">#{invoice.invoiceNumber}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 text-right">
              <h2 className="text-xl font-bold">{user.businessName || user.name}</h2>
              {user.address && (
                <div className="text-sm text-muted-foreground mt-1">
                  <p>{user.address.street}</p>
                  <p>{user.address.city}, {user.address.state} {user.address.postalCode}</p>
                  <p>{user.address.country}</p>
                </div>
              )}
              {user.email && <p className="text-sm mt-1">{user.email}</p>}
              {user.phone && <p className="text-sm">{user.phone}</p>}
            </div>
          </div>

          {/* Bill To & Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3">Bill To</h3>
              <div className="space-y-1">
                <p className="font-medium">{client.name}</p>
                {client.company && <p className="text-sm">{client.company}</p>}
                {client.email && <p className="text-sm">{client.email}</p>}
                {client.phone && <p className="text-sm">{client.phone}</p>}
                {client.address && (
                  <div className="text-sm text-muted-foreground">
                    <p>{client.address.street}</p>
                    <p>{client.address.city}, {client.address.state} {client.address.postalCode}</p>
                    <p>{client.address.country}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="md:text-right">
              <div className="inline-block text-left">
                <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3">Invoice Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between gap-8">
                    <span className="text-sm text-muted-foreground">Issue Date:</span>
                    <span className="font-medium">{formattedIssueDate}</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span className="text-sm text-muted-foreground">Due Date:</span>
                    <span className="font-medium">{formattedDueDate}</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span className="text-sm text-muted-foreground">Currency:</span>
                    <span className="font-medium">{invoice.currency}</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <InvoiceStatusBadge status={invoice.status} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-8">
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-semibold">Description</th>
                    <th className="text-right p-4 font-semibold">Quantity</th>
                    <th className="text-right p-4 font-semibold">Unit Price</th>
                    <th className="text-right p-4 font-semibold">Tax Rate</th>
                    <th className="text-right p-4 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => {
                    const itemTotal = item.quantity * item.unitPrice
                    const itemTax = itemTotal * (item.taxRate / 100)
                    const itemAmount = itemTotal + itemTax

                    return (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                        <td className="p-4 border-t">
                          <div>
                            <p className="font-medium">{item.description}</p>
                          </div>
                        </td>
                        <td className="p-4 border-t text-right">{item.quantity}</td>
                        <td className="p-4 border-t text-right">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                        <td className="p-4 border-t text-right">{item.taxRate}%</td>
                        <td className="p-4 border-t text-right font-medium">
                          {formatCurrency(itemAmount, invoice.currency)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full md:w-1/2 lg:w-1/3 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal, invoice.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(totalTax, invoice.currency)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total, invoice.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="mt-8 pt-8 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {invoice.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <h4 className="font-semibold mb-2">Terms & Conditions</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{invoice.terms}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t text-center">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-muted-foreground">
                <p>Thank you for your business!</p>
                <p className="mt-1">Please make payment by the due date.</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">{user.businessName || user.name}</p>
                <p className="text-muted-foreground">
                  {user.address?.city}, {user.address?.country}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Instructions */}
      {invoice.status === 'sent' && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Payment Instructions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Bank Transfer</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Account: 1234 5678 9012</p>
                  <p>Routing: 021000021</p>
                  <p>Bank: Example Bank</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">PayPal</h4>
                <div className="text-sm text-muted-foreground">
                  <p>Send payment to: payments@{user.email?.split('@')[1] || 'example.com'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Credit Card</h4>
                <div className="text-sm text-muted-foreground">
                  <p>Pay online at: invoiceflow.com/pay/{invoice.id}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default InvoicePreview
```