'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { toast } from '@/components/ui/Toast'
import { KanbanColumn } from './KanbanColumn'
import { AddColumnForm } from './AddColumnForm'
import { Board, Column, Task } from '@/lib/types'
import { useBoard } from '@/hooks/useBoard'
import { useTasks } from '@/hooks/useTasks'
import { 
  Plus, 
  RefreshCw, 
  Filter, 
  Settings,
  Users,
  Eye,
  EyeOff,
  Grid,
  List,
  Search,
  Download
} from 'lucide-react'
import { Dropdown } from '@/components/ui/Dropdown'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

interface KanbanBoardProps {
  boardId: string
  projectId?: string
}

export function KanbanBoard({ boardId, projectId }: KanbanBoardProps) {
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showCompleted, setShowCompleted] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  
  const { 
    board, 
    columns, 
    isLoading: boardLoading, 
    error: boardError,
    createColumn,
    updateColumn,
    deleteColumn,
    refreshBoard 
  } = useBoard(boardId)
  
  const { 
    tasks, 
    isLoading: tasksLoading,
    moveTask,
    updateTask,
    deleteTask
  } = useTasks()

  // Filter tasks based on search and filter criteria
  const filteredTasks = useCallback((columnTasks: Task[]) => {
    return columnTasks.filter(task => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      // Status filter
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus
      
      // Completed filter
      const matchesCompleted = showCompleted || task.status !== 'done'
      
      return matchesSearch && matchesStatus && matchesCompleted
    })
  }, [searchQuery, filterStatus, showCompleted])

  // Handle column creation
  const handleAddColumn = async (name: string) => {
    try {
      await createColumn({
        name,
        color: '#3b82f6', // Default blue color
        boardId
      })
      setIsAddingColumn(false)
      toast.success('Column created successfully')
    } catch (error) {
      toast.error('Failed to create column')
    }
  }

  // Handle task move between columns
  const handleTaskMove = async (taskId: string, sourceColumnId: string, targetColumnId: string, newOrder: number) => {
    try {
      await moveTask(taskId, targetColumnId, newOrder)
      toast.success('Task moved successfully')
    } catch (error) {
      toast.error('Failed to move task')
    }
  }

  // Handle task reorder within column
  const handleTaskReorder = async (taskId: string, columnId: string, newOrder: number) => {
    try {
      await moveTask(taskId, columnId, newOrder)
    } catch (error) {
      toast.error('Failed to reorder task')
    }
  }

  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true)
  }

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false)
  }

  // Calculate board statistics
  const boardStats = {
    totalTasks: columns.reduce((acc, col) => acc + (col.tasks?.length || 0), 0),
    completedTasks: columns.reduce((acc, col) => 
      acc + (col.tasks?.filter(t => t.status === 'done').length || 0), 0),
    inProgressTasks: columns.reduce((acc, col) => 
      acc + (col.tasks?.filter(t => t.status === 'in_progress').length || 0), 0),
    todoTasks: columns.reduce((acc, col) => 
      acc + (col.tasks?.filter(t => t.status === 'todo').length || 0), 0),
  }

  if (boardLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    )
  }

  if (boardError || !board) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center p-8">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Failed to load board
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          {boardError || 'Board not found'}
        </p>
        <Button onClick={() => refreshBoard()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Board Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{board.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{board.description}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Users className="w-3 h-3" />
            {board.memberIds?.length || 0} members
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Grid className="w-3 h-3" />
            {columns.length} columns
          </Badge>
        </div>
      </div>

      {/* Board Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="w-full"
          />
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'kanban' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className="gap-2"
          >
            <Grid className="w-4 h-4" />
            Kanban
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="gap-2"
          >
            <List className="w-4 h-4" />
            List
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <Dropdown
            trigger={
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            }
          >
            <div className="p-2 min-w-[200px]">
              <div className="mb-3">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showCompleted"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <label htmlFor="showCompleted" className="text-sm text-gray-700 dark:text-gray-300">
                  Show Completed
                </label>
              </div>
            </div>
          </Dropdown>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setFilterStatus('all')
              setShowCompleted(true)
            }}
          >
            Clear
          </Button>
        </div>

        {/* Add Column Button */}
        <Button
          onClick={() => setIsAddingColumn(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Column
        </Button>
      </div>

      {/* Board Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {boardStats.totalTasks}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-300">Total Tasks</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">
            {boardStats.completedTasks}
          </div>
          <div className="text-sm text-green-600 dark:text-green-300">Completed</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-100 dark:border-yellow-800">
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
            {boardStats.inProgressTasks}
          </div>
          <div className="text-sm text-yellow-600 dark:text-yellow-300">In Progress</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
            {boardStats.todoTasks}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">To Do</div>
        </div>
      </div>

      {/* Add Column Form */}
      {isAddingColumn && (
        <div className="mb-6">
          <AddColumnForm
            onSubmit={handleAddColumn}
            onCancel={() => setIsAddingColumn(false)}
          />
        </div>
      )}

      {/* Kanban Board Columns */}
      <div className={cn(
        "flex-1 overflow-x-auto pb-6",
        isDragging && "cursor-grabbing"
      )}>
        <div className="flex gap-4 min-h-[600px]">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={filteredTasks(column.tasks || [])}
              onTaskMove={handleTaskMove}
              onTaskReorder={handleTaskReorder}
              onTaskUpdate={updateTask}
              onTaskDelete={deleteTask}
              onColumnUpdate={updateColumn}
              onColumnDelete={deleteColumn}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              viewMode={viewMode}
            />
          ))}
          
          {/* Empty state */}
          {columns.length === 0 && !isAddingColumn && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Grid className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No columns yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                Create your first column to start organizing tasks
              </p>
              <Button onClick={() => setIsAddingColumn(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Column
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper component for error display
function AlertCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  )
}