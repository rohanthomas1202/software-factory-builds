```tsx
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, DollarSign, FileText, Users, CreditCard, Clock, AlertCircle, CheckCircle } from 'lucide-react'

export interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  change?: {
    value: number
    type: 'increase' | 'decrease'
  }
  icon?: React.ReactNode
  loading?: boolean
  className?: string
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  description,
  change,
  icon,
  loading = false,
  className = '',
}) => {
  const getDefaultIcon = () => {
    const titleLower = title.toLowerCase()
    if (titleLower.includes('revenue') || titleLower.includes('income') || titleLower.includes('total')) {
      return <DollarSign className="h-5 w-5 text-primary" />
    }
    if (titleLower.includes('invoice')) {
      return <FileText className="h-5 w-5 text-blue-500" />
    }
    if (titleLower.includes('client')) {
      return <Users className="h-5 w-5 text-green-500" />
    }
    if (titleLower.includes('expense')) {
      return <CreditCard className="h-5 w-5 text-amber-500" />
    }
    if (titleLower.includes('overdue')) {
      return <AlertCircle className="h-5 w-5 text-red-500" />
    }
    if (titleLower.includes('pending')) {
      return <Clock className="h-5 w-5 text-orange-500" />
    }
    if (titleLower.includes('paid')) {
      return <CheckCircle className="h-5 w-5 text-emerald-500" />
    }
    return <DollarSign className="h-5 w-5 text-primary" />
  }

  return (
    <Card className={cn('transition-all duration-300 hover:shadow-lg', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          {icon || getDefaultIcon()}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold tracking-tight">
              {value}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
            {change && (
              <div className="flex items-center mt-2">
                {change.type === 'increase' ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span
                  className={cn(
                    'text-xs font-medium',
                    change.type === 'increase' ? 'text-emerald-600' : 'text-red-600'
                  )}
                >
                  {change.type === 'increase' ? '+' : '-'}
                  {Math.abs(change.value)}%
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  from last month
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default StatsCard
```