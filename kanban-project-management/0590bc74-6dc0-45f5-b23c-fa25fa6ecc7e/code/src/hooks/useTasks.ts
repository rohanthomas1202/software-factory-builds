'use client'

import { useState, useCallback } from 'react'
import { toast } from '@/components/ui/Toast'
import { Task, Comment } from '@/lib/types'

interface UseTasksReturn {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  createTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'comments'>) => Promise<Task | null>
  updateTask: (id: string, data: Partial<Task>) => Promise<Task | null>
  deleteTask: (id: string) => Promise<boolean>
  fetchTasksByColumn: (columnId: string) => Promise<void>
  addComment: (taskId: string, content: string) => Promise<Comment | null>
  updateComment: (taskId: string, commentId: string, content: string) => Promise<Comment | null>
  deleteComment: (taskId: string, commentId: string) => Promise<boolean>
}

export function useTasks(columnId?: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTasksByColumn = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/tasks?columnId=${id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      
      const data = await response.json()
      setTasks(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tasks'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createTask = useCallback(async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'comments'>) => {
    if (!columnId) {
      toast.error('No column selected')
      return null
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          columnId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create task')
      }

      const newTask = await response.json()
      
      setTasks(prev => [...prev, newTask])
      toast.success('Task created successfully!')
      return newTask
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create task'
      toast.error(message)
      return null
    }
  }, [columnId])

  const updateTask = useCallback(async (id: string, data: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update task')
      }

      const updatedTask = await response.json()
      
      setTasks(prev => prev.map(task => 
        task.id === id ? updatedTask : task
      ))
      
      toast.success('Task updated successfully!')
      return updatedTask
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update task'
      toast.error(message)
      return null
    }
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete task')
      }

      setTasks(prev => prev.filter(task => task.id !== id))
      toast.success('Task deleted successfully!')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete task'
      toast.error(message)
      return false
    }
  }, [])

  const addComment = useCallback(async (taskId: string, content: string) => {
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, content })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add comment')
      }

      const newComment = await response.json()
      
      // Update task with new comment
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, comments: [...(task.comments || []), newComment] }
          : task
      ))
      
      toast.success('Comment added successfully!')
      return newComment
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add comment'
      toast.error(message)
      return null
    }
  }, [])

  const updateComment = useCallback(async (taskId: string, commentId: string, content: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update comment')
      }

      const updatedComment = await response.json()
      
      // Update task with updated comment
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              comments: (task.comments || []).map(comment => 
                comment.id === commentId ? updatedComment : comment
              )
            }
          : task
      ))
      
      toast.success('Comment updated successfully!')
      return updatedComment
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update comment'
      toast.error(message)
      return null
    }
  }, [])

  const deleteComment = useCallback(async (taskId: string, commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete comment')
      }

      // Update task by removing comment
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              comments: (task.comments || []).filter(comment => comment.id !== commentId)
            }
          : task
      ))
      
      toast.success('Comment deleted successfully!')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete comment'
      toast.error(message)
      return false
    }
  }, [])

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    fetchTasksByColumn,
    addComment,
    updateComment,
    deleteComment
  }
}