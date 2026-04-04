```typescript
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { CalendarIcon, Plus, Trash2, Save, X, Send, Calendar, User, Building, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Invoice, Client, InvoiceItem, InvoiceStatus, CreateInvoiceRequest, UpdateInvoiceRequest } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { currencies } from '@/lib/currencies'
import InvoiceLineItems from './InvoiceLineItems'
import InvoicePreview from './InvoicePreview'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export interface InvoiceFormData {
  clientId: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  status: InvoiceStatus
  items: InvoiceItem[]
  taxRate: number
  discount: number
  discountType: 'percentage' | 'fixed'
  notes?: string
  terms?: string
}

interface InvoiceFormProps {
  invoice?: Invoice
  clients: Client[]
  user: any
  onSubmit: (data: CreateInvoiceRequest | UpdateInvoiceRequest) => Promise<void>
  isSubmitting?: boolean
  mode?: 'create' | 'edit'
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  invoice,
  clients,
  user,
  onSubmit,
  isSubmitting = false,
  mode = 'create'
}) => {
  const router = useRouter()
  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: invoice?.clientId || '',
    invoiceNumber: invoice?.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
    issueDate: invoice?.issueDate ? format(new Date(invoice.issueDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    dueDate: invoice?.dueDate ? format(new Date(invoice.dueDate), 'yyyy-MM-dd') : format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    status: invoice?.status || 'draft',
    items: invoice?.items || [
      {
        id: '1',
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 0
      }
    ],
    taxRate: invoice?.taxRate || 0,
    discount: invoice?.discount || 0,
    discountType: invoice?.discountType || 'percentage',
    notes: invoice?.notes || '',
    terms: invoice?.terms || 'Payment due within 30 days. Late payments subject to 1.5% monthly interest.'
  })

  const [selectedClient, setSelectedClient] = useState<Client | undefined>(
    clients.find(c => c.id === invoice?.clientId)
  )
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)

  const currencyOptions = currencies.map(currency => ({
    value: currency.code,
    label: `${currency.code} - ${currency.name} (${currency.symbolNative})`
  }))

  const clientOptions = clients.map(client => ({
    value: client.id,
    label: `${client.name}${client.company ? ` - ${client.company}` : ''}`
  }))

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  const discountTypeOptions = [
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'fixed', label: 'Fixed Amount' }
  ]

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice)
    }, 0)

    let discountAmount = 0
    if (formData.discountType === 'percentage') {
      discountAmount = subtotal * (formData.discount / 100)
    } else {
      discountAmount = formData.discount
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount)
    const taxAmount = taxableAmount * (formData.taxRate / 100)
    const total = taxableAmount + taxAmount

    return { subtotal, discountAmount, taxAmount, total }
  }

  const handleClientChange = (clientId: string) => {
    setFormData(prev => ({ ...prev, clientId }))
    const client = clients.find(c => c.id === clientId)
    setSelectedClient(client)
  }

  const handleItemChange = (items: InvoiceItem[]) => {
    setFormData(prev => ({ ...prev, items }))
  }

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: formData.taxRate
    }
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!formData.clientId) {
      setError('Please select a client')
      return
    }

    if (!formData.invoiceNumber.trim()) {
      setError('Invoice number is required')
      return
    }

    if (formData.items.length === 0) {
      setError('Please add at least one line item')
      return
    }

    const hasEmptyItems = formData.items.some(item => 
      !item.description.trim() || item.quantity <= 0 || item.unitPrice < 0
    )
    if (hasEmptyItems) {
      setError('Please fill in all line items with valid values')
      return
    }

    const { total } = calculateTotals()
    if (total <= 0) {
      setError('Invoice total must be greater than 0')
      return
    }

    try {
      const invoiceData: any = {
        clientId: formData.clientId,
        invoiceNumber: formData.invoiceNumber,
        issueDate: new Date(formData.issueDate).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString(),
        status: formData.status,
        items: formData.items,
        taxRate: formData.taxRate,
        discount: formData.discount,
        discountType: formData.discountType,
        notes: formData.notes,
        terms: formData.terms,
        currency: user.currency || 'USD'
      }

      if (mode === 'edit' && invoice) {
        invoiceData.id = invoice.id
      }

      await onSubmit(invoiceData)
      
      setSuccess(mode === 'create' ? 'Invoice created successfully!' : 'Invoice updated successfully!')
      
      // Redirect after successful submission
      setTimeout(() => {
        router.push('/invoices')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to save invoice')
    }
  }

  const handleSaveDraft = async () => {
    setFormData(prev => ({ ...prev, status: 'draft' }))
    // The form will be submitted with status=draft
  }

  const handleSendInvoice = async () => {
    setFormData(prev => ({ ...prev, status: 'sent' }))
    // The form will be submitted with status=sent
  }

  const { subtotal, discountAmount, taxAmount, total } = calculateTotals()

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>
                {mode === 'create' ? 'Create a new invoice' : 'Edit invoice details'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Select
                    label="Client"
                    value={formData.clientId}
                    onChange={handleClientChange}
                    options={clientOptions}
                    placeholder="Select a client"
                    error={!formData.clientId ? 'Client is required' : undefined}
                    leftIcon={<User className="h-4 w-4" />}
                  />
                  {selectedClient && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>{selectedClient.email}</p>
                      {selectedClient.phone && <p>{selectedClient.phone}</p>}
                    </div>
                  )}
                </div>

                <Input
                  label="Invoice Number"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  placeholder="e.g., INV-001"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Issue Date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                  leftIcon={<Calendar className="h-4 w-4" />}
                />

                <Input
                  type="date"
                  label="Due Date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  leftIcon={<Calendar className="h-4 w-4" />}
                />
              </div>

              {mode === 'edit' && (
                <Select
                  label="Status"
                  value={formData.status}
                  onChange={(value) => setFormData(prev => ({ ...prev, status: value as InvoiceStatus }))}
                  options={statusOptions}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Line Items</CardTitle>
                  <CardDescription>Add services or products for this invoice</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <InvoiceLineItems
                items={formData.items}
                currency={user.currency || 'USD'}
                taxRate={formData.taxRate}
                onChange={handleItemChange}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Add notes and terms for your client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional information for your client..."
                rows={3}
              />

              <Textarea
                label="Terms & Conditions"
                value={formData.terms}
                onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                placeholder="Payment terms and conditions..."
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Invoice totals and calculations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal, user.currency)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={formData.discountType}
                    onChange={(value) => setFormData(prev => ({ ...prev, discountType: value as 'percentage' | 'fixed' }))}
                    options={discountTypeOptions}
                    size="sm"
                  />
                  <Input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step={formData.discountType === 'percentage' ? '0.1' : '0.01'}
                    size="sm"
                  />
                </div>

                {formData.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(discountAmount, user.currency)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tax Rate</span>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={formData.taxRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-24"
                      size="sm"
                    />
                    <span className="text-sm">%</span>
                  </div>
                </div>

                {formData.taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax Amount</span>
                    <span className="font-medium">{formatCurrency(taxAmount, user.currency)}</span>
                  </div>
                )}

                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(total, user.currency)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full"
                variant="default"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {mode === 'create' ? 'Create Invoice' : 'Update Invoice'}
                  </>
                )}
              </Button>

              {mode === 'create' && (
                <>
                  <Button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isSubmitting}
                    className="w-full"
                    variant="outline"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                  </Button>

                  <Button
                    type="button"
                    onClick={handleSendInvoice}
                    disabled={isSubmitting}
                    className="w-full"
                    variant="secondary"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Save & Send
                  </Button>
                </>
              )}

              <Button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="w-full"
                variant="ghost"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>

              <Button
                type="button"
                onClick={() => router.back()}
                className="w-full"
                variant="outline"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {showPreview && selectedClient && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Preview</CardTitle>
              <CardDescription>How your invoice will appear to the client</CardDescription>
            </CardHeader>
            <CardContent>
              <InvoicePreview
                invoice={{
                  id: 'preview',
                  clientId: selectedClient.id,
                  userId: user.id,
                  invoiceNumber: formData.invoiceNumber,
                  issueDate: new Date(formData.issueDate).toISOString(),
                  dueDate: new Date(formData.dueDate).toISOString(),
                  status: formData.status,
                  items: formData.items,
                  subtotal,
                  taxRate: formData.taxRate,
                  taxAmount,
                  discount: formData.discount,
                  discountType: formData.discountType,
                  discountAmount,
                  total,
                  currency: user.currency || 'USD',
                  notes: formData.notes,
                  terms: formData.terms,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }}
                client={selectedClient}
                user={user}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default InvoiceForm
```