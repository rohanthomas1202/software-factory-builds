'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Dropdown } from '@/components/ui/Dropdown'
import { toast } from '@/components/ui/Toast'
import { User, UserRole } from '@/lib/types'
import { 
  Users, 
  Mail, 
  MoreVertical, 
  UserPlus, 
  Shield, 
  Eye, 
  UserMinus,
  Crown,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Settings
} from 'lucide-react'

interface TeamMemberListProps {
  projectId: string
  currentUser: User
  onInviteClick?: () => void
  className?: string
}

interface TeamMemberWithRole extends User {
  projectRole: UserRole
  isOwner: boolean
}

export function TeamMemberList({ 
  projectId, 
  currentUser, 
  onInviteClick,
  className 
}: TeamMemberListProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)

  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/team?projectId=${projectId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch team members')
      }

      const members: TeamMemberWithRole[] = data.data.teamMembers.map((user: User) => ({
        ...user,
        projectRole: store.getUserProjectRole(user.id, projectId) || 'member',
        isOwner: user.id === data.data.project.ownerId
      }))

      // Sort: owner first, then admins, then members, then viewers
      members.sort((a, b) => {
        if (a.isOwner) return -1
        if (b.isOwner) return 1
        if (a.projectRole === 'admin' && b.projectRole !== 'admin') return -1
        if (b.projectRole === 'admin' && a.projectRole !== 'admin') return 1
        if (a.projectRole === 'member' && b.projectRole === 'viewer') return -1
        if (b.projectRole === 'member' && a.projectRole === 'viewer') return 1
        return a.name.localeCompare(b.name)
      })

      setTeamMembers(members)
    } catch (err) {
      console.error('Error fetching team members:', err)
      setError(err instanceof Error ? err.message : 'Failed to load team members')
      toast.error('Failed to load team members', {
        description: 'Please try again later'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchTeamMembers()
    }
  }, [projectId])

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return
    }

    try {
      setRemovingUserId(userId)
      
      const response = await fetch(`/api/team?projectId=${projectId}&userId=${userId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove team member')
      }

      toast.success('Team member removed', {
        description: 'The team member has been removed from the project'
      })

      // Refresh the list
      await fetchTeamMembers()
    } catch (err) {
      console.error('Error removing team member:', err)
      toast.error('Failed to remove team member', {
        description: err instanceof Error ? err.message : 'Please try again later'
      })
    } finally {
      setRemovingUserId(null)
    }
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      // In a real app, you would have an API endpoint for updating roles
      // For now, we'll simulate it
      toast.info('Role update feature coming soon', {
        description: 'Role management will be available in the next update'
      })
    } catch (err) {
      console.error('Error updating role:', err)
      toast.error('Failed to update role', {
        description: 'Please try again later'
      })
    }
  }

  const getRoleBadgeVariant = (role: UserRole, isOwner: boolean) => {
    if (isOwner) return 'primary'
    switch (role) {
      case 'admin': return 'warning'
      case 'member': return 'success'
      case 'viewer': return 'secondary'
      default: return 'default'
    }
  }

  const getRoleIcon = (role: UserRole, isOwner: boolean) => {
    if (isOwner) return <Crown className="h-3 w-3" />
    switch (role) {
      case 'admin': return <Shield className="h-3 w-3" />
      case 'member': return <CheckCircle className="h-3 w-3" />
      case 'viewer': return <Eye className="h-3 w-3" />
      default: return null
    }
  }

  const getRoleLabel = (role: UserRole, isOwner: boolean) => {
    if (isOwner) return 'Owner'
    switch (role) {
      case 'admin': return 'Admin'
      case 'member': return 'Member'
      case 'viewer': return 'Viewer'
      default: return role
    }
  }

  // Check if current user can manage team members
  const canManageTeam = teamMembers.some(
    member => member.id === currentUser.id && (member.isOwner || member.projectRole === 'admin')
  )

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('p-8 text-center', className)}>
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Failed to load team members
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <Button variant="outline" onClick={fetchTeamMembers}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Team Members
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} in this project
          </p>
        </div>
        
        {canManageTeam && onInviteClick && (
          <Button onClick={onInviteClick} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {teamMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar
                src={member.avatar}
                fallback={member.name.charAt(0)}
                size="lg"
                status="online"
              />
              
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {member.name}
                  </h4>
                  {member.id === currentUser.id && (
                    <Badge variant="outline" size="sm">
                      You
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-3 w-3 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {member.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge
                variant={getRoleBadgeVariant(member.projectRole, member.isOwner)}
                className="gap-1.5"
              >
                {getRoleIcon(member.projectRole, member.isOwner)}
                {getRoleLabel(member.projectRole, member.isOwner)}
              </Badge>

              {canManageTeam && member.id !== currentUser.id && !member.isOwner && (
                <Dropdown
                  trigger={
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  }
                  align="end"
                >
                  <Dropdown.Item
                    onClick={() => handleRoleChange(member.id, 'admin')}
                    icon={<Shield className="h-4 w-4" />}
                    disabled={member.projectRole === 'admin'}
                  >
                    Make Admin
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => handleRoleChange(member.id, 'member')}
                    icon={<CheckCircle className="h-4 w-4" />}
                    disabled={member.projectRole === 'member'}
                  >
                    Make Member
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => handleRoleChange(member.id, 'viewer')}
                    icon={<Eye className="h-4 w-4" />}
                    disabled={member.projectRole === 'viewer'}
                  >
                    Make Viewer
                  </Dropdown.Item>
                  <Dropdown.Separator />
                  <Dropdown.Item
                    onClick={() => handleRemoveMember(member.id)}
                    icon={<UserMinus className="h-4 w-4" />}
                    variant="danger"
                    disabled={removingUserId === member.id}
                  >
                    {removingUserId === member.id ? 'Removing...' : 'Remove from Team'}
                  </Dropdown.Item>
                </Dropdown>
              )}
            </div>
          </div>
        ))}
      </div>

      {teamMembers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No team members yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Invite team members to collaborate on this project
          </p>
          {canManageTeam && onInviteClick && (
            <Button onClick={onInviteClick} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Your First Member
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Helper function to get user's role in a project (from store)
function store() {
  return {
    getUserProjectRole: (userId: string, projectId: string): UserRole | null => {
      // This would come from your actual store
      // For now, return a mock value
      return 'member'
    }
  }
}