'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Navbar } from '@/components/Layout/Navbar';
import { Sidebar } from '@/components/Layout/Sidebar';
import { KanbanBoard } from '@/components/Board/KanbanBoard';
import { Button } from '@/components/UI/Button';
import { Badge } from '@/components/UI/Badge';
import { Avatar } from '@/components/UI/Avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/UI/DropdownMenu';
import { Board, Column, Task, User } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';
import { 
  ArrowLeft, 
  MoreVertical, 
  Users, 
  Filter, 
  Search, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Settings, 
  Share2, 
  Download,
  Clock,
  BarChart3,
  MessageSquare,
  Bell,
  Zap,
  ChevronDown,
  Plus
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Polling interval for real-time updates (simulated)
const POLLING_INTERVAL = 5000; // 5 seconds

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [boardUsers, setBoardUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showCompleted, setShowCompleted] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPolling, setIsPolling] = useState(true);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [recentActivity, setRecentActivity] = useState<string[]>([]);

  const boardId = params.boardId as string;

  // Fetch board data
  const fetchBoardData = useCallback(async () => {
    if (!boardId) return;

    try {
      const [boardRes, columnsRes, tasksRes, usersRes] = await Promise.all([
        fetch(`/api/boards/${boardId}`),
        fetch(`/api/boards/${boardId}/columns`),
        fetch('/api/tasks?boardId=' + boardId),
        fetch('/api/projects/' + boardId + '/users') // Simulated endpoint
      ]);

      if (!boardRes.ok || !columnsRes.ok || !tasksRes.ok) {
        throw new Error('Failed to fetch board data');
      }

      const boardData = await boardRes.json();
      const columnsData = await columnsRes.json();
      const tasksData = await tasksRes.json();
      const usersData = usersRes.ok ? await usersRes.json() : [];

      setBoard(boardData);
      setColumns(columnsData);
      setTasks(tasksData);
      setBoardUsers(usersData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching board data:', err);
      setError('Failed to load board. Please try again.');
      toast.error('Failed to load board data');
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  // Simulate real-time updates with polling
  useEffect(() => {
    if (!isPolling || !boardId) return;

    fetchBoardData();

    const interval = setInterval(() => {
      fetchBoardData();
      
      // Simulate active users (random selection from board users)
      if (boardUsers.length > 0) {
        const randomUsers = [...boardUsers]
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(3, boardUsers.length));
        setActiveUsers(randomUsers);
      }

      // Simulate recent activity
      const activities = [
        'Sarah moved "Design Review" to In Progress',
        'John commented on "API Integration"',
        'Mike completed "User Authentication"',
        'Lisa assigned "Mobile App Design" to Alex',
        'David updated the due date for "Database Migration"'
      ];
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];
      setRecentActivity(prev => [randomActivity, ...prev.slice(0, 4)]);
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [boardId, isPolling, fetchBoardData, boardUsers]);

  // Initial fetch
  useEffect(() => {
    if (boardId && !authLoading) {
      fetchBoardData();
    }
  }, [boardId, authLoading, fetchBoardData]);

  // Handle task updates
  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
    toast.success('Task updated successfully');
  }, []);

  // Handle task creation
  const handleTaskCreate = useCallback((newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
    toast.success('Task created successfully');
  }, []);

  // Handle task deletion
  const handleTaskDelete = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    toast.success('Task deleted successfully');
  }, []);

  // Handle column updates
  const handleColumnUpdate = useCallback((updatedColumn: Column) => {
    setColumns(prev => prev.map(col => 
      col.id === updatedColumn.id ? updatedColumn : col
    ));
    toast.success('Column updated successfully');
  }, []);

  // Handle column creation
  const handleColumnCreate = useCallback((newColumn: Column) => {
    setColumns(prev => [...prev, newColumn]);
    toast.success('Column created successfully');
  }, []);

  // Handle column deletion
  const handleColumnDelete = useCallback((columnId: string) => {
    setColumns(prev => prev.filter(col => col.id !== columnId));
    toast.success('Column deleted successfully');
  }, []);

  // Filter tasks based on search and showCompleted
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompleted = showCompleted || task.status !== 'done';
    return matchesSearch && matchesCompleted;
  });

  // Calculate board statistics
  const boardStats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'done').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    overdueTasks: tasks.filter(t => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < new Date() && t.status !== 'done';
    }).length,
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading board...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <EyeOff className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Error Loading Board</h3>
                    <p className="text-gray-400">{error}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => router.push('/dashboard')} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                  <Button onClick={fetchBoardData}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <EyeOff className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Board Not Found</h2>
              <p className="text-gray-400 mb-6">The board you're looking for doesn't exist or you don't have access.</p>
              <Button onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <Navbar />
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 lg:p-8">
          {/* Board Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  className="text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">{board.name}</h1>
                  <p className="text-gray-400">{board.description}</p>
                </div>
                <Badge variant={board.isPublic ? 'success' : 'secondary'}>
                  {board.isPublic ? 'Public' : 'Private'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {activeUsers.slice(0, 3).map((user) => (
                      <Avatar
                        key={user.id}
                        user={user}
                        size="sm"
                        showStatus
                        status="online"
                        className="ring-2 ring-gray-900"
                      />
                    ))}
                    {activeUsers.length > 3 && (
                      <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-xs font-medium text-gray-400 ring-2 ring-gray-900">
                        +{activeUsers.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-400">
                    {activeUsers.length} active
                  </span>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setShowCompleted(!showCompleted)}>
                      {showCompleted ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {showCompleted ? 'Hide Completed' : 'Show Completed'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsPolling(!isPolling)}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${isPolling ? 'animate-spin' : ''}`} />
                      {isPolling ? 'Pause Updates' : 'Resume Updates'}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Board Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Board
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="w-4 h-4 mr-2" />
                      Export Board
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Board Stats and Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Tasks</p>
                    <p className="text-2xl font-bold text-white">{boardStats.totalTasks}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">In Progress</p>
                    <p className="text-2xl font-bold text-white">{boardStats.inProgressTasks}</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-yellow-500" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Completed</p>
                    <p className="text-2xl font-bold text-white">{boardStats.completedTasks}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Overdue</p>
                    <p className="text-2xl font-bold text-white">{boardStats.overdueTasks}</p>
                  </div>
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-red-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant={showCompleted ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowCompleted(!showCompleted)}
                >
                  {showCompleted ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showCompleted ? 'Hide Completed' : 'Show Completed'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPolling(!isPolling)}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isPolling ? 'animate-spin' : ''}`} />
                  {isPolling ? 'Pause Updates' : 'Resume Updates'}
                </Button>
                
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                
                <div className="text-xs text-gray-400">
                  Last updated: {formatDate(lastUpdated)}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              {/* Kanban Board */}
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
                <KanbanBoard
                  board={board}
                  columns={columns}
                  tasks={filteredTasks}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskCreate={handleTaskCreate}
                  onTaskDelete={handleTaskDelete}
                  onColumnUpdate={handleColumnUpdate}
                  onColumnCreate={handleColumnCreate}
                  onColumnDelete={handleColumnDelete}
                />
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Active Users */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Active Users</h3>
                  <Badge variant="outline">{activeUsers.length} online</Badge>
                </div>
                <div className="space-y-3">
                  {activeUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <Avatar user={user} size="sm" showStatus status="online" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-gray-400">Active now</p>
                      </div>
                    </div>
                  ))}
                  {activeUsers.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No active users</p>
                  )}
                </div>
              </div>
              
              {/* Recent Activity */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Recent Activity</h3>
                  <Bell className="w-4 h-4 text-gray-400" />
                </div>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="text-sm">
                      <p className="text-white">{activity}</p>
                      <p className="text-xs text-gray-400 mt-1">Just now</p>
                    </div>
                  ))}
                  {recentActivity.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>
              
              {/* Board Info */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                <h3 className="font-semibold text-white mb-4">Board Info</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400">Created</p>
                    <p className="text-sm text-white">{formatDate(board.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Last Updated</p>
                    <p className="text-sm text-white">{formatDate(lastUpdated)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Total Columns</p>
                    <p className="text-sm text-white">{columns.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Total Tasks</p>
                    <p className="text-sm text-white">{tasks.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}