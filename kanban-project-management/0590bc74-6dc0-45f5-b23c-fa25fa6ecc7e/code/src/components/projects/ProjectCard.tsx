'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown } from '@/components/ui/Dropdown'
import { Project } from '@/lib/types'
import { 
  Folder, 
  Users, 
  Calendar, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Settings,
  ArrowUpRight,
  Clock,
  CheckCircle
} from 'lucide-react'

interface ProjectCardProps {
  project: Project
  onEdit?: (project: Project) => void
  onDelete?: (projectId: string) => void
  className?: string
}

export function ProjectCard({ project, onEdit, onDelete, className }: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500'
    if (progress >= 50) return 'bg-blue-500'
    if (progress >= 25) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleDelete = async () => {
    if (!onDelete) return
    
    setIsDeleting(true)
    try {
      await onDelete(project.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className={cn(
      'group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-lg hover:border-primary/20 dark:hover:border-primary/30',
      'hover:scale-[1.02]',
      className
    )}>
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl overflow-hidden">
        <div 
          className={cn('h-full transition-all duration-500', getProgressColor(project.progress))}
          style={{ width: `${project.progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Folder className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {project.description}
            </p>
          </div>
        </div>

        <Dropdown
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          }
          align="end"
        >
          <Dropdown.Item onClick={() => onEdit?.(project)}>
            <Edit className="h-4 w-4" />
            Edit Project
          </Dropdown.Item>
          <Dropdown.Item onClick={() => window.open(`/board/${project.defaultBoardId}`, '_blank')}>
            <ArrowUpRight className="h-4 w-4" />
            Open Board
          </Dropdown.Item>
          <Dropdown.Item onClick={() => {/* Navigate to settings */}}>
            <Settings className="h-4 w-4" />
            Settings
          </Dropdown.Item>
          <Dropdown.Separator />
          <Dropdown.Item 
            onClick={handleDelete}
            className="text-red-600 dark:text-red-400"
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Deleting...' : 'Delete Project'}
          </Dropdown.Item>
        </Dropdown>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {project.totalTasks}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Tasks</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {project.completedTasks}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {project.teamMembers}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Members</div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-300">Progress</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {project.progress}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={cn('h-full transition-all duration-500', getProgressColor(project.progress))}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Avatar
            src={project.ownerAvatar}
            fallback={project.ownerName.charAt(0)}
            size="sm"
          />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {project.ownerName}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            {formatDate(project.updatedAt)}
          </div>
          
          <Link href={`/board/${project.defaultBoardId}`}>
            <Button size="sm" variant="outline" className="gap-2">
              Open Board
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}