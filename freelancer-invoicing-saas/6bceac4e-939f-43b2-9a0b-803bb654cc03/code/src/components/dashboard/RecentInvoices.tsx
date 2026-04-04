```tsx
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowUpRight, MoreVertical, Eye, Edit, Trash2, ExternalLink, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Invoice, InvoiceStatus } from '@/types'
import { formatCurrency } from '@/lib/utils'
import InvoiceStatusBadge from '@/components/invoices/InvoiceStatusBadge'

export interface RecentInvoicesProps {
  invoices: Invoice[]
  loading?: boolean
  maxItems?: number
}

const RecentInvoices: React.FC<RecentInvoicesProps> = ({
  invoices,
  loading = false,
  maxItems = 5,
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
      case 'sent':
        return 'bg-blue-500/10 text-blue-700 border-blue-200'
      case 'overdue':
        return 'bg-red-500/10 text-red-700 border-red-200'
      case 'pending':
        return 'bg-amber-500/10 text-amber-700 border-amber-200'
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200'
    }
  }

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to delete invoice:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Invoices</CardTitle>
          <CardDescription>Loading your recent invoices...</CardDescription>
        </CardHeader>
        <CardContent>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-6 w-16 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const displayedInvoices = invoices.slice(0, maxItems)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">Recent Invoices</CardTitle>
          <CardDescription>
            Your {displayedInvoices.length} most recent invoices
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/invoices">
            View All
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {displayedInvoices.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first invoice to get started
            </p>
            <Button asChild>
              <Link href="/invoices/new">Create Invoice</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {invoice.client?.name || 'Unknown Client'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </p>
                    <InvoiceStatusBadge status={invoice.status} />
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/invoices/${invoice.id}`} className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/invoices/${invoice.id}/edit`} className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/invoice/${invoice.id}`} target="_blank" className="cursor-pointer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Public View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 cursor-pointer"
                        onClick={() => handleDelete(invoice.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentInvoices
```