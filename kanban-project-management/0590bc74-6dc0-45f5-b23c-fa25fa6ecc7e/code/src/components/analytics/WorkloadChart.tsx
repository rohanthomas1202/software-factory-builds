'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  MoreVertical,
  Filter,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  User
} from 'lucide-react'
import { Dropdown } from '@/components/ui/Dropdown'

interface WorkloadData {
  userId: string
  userName: string
  userEmail: string
  userAvatar?: string
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  pendingTasks: number
  completionRate: number
}

interface WorkloadChartProps {
  workloadData: WorkloadData[]
  isLoading?: boolean
  className?: string
}

export function WorkloadChart({ workloadData, isLoading = false, className }: WorkloadChartProps) {
  const [sortBy, setSortBy] = useState<'total' | 'completion' | 'pending'>('total')
  const [maxTasks, setMaxTasks] = useState(0)

  // Sort and calculate max for bar scaling
  const sortedData = [...workloadData].sort((a, b) => {
    if (sortBy === 'total') return b.totalTasks - a.totalTasks
    if (sortBy === 'completion') return b.completionRate - a.completionRate
    return b.pendingTasks - a.pendingTasks
  })

  const maxTotalTasks = Math.max(...sortedData.map(d => d.totalTasks), 1)

  const getWorkloadStatus = (completionRate: number, totalTasks: number) => {
    if (totalTasks === 0) return 'idle'
    if (completionRate >= 80) return 'optimal'
    if (completionRate >= 50) return 'moderate'
    if (totalTasks > 10) return 'high'
    return 'normal'
  }

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Email', 'Total Tasks', 'Completed', 'In Progress', 'Pending', 'Completion Rate'],
      ...sortedData.map(d => [
        d.userName,
        d.userEmail,
        d.totalTasks.toString(),
        d.completedTasks.toString(),
        d.inProgressTasks.toString(),
        d.pendingTasks.toString(),
        `${Math.round(d.completionRate)}%`
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workload-distribution-${new Date().toISOString().split('T')[0]}.csv`
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
            <Users className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Team Workload
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

  if (!sortedData || sortedData.length === 0) {
    return (
      <div className={cn("bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6", className)}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Team Workload
            </h3>
          </div>
        </div>
        <div className="h-64 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <User className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm">No workload data available</p>
          <p className="text-xs mt-1">Assign tasks to team members to see workload distribution</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Team Workload
          </h3>
          <Badge variant="outline" className="text-xs">
            {sortedData.length} members
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <Dropdown
            trigger={
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                {sortBy === 'total' ? 'Total Tasks' : sortBy === 'completion' ? 'Completion Rate' : 'Pending Tasks'}
              </Button>
            }
          >
            <Dropdown.Item onClick={() => setSortBy('total')}>
              Sort by Total Tasks
            </Dropdown.Item>
            <Dropdown.Item onClick={() => setSortBy('completion')}>
              Sort by Completion Rate
            </Dropdown.Item>
            <Dropdown.Item onClick={() => setSortBy('pending')}>
              Sort by Pending Tasks
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
        {sortedData.map((user) => {
          const status = getWorkloadStatus(user.completionRate, user.totalTasks)
          
          return (
            <div
              key={user.userId}
              className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            >
              <div className="flex-shrink-0">
                <Avatar
                  src={user.userAvatar}
                  fallback={user.userName.charAt(0)}
                  size="sm"
                  status={
                    status === 'optimal' ? 'online' :
                    status === 'high' ? 'busy' :
                    status === 'moderate' ? 'away' : 'offline'
                  }
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user.userName}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.userEmail}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        status === 'optimal' ? 'success' :
                        status === 'high' ? 'danger' :
                        status === 'moderate' ? 'warning' : 'outline'
                      }
                      size="sm"
                    >
                      {Math.round(user.completionRate)}% complete
                    </Badge>
                    <Dropdown
                      trigger={
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      }
                      align="end"
                    >
                      <Dropdown.Item>View Profile</Dropdown.Item>
                      <Dropdown.Item>View Tasks</Dropdown.Item>
                      <Dropdown.Separator />
                      <Dropdown.Item>Send Message</Dropdown.Item>
                    </Dropdown>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div className="h-full flex">
                    <div
                      className="bg-green-500 transition-all duration-300"
                      style={{ width: `${(user.completedTasks / user.totalTasks) * 100 || 0}%` }}
                      title={`Completed: ${user.completedTasks}`}
                    />
                    <div
                      className="bg-blue-500 transition-all duration-300"
                      style={{ width: `${(user.inProgressTasks / user.totalTasks) * 100 || 0}%` }}
                      title={`In Progress: ${user.inProgressTasks}`}
                    />
                    <div
                      className="bg-gray-400 transition-all duration-300"
                      style={{ width: `${(user.pendingTasks / user.totalTasks) * 100 || 0}%` }}
                      title={`Pending: ${user.pendingTasks}`}
                    />
                  </div>
                </div>

                {/* Task breakdown */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {user.completedTasks} done
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-blue-500" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {user.inProgressTasks} in progress
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {user.pendingTasks} pending
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 font-medium">
                    {user.totalTasks} total
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600 dark:text-gray-300">
            <span className="font-medium">
              {sortedData.reduce((sum, d) => sum + d.totalTasks, 0)}
            </span> total assigned tasks
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="h-2 w-4 bg-green-500 rounded" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Completed</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-4 bg-blue-500 rounded" />
              <span className="text-xs text-gray-500 dark:text-gray-400">In Progress</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-4 bg-gray-400 rounded" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}