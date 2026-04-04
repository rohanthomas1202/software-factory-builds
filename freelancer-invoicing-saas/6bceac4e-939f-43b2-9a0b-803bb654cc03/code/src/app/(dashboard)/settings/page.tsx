```typescript
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  Save, 
  Upload, 
  Eye, 
  EyeOff, 
  Globe, 
  Building, 
  User, 
  Phone, 
  Link, 
  FileText,
  Shield,
  Bell,
  CreditCard,
  Download,
  Mail,
  MapPin,
  Lock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { currencies } from '@/lib/currencies'
import { timezones } from '@/lib/timezones'
import PageHeader from '@/components/layout/PageHeader'

// Form validation schemas
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  businessName: z.string().min(1, 'Business name is required'),
  phone: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  taxId: z.string().optional(),
  avatarUrl: z.string().optional(),
})

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
})

const preferencesSchema = z.object({
  currency: z.string().min(1, 'Currency is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  dateFormat: z.string().min(1, 'Date format is required'),
  language: z.string().min(1, 'Language is required'),
})

const securitySchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false
  }
  return true
}, {
  message: 'Current password is required to set a new password',
  path: ['currentPassword'],
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false
  }
  return true
}, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type ProfileFormData = z.infer<typeof profileSchema>
type AddressFormData = z.infer<typeof addressSchema>
type PreferencesFormData = z.infer<typeof preferencesSchema>
type SecurityFormData = z.infer<typeof securitySchema>

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [userData, setUserData] = useState<any>(null)

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      businessName: '',
      phone: '',
      website: '',
      taxId: '',
      avatarUrl: '',
    }
  })

  // Address form
  const addressForm = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    }
  })

  // Preferences form
  const preferencesForm = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      currency: 'USD',
      timezone: 'America/New_York',
      dateFormat: 'MM/dd/yyyy',
      language: 'en',
    }
  })

  // Security form
  const securityForm = useForm<SecurityFormData>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  })

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
        
        // Set form values
        profileForm.reset({
          name: data.name || '',
          email: data.email || '',
          businessName: data.businessName || '',
          phone: data.phone || '',
          website: data.website || '',
          taxId: data.taxId || '',
          avatarUrl: data.avatarUrl || '',
        })

        addressForm.reset({
          street: data.address?.street || '',
          city: data.address?.city || '',
          state: data.address?.state || '',
          postalCode: data.address?.postalCode || '',
          country: data.address?.country || '',
        })

        preferencesForm.reset({
          currency: data.currency || 'USD',
          timezone: data.timezone || 'America/New_York',
          dateFormat: data.dateFormat || 'MM/dd/yyyy',
          language: data.language || 'en',
        })
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      setMessage({ type: 'error', text: 'Failed to load user data' })
    }
  }

  const handleProfileSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          address: addressForm.getValues(),
          currency: preferencesForm.getValues().currency,
          timezone: preferencesForm.getValues().timezone,
          dateFormat: preferencesForm.getValues().dateFormat,
          language: preferencesForm.getValues().language,
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully' })
        fetchUserData() // Refresh data
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to update profile' })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreferencesSubmit = async (data: PreferencesFormData) => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Preferences updated successfully' })
        fetchUserData() // Refresh data
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to update preferences' })
      }
    } catch (error) {
      console.error('Error updating preferences:', error)
      setMessage({ type: 'error', text: 'Failed to update preferences' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSecuritySubmit = async (data: SecurityFormData) => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password updated successfully' })
        securityForm.reset({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to update password' })
      }
    } catch (error) {
      console.error('Error updating password:', error)
      setMessage({ type: 'error', text: 'Failed to update password' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/export/data')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoiceflow-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      setMessage({ type: 'error', text: 'Failed to export data' })
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/settings/account', {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/login')
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to delete account' })
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      setMessage({ type: 'error', text: 'Failed to delete account' })
    }
  }

  // Currency options
  const currencyOptions = currencies.map(currency => ({
    value: currency.code,
    label: `${currency.code} - ${currency.name} (${currency.symbol})`,
  }))

  // Timezone options
  const timezoneOptions = timezones.map(tz => ({
    value: tz.value,
    label: `${tz.label} (${tz.offset})`,
  }))

  // Date format options
  const dateFormatOptions = [
    { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY' },
    { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY' },
    { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD' },
    { value: 'MMMM dd, yyyy', label: 'Month DD, YYYY' },
  ]

  // Language options
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'ja', label: 'Japanese' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings', href: '/settings' },
        ]}
      />

      {message && (
        <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-4 lg:grid-cols-6">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Globe className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <FileText className="h-4 w-4 mr-2" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal and business information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Input
                      label="Full Name"
                      placeholder="John Doe"
                      leftIcon={<User className="h-4 w-4" />}
                      {...profileForm.register('name')}
                      error={profileForm.formState.errors.name?.message}
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="john@example.com"
                      leftIcon={<Mail className="h-4 w-4" />}
                      {...profileForm.register('email')}
                      error={profileForm.formState.errors.email?.message}
                    />
                    <Input
                      label="Business Name"
                      placeholder="John Doe Consulting"
                      leftIcon={<Building className="h-4 w-4" />}
                      {...profileForm.register('businessName')}
                      error={profileForm.formState.errors.businessName?.message}
                    />
                    <Input
                      label="Phone Number"
                      placeholder="+1 (555) 123-4567"
                      leftIcon={<Phone className="h-4 w-4" />}
                      {...profileForm.register('phone')}
                      error={profileForm.formState.errors.phone?.message}
                    />
                  </div>
                  <div className="space-y-4">
                    <Input
                      label="Website"
                      placeholder="https://example.com"
                      leftIcon={<Link className="h-4 w-4" />}
                      {...profileForm.register('website')}
                      error={profileForm.formState.errors.website?.message}
                    />
                    <Input
                      label="Tax ID / VAT Number"
                      placeholder="US-123456789"
                      leftIcon={<FileText className="h-4 w-4" />}
                      {...profileForm.register('taxId')}
                      error={profileForm.formState.errors.taxId?.message}
                    />
                    <Input
                      label="Avatar URL"
                      placeholder="https://example.com/avatar.jpg"
                      leftIcon={<Upload className="h-4 w-4" />}
                      {...profileForm.register('avatarUrl')}
                      error={profileForm.formState.errors.avatarUrl?.message}
                      helperText="Enter a URL to your profile picture"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Business Address
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Street Address"
                      placeholder="123 Main St"
                      {...addressForm.register('street')}
                      error={addressForm.formState.errors.street?.message}
                    />
                    <Input
                      label="City"
                      placeholder="New York"
                      {...addressForm.register('city')}
                      error={addressForm.formState.errors.city?.message}
                    />
                    <Input
                      label="State / Province"
                      placeholder="NY"
                      {...addressForm.register('state')}
                      error={addressForm.formState.errors.state?.message}
                    />
                    <Input
                      label="Postal Code"
                      placeholder="10001"
                      {...addressForm.register('postalCode')}
                      error={addressForm.formState.errors.postalCode?.message}
                    />
                    <Input
                      label="Country"
                      placeholder="United States"
                      {...addressForm.register('country')}
                      error={addressForm.formState.errors.country?.message}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your invoicing experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={preferencesForm.handleSubmit(handlePreferencesSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="Default Currency"
                    options={currencyOptions}
                    value={preferencesForm.watch('currency')}
                    onChange={(value) => preferencesForm.setValue('currency', value)}
                    error={preferencesForm.formState.errors.currency?.message}
                    leftIcon={<CreditCard className="h-4 w-4" />}
                  />
                  <Select
                    label="Timezone"
                    options={timezoneOptions}
                    value={preferencesForm.watch('timezone')}
                    onChange={(value) => preferencesForm.setValue('timezone', value)}
                    error={preferencesForm.formState.errors.timezone?.message}
                    leftIcon={<Globe className="h-4 w-4" />}
                  />
                  <Select
                    label="Date Format"
                    options={dateFormatOptions}
                    value={preferencesForm.watch('dateFormat')}
                    onChange={(value) => preferencesForm.setValue('dateFormat', value)}
                    error={preferencesForm.formState.errors.dateFormat?.message}
                  />
                  <Select
                    label="Language"
                    options={languageOptions}
                    value={preferencesForm.watch('language')}
                    onChange={(value) => preferencesForm.setValue('language', value)}
                    error={preferencesForm.formState.errors.language?.message}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={securityForm.handleSubmit(handleSecuritySubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      label="Current Password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Enter current password"
                      leftIcon={<Lock className="h-4 w-4" />}
                      {...securityForm.register('currentPassword')}
                      error={securityForm.formState.errors.currentPassword?.message}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      label="New Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      leftIcon={<Lock className="h-4 w-4" />}
                      {...securityForm.register('newPassword')}
                      error={securityForm.formState.errors.newPassword?.message}
                      helperText="Password must be at least 8 characters"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="Confirm new password"
                    leftIcon={<Lock className="h-4 w-4" />}
                    {...securityForm.register('confirmPassword')}
                    error={securityForm.formState.errors.confirmPassword?.message}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Data management and account actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Download all your data including invoices, clients, and expenses in JSON format.
                  </p>
                  <Button variant="outline" onClick={handleExportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export All Data
                  </Button>
                </div>

                <div className="border rounded-lg p-4 border-red-200 dark:border-red-800">
                  <h3 className="font-semibold mb-2 text-red-600 dark:text-red-400">
                    Danger Zone
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    className="w-full sm:w-auto"
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```