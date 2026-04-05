'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import {
  Folder,
  FolderOpen,
  ChevronRight,
  Plus,
  Users,
  Calendar,
  Flag,
  Star,
  CheckSquare,
  Clock,
  AlertCircle,
  TrendingUp,
  Settings,
  HelpCircle,
  FileText,
  Grid,
  LayoutDashboard,
  PieChart,
} from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import { Project } from '@/lib/types'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { projects, isLoading } = useProjects()
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState(false)

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  const recentProjects = projects.slice(0, 3)
  const favoriteProjects = projects.filter(p => p.isFavorite).slice(0, 3)

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard',
    },
    {
      title: 'Projects',
      href: '/projects',
      icon: Folder,
      active: pathname.startsWith('/projects'),
      badge: projects.length,
    },
    {
      title: 'Boards',
      href: '/boards',
      icon: Grid,
      active: pathname.startsWith('/board'),
    },
    {
      title: 'Analytics',
      href: '/analytics',
      icon: PieChart,
      active: pathname === '/analytics',
    },
    {
      title: 'Team',
      href: '/team',
      icon: Users,
      active: pathname.startsWith('/team'),
    },
    {
      title: 'Calendar',
      href: '/calendar',
      icon: Calendar,
      active: pathname === '/calendar',
    },
  ]

  const quickActions = [
    {
      title: 'My Tasks',
      href: '/tasks/me',
      icon: CheckSquare,
      count: 12,
    },
    {
      title: 'Overdue',
      href: '/tasks/overdue',
      icon: Clock,
      count: 3,
      variant: 'danger' as const,
    },
    {
      title: 'High Priority',
      href: '/tasks/priority/high',
      icon: Flag,
      count: 5,
      variant: 'warning' as const,
    },
    {
      title: 'Starred',
      href: '/tasks/starred',
      icon: Star,
      count: 8,
    },
  ]

  if (collapsed) {
    return (
      <aside className={cn('sticky top-16 h-[calc(100vh-4rem)] w-16 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900', className)}>
        <div className="flex h-full flex-col py-4">
          <div className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'mx-2 flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                  item.active
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                )}
                title={item.title}
              >
                <item.icon className="h-5 w-5" />
              </Link>
            ))}
          </div>
          <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-800">
            <Button
              variant="ghost"
              size="icon"
              className="mx-2"
              onClick={() => setCollapsed(false)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className={cn('sticky top-16 h-[calc(100vh-4rem)] w-64 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900', className)}>
      <div className="flex h-full flex-col">
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  item.active
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                )}
              >
                <div className="flex items-center">
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.title}
                </div>
                {item.badge !== undefined && (
                  <Badge variant="secondary" className="ml-2">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Quick Actions
            </h3>
            <div className="space-y-1">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center">
                    <action.icon className="mr-3 h-5 w-5" />
                    {action.title}
                  </div>
                  {action.count > 0 && (
                    <Badge
                      variant={action.variant || 'secondary'}
                      className={cn(
                        'ml-2',
                        action.variant === 'danger' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                        action.variant === 'warning' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      )}
                    >
                      {action.count}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Projects */}
          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between px-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Recent Projects
              </h3>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/projects/new">
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="space-y-1">
              {isLoading ? (
                <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
              ) : recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    isExpanded={expandedProjects.has(project.id)}
                    onToggle={() => toggleProject(project.id)}
                  />
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">No projects yet</div>
              )}
            </div>
          </div>

          {/* Favorite Projects */}
          {favoriteProjects.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Favorites
              </h3>
              <div className="space-y-1">
                {favoriteProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Star className="mr-3 h-5 w-5 text-yellow-500" />
                    <span className="truncate">{project.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Collapse button */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setCollapsed(true)}
          >
            <ChevronRight className="mr-2 h-4 w-4" />
            Collapse sidebar
          </Button>
        </div>
      </div>
    </aside>
  )
}

function ProjectItem({
  project,
  isExpanded,
  onToggle,
}: {
  project: Project
  isExpanded: boolean
  onToggle: () => void
}) {
  const pathname = usePathname()
  const isActive = pathname === `/projects/${project.id}`

  return (
    <div>
      <div
        className={cn(
          'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
          isActive
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
        )}
      >
        <Link
          href={`/projects/${project.id}`}
          className="flex flex-1 items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {isExpanded ? (
            <FolderOpen className="mr-3 h-5 w-5" />
          ) : (
            <Folder className="mr-3 h-5 w-5" />
          )}
          <span className="truncate">{project.name}</span>
        </Link>
        <button
          onClick={onToggle}
          className="ml-2 rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <ChevronRight
            className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')}
          />
        </button>
      </div>
      {isExpanded && project.boards && project.boards.length > 0 && (
        <div className="ml-8 mt-1 space-y-1">
          {project.boards.map((board) => (
            <Link
              key={board.id}
              href={`/board/${board.id}`}
              className="flex items-center rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div className="mr-2 h-2 w-2 rounded-full bg-blue-500" />
              <span className="truncate">{board.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}