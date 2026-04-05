'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { TasksChart } from '@/components/analytics/TasksChart'
import { WorkloadChart } from '@/components/analytics/WorkloadChart'
import { StatCard } from '@/components/analytics/StatCard'
import { toast } from '@/components/ui/Toast'
import { AnalyticsData } from '@/lib/types'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Download,
  Filter,
  RefreshCw,
  FolderKanban,
  Target,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dropdown } from '@/components/ui/Dropdown'

export default function AnalyticsPage() {
  const router = useRouter()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [selectedProject, setSelectedProject] = useState<string>('all')

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange, selectedProject])

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true)
      const queryParams = new URLSearchParams({
        range: timeRange,
        projectId: selectedProject
      })
      
      const response = await fetch(`/api/analytics?${queryParams}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      
      const data = await response.json()
      setAnalyticsData(data.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error({
        title: 'Failed to load analytics',
        description: 'Please try again later'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    toast.success({
      title: 'Export started',
      description: 'Your analytics report is being prepared'
    })
  }

  const handleRefresh = () => {
    fetchAnalyticsData()
    toast.success({
      title: 'Data refreshed',
      description: 'Analytics data has been updated'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-6">
            <PageHeader
              title="Analytics Dashboard"
              description="Track team performance and project metrics"
            />
            <div className="flex items-center justify-center h-96">
              <Spinner size="lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-6">
          <PageHeader
            title="Analytics Dashboard"
            description="Track team performance and project metrics"
            actions={
              <div className="flex items-center gap-3">
                <Dropdown
                  trigger={
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
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
                  <Dropdown.Separator />
                  <Dropdown.Item onClick={() => setSelectedProject('all')}>
                    All Projects
                  </Dropdown.Item>
                  {analyticsData?.projects.map(project => (
                    <Dropdown.Item 
                      key={project.id}
                      onClick={() => setSelectedProject(project.id)}
                    >
                      {project.name}
                    </Dropdown.Item>
                  ))}
                </Dropdown>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            }
          />

          {/* Time Range Badges */}
          <div className="flex items-center gap-2 mb-6">
            <Badge 
              variant={timeRange === '7d' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setTimeRange('7d')}
            >
              7D
            </Badge>
            <Badge 
              variant={timeRange === '30d' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setTimeRange('30d')}
            >
              30D
            </Badge>
            <Badge 
              variant={timeRange === '90d' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setTimeRange('90d')}
            >
              90D
            </Badge>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-4">
              Showing data for {timeRange === '7d' ? 'last 7 days' : timeRange === '30d' ? 'last 30 days' : 'last 90 days'}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Tasks"
              value={analyticsData?.totalTasks || 0}
              description="Across all projects"
              icon={<FolderKanban className="h-5 w-5" />}
              trend={{
                value: analyticsData?.taskGrowth || 0,
                direction: analyticsData?.taskGrowth && analyticsData.taskGrowth > 0 ? 'up' : 'down'
              }}
              variant="default"
            />
            <StatCard
              title="Completed"
              value={analyticsData?.completedTasks || 0}
              description={`${analyticsData?.completionRate || 0}% completion rate`}
              icon={<CheckCircle className="h-5 w-5" />}
              variant="success"
            />
            <StatCard
              title="In Progress"
              value={analyticsData?.inProgressTasks || 0}
              description="Active tasks"
              icon={<Clock className="h-5 w-5" />}
              variant="warning"
            />
            <StatCard
              title="Overdue"
              value={analyticsData?.overdueTasks || 0}
              description="Past deadline"
              icon={<AlertCircle className="h-5 w-5" />}
              variant="danger"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Task Completion Trend
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Daily task completion over time
                  </p>
                </div>
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <TasksChart 
                dailyTaskCounts={analyticsData?.dailyTaskCounts || []}
                height={300}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Team Workload
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tasks assigned per team member
                  </p>
                </div>
                <Users className="h-5 w-5 text-primary" />
              </div>
              <WorkloadChart 
                teamWorkload={analyticsData?.teamWorkload || []}
                height={300}
              />
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Priority Distribution
                </h3>
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-4">
                {analyticsData?.priorityDistribution?.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {item.priority}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          'h-full rounded-full',
                          item.priority === 'High' && 'bg-red-500',
                          item.priority === 'Medium' && 'bg-yellow-500',
                          item.priority === 'Low' && 'bg-green-500',
                          item.priority === 'Urgent' && 'bg-purple-500'
                        )}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Project Health
                </h3>
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-4">
                {analyticsData?.projectHealth?.map((project, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-3 w-3 rounded-full',
                        project.health === 'healthy' && 'bg-green-500',
                        project.health === 'warning' && 'bg-yellow-500',
                        project.health === 'critical' && 'bg-red-500'
                      )} />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {project.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {project.completedTasks}/{project.totalTasks} tasks
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        project.health === 'healthy' ? 'success' :
                        project.health === 'warning' ? 'warning' : 'danger'
                      }
                    >
                      {project.health}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Performance Metrics
                </h3>
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Average Completion Time
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {analyticsData?.avgCompletionTime || 0}d
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: '65%' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Team Productivity
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {analyticsData?.teamProductivity || 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${analyticsData?.teamProductivity || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      On-time Delivery
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {analyticsData?.onTimeDelivery || 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div 
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${analyticsData?.onTimeDelivery || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Mock components for Navbar and Sidebar (these should be imported from your actual components)
function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              KanbanFlow
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
            <Button variant="ghost" size="sm">
              Projects
            </Button>
            <Button variant="ghost" size="sm" className="text-primary">
              Analytics
            </Button>
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    </nav>
  )
}

function Sidebar() {
  return (
    <aside className="hidden md:block w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Projects
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/10 text-primary">
                <FolderKanban className="h-4 w-4" />
                <span className="text-sm font-medium">All Projects</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <FolderKanban className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Web Redesign</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <FolderKanban className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Mobile App</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Navigation
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <BarChart3 className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Analytics</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Team</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Calendar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}