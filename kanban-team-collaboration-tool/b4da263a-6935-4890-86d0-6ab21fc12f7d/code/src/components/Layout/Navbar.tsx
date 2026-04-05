'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, Menu, X, Plus, ChevronDown, Home, Grid, Inbox, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Avatar } from '@/components/UI/Avatar';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { NotificationPanel } from '@/components/UI/NotificationPanel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/UI/DropdownMenu';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard?view=boards', label: 'Boards', icon: Grid },
    { href: '/dashboard?view=inbox', label: 'Inbox', icon: Inbox },
    { href: '/dashboard?view=goals', label: 'Goals', icon: Target },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left section - Logo and navigation */}
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="mr-2 rounded-md p-2 text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                  <Grid className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">KanbanFlow</span>
              </Link>

              {/* Desktop navigation */}
              <div className="hidden lg:ml-10 lg:flex lg:space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href.split('?')[0]);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      )}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Center section - Search */}
            <div className="hidden flex-1 px-8 lg:block">
              <form onSubmit={handleSearch} className="w-full max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search tasks, projects, or team members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border-gray-700 bg-gray-800 pl-10 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </form>
            </div>

            {/* Right section - User menu and notifications */}
            <div className="flex items-center space-x-4">
              {/* Mobile search button */}
              <button className="rounded-md p-2 text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden">
                <Search size={20} />
              </button>

              {/* Create button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 lg:flex">
                    <Plus size={16} className="mr-2" />
                    Create
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Create New</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard?create=project')}>
                    <FolderKanban className="mr-2 h-4 w-4" />
                    Project
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard?create=board')}>
                    <Grid className="mr-2 h-4 w-4" />
                    Board
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard?create=task')}>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard?create=team')}>
                    <Users className="mr-2 h-4 w-4" />
                    Team
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationPanelOpen(!isNotificationPanelOpen)}
                  className="relative rounded-md p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {isNotificationPanelOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-80">
                    <NotificationPanel
                      notifications={notifications}
                      onClose={() => setIsNotificationPanelOpen(false)}
                      onMarkAllAsRead={markAllAsRead}
                    />
                  </div>
                )}
              </div>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-3 rounded-lg p-1 hover:bg-gray-800">
                    <Avatar user={user} size="sm" />
                    <div className="hidden text-left lg:block">
                      <p className="text-sm font-medium text-white">{user?.name}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                    <ChevronDown className="hidden h-4 w-4 text-gray-400 lg:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-400">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="border-t border-gray-800 py-4 lg:hidden">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium',
                        isActive
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      )}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="mt-4">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="search"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border-gray-700 bg-gray-800 pl-10 text-white placeholder:text-gray-400"
                    />
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

// Import missing icons
import {
  FolderKanban,
  Grid,
  CheckSquare,
  Users,
  User,
  Settings,
  LogOut,
} from 'lucide-react';