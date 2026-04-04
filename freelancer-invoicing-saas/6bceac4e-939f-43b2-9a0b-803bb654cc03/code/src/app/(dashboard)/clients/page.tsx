import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { store } from '@/lib/store'
import PageHeader from '@/components/layout/PageHeader'
import ClientCard from '@/components/clients/ClientCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent } from '@/components/ui/Card'
import { Plus, Search, Filter, Users, Download, Mail, Building } from 'lucide-react'

export const metadata = {
  title: 'Clients - InvoiceFlow',
  description: 'Manage your clients and their information',
}

export default async function ClientsPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Get clients for the current user
  const clients = await store.getClientsByUserId(session.userId)
  
  // Get invoices to calculate stats
  const invoices = await store.getInvoicesByUserId(session.userId)
  
  // Calculate client statistics
  const clientStats = clients.map(client => {
    const clientInvoices = invoices.filter(inv => inv.clientId === client.id)
    const paidInvoices = clientInvoices.filter(inv => inv.status === 'paid')
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0)
    
    return {
      clientId: client.id,
      invoiceCount: clientInvoices.length,
      totalRevenue
    }
  })

  // Get active clients count
  const activeClients = clients.filter(client => client.status === 'active').length

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Clients"
        description="Manage your clients and their information"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Clients', href: '/clients' }
        ]}
      >
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Link href="/clients/new">
            <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl">
              <Plus className="h-4 w-4" />
              Add Client
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <h3 className="text-3xl font-bold mt-2">{clients.length}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                <h3 className="text-3xl font-bold mt-2">{activeClients}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Building className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                <h3 className="text-3xl font-bold mt-2">{invoices.length}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Mail className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search clients by name, email, or company..."
                leftIcon={<Search className="h-4 w-4" />}
                className="bg-background/50"
              />
            </div>
            <div className="flex gap-3">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
                defaultValue="all"
                className="w-40"
              />
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Grid */}
      {clients.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="mx-auto max-w-md">
              <div className="h-20 w-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No clients yet</h3>
              <p className="text-muted-foreground mb-6">
                Add your first client to start creating invoices and tracking payments.
              </p>
              <Link href="/clients/new">
                <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  <Plus className="h-4 w-4" />
                  Add Your First Client
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map(client => {
            const stats = clientStats.find(s => s.clientId === client.id)
            return (
              <ClientCard
                key={client.id}
                client={client}
                invoiceCount={stats?.invoiceCount || 0}
                totalRevenue={stats?.totalRevenue || 0}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}