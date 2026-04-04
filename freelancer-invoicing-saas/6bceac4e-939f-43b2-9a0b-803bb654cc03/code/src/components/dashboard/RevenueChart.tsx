```tsx
'use client'

import React, { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export interface RevenueDataPoint {
  date: string
  revenue: number
  invoices: number
  expenses: number
  profit: number
}

export interface RevenueChartProps {
  data: RevenueDataPoint[]
  loading?: boolean
  currency?: string
}

const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  loading = false,
  currency = 'USD',
}) => {
  const [timeRange, setTimeRange] = useState('30d')
  const [chartType, setChartType] = useState<'revenue' | 'profit' | 'invoices'>('revenue')

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
  ]

  const chartTypeOptions = [
    { value: 'revenue', label: 'Revenue' },
    { value: 'profit', label: 'Profit' },
    { value: 'invoices', label: 'Invoices' },
  ]

  const calculateStats = () => {
    if (!data.length) return { total: 0, change: 0, average: 0 }
    
    const currentPeriod = data.slice(-7)
    const previousPeriod = data.slice(-14, -7)
    
    const currentTotal = currentPeriod.reduce((sum, point) => sum + point[chartType], 0)
    const previousTotal = previousPeriod.reduce((sum, point) => sum + point[chartType], 0)
    
    const change = previousTotal > 0 
      ? ((currentTotal - previousTotal) / previousTotal) * 100 
      : currentTotal > 0 ? 100 : 0
    
    const average = currentTotal / currentPeriod.length
    
    return {
      total: currentTotal,
      change,
      average,
    }
  }

  const stats = calculateStats()
  const isPositive = stats.change >= 0

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center mt-1">
              <div
                className="h-2 w-2 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm">
                {entry.dataKey === 'revenue' && 'Revenue: '}
                {entry.dataKey === 'profit' && 'Profit: '}
                {entry.dataKey === 'invoices' && 'Invoices: '}
                {entry.dataKey === 'expenses' && 'Expenses: '}
                {entry.dataKey === 'revenue' || entry.dataKey === 'profit' || entry.dataKey === 'expenses'
                  ? formatCurrency(entry.value, currency)
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Loading revenue data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              Track your revenue, profit, and invoice trends
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select
              value={chartType}
              onChange={setChartType}
              options={chartTypeOptions}
              className="w-32"
            />
            <Select
              value={timeRange}
              onChange={setTimeRange}
              options={timeRangeOptions}
              className="w-32"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">
                {chartType === 'revenue' || chartType === 'profit' || chartType === 'expenses'
                  ? formatCurrency(stats.total, currency)
                  : stats.total}
              </p>
              <p className="text-sm text-muted-foreground capitalize">
                Total {chartType} this period
              </p>
            </div>
            <div className="flex items-center">
              {isPositive ? (
                <TrendingUp className="h-5 w-5 text-emerald-500 mr-2" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
              )}
              <span
                className={cn(
                  'text-lg font-semibold',
                  isPositive ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {isPositive ? '+' : ''}
                {stats.change.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="h-[300px]">
          {data.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No revenue data yet</h3>
              <p className="text-sm text-muted-foreground">
                Create and send invoices to start tracking revenue
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    if (chartType === 'revenue' || chartType === 'profit' || chartType === 'expenses') {
                      return formatCurrency(value, currency, true)
                    }
                    return value
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={chartType}
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center mr-3">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Daily Revenue</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(stats.average, currency)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center mr-3">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-lg font-semibold">
                  {data.reduce((sum, point) => sum + point.invoices, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center mr-3">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Growth Rate</p>
                <p className={cn(
                  'text-lg font-semibold',
                  isPositive ? 'text-emerald-600' : 'text-red-600'
                )}>
                  {isPositive ? '+' : ''}
                  {stats.change.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export default RevenueChart
```