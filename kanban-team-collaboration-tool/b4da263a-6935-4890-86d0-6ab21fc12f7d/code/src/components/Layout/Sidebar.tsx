'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  BarChart3,
  Calendar,
  FileText,
  Settings,
  HelpCircle,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Home,
  Grid,
  Inbox,
  Target,
  TrendingUp,
  Zap,
  Shield,
  MessageSquare,
  Layers,
  GitBranch,
  Lock,
  Bell,
  Mail,
  Sparkles,
  Eye,
  EyeOff,
  X,
  Menu,
  Search,
  MoreVertical,
  GripVertical,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  Paperclip,
  User as UserIcon,
  Flag,
  MessageSquare as MessageSquareIcon,
  Eye as EyeIcon,
  ExternalLink,
  Download,
  Upload,
  Copy,
  Share2,
  Archive,
  RefreshCw,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/UI/Button';
import { Avatar } from '@/components/UI/Avatar';
import { Badge } from '@/components/UI/Badge';
import { useAuth } from '@/hooks/useAuth';

interface Project {
  id: string;
  name: string;
  color: string;
  taskCount: number;
  completedTasks: number;
}

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  online: boolean;
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    // Mock data - in a real app, this would come from an API
    setProjects([
      { id: '1', name: 'Website Redesign', color: 'bg-blue-500', taskCount: 24, completedTasks: 18 },
      { id: '2', name: 'Mobile App', color: 'bg-purple-500', taskCount: 42, completedTasks: 32 },
      { id: '3', name: 'Marketing Campaign', color: 'bg-green-500', taskCount: 15, completedTasks: 10 },
      { id: '4', name: 'Q4 Planning', color: 'bg-orange-500', taskCount: 8, completedTasks: 3 },
    ]);

    setTeamMembers([
      { id: '1', name: 'Alex Johnson', avatar: '', role: 'Project Manager', online: true },
      { id: '2', name: 'Sam Wilson', avatar: '', role: 'Designer', online: true },
      { id: '3', name: 'Taylor Swift', avatar: '', role: 'Developer', online: false },
      { id: '4', name: 'Jordan Lee', avatar: '', role: 'QA Engineer', online: true },
    ]);
  }, []);

  const mainNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { href: '/dashboard/projects', label: 'Projects', icon: FolderKanban, badge: '12' },
    { href: '/dashboard/boards', label: 'Boards', icon: Grid, badge: null },
    { href: '/dashboard/team', label: 'Team', icon: Users, badge: null },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, badge: 'New' },
    { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar, badge: null },
    { href: '/dashboard/documents', label: 'Documents', icon: FileText, badge: '3' },
  ];

  const filterItems = [
    { id: 'all', label: 'All Tasks', icon: Layers, count: 89 },
    { id: 'assigned', label: 'Assigned to Me', icon: UserIcon, count: 12 },
    { id: 'starred', label: 'Starred', icon: Star, count: 8 },
    { id: 'today', label: 'Due Today', icon: Clock, count: 5 },
    { id: 'overdue', label: 'Overdue', icon: AlertCircle, count: 3 },
    { id: 'completed', label: 'Completed', icon: CheckCircle, count: 42 },
  ];

  const quickActions = [
    { label: 'New Task', icon: Plus, action: () => console.log('New Task') },
    { label: 'Filter View', icon: Filter, action: () => console.log('Filter View') },
    { label: 'Export Data', icon: Download, action: () => console.log('Export Data') },
    { label: 'Share Board', icon: Share2, action: () => console.log('Share Board') },
  ];

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col border-r border-gray-800 bg-gray-900 transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-700 bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* User profile */}
      <div className="border-b border-gray-800 p-4">
        <div className={cn('flex items-center space-x-3', isCollapsed && 'justify-center')}>
          <Avatar user={user} size="md" showStatus status="online" />
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-xs text-gray-400">{user?.email}</p>
              <Badge variant="outline" className="mt-1 border-blue-500/30 text-blue-400">
                {user?.role}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        <div className={cn('mb-6', isCollapsed && 'text-center')}>
          {!isCollapsed && (
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Navigation
            </h3>
          )}
          <ul className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                      isCollapsed && 'justify-center'
                    )}
                  >
                    <div className="relative">
                      <Icon size={18} />
                      {item.badge && (
                        <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <>
                        <span className="ml-3 flex-1">{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-2">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Filters */}
        <div className={cn('mb-6', isCollapsed && 'text-center')}>
          {!isCollapsed && (
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Filters
            </h3>
          )}
          <ul className="space-y-1">
            {filterItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeFilter === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveFilter(item.id)}
                    className={cn(
                      'group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                      isCollapsed && 'justify-center'
                    )}
                  >
                    <Icon size={18} />
                    {!isCollapsed && (
                      <>
                        <span className="ml-3 flex-1 text-left">{item.label}</span>
                        <Badge variant="outline" className="border-gray-700 text-gray-400">
                          {item.count}
                        </Badge>
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Projects */}
        {!isCollapsed && (
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Projects
              </h3>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Plus size={14} />
              </Button>
            </div>
            <ul className="space-y-2">
              {projects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="group flex items-center rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    <div className={cn('h-3 w-3 rounded-full', project.color)} />
                    <span className="ml-3 flex-1 truncate">{project.name}</span>
                    <div className="ml-2 flex items-center space-x-1">
                      <span className="text-xs text-gray-400">
                        {project.completedTasks}/{project.taskCount}
                      </span>
                      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-700">
                        <div
                          className="h-full bg-green-500"
                          style={{
                            width: `${(project.completedTasks / project.taskCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Team members */}
        {!isCollapsed && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Team Online
              </h3>
              <span className="text-xs text-green-400">{teamMembers.filter(m => m.online).length} online</span>
            </div>
            <ul className="space-y-2">
              {teamMembers.map((member) => (
                <li key={member.id}>
                  <div className="flex items-center rounded-lg px-3 py-2 hover:bg-gray-800">
                    <Avatar
                      user={{ name: member.name, avatar: member.avatar }}
                      size="sm"
                      showStatus
                      status={member.online ? 'online' : 'offline'}
                    />
                    <div className="ml-3 min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{member.name}</p>
                      <p className="truncate text-xs text-gray-400">{member.role}</p>
                    </div>
                    <MessageSquareIcon size={14} className="text-gray-400 hover:text-white" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* Quick actions - only show when not collapsed */}
      {!isCollapsed && (
        <div className="border-t border-gray-800 p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  onClick={action.action}
                  className="h-auto flex-col items-center justify-center py-2"
                >
                  <Icon size={16} className="mb-1" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Settings link */}
      <div className="border-t border-gray-800 p-4">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white',
            isCollapsed && 'justify-center'
          )}
        >
          <Settings size={18} />
          {!isCollapsed && <span className="ml-3">Settings</span>}
        </Link>
      </div>
    </aside>
  );
}