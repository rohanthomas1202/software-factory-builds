```typescript
import React from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import PageHeader from '@/components/layout/PageHeader'
import ClientForm from '@/components/clients/ClientForm'

export const metadata = {
  title: 'Add New Client - InvoiceFlow',
  description: 'Add a new client to your invoicing system',
}

export default async function NewClientPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add New Client"
        description="Enter client details to start creating invoices"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Clients', href: '/clients' },
          { label: 'Add New', href: '/clients/new' },
        ]}
      />

      <ClientForm />
    </div>
  )
}
```