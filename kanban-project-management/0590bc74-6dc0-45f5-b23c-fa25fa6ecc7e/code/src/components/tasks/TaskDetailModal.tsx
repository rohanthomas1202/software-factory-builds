'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { TaskDetail } from './TaskDetail'
import { Task, User, Comment } from '@/lib/types'
import { toast } from '@/components/ui/Toast'

interface TaskDetailModalProps {
  taskId: string | null
  isOpen: boolean
  onClose: () => void
  onTaskUpdate?: (task: Task) => void
  onTaskDelete?: (taskId: string) => void
}

export function TaskDetailModal({ 
  taskId, 
  isOpen, 
  onClose, 
  onTaskUpdate, 
  onTaskDelete 
}: TaskDetailModalProps) {
  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch task when modal opens
  useEffect(() => {
    if (isOpen && taskId) {
      fetchTask()
    }
  }, [isOpen, taskId])

  const fetchTask = async () => {
    if (!taskId) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/tasks/${taskId}`)
      if (!response.ok) throw new Error('Failed to fetch task')
      const data = await response.json()
      setTask(data.task)
    } catch (error) {
      console.error('Error fetching task:', error)
      toast.error('Failed to load task details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTaskUpdate = (updatedTask: Task) => {
    setTask(updatedTask)
    onTaskUpdate?.(updatedTask)
  }

  const handleTaskDelete = (deletedTaskId: string) => {
    onTaskDelete?.(deletedTaskId)
    onClose()
  }

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      className="max-w-6xl h-[90vh]"
    >
      <Modal.Content showClose={false} className="h-full flex flex-col p-0">
        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <Spinner size="lg" />
          </div>
        ) : taskId ? (
          <TaskDetail
            taskId={taskId}
            onClose={onClose}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            className="flex-1"
          />
        ) : (
          <div className="flex items-center justify-center flex-1 p-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Task Selected
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Select a task to view its details
              </p>
            </div>
          </div>
        )}
      </Modal.Content>
    </Modal>
  )
}