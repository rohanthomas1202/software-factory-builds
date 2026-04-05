'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Filter,
  Download
} from 'lucide-react'
import { Dropdown } from '@/components/ui/Dropdown'

interface DailyTaskCount {
  date: string
  count: number
}

interface TasksChartProps {
  dailyTaskTrends: DailyTaskCount[]
  isLoading?: boolean
  className?: string
}

export function TasksChart({ dailyTaskTrends, isLoading = false, className }: TasksChartProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [chartData, setChartData] = useState<DailyTaskCount[]>([])
  const [maxCount, setMaxCount] = useState(0)

  useEffect(() => {
    if (!dailyTaskTrends || dailyTaskTrends.length === 0) {
      setChartData([])
      setMaxCount(0)
      return
    }

    // Filter data based on time range
    let filteredData = [...dailyTaskTrends]
    if (timeRange === '7d') {
      filteredData = dailyTaskTrends.slice(-7)
    } else if (timeRange === '30d') {
      filteredData = dailyTaskTrends.slice(-30)
    }
    // 90d uses all data (last 90 days from API)

    setChartData(filteredData)
    setMaxCount(Math.max(...filteredData.map(d => d.count), 1))
  }, [dailyTaskTrends, timeRange])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return timeRange === '7d' 
      ? date.toLocaleDateString('en-US', { weekday: 'short' })
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const calculateTrend = () => {
    if (chartData.length < 2) return { direction: 'neutral', percentage: 0 }
    
    const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2))
    const secondHalf = chartData.slice(Math.floor(chartData.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.count, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.count, 0) / secondHalf.length
    
    if (firstAvg === 0) return { direction: 'up', percentage: 100 }
    
    const percentage = ((secondAvg - firstAvg) / firstAvg) * 100
    return {
      direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral',
      percentage: Math.abs(Math.round(percentage))
    }
  }

  const trend = calculateTrend()

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Tasks Created'],
      ...chartData.map(d => [d.date, d.count.toString()])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `task-trends-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className={cn("bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6", className)}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Task Trends
            </h3>
          </div>
          <Spinner size="sm" />
        </div>
        <div className="h-64 flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className={cn("bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6", className)}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Task Trends
            </h3>
          </div>
        </div>
        <div className="h-64 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <Calendar className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm">No task data available</p>
          <p className="text-xs mt-1">Tasks will appear here as they're created</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Task Trends
          </h3>
          <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            {trend.direction === 'up' && (
              <TrendingUp className="h-3 w-3 text-green-500" />
            )}
            {trend.direction === 'down' && (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={cn(
              "text-xs font-medium",
              trend.direction === 'up' && "text-green-600 dark:text-green-400",
              trend.direction === 'down' && "text-red-600 dark:text-red-400",
              trend.direction === 'neutral' && "text-gray-600 dark:text-gray-400"
            )}>
              {trend.direction === 'up' && '+'}
              {trend.percentage}%
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Dropdown
            trigger={
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                {timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : 'Last 90 days'}
              </Button>
            }
          >
            <Dropdown.Item onClick={() => setTimeRange('7d')}>
              Last 7 days
            </Dropdown.Item>
            <Dropdown.Item onClick={() => setTimeRange('30d')}>
              Last 30 days
            </Dropdown.Item>
            <Dropdown.Item onClick={() => setTimeRange('90d')}>
              Last 90 days
            </Dropdown.Item>
          </Dropdown>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-64 relative">
          <div className="absolute inset-0 flex items-end">
            <div className="flex-1 flex items-end justify-between px-2">
              {chartData.map((data, index) => (
                <div
                  key={data.date}
                  className="flex flex-col items-center flex-1 mx-0.5"
                >
                  <div
                    className={cn(
                      "w-full rounded-t-lg transition-all duration-300 hover:opacity-90",
                      "bg-gradient-to-t from-primary-500 to-primary-400 dark:from-primary-600 dark:to-primary-500"
                    )}
                    style={{
                      height: `${(data.count / maxCount) * 90}%`,
                      minHeight: data.count > 0 ? '4px' : '0px',
                    }}
                    title={`${data.count} tasks on ${data.date}`}
                  />
                  <div className="mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {formatDate(data.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-4">
            {[maxCount, Math.floor(maxCount * 0.75), Math.floor(maxCount * 0.5), Math.floor(maxCount * 0.25), 0].map((value) => (
              <div key={value} className="text-xs text-gray-500 dark:text-gray-400 pl-2">
                {value}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600 dark:text-gray-300">
              <span className="font-medium">{chartData.reduce((sum, d) => sum + d.count, 0)}</span> tasks created
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              Peak: <span className="font-medium">{maxCount}</span> tasks in a day
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}