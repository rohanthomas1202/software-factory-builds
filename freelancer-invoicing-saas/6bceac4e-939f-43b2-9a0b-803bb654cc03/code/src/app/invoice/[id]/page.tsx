```tsx
import React from 'react'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { Download, Printer, Mail, ArrowLeft, CheckCircle, Clock, AlertCircle, ExternalLink, Copy, Share2 } from 'lucide-react'
import { store } from '@/lib/store'
import { InvoiceStatus } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Separator } from '@/components/ui/Separator'
import { InvoiceCalculations, calculateInvoiceTotals, getInvoiceStatusInfo } from '@/lib/invoice-utils'
import Link from 'next/link'

interface PublicInvoicePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PublicInvoicePageProps) {
  const invoice = await store.getInvoice(params.id)
  
  if (!invoice) {
    return {
      title: 'Invoice Not Found - InvoiceFlow',
      description: 'The requested invoice could not be found.',
    }
  }

  return {
    title: `Invoice #${invoice.invoiceNumber} - ${invoice.client.name}`,
    description: `Invoice from ${invoice.user.businessName || invoice.user.name} to ${invoice.client.name} for ${formatCurrency(invoice.total, invoice.currency)}`,
  }
}

export default async function PublicInvoicePage({ params }: PublicInvoicePageProps) {
  const invoice = await store.getInvoice(params.id)
  
  if (!invoice) {
    notFound()
  }

  // Don't show draft invoices publicly
  if (invoice.status === 'draft') {
    notFound()
  }

  const user = invoice.user
  const client = invoice.client
  const calculations = calculateInvoiceTotals(invoice)
  const statusInfo = getInvoiceStatusInfo(invoice.status)
  const isOverdue = calculations.isOverdue
  const daysOverdue = calculations.daysOverdue

  const handlePrint = () => {
    window.print()
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      // In a real app, you'd show a toast notification here
      alert('Invoice link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice #${invoice.invoiceNumber}`,
          text: `Invoice from ${user.businessName || user.name} for ${formatCurrency(invoice.total, invoice.currency)}`,
          url: window.location.href,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      handleCopyLink()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link 
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to InvoiceFlow
              </Link>
              <div className="hidden sm:block h-4 w-px bg-gray-300 dark:bg-gray-700" />
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Public Invoice View
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = `mailto:?subject=Invoice%20%23${invoice.invoiceNumber}&body=View%20invoice:%20${window.location.href}`}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Status Banner */}
          <Card className="mb-6 border-l-4 border-l-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                    {statusInfo.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Invoice {invoice.status === 'paid' ? 'Paid' : statusInfo.label}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {invoice.status === 'paid' 
                        ? `Paid on ${format(new Date(invoice.paidAt!), 'MMM dd, yyyy')}`
                        : statusInfo.description}
                      {isOverdue && (
                        <span className="ml-2 text-red-600 dark:text-red-400 font-medium">
                          • {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Amount
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="print:shadow-none">
                <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Invoice #{invoice.invoiceNumber}
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        Issued on {format(new Date(invoice.issueDate), 'MMMM dd, yyyy')}
                      </CardDescription>
                    </div>
                    <Badge variant={statusInfo.variant as any} className="text-sm px-4 py-1.5">
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  {/* From & To */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                        From
                      </h3>
                      <div className="space-y-2">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {user.businessName || user.name}
                        </div>
                        {user.name && user.businessName && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {user.name}
                          </div>
                        )}
                        {user.address && (
                          <>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {user.address.street}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {user.address.city}, {user.address.state} {user.address.postalCode}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {user.address.country}
                            </div>
                          </>
                        )}
                        {user.email && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {user.email}
                          </div>
                        )}
                        {user.phone && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                        Bill To
                      </h3>
                      <div className="space-y-2">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {client.name}
                        </div>
                        {client.company && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {client.company}
                          </div>
                        )}
                        {client.address && (
                          <>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {client.address.street}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {client.address.city}, {client.address.state} {client.address.postalCode}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {client.address.country}
                            </div>
                          </>
                        )}
                        {client.email && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Invoice Date</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {format(new Date(invoice.issueDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Due Date</span>
                      <span className={`font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                        {isOverdue && ` • Overdue`}
                      </span>
                    </div>
                    {invoice.poNumber && (
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>PO Number</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {invoice.poNumber}
                        </span>
                      </div>
                    )}
                    {invoice.notes && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Notes
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {invoice.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Line Items */}
              <Card className="mt-6 print:shadow-none">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-800">
                          <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="text-right py-4 px-6 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="text-right py-4 px-6 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="text-right py-4 px-6 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {invoice.items.map((item, index) => (
                          <tr key={index}>
                            <td className="py-4 px-6">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {item.description}
                              </div>
                              {item.details && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {item.details}
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right text-gray-900 dark:text-gray-100">
                              {item.quantity}
                            </td>
                            <td className="py-4 px-6 text-right text-gray-900 dark:text-gray-100">
                              {formatCurrency(item.unitPrice, invoice.currency)}
                            </td>
                            <td className="py-4 px-6 text-right font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(item.quantity * item.unitPrice, invoice.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6 print:static print:shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    Invoice Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(calculations.subtotal, invoice.currency)}
                      </span>
                    </div>
                    
                    {invoice.taxRate > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Tax ({invoice.taxRate}%)
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(calculations.taxAmount, invoice.currency)}
                        </span>
                      </div>
                    )}
                    
                    {invoice.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Discount ({invoice.discountType === 'percentage' ? `${invoice.discount}%` : formatCurrency(invoice.discount, invoice.currency)})
                        </span>
                        <span className="font-medium text-red-600 dark:text-red-400">
                          -{formatCurrency(calculations.discountAmount, invoice.currency)}
                        </span>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between text-base font-semibold">
                      <span className="text-gray-900 dark:text-gray-100">Total</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {formatCurrency(calculations.total, invoice.currency)}
                      </span>
                    </div>
                    
                    {invoice.status === 'paid' && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Amount Paid</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {formatCurrency(calculations.amountPaid, invoice.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Balance</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(calculations.amountDue, invoice.currency)}
                          </span>
                        </div>
                      </>
                    )}
                    
                    {invoice.status === 'sent' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Amount Due</span>
                        <span className={`font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                          {formatCurrency(calculations.amountDue, invoice.currency)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {invoice.paymentInstructions && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Payment Instructions
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {invoice.paymentInstructions}
                      </p>
                    </div>
                  )}
                  
                  {invoice.terms && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Terms & Conditions
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {invoice.terms}
                      </p>
                    </div>
                  )}
                </CardContent>
                
                {invoice.status === 'sent' && (
                  <CardFooter className="border-t border-gray-200 dark:border-gray-800 p-6">
                    <div className="w-full space-y-3">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Need to make a payment?
                        </div>
                        <Button 
                          className="w-full gap-2"
                          onClick={() => {
                            // In a real app, this would link to a payment gateway
                            alert('Payment processing would be integrated here. In a real app, this would redirect to Stripe, PayPal, etc.')
                          }}
                        >
                          <CreditCard className="h-4 w-4" />
                          Pay Invoice
                        </Button>
                      </div>
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                        Secure payment processing powered by InvoiceFlow
                      </p>
                    </div>
                  </CardFooter>
                )}
              </Card>
              
              {/* InvoiceFlow Branding */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Invoice created with{' '}
                  <Link 
                    href="/" 
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    InvoiceFlow
                  </Link>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Professional invoicing for freelancers
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, 
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
          }
          .print\\:static {
            position: static !important;
          }
          a {
            color: black !important;
            text-decoration: none !important;
          }
        }
      `}</style>
    </div>
  )
}
```