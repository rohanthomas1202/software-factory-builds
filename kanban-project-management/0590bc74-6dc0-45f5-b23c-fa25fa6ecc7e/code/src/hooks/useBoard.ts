'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from '@/components/ui/Toast'
import { Board, Column, Task } from '@/lib/types'

interface UseBoardReturn {
  board: Board | null
  columns: Column[]
  isLoading: boolean
  error: string | null
  createColumn: (data: Omit<Column, 'id' | 'createdAt' | 'updatedAt' | 'boardId' | 'order'>) => Promise<Column | null>
  updateColumn: (id: string, data: Partial<Column>) => Promise<Column | null>
  deleteColumn: (id: string) => Promise<boolean>
  moveTask: (taskId: string, columnId: string, newOrder: number) => Promise<boolean>
  fetchBoard: (boardId: string) => Promise<void>
  refreshBoard: () => Promise<void>
}

export function useBoard(boardId?: string) {
  const [board, setBoard] = useState<Board | null>(null)
  const [columns, setColumns] = useState<Column[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBoard = useCallback(async (id: string) => {
    if (!id) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/boards/${id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch board')
      }
      
      const data = await response.json()
      setBoard(data.board)
      setColumns(data.columns || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch board'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshBoard = useCallback(async () => {
    if (boardId) {
      await fetchBoard(boardId)
    }
  }, [boardId, fetchBoard])

  // Initial fetch if boardId provided
  useEffect(() => {
    if (boardId) {
      fetchBoard(boardId)
    }
  }, [boardId, fetchBoard])

  const createColumn = useCallback(async (data: Omit<Column, 'id' | 'createdAt' | 'updatedAt' | 'boardId' | 'order'>) => {
    if (!boardId) {
      toast.error('No board selected')
      return null
    }

    try {
      const response = await fetch('/api/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          boardId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create column')
      }

      const newColumn = await response.json()
      
      setColumns(prev => [...prev, newColumn])
      toast.success('Column created successfully!')
      return newColumn
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create column'
      toast.error(message)
      return null
    }
  }, [boardId])

  const updateColumn = useCallback(async (id: string, data: Partial<Column>) => {
    try {
      const response = await fetch(`/api/columns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update column')
      }

      const updatedColumn = await response.json()
      
      setColumns(prev => prev.map(column => 
        column.id === id ? updatedColumn : column
      ))
      
      toast.success('Column updated successfully!')
      return updatedColumn
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update column'
      toast.error(message)
      return null
    }
  }, [])

  const deleteColumn = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/columns/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete column')
      }

      setColumns(prev => prev.filter(column => column.id !== id))
      toast.success('Column deleted successfully!')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete column'
      toast.error(message)
      return false
    }
  }, [])

  const moveTask = useCallback(async (taskId: string, columnId: string, newOrder: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId, order: newOrder })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to move task')
      }

      // Refresh board data after moving task
      if (boardId) {
        await fetchBoard(boardId)
      }
      
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to move task'
      toast.error(message)
      return false
    }
  }, [boardId, fetchBoard])

  return {
    board,
    columns,
    isLoading,
    error,
    createColumn,
    updateColumn,
    deleteColumn,
    moveTask,
    fetchBoard,
    refreshBoard
  }
}