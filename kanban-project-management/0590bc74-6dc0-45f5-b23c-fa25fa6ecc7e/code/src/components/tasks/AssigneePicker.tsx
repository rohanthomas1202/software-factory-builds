'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { User } from '@/lib/types'
import { Search, Check, X, User as UserIcon, Users } from 'lucide-react'

interface AssigneePickerProps {
  value: string | null
  onChange: (userId: string | null) => void
  projectId?: string
  className?: string
  disabled?: boolean
}

export function AssigneePicker({ 
  value, 
  onChange, 
  projectId, 
  className, 
  disabled 
}: AssigneePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        const url = projectId ? `/api/team?projectId=${projectId}` : '/api/team'
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
          
          if (value) {
            const user = data.users.find((u: User) => u.id === value)
            setSelectedUser(user || null)
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [projectId, value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (user: User) => {
    if (value === user.id) {
      onChange(null)
      setSelectedUser(null)
    } else {
      onChange(user.id)
      setSelectedUser(user)
    }
    setIsOpen(false)
    setSearch('')
  }

  const handleClear = () => {
    onChange(null)
    setSelectedUser(null)
    setIsOpen(false)
  }

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        className={cn(
          'w-full justify-start gap-2',
          !selectedUser && 'text-muted-foreground'
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        {selectedUser ? (
          <>
            <Avatar
              src={selectedUser.avatar}
              fallback={selectedUser.name[0]}
              size="sm"
            />
            <span className="truncate">{selectedUser.name}</span>
          </>
        ) : (
          <>
            <UserIcon className="h-4 w-4" />
            <span>Assign to...</span>
          </>
        )}
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search team members..."
                className="pl-9"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-1">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Spinner size="sm" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No team members found</p>
              </div>
            ) : (
              <>
                <div className="p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={handleClear}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border">
                      <X className="h-3 w-3" />
                    </div>
                    <span>Unassign</span>
                  </Button>
                </div>
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent',
                      value === user.id && 'bg-accent'
                    )}
                    onClick={() => handleSelect(user)}
                  >
                    <Avatar
                      src={user.avatar}
                      fallback={user.name[0]}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    {value === user.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}