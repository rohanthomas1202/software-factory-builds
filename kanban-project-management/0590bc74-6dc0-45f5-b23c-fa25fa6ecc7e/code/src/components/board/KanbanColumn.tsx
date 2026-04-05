'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { TaskCard } from './TaskCard'
import { AddTaskForm } from './AddTaskForm'
import { Column, Task } from '@/lib/types'
import { 
  MoreVertical, 
  Plus, 
  GripVertical,
  Trash2,
  Edit,
  Settings,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Palette,
  X
} from 'lucide-react'
import { Dropdown } from '@/components/ui/Dropdown'
import { Badge } from '@/components/ui/Badge'
import { toast } from '@/components/ui/Toast'

interface KanbanColumnProps {
  column: Column
  tasks: Task[]
  onTaskMove: (taskId: string, sourceColumnId: string, targetColumnId: string, newOrder: number) => Promise<void>
  onTaskReorder: (taskId: string, columnId: string, newOrder: number) => Promise<void>
  onTaskUpdate: (taskId: string, data: Partial<Task>) => Promise<Task | null>
  onTaskDelete: (taskId: string) => Promise<boolean>
  onColumnUpdate: (columnId: string, data: Partial<Column>) => Promise<Column | null>
  onColumnDelete: (columnId: string) => Promise<boolean>
  onDragStart: () => void
  onDragEnd: () => void
  viewMode: 'kanban' | 'list'
}

