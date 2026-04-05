'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { TaskPriority } from '@/lib/types'
import { Plus, X, Calendar, User, Tag, AlertCircle } from 'lucide-react'

interface AddTaskFormProps {
  columnId: string
  onSubmit: (data: {
    title: string
    description?: string
    priority: TaskPriority
    assigneeId?: string
    dueDate?: Date
  }) => Promise<void>
  onCancel: () => void
}

export function AddTaskForm({ columnId, onSubmit, onCancel }: AddTaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined
      })
      setTitle('')
      setDescription('')
      setPriority('medium')
      setDueDate('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'critical', label: 'Critical', color: 'bg-red-500' },
    { value: 'high', label: 'High', color: 'bg-orange-500' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { value: 'low', label: 'Low', color: 'bg-blue-500' },
    { value: 'none', label: 'None', color: 'bg-gray-500' }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="space-y-3">
        <Input
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
          autoFocus
          className="bg-white dark:bg-gray-900"
        />
        
        <Input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          className="bg-white dark:bg-gray-900"
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Priority
            </label>
            <div className="flex gap-1">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value)}
                  className={`
                    flex-1 py-1.5 rounded text-xs font-medium transition-all
                    ${priority === option.value 
                      ? `${option.color} text-white` 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Due Date
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isSubmitting}
              className="bg-white dark:bg-gray-900 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <Spinner size="sm" className="mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Add Task
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}