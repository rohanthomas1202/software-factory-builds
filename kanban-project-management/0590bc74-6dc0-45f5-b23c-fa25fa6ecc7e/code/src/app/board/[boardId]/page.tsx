'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { KanbanBoard } from '@/components/board/KanbanBoard'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { toast } from '@/components/ui/Toast'
import { useBoard } from '@/hooks/useBoard'
import { Board, Task } from '@/lib/types'
import { 
  Settings, 
  Users, 
  Filter, 
  Share2, 
  MoreVertical, 
  Plus, 
  Calendar,
  BarChart3,
  Download,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RefreshCw
} from 'lucide-react'
import { Dropdown } from '@/components/ui/Dropdown'

export default function BoardPage() {
  const params = useParams()
  const router = useRouter()
  const boardId = params.boardId as string
  
  const { 
    board, 
    columns, 
    isLoading, 
    error, 
    createColumn, 
    updateColumn, 
    deleteColumn,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    refreshBoard
  } = useBoard(boardId)
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [showCompleted, setShowCompleted] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (error) {
      toast.error('Failed to load board', error)
    }
  }, [error])

  const handleTaskClick = useCallback((taskId: string) => {
    setSelectedTaskId(taskId)
    setIsTaskModalOpen(true)
  }, [])

  const handleTaskUpdate = useCallback(async (updatedTask: Task) => {
    try {
      await updateTask(updatedTask.id, updatedTask)
      toast.success('Task updated successfully')
    } catch (error) {
      toast.error('Failed to update task', error instanceof Error ? error.message : 'Unknown error')
    }
  }, [updateTask])

  const handleTaskDelete = useCallback(async (taskId: string) => {
    try {
      await deleteTask(taskId)
      toast.success('Task deleted successfully')
      setIsTaskModalOpen(false)
    } catch (error) {
      toast.error('Failed to delete task', error instanceof Error ? error.message : 'Unknown error')
    }
  }, [deleteTask])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refreshBoard()
      toast.success('Board refreshed')
    } catch (error) {
      toast.error('Failed to refresh board', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshBoard])

  const handleExportBoard = useCallback(() => {
    if (!board) return
    
    const boardData = {
      board,
      columns,
      tasks: columns.flatMap(col => col.tasks || [])
    }
    
    const dataStr = JSON.stringify(boardData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${board.name.replace(/\s+/g, '_')}_export.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    toast.success('Board exported successfully')
  }, [board, columns])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!board) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Board not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The board you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={board.name}
        description={board.description}
        backButton={{
          label: 'Back to Projects',
          href: '/dashboard'
        }}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Dropdown
              trigger={
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              }
            >
              <Dropdown.Item
                icon={showCompleted ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                onClick={() => setShowCompleted(!showCompleted)}
              >
                {showCompleted ? 'Hide Completed' : 'Show Completed'}
              </Dropdown.Item>
              <Dropdown.Separator />
              <Dropdown.Item icon={<Calendar className="h-4 w-4" />}>
                Due This Week
              </Dropdown.Item>
              <Dropdown.Item icon={<Users className="h-4 w-4" />}>
                Assigned to Me
              </Dropdown.Item>
            </Dropdown>

            <Button variant="outline" size="sm" onClick={handleExportBoard}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>

            <Dropdown
              trigger={
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              }
            >
              <Dropdown.Item icon={<Settings className="h-4 w-4" />}>
                Board Settings
              </Dropdown.Item>
              <Dropdown.Item icon={<BarChart3 className="h-4 w-4" />}>
                View Analytics
              </Dropdown.Item>
              <Dropdown.Item icon={<Users className="h-4 w-4" />}>
                Manage Team
              </Dropdown.Item>
              <Dropdown.Separator />
              <Dropdown.Item 
                icon={<Lock className="h-4 w-4" />}
                variant="danger"
              >
                Archive Board
              </Dropdown.Item>
            </Dropdown>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {columns.reduce((acc, col) => acc + (col.tasks?.length || 0), 0)}
              </p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {columns.reduce((acc, col) => {
                  const completedTasks = col.tasks?.filter(task => task.status === 'done') || []
                  return acc + completedTasks.length
                }, 0)}
              </p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {columns.reduce((acc, col) => {
                  const inProgressTasks = col.tasks?.filter(task => task.status === 'in_progress') || []
                  return acc + inProgressTasks.length
                }, 0)}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {columns.reduce((acc, col) => {
                  const overdueTasks = col.tasks?.filter(task => {
                    if (!task.dueDate) return false
                    const dueDate = new Date(task.dueDate)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    return dueDate < today && task.status !== 'done'
                  }) || []
                  return acc + overdueTasks.length
                }, 0)}
              </p>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      <KanbanBoard
        board={board}
        columns={columns}
        onTaskClick={handleTaskClick}
        onCreateColumn={createColumn}
        onUpdateColumn={updateColumn}
        onDeleteColumn={deleteColumn}
        onCreateTask={createTask}
        onUpdateTask={updateTask}
        onDeleteTask={deleteTask}
        onMoveTask={moveTask}
        showCompleted={showCompleted}
      />

      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false)
          setSelectedTaskId(null)
        }}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
      />
    </div>
  )
}