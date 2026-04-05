'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Dropdown } from '@/components/ui/Dropdown'
import { Spinner } from '@/components/ui/Spinner'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { CreateProjectModal } from '@/components/projects/CreateProjectModal'
import { useProjects } from '@/hooks/useProjects'
import { useAuth } from '@/hooks/useAuth'
import { Project } from '@/lib/types'
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Calendar,
  TrendingUp,
  Users,
  MoreVertical,
  Download,
  Share2,
  Star,
  StarOff,
  Archive,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react'

export default function ProjectsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { projects, isLoading: projectsLoading, error } = useProjects()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'created' | 'progress'>('updated')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'archived'>('all')
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && !project.completed && !project.archived) ||
                           (filterStatus === 'completed' && project.completed) ||
                           (filterStatus === 'archived' && project.archived)
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'progress':
          return (b.progress || 0) - (a.progress || 0)
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })

  // Calculate stats
  const stats = {
    total: projects.length,
    active: projects.filter(p => !p.completed && !p.archived).length,
    completed: projects.filter(p => p.completed).length,
    archived: projects.filter(p => p.archived).length,
    starred: projects.filter(p => p.starred).length
  }

  // Handle project selection
  const toggleProjectSelection = (projectId: string) => {
    const newSelected = new Set(selectedProjects)
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId)
    } else {
      newSelected.add(projectId)
    }
    setSelectedProjects(newSelected)
  }

  // Handle bulk actions
  const handleBulkAction = (action: 'star' | 'archive' | 'delete') => {
    // In a real app, this would make API calls
    console.log(`Bulk ${action} for projects:`, Array.from(selectedProjects))
    setSelectedProjects(new Set())
  }

  if (authLoading || projectsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Projects"
        description="Manage all your projects in one place. Create new projects, track progress, and collaborate with your team."
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <FolderKanban className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold mt-1">{stats.active}</p>
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold mt-1">{stats.completed}</p>
            </div>
            <CheckCircle className="h-5 w-5 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Starred</p>
              <p className="text-2xl font-bold mt-1">{stats.starred}</p>
            </div>
            <Star className="h-5 w-5 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Team</p>
              <p className="text-2xl font-bold mt-1">
                {projects.reduce((acc, p) => acc + (p.memberCount || 0), 0)}
              </p>
            </div>
            <Users className="h-5 w-5 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedProjects.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {selectedProjects.size} project{selectedProjects.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('star')}
                  className="text-blue-700 dark:text-blue-300"
                >
                  <Star className="h-4 w-4 mr-1" />
                  Star
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('archive')}
                  className="text-blue-700 dark:text-blue-300"
                >
                  <Archive className="h-4 w-4 mr-1" />
                  Archive
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedProjects(new Set())}
              className="text-blue-700 dark:text-blue-300"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Controls Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters and Controls */}
          <div className="flex items-center gap-3">
            {/* View Mode */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Status Filter */}
            <Dropdown
              trigger={
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Status: {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                </Button>
              }
            >
              <Dropdown.Item onClick={() => setFilterStatus('all')}>
                All Projects
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setFilterStatus('active')}>
                Active
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setFilterStatus('completed')}>
                Completed
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setFilterStatus('archived')}>
                Archived
              </Dropdown.Item>
            </Dropdown>

            {/* Sort By */}
            <Dropdown
              trigger={
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                </Button>
              }
            >
              <Dropdown.Item onClick={() => setSortBy('name')}>
                Name
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setSortBy('updated')}>
                Last Updated
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setSortBy('created')}>
                Date Created
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setSortBy('progress')}>
                Progress
              </Dropdown.Item>
            </Dropdown>

            {/* More Actions */}
            <Dropdown
              trigger={
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              }
            >
              <Dropdown.Item>
                <Download className="h-4 w-4 mr-2" />
                Export Projects
              </Dropdown.Item>
              <Dropdown.Item>
                <Share2 className="h-4 w-4 mr-2" />
                Share View
              </Dropdown.Item>
              <Dropdown.Separator />
              <Dropdown.Item>
                <Eye className="h-4 w-4 mr-2" />
                Show Archived
              </Dropdown.Item>
              <Dropdown.Item>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Completed
              </Dropdown.Item>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <FolderKanban className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
            No projects found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {searchQuery 
              ? 'No projects match your search. Try adjusting your filters or search terms.'
              : 'Get started by creating your first project to organize your work and collaborate with your team.'
            }
          </p>
          <Button onClick={() => setShowCreateModal(true)} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Create Your First Project
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project}
              isSelected={selectedProjects.has(project.id)}
              onSelect={() => toggleProjectSelection(project.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <div 
              key={project.id}
              className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border ${
                selectedProjects.has(project.id)
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onClick={() => toggleProjectSelection(project.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedProjects.has(project.id)}
                    onChange={() => {}}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {project.name}
                      </h3>
                      {project.starred && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                      {project.archived && (
                        <Badge variant="secondary" size="sm">Archived</Badge>
                      )}
                      {project.completed && (
                        <Badge variant="success" size="sm">Completed</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {project.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Users className="h-4 w-4" />
                      <span>{project.memberCount || 0} members</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <FolderKanban className="h-4 w-4" />
                      <span>{project.taskCount || 0} tasks</span>
                    </div>
                  </div>
                  <div className="w-32">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500 dark:text-gray-400">Progress</span>
                      <span className="font-medium">{project.progress || 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/board/${project.defaultBoardId || ''}`)
                    }}
                  >
                    View Board
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination (simplified) */}
      {filteredProjects.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredProjects.length} of {projects.length} projects
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="default" size="sm">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              3
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={() => {
          setShowCreateModal(false)
          // Projects will be refreshed via the hook
        }}
      />
    </div>
  )
}