export function KanbanColumn({
  column,
  tasks,
  onTaskMove,
  onTaskReorder,
  onTaskUpdate,
  onTaskDelete,
  onColumnUpdate,
  onColumnDelete,
  onDragStart,
  onDragEnd,
  viewMode
}: KanbanColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isWipLimited, setIsWipLimited] = useState(!!column.wipLimit)
  const [wipLimit, setWipLimit] = useState(column.wipLimit?.toString() || '')
  const [columnName, setColumnName] = useState(column.name)
  const [columnColor, setColumnColor] = useState(column.color || '#3b82f6')
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  
  const columnRef = useRef<HTMLDivElement>(null)
  const dragCounter = useRef(0)

  // Handle drag over for drop zone
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  // Handle drag enter
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    setIsDraggingOver(true)
  }

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDraggingOver(false)
    }
  }

  // Handle drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    dragCounter.current = 0
    
    const taskId = e.dataTransfer.getData('taskId')
    const sourceColumnId = e.dataTransfer.getData('sourceColumnId')
    
    if (taskId && sourceColumnId && sourceColumnId !== column.id) {
      // Move task to this column
      const newOrder = tasks.length
      await onTaskMove(taskId, sourceColumnId, column.id, newOrder)
    }
  }

  // Handle column update
  const handleUpdateColumn = async () => {
    try {
      const updates: Partial<Column> = {
        name: columnName,
        color: columnColor,
      }
      
      if (isWipLimited && wipLimit) {
        updates.wipLimit = parseInt(wipLimit, 10)
      } else {
        updates.wipLimit = undefined
      }
      
      await onColumnUpdate(column.id, updates)
      setIsEditing(false)
      toast.success('Column updated successfully')
    } catch (error) {
      toast.error('Failed to update column')
    }
  }

  // Handle column delete
  const handleDeleteColumn = async () => {
    if (tasks.length > 0) {
      if (!confirm(`Delete column "${column.name}" with ${tasks.length} tasks?`)) {
        return
      }
    }
    
    try {
      await onColumnDelete(column.id)
      toast.success('Column deleted successfully')
    } catch (error) {
      toast.error('Failed to delete column')
    }
  }

  // Handle task add
  const handleAddTask = async (data: { title: string; description?: string; priority?: string }) => {
    try {
      await onTaskUpdate('new', {
        title: data.title,
        description: data.description,
        priority: data.priority as any,
        columnId: column.id,
        status: column.name.toLowerCase().replace(' ', '_') as any,
        order: tasks.length
      })
      setIsAddingTask(false)
      toast.success('Task created successfully')
    } catch (error) {
      toast.error('Failed to create task')
    }
  }

  // Color options for column
  const colorOptions = [
    { value: '#3b82f6', label: 'Blue', bg: 'bg-blue-500' },
    { value: '#10b981', label: 'Green', bg: 'bg-green-500' },
    { value: '#f59e0b', label: 'Amber', bg: 'bg-amber-500' },
    { value: '#ef4444', label: 'Red', bg: 'bg-red-500' },
    { value: '#8b5cf6', label: 'Purple', bg: 'bg-purple-500' },
    { value: '#ec4899', label: 'Pink', bg: 'bg-pink-500' },
    { value: '#06b6d4', label: 'Cyan', bg: 'bg-cyan-500' },
    { value: '#64748b', label: 'Slate', bg: 'bg-slate-500' },
  ]

  // Check if WIP limit is exceeded
  const isWipExceeded = isWipLimited && column.wipLimit && tasks.length > column.wipLimit

  if (viewMode === 'list') {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: column.color || '#3b82f6' }}
            />
            <h3 className="font-semibold text-gray-900 dark:text-white">{column.name}</h3>
            <Badge variant="outline">{tasks.length}</Badge>
            {isWipExceeded && (
              <Badge variant="danger" className="animate-pulse">
                WIP Limit: {tasks.length}/{column.wipLimit}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingTask(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
            <Dropdown
              trigger={
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              }
            >
              <Dropdown.Item onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Column
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setIsCollapsed(!isCollapsed)}>
                {isCollapsed ? (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Expand
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Collapse
                  </>
                )}
              </Dropdown.Item>
              <Dropdown.Item onClick={handleDeleteColumn} className="text-red-600 dark:text-red-400">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Column
              </Dropdown.Item>
            </Dropdown>
          </div>
        </div>

        {!isCollapsed && (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                columnId={column.id}
                onUpdate={onTaskUpdate}
                onDelete={onTaskDelete}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                viewMode="list"
              />
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                No tasks in this column
              </div>
            )}
          </div>
        )}

        {isAddingTask && (
          <div className="mt-4">
            <AddTaskForm
              columnId={column.id}
              onSubmit={handleAddTask}
              onCancel={() => setIsAddingTask(false)}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={columnRef}
      className={cn(
        "flex-shrink-0 w-80 flex flex-col rounded-2xl border transition-all duration-200",
        isDraggingOver && "ring-2 ring-primary/50 ring-offset-2",
        isWipExceeded ? "border-red-300 dark:border-red-700" : "border-gray-200 dark:border-gray-700"
      )}
      style={{
        backgroundColor: isWipExceeded 
          ? 'rgba(239, 68, 68, 0.05)' 
          : 'var(--background)'
      }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className={cn(
        "p-4 rounded-t-2xl border-b flex items-center justify-between transition-colors",
        isWipExceeded 
          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" 
          : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
      )}>
        {isEditing ? (
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={columnColor}
                onChange={(e) => setColumnColor(e.target.value)}
                className="w-6 h-6 cursor-pointer rounded border-0"
              />
              <input
                type="text"
                value={columnName}
                onChange={(e) => setColumnName(e.target.value)}
                className="flex-1 px-3 py-1 text-sm font-semibold bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-primary"
                placeholder="Column name"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="wipLimit"
                  checked={isWipLimited}
                  onChange={(e) => setIsWipLimited(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="wipLimit" className="text-xs text-gray-600 dark:text-gray-400">
                  Enable WIP Limit
                </label>
              </div>
              
              {isWipLimited && (
                <input
                  type="number"
                  min="1"
                  value={wipLimit}
                  onChange={(e) => setWipLimit(e.target.value)}
                  className="w-full px-3 py-1 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-primary"
                  placeholder="WIP limit"
                />
              )}
            </div>
            
            <div className="flex items-center gap-2 pt-2">
              <Button size="sm" onClick={handleUpdateColumn}>
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false)
                  setColumnName(column.name)
                  setColumnColor(column.color || '#3b82f6')
                  setIsWipLimited(!!column.wipLimit)
                  setWipLimit(column.wipLimit?.toString() || '')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 flex-1">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: column.color || '#3b82f6' }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {column.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" size="sm">
                    {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                  </Badge>
                  {column.wipLimit && (
                    <Badge
                      variant={isWipExceeded ? "danger" : "outline"}
                      size="sm"
                      className={isWipExceeded ? "animate-pulse" : ""}
                    >
                      {isWipLimited ? (
                        <>
                          {isWipExceeded ? (
                            <Lock className="w-3 h-3 mr-1" />
                          ) : (
                            <Unlock className="w-3 h-3 mr-1" />
                          )}
                          {tasks.length}/{column.wipLimit}
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3 mr-1" />
                          {column.wipLimit} limit
                        </>
                      )}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-8 w-8 p-0"
              >
                {isCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </Button>
              <Dropdown
                trigger={
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                }
              >
                <Dropdown.Item onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Column
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setIsAddingTask(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setIsCollapsed(!isCollapsed)}>
                  {isCollapsed ? (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Expand
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Collapse
                    </>
                  )}
                </Dropdown.Item>
                <Dropdown.Item onClick={handleDeleteColumn} className="text-red-600 dark:text-red-400">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Column
                </Dropdown.Item>
              </Dropdown>
            </div>
          </>
        )}
      </div>

      {/* Column Content */}
      {!isCollapsed && (
        <>
          {/* Tasks List */}
          <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)]">
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                columnId={column.id}
                order={index}
                onUpdate={onTaskUpdate}
                onDelete={onTaskDelete}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onReorder={onTaskReorder}
                viewMode="kanban"
              />
            ))}
            
            {tasks.length === 0 && !isAddingTask && (
              <div
                className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl min-h-[200px]"
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Drop tasks here or
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingTask(true)}
                >
                  Add Task
                </Button>
              </div>
            )}
          </div>

          {/* Add Task Button */}
          {!isAddingTask && tasks.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingTask(true)}
                className="w-full justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </div>
          )}

          {/* Add Task Form */}
          {isAddingTask && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <AddTaskForm
                columnId={column.id}
                onSubmit={handleAddTask}
                onCancel={() => setIsAddingTask(false)}
              />
            </div>
          )}
        </>
      )}

      {/* Collapsed State */}
      {isCollapsed && (
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="text-center">
            <Badge variant="outline">{tasks.length} tasks</Badge>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Column collapsed
            </p>
          </div>
        </div>
      )}
    </div>
  )
}