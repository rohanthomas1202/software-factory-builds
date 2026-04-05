'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/Toast'
import { User, UserRole } from '@/lib/types'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  email: string
  password: string
  name: string
}

export function useAuth() {
  const router = useRouter()
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  })

  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me')
        
        if (response.ok) {
          const user = await response.json()
          setAuthState({
            user,
            isLoading: false,
            isAuthenticated: true
          })
        } else {
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false
          })
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error)
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
      }
    }

    fetchCurrentUser()
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Fetch updated user data
      const userResponse = await fetch('/api/auth/me')
      if (userResponse.ok) {
        const user = await userResponse.json()
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true
        })
      }

      toast.success('Login successful!')
      router.push('/dashboard')
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [router])

  const register = useCallback(async (data: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      toast.success('Account created successfully!')
      router.push('/login')
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }, [router])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })

      toast.success('Logged out successfully')
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      toast.error('Logout failed')
    }
  }, [router])

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const updatedUser = await response.json()
      setAuthState(prev => ({
        ...prev,
        user: updatedUser
      }))

      toast.success('Profile updated successfully')
      return { success: true, user: updatedUser }
    } catch (error) {
      toast.error('Failed to update profile')
      return { success: false, error: 'Update failed' }
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const user = await response.json()
        setAuthState(prev => ({
          ...prev,
          user
        }))
        return user
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }, [])

  return {
    ...authState,
    login,
    register,
    logout,
    updateProfile,
    refreshUser
  }
}