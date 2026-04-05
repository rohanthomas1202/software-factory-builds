'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from '@/components/ui/Toast'
import { Project } from '@/lib/types'

interface UseProjectsReturn {
  projects: Project[]
  isLoading: boolean
  error: string | null
  createProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>) => Promise<Project | null>
  updateProject: (id: string, data: Partial<Project>) => Promise<Project | null>
  deleteProject: (id: string) => Promise<boolean>
  fetchProjects: () => Promise<void>
  getProjectById: (id: string) => Project | undefined
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/projects')
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      
      const data = await response.json()
      setProjects(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch projects'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const createProject = useCallback(async (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create project')
      }

      const newProject = await response.json()
      
      setProjects(prev => [...prev, newProject])
      toast.success('Project created successfully!')
      return newProject
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project'
      toast.error(message)
      return null
    }
  }, [])

  const updateProject = useCallback(async (id: string, data: Partial<Project>) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update project')
      }

      const updatedProject = await response.json()
      
      setProjects(prev => prev.map(project => 
        project.id === id ? updatedProject : project
      ))
      
      toast.success('Project updated successfully!')
      return updatedProject
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update project'
      toast.error(message)
      return null
    }
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete project')
      }

      setProjects(prev => prev.filter(project => project.id !== id))
      toast.success('Project deleted successfully!')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete project'
      toast.error(message)
      return false
    }
  }, [])

  const getProjectById = useCallback((id: string) => {
    return projects.find(project => project.id === id)
  }, [projects])

  return {
    projects,
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    fetchProjects,
    getProjectById
  }
}