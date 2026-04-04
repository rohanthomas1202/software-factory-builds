'use client'

import React from 'react'
import { Badge } from '@/components/ui/Badge'
import { InvoiceStatus } from '@/types'

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
  className?: string
}

const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusConfig = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Draft',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        }
      case 'sent':
        return {
          label: 'Sent',
          variant: 'default' as const,
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        }
      case 'paid':
        return {
          label: 'Paid',
          variant: 'success' as const,
          className: 'bg-green-100 text-green-800 border-green-200'
        }
      case 'overdue':
        return {
          label: 'Overdue',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200'
        }
      case 'partially_paid':
        return {
          label: 'Partially Paid',
          variant: 'warning' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        }
      case 'cancelled':
        return {
          label: 'Cancelled',
          variant: 'outline' as const,
          className: 'bg-gray-50 text-gray-600 border-gray-300'
        }
      default:
        return {
          label: 'Unknown',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Badge
      variant={config.variant}
      className={`font-medium px-3 py-1.5 border ${config.className} ${className}`}
    >
      {config.label}
    </Badge>
  )
}

export default InvoiceStatusBadge