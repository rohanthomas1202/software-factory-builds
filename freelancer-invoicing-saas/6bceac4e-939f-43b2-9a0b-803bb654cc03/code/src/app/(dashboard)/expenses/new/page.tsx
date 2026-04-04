```typescript
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import ExpenseForm, { ExpenseFormData } from '@/components/expenses/ExpenseForm'
import { useToast } from '@/components/ui/toaster'

export default function NewExpensePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create expense')
      }

      const result = await response.json()
      
      toast({
        title: 'Success!',
        description: 'Expense created successfully',
        type: 'success',
      })

      // Redirect to expenses page
      router.push('/expenses')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create expense',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add New Expense"
        description="Track a new business expense"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Expenses', href: '/expenses' },
          { label: 'Add Expense', href: '/expenses/new' },
        ]}
      />

      <ExpenseForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
```