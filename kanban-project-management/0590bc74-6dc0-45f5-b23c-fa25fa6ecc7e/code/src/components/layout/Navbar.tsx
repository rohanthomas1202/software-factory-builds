'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Dropdown } from '@/components/ui/Dropdown'
import { toast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import {
  Search,
  Bell,
  HelpCircle,
  Moon,
  Sun,
  LogOut,
  Settings,
  User,
  Home,
  Plus,
  Menu,
  X,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useTheme } from 'next-themes'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { user, isLoading, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Task assigned', description: 'You were assigned to "Design Review"', time: '2 min ago', read: false },
    { id: '2', title: 'Comment added', description: 'John commented on "API Integration"', time: '1 hour ago', read: false },
    { id: '3', title: 'Deadline approaching', description: '"Sprint Planning" due tomorrow', time: '2 hours ago', read: true },
  ])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      toast.info(`Searching for "${searchQuery}"`)
      // In a real app, this would navigate to search results
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
    toast.success('All notifications marked as read')
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isHomePage = pathname === '/'

  if (isAuthPage || isHomePage) {
    return null
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left section - Logo and navigation */}
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mr-2 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Kanban<span className="text-blue-600 dark:text-blue-400">Flow</span>
              </span>
            </Link>

            <div className="ml-8 hidden items-center space-x-1 lg:flex">
              <NavLink href="/dashboard" active={pathname === '/dashboard'}>
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </NavLink>
              <NavLink href="/projects" active={pathname.startsWith('/projects')}>
                <Zap className="mr-2 h-4 w-4" />
                Projects
              </NavLink>
              <NavLink href="/analytics" active={pathname === '/analytics'}>
                <Sparkles className="mr-2 h-4 w-4" />
                Analytics
              </NavLink>
            </div>
          </div>

          {/* Center section - Search */}
          <div className="flex flex-1 items-center justify-center px-4 lg:px-0">
            <form onSubmit={handleSearch} className="w-full max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search tasks, projects, or team members..."
                  className="w-full pl-10 pr-4"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>

          {/* Right section - User actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="hidden sm:inline-flex"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
              <HelpCircle className="h-5 w-5" />
            </Button>

            {/* Notifications dropdown */}
            <Dropdown
              trigger={
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              }
              align="end"
            >
              <div className="w-80 p-2">
                <div className="flex items-center justify-between p-2">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'rounded-lg p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800',
                        !notification.read && 'bg-blue-50 dark:bg-blue-900/20'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {notification.description}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {notification.time}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t p-2">
                  <Button variant="ghost" className="w-full" asChild>
                    <Link href="/notifications">View all notifications</Link>
                  </Button>
                </div>
              </div>
            </Dropdown>

            {/* Create button */}
            <Dropdown
              trigger={
                <Button className="hidden md:inline-flex">
                  <Plus className="mr-2 h-4 w-4" />
                  Create
                </Button>
              }
              align="end"
            >
              <div className="w-48 p-2">
                <Dropdown.Item asChild>
                  <Link href="/projects/new" className="flex items-center">
                    <Zap className="mr-2 h-4 w-4" />
                    New Project
                  </Link>
                </Dropdown.Item>
                <Dropdown.Item asChild>
                  <Link href="/board/new" className="flex items-center">
                    <Sparkles className="mr-2 h-4 w-4" />
                    New Board
                  </Link>
                </Dropdown.Item>
                <Dropdown.Item asChild>
                  <Link href="/tasks/new" className="flex items-center">
                    <Home className="mr-2 h-4 w-4" />
                    New Task
                  </Link>
                </Dropdown.Item>
                <Dropdown.Item asChild>
                  <Link href="/team/invite" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Invite Team
                  </Link>
                </Dropdown.Item>
              </div>
            </Dropdown>

            {/* User dropdown */}
            {user ? (
              <Dropdown
                trigger={
                  <button className="flex items-center space-x-2 rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Avatar
                      src={user.avatar}
                      fallback={user.name.charAt(0)}
                      status="online"
                      size="sm"
                    />
                    <div className="hidden text-left md:block">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.role}
                      </p>
                    </div>
                  </button>
                }
                align="end"
              >
                <div className="w-56 p-2">
                  <div className="p-2">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                  <Dropdown.Separator />
                  <Dropdown.Item asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </Dropdown.Item>
                  <Dropdown.Item asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </Dropdown.Item>
                  <Dropdown.Separator />
                  <Dropdown.Item
                    onClick={handleLogout}
                    className="flex items-center text-red-600 dark:text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Dropdown.Item>
                </div>
              </Dropdown>
            ) : (
              <Button asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-gray-200 py-4 dark:border-gray-800 lg:hidden">
            <div className="space-y-1">
              <MobileNavLink href="/dashboard" active={pathname === '/dashboard'}>
                <Home className="mr-3 h-5 w-5" />
                Dashboard
              </MobileNavLink>
              <MobileNavLink href="/projects" active={pathname.startsWith('/projects')}>
                <Zap className="mr-3 h-5 w-5" />
                Projects
              </MobileNavLink>
              <MobileNavLink href="/analytics" active={pathname === '/analytics'}>
                <Sparkles className="mr-3 h-5 w-5" />
                Analytics
              </MobileNavLink>
              <MobileNavLink href="/team" active={pathname.startsWith('/team')}>
                <User className="mr-3 h-5 w-5" />
                Team
              </MobileNavLink>
              <MobileNavLink href="/settings" active={pathname.startsWith('/settings')}>
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </MobileNavLink>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
      )}
    >
      {children}
    </Link>
  )
}

function MobileNavLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center rounded-lg px-3 py-2 text-base font-medium transition-colors',
        active
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
      )}
    >
      {children}
    </Link>
  )
}