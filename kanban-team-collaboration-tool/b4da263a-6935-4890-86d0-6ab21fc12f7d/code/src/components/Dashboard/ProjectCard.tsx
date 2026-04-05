'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Project, User } from '@/lib/types';
import { Button } from '@/components/UI/Button';
import { Avatar } from '@/components/UI/Avatar';
import { Badge } from '@/components/UI/Badge';
import { cn, formatDate } from '@/lib/utils';
import {
  MoreVertical,
  Star,
  StarOff,
  Users,
  Calendar,
  FolderKanban,
  Clock,
  Target,
  TrendingUp,
  Edit2,
  Trash2,
  Archive,
  Copy,
  Eye,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  PauseCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/UI/DropdownMenu';
import { toast } from 'react-hot-toast';

interface ProjectCardProps {
  project: Project;
  viewMode: 'grid' | 'list';
  onUpdate: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

export function ProjectCard({ project, viewMode, onUpdate, onDelete }: ProjectCardProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(project.isFavorite);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFavoriteToggle = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !isFavorite }),
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
        onUpdate({ ...project, isFavorite: !isFavorite });
        toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
      toast.error('Failed to update favorite status');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete(project.id);
      } else {
        throw new Error('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });

      if (response.ok) {
        onUpdate({ ...project, status: 'archived' });
        toast.success('Project archived');
      }
    } catch (error) {
      console.error('Error archiving project:', error);
      toast.error('Failed to archive project');
    }
  };

  const getStatusIcon = () => {
    switch (project.status) {
      case 'active':
        return <Target className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
      case 'on-hold':
        return <PauseCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (project.status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getPriorityColor = () => {
    switch (project.priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const handleOpenBoard = () => {
    if (project.boards.length > 0) {
      router.push(`/board/${project.boards[0].id}`);
    } else {
      toast.error('No boards available for this project');
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="group bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <FolderKanban className="h-6 w-6 text-primary" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {project.name}
                </h3>
                <Badge className={getStatusColor()}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon()}
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                </Badge>
                <Badge variant="outline" className={getPriorityColor()}>
                  {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)} Priority
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                {project.description || 'No description provided'}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {project.members.length} members
                </span>
                <span className="flex items-center gap-1">
                  <FolderKanban className="h-3 w-3" />
                  {project.boards.length} boards
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Updated {formatDate(project.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavoriteToggle}
              className="text-gray-400 hover:text-yellow-500"
            >
              {isFavorite ? (
                <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
              ) : (
                <StarOff className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleOpenBoard}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <ArrowUpRight className="h-4 w-4 mr-1" />
              Open
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleOpenBoard}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Project
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/project/${project.id}/settings`)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Project
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete Project'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
              <Badge className={getStatusColor()}>
                <span className="flex items-center gap-1">
                  {getStatusIcon()}
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavoriteToggle}
              className="text-gray-400 hover:text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {isFavorite ? (
                <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
              ) : (
                <StarOff className="h-5 w-5" />
              )}
            </Button>
          </div>

          <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2 line-clamp-1">
            {project.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {project.description || 'No description provided'}
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Priority</span>
          <Badge variant="outline" className={getPriorityColor()}>
            {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                style={{ width: `${project.progress || 0}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {project.progress || 0}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Team</span>
          <div className="flex -space-x-2">
            {project.members.slice(0, 3).map((member) => (
              <Avatar
                key={member.id}
                user={member}
                size="sm"
                className="border-2 border-white dark:border-gray-800"
              />
            ))}
            {project.members.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  +{project.members.length - 3}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <FolderKanban className="h-3 w-3" />
            {project.boards.length}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(project.updatedAt)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleOpenBoard}>
                <Eye className="h-4 w-4 mr-2" />
                View Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/project/${project.id}/settings`)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="h-4 w-4 mr-2" />
                Archive Project
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete Project'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="default"
            size="sm"
            onClick={handleOpenBoard}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            Open
          </Button>
        </div>
      </div>
    </div>
  );
}