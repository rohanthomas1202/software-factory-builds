'use client';

import React from 'react';
import Link from 'next/link';
import { User } from '@/types';
import { cn } from '@/lib/utils';
import { 
  ChefHat, 
  Users, 
  Star, 
  Bookmark, 
  TrendingUp, 
  Award, 
  Clock, 
  Heart,
  Flame,
  Trophy,
  Zap,
  Eye,
  MessageCircle,
  ThumbsUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Percent
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ProfileStatsProps {
  user: User;
  stats?: {
    totalRecipes: number;
    totalLikes: number;
    totalViews: number;
    totalComments: number;
    averageRating: number;
    savedRecipes: number;
    followers: number;
    following: number;
    engagementRate?: number;
    trendingPosition?: number;
    weeklyChange?: number;
  };
  className?: string;
}

export function ProfileStats({ 
  user, 
  stats = {
    totalRecipes: 0,
    totalLikes: 0,
    totalViews: 0,
    totalComments: 0,
    averageRating: 0,
    savedRecipes: 0,
    followers: 0,
    following: 0,
    engagementRate: 0,
    trendingPosition: 0,
    weeklyChange: 0
  },
  className 
}: ProfileStatsProps) {
  const statCards = [
    {
      title: 'Recipes',
      value: stats.totalRecipes,
      icon: ChefHat,
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      href: `/profile/${user.username}?tab=recipes`,
      change: stats.weeklyChange,
    },
    {
      title: 'Followers',
      value: stats.followers,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      href: `/profile/${user.username}?tab=followers`,
    },
    {
      title: 'Following',
      value: stats.following,
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      href: `/profile/${user.username}?tab=following`,
    },
    {
      title: 'Avg Rating',
      value: stats.averageRating.toFixed(1),
      icon: Star,
      color: 'from-yellow-500 to-amber-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      showStar: true,
    },
    {
      title: 'Saved',
      value: stats.savedRecipes,
      icon: Bookmark,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      href: '/saved',
    },
    {
      title: 'Views',
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
    },
    {
      title: 'Likes',
      value: stats.totalLikes.toLocaleString(),
      icon: ThumbsUp,
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    {
      title: 'Comments',
      value: stats.totalComments.toLocaleString(),
      icon: MessageCircle,
      color: 'from-teal-500 to-cyan-500',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      borderColor: 'border-teal-200 dark:border-teal-800',
    },
  ];

  const achievementCards = [
    {
      title: 'Engagement Rate',
      value: `${stats.engagementRate?.toFixed(1) || '0.0'}%`,
      icon: TrendingUp,
      color: 'from-emerald-500 to-green-500',
      description: 'Higher than 85% of users',
      trend: 'up' as const,
    },
    {
      title: 'Trending Position',
      value: `#${stats.trendingPosition || 'N/A'}`,
      icon: Trophy,
      color: 'from-amber-500 to-yellow-500',
      description: 'Top chef this week',
      trend: 'up' as const,
    },
    {
      title: 'Activity Score',
      value: '92',
      icon: Zap,
      color: 'from-violet-500 to-purple-500',
      description: 'Very Active',
      trend: 'up' as const,
    },
    {
      title: 'Consistency',
      value: '87%',
      icon: Clock,
      color: 'from-sky-500 to-blue-500',
      description: 'Weekly posting streak',
      trend: 'stable' as const,
    },
  ];

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-emerald-500" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-500" />;
      default:
        return <Percent className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const isLink = !!stat.href;
          
          const content = (
            <div className={cn(
              'relative p-4 rounded-xl border transition-all duration-200 hover:shadow-lg',
              stat.bgColor,
              stat.borderColor,
              isLink && 'cursor-pointer hover:scale-[1.02]'
            )}>
              {/* Gradient Corner */}
              <div className={cn(
                'absolute top-0 right-0 w-16 h-16 rounded-tr-xl rounded-bl-3xl opacity-10',
                `bg-gradient-to-br ${stat.color}`
              )} />
              
              <div className="relative flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    `bg-gradient-to-br ${stat.color}`
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  
                  {stat.change !== undefined && (
                    <Badge
                      variant={stat.change >= 0 ? 'success' : 'danger'}
                      size="sm"
                      className="gap-1"
                    >
                      {stat.change >= 0 ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      )}
                      {Math.abs(stat.change)}%
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </span>
                    {stat.showStar && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                </div>
              </div>
            </div>
          );

          return isLink ? (
            <Link key={index} href={stat.href!}>
              {content}
            </Link>
          ) : (
            <div key={index}>
              {content}
            </div>
          );
        })}
      </div>

      {/* Achievements & Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {achievementCards.map((achievement, index) => {
          const Icon = achievement.icon;
          
          return (
            <div
              key={index}
              className={cn(
                'relative p-4 rounded-xl border transition-all duration-200 hover:shadow-lg',
                'bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800',
                'border-gray-200 dark:border-gray-700'
              )}
            >
              {/* Background Gradient */}
              <div className={cn(
                'absolute inset-0 rounded-xl opacity-5',
                `bg-gradient-to-br ${achievement.color}`
              )} />
              
              <div className="relative space-y-3">
                <div className="flex items-center justify-between">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    `bg-gradient-to-br ${achievement.color}`
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {getTrendIcon(achievement.trend)}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {achievement.value}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {achievement.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {achievement.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
              <Flame className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Community Rank
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Based on engagement and quality
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                #{stats.trendingPosition || 'N/A'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Global</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                #{Math.floor(Math.random() * 50) + 1}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Country</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                #{Math.floor(Math.random() * 20) + 1}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            leftIcon={<TrendingUp className="w-4 h-4" />}
          >
            View Leaderboard
          </Button>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Weekly Activity
            </h3>
            <Badge variant="primary">This Week</Badge>
          </div>
          
          <div className="space-y-4">
            {[
              { day: 'Mon', recipes: 2, likes: 45, comments: 12 },
              { day: 'Tue', recipes: 1, likes: 32, comments: 8 },
              { day: 'Wed', recipes: 0, likes: 28, comments: 6 },
              { day: 'Thu', recipes: 3, likes: 67, comments: 18 },
              { day: 'Fri', recipes: 1, likes: 41, comments: 10 },
              { day: 'Sat', recipes: 2, likes: 58, comments: 15 },
              { day: 'Sun', recipes: 1, likes: 39, comments: 9 },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">
                  {activity.day}
                </span>
                
                <div className="flex-1 mx-4">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 rounded-full bg-primary-500"
                      style={{ width: `${(activity.recipes / 3) * 100}%` }}
                    />
                    <div 
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${(activity.likes / 67) * 100}%` }}
                    />
                    <div 
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${(activity.comments / 18) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <ChefHat className="w-3 h-3" />
                    {activity.recipes}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {activity.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {activity.comments}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Categories
            </h3>
            <Badge variant="secondary">By Engagement</Badge>
          </div>
          
          <div className="space-y-3">
            {[
              { name: 'Italian', count: 24, color: 'bg-red-500' },
              { name: 'Desserts', count: 18, color: 'bg-pink-500' },
              { name: 'Asian', count: 15, color: 'bg-orange-500' },
              { name: 'Healthy', count: 12, color: 'bg-green-500' },
              { name: 'Breakfast', count: 9, color: 'bg-yellow-500' },
            ].map((category, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {category.name}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {category.count} recipes
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${category.color}`}
                    style={{ width: `${(category.count / 24) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center"
              leftIcon={<ChefHat className="w-4 h-4" />}
            >
              View All Categories
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}