'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Loader2, Save, X, User, Mail, Building, Phone, MapPin, Globe } from 'lucide-react'
import { Client } from '@/types'

interface ClientFormProps {
  client?: Client
  onSubmit: (data: FormData) => Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
  cancelLabel?: string
  onCancel?: () => void
}

interface FormData {
  name: string
  email: string
  company?: string
  phone?: string
  address?: string
  website?: string
  notes?: string
  taxId?: string
}

const ClientForm: React.FC<ClientFormProps> = ({
  client,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Save Client',
  cancelLabel = 'Cancel',
  onCancel
}) => {
  const router = useRouter()
  const [error, setError] = useState<string>('')
  const [formData, setFormData] = useState<FormData>({
    name: client?.name || '',
    email: client?.email || '',
    company: client?.company || '',
    phone: client?.phone || '',
    address: client?.address || '',
    website: client?.website || '',
    notes: client?.notes || '',
    taxId: client?.taxId || ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate required fields
    if (!formData.name.trim()) {
      setError('Client name is required')
      return
    }

    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.back()
    }
  }

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/80 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          {client ? 'Edit Client' : 'New Client'}
        </CardTitle>
        <CardDescription>
          {client ? 'Update client information' : 'Add a new client to your invoicing system'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Input
                  label="Client Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  leftIcon={<User className="h-4 w-4 text-muted-foreground" />}
                  required
                  disabled={isSubmitting}
                  className="bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                />
              </div>

              <div>
                <Input
                  label="Email Address *"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="client@example.com"
                  leftIcon={<Mail className="h-4 w-4 text-muted-foreground" />}
                  required
                  disabled={isSubmitting}
                  className="bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                />
              </div>

              <div>
                <Input
                  label="Company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Acme Inc."
                  leftIcon={<Building className="h-4 w-4 text-muted-foreground" />}
                  disabled={isSubmitting}
                  className="bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                />
              </div>

              <div>
                <Input
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  leftIcon={<Phone className="h-4 w-4 text-muted-foreground" />}
                  disabled={isSubmitting}
                  className="bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Input
                  label="Website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  leftIcon={<Globe className="h-4 w-4 text-muted-foreground" />}
                  disabled={isSubmitting}
                  className="bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                />
              </div>

              <div>
                <Input
                  label="Tax ID / VAT"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
                  placeholder="GB123456789"
                  leftIcon={<FileText className="h-4 w-4 text-muted-foreground" />}
                  disabled={isSubmitting}
                  className="bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                />
              </div>

              <div>
                <Textarea
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main St, City, State, ZIP"
                  rows={3}
                  disabled={isSubmitting}
                  className="bg-background/50 border-border/50 focus:border-primary/50 transition-all min-h-[80px]"
                />
              </div>
            </div>
          </div>

          <div>
            <Textarea
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes about this client..."
              rows={4}
              disabled={isSubmitting}
              className="bg-background/50 border-border/50 focus:border-primary/50 transition-all min-h-[100px]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/30">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {submitLabel}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default ClientForm