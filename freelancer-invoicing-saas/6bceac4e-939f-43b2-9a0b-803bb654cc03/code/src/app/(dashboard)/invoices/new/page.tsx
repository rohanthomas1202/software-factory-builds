```typescript
import React from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { store } from '@/lib/store'
import PageHeader from '@/components/layout/PageHeader'
import InvoiceForm from '@/components/invoices/InvoiceForm'

export const metadata = {
  title: 'Create Invoice - InvoiceFlow',
  description: 'Create a new invoice for your client',
}

export default async function NewInvoicePage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Fetch user data for default values
  const user = await store.getUser(session.userId)
  if (!user) {
    redirect('/login')
  }

  // Fetch clients for the dropdown
  const clients = await store.getClients(session.userId)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Invoice"
        description="Create a new invoice for your client"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Invoices', href: '/invoices' },
          { label: 'Create Invoice', href: '/invoices/new' }
        ]}
      />

      <InvoiceForm 
        user={user}
        clients={clients}
        mode="create"
      />
    </div>
  )
}
```