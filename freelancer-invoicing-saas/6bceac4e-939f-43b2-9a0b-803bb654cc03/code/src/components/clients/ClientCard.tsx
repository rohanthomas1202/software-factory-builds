'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog'
import { Client } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  FileText, 
  Mail, 
  Phone, 
  Building, 
  Globe, 
  User,
  ExternalLink,
  Calendar,
  DollarSign
} from 'lucide-react'

interface ClientCardProps {
  client: Client
  onDelete?: (clientId: string) => Promise<void>
  showActions?: boolean
  invoiceCount?: number
  totalRevenue?: number
}

const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onDelete,
  showActions = true,
  invoiceCount = 0,
  totalRevenue = 0
}) => {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleEdit = () => {
    router.push(`/clients/${client.id}`)
  }

  const handleCreateInvoice = () => {
    router.push(`/invoices/new?clientId=${client.id}`)
  }

  const handleDelete = async () => {
    if (!onDelete) return

    setIsLoading(true)
    try {
      await onDelete(client.id)
    } catch (error) {
      console.error('Error deleting client:', error)
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
    }
  }

  const getStatusColor = (status: Client['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
      case 'inactive':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20'
      default:
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
    }
  }

  return (
    <>
      <Card className="group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30 bg-gradient-to-br from-card to-card/80 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500" />
        
        <CardHeader className="relative pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-lg">
                <AvatarImage src={client.avatarUrl} alt={client.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                  <Link href={`/clients/${client.id}`} className="hover:underline">
                    {client.name}
                  </Link>
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {client.email}
                </CardDescription>
              </div>
            </div>
            
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Client
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCreateInvoice} className="cursor-pointer">
                    <FileText className="h-4 w-4 mr-2" />
                    Create Invoice
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Client
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={getStatusColor(client.status)}>
              {client.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
            {client.company && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
                <Building className="h-3 w-3 mr-1" />
                {client.company}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <div className="space-y-3">
            {client.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{client.phone}</span>
              </div>
            )}

            {client.website && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
                <a
                  href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors hover:underline"
                >
                  {client.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}

            {client.address && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 mt-0.5" />
                <span className="line-clamp-2">{client.address}</span>
              </div>
            )}

            {client.notes && (
              <div className="pt-2 border-t border-border/30">
                <p className="text-sm text-muted-foreground line-clamp-2">{client.notes}</p>
              </div>
            )}

            {(invoiceCount > 0 || totalRevenue > 0) && (
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{invoiceCount}</div>
                  <div className="text-xs text-muted-foreground">Invoices</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(totalRevenue, 'USD')}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Revenue</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-3 border-t border-border/30">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="gap-1"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleCreateInvoice}
              className="gap-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <FileText className="h-3.5 w-3.5" />
              Invoice
            </Button>
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {client.name}? This action cannot be undone.
              {invoiceCount > 0 && (
                <div className="mt-2 p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm font-medium text-destructive">
                    ⚠️ This client has {invoiceCount} invoice{invoiceCount !== 1 ? 's' : ''}. 
                    Deleting them will not delete the invoices, but they will no longer be associated with a client.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Deleting...' : 'Delete Client'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default ClientCard