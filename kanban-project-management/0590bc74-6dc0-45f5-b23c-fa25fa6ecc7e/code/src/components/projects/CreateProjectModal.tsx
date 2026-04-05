'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { toast } from '@/components/ui/Toast'
import { User, UserRole } from '@/lib/types'
import { Users, X, Plus, Check } from 'lucide-react'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onProjectCreated?: (projectId: string) => void
}

export function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue',
    visibility: 'private' as 'private' | 'public',
  })
  const [teamMembers, setTeamMembers] = useState<Array<{ email: string; role: UserRole }>>([])
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('member')

  const colors = [
    { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
    { value: 'green', label: 'Green', class: 'bg-green-500' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
    { value: 'red', label: 'Red', class: 'bg-red-500' },
    { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Project name is required')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          teamMembers,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      const data = await response.json()
      
      toast.success('Project created successfully!')
      onClose()
      
      if (onProjectCreated) {
        onProjectCreated(data.project.id)
      } else {
        router.push(`/projects`)
        router.refresh()
      }
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Failed to create project. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const addTeamMember = () => {
    if (!newMemberEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newMemberEmail)) {
      toast.error('Please enter a valid email address')
      return
    }

    if (teamMembers.some(member => member.email === newMemberEmail)) {
      toast.error('This email is already added to the team')
      return
    }

    setTeamMembers([...teamMembers, { email: newMemberEmail, role: newMemberRole }])
    setNewMemberEmail('')
    setNewMemberRole('member')
  }

  const removeTeamMember = (email: string) => {
    setTeamMembers(teamMembers.filter(member => member.email !== email))
  }

  const updateTeamMemberRole = (email: string, role: UserRole) => {
    setTeamMembers(teamMembers.map(member => 
      member.email === email ? { ...member, role } : member
    ))
  }

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Create New Project</h2>
              <p className="text-muted-foreground mt-1">
                Set up your project details and team members
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label required>Project Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter project name"
                  className="mt-2"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your project..."
                  className="mt-2 min-h-[100px]"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label>Project Color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={cn(
                        'w-8 h-8 rounded-full border-2 transition-all',
                        color.class,
                        formData.color === color.value
                          ? 'border-foreground ring-2 ring-offset-2 ring-primary'
                          : 'border-transparent hover:scale-110'
                      )}
                      aria-label={`Select ${color.label} color`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value: 'private' | 'public') => 
                    setFormData({ ...formData, visibility: value })
                  }
                  className="mt-2"
                  disabled={isLoading}
                >
                  <option value="private">Private - Only team members can access</option>
                  <option value="public">Public - Anyone with the link can view</option>
                </Select>
              </div>

              <div>
                <Label>Add Team Members</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="team@example.com"
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Select
                    value={newMemberRole}
                    onValueChange={(value: UserRole) => setNewMemberRole(value)}
                    className="w-32"
                    disabled={isLoading}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </Select>
                  <Button
                    type="button"
                    onClick={addTeamMember}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Team Members ({teamMembers.length})</Label>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                  {teamMembers.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No team members added yet</p>
                    </div>
                  ) : (
                    teamMembers.map((member) => (
                      <div
                        key={member.email}
                        className="flex items-center justify-between p-3 bg-card rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            fallback={member.email[0].toUpperCase()}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium">{member.email}</p>
                            <Badge variant="outline" className="mt-1">
                              {member.role}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={member.role}
                            onValueChange={(value: UserRole) => 
                              updateTeamMemberRole(member.email, value)
                            }
                            className="w-24"
                            disabled={isLoading}
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTeamMember(member.email)}
                            disabled={isLoading}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}