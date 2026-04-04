```typescript
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { CalendarIcon, Save, X, Receipt, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Expense, ExpenseCategory } from '@/types'
import { formatCurrency } from '@/lib/utils'

export interface ExpenseFormData {
  description: string
  amount: number | string
  category: ExpenseCategory
  date: string
  vendor?: string
  receiptNumber?: string
  tax?: number | string
  notes?: string
  status: 'pending' | 'paid' | 'reimbursed'
}

interface ExpenseFormProps {
  expense?: Expense
  onSubmit: (data: ExpenseFormData) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  expense,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const router = useRouter()
  const [error, setError] = useState<string>('')
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: '',
    amount: '',
    category: 'other',
    date: format(new Date(), 'yyyy-MM-dd'),
    vendor: '',
    receiptNumber: '',
    tax: '',
    notes: '',
    status: 'pending',
  })

  // Initialize form with expense data if editing
  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        date: format(new Date(expense.date), 'yyyy-MM-dd'),
        vendor: expense.vendor || '',
        receiptNumber: expense.receiptNumber || '',
        tax: expense.tax || '',
        notes: expense.notes || '',
        status: expense.status,
      })
    }
  }, [expense])

  const handleChange = (field: keyof ExpenseFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate required fields
    if (!formData.description.trim()) {
      setError('Description is required')
      return
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Amount must be greater than 0')
      return
    }

    if (!formData.category) {
      setError('Category is required')
      return
    }

    try {
      // Convert string amounts to numbers
      const submitData = {
        ...formData,
        amount: Number(formData.amount),
        tax: formData.tax ? Number(formData.tax) : undefined,
      }
      await onSubmit(submitData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense')
    }
  }

  const categoryOptions = [
    { value: 'office', label: 'Office Supplies' },
    { value: 'travel', label: 'Travel & Transportation' },
    { value: 'software', label: 'Software & Subscriptions' },
    { value: 'hardware', label: 'Hardware & Equipment' },
    { value: 'marketing', label: 'Marketing & Advertising' },
    { value: 'professional', label: 'Professional Services' },
    { value: 'other', label: 'Other Expenses' },
  ]

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'reimbursed', label: 'Reimbursed' },
  ]

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          {expense ? 'Edit Expense' : 'Add New Expense'}
        </CardTitle>
        <CardDescription>
          Track your business expenses for better financial management
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Description */}
            <div className="md:col-span-2">
              <Input
                label="Description *"
                placeholder="What was this expense for?"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                required
              />
            </div>

            {/* Amount */}
            <div>
              <Input
                label="Amount *"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                leftIcon={<span className="text-muted-foreground">$</span>}
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                required
              />
            </div>

            {/* Category */}
            <div>
              <Select
                label="Category *"
                options={categoryOptions}
                value={formData.category}
                onChange={(value) => handleChange('category', value as ExpenseCategory)}
                required
              />
            </div>

            {/* Date */}
            <div>
              <Input
                label="Date *"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                required
              />
            </div>

            {/* Status */}
            <div>
              <Select
                label="Status"
                options={statusOptions}
                value={formData.status}
                onChange={(value) => handleChange('status', value as 'pending' | 'paid' | 'reimbursed')}
              />
            </div>

            {/* Vendor */}
            <div>
              <Input
                label="Vendor"
                placeholder="Company or store name"
                value={formData.vendor}
                onChange={(e) => handleChange('vendor', e.target.value)}
              />
            </div>

            {/* Receipt Number */}
            <div>
              <Input
                label="Receipt Number"
                placeholder="Receipt #"
                value={formData.receiptNumber}
                onChange={(e) => handleChange('receiptNumber', e.target.value)}
              />
            </div>

            {/* Tax */}
            <div>
              <Input
                label="Tax Amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                leftIcon={<span className="text-muted-foreground">$</span>}
                value={formData.tax}
                onChange={(e) => handleChange('tax', e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <Textarea
                label="Notes"
                placeholder="Additional details about this expense..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Total Preview */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
              <span className="font-semibold">
                {formatCurrency(Number(formData.amount) || 0, 'USD')}
              </span>
            </div>
            {formData.tax && Number(formData.tax) > 0 && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium text-muted-foreground">Tax</span>
                <span className="font-semibold">
                  {formatCurrency(Number(formData.tax) || 0, 'USD')}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center mt-2 pt-2 border-t">
              <span className="text-lg font-bold">Total</span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(
                  (Number(formData.amount) || 0) + (Number(formData.tax) || 0),
                  'USD'
                )}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel || (() => router.back())}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {expense ? 'Update Expense' : 'Save Expense'}
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

export default ExpenseForm
```