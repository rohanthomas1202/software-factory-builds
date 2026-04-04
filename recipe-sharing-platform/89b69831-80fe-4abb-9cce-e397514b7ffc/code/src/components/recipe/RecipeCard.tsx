'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Users, Flame, Bookmark, BookmarkCheck, ChefHat, MoreVertical, Star, Eye, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Recipe } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

interface RecipeCardProps {
  recipe: Recipe;
  className?: string;
  showAuthor?: boolean;
  showActions?: boolean;
  showStats?: boolean;
  variant?: 'default' | 'compact' | 'featured';
  onSaveToggle?: (recipeId: string, saved: boolean) => void;
}

export function RecipeCard({
  recipe,
  className,
  showAuthor = true,
  showActions = true,
  showStats = true,
  variant = 'default',
  onSaveToggle,
}: RecipeCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(recipe.isSaved || false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save recipes',
        type: 'warning',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/recipes/${recipe.id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ save: !isSaved }),
      });

      if (response.ok) {
        const newSavedState = !isSaved;
        setIsSaved(newSavedState);
        onSaveToggle?.(recipe.id, newSavedState);
        toast({
          title: newSavedState ? 'Recipe saved!' : 'Recipe removed',
          description: newSavedState 
            ? 'Added to your saved recipes' 
            : 'Removed from saved recipes',
          type: 'success',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update saved status',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const renderCompact = () => (
    <Link
      href={`/recipes/${recipe.id}`}
      className={cn(
        'group flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800',
        'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800',
        'transition-all duration-200 hover:shadow-md',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-20 h-20 flex-shrink-0">
        <Image
          src={recipe.imageUrl}
          alt={recipe.title}
          fill
          className="rounded-lg object-cover"
          sizes="80px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {recipe.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
              by {recipe.author.displayName}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleSaveToggle}
            disabled={isSaving}
          >
            {isSaved ? (
              <BookmarkCheck className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span>{recipe.averageRating.toFixed(1)}</span>
            <span className="text-gray-400">({recipe.ratingCount})</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{formatTime(recipe.prepTime + recipe.cookTime)}</span>
          </div>
          <Badge
            variant="secondary"
            className={cn('text-xs', getDifficultyColor(recipe.difficulty))}
          >
            {recipe.difficulty}
          </Badge>
        </div>
      </div>
    </Link>
  );

  const renderDefault = () => (
    <Link
      href={`/recipes/${recipe.id}`}
      className={cn(
        'group block rounded-2xl border border-gray-200 dark:border-gray-800',
        'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800',
        'transition-all duration-300 hover:shadow-xl overflow-hidden',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Recipe Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={recipe.imageUrl}
          alt={recipe.title}
          fill
          className={cn(
            'object-cover transition-transform duration-500',
            isHovered && 'scale-105'
          )}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Save Button */}
        {showActions && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm',
              'opacity-0 group-hover:opacity-100 transition-all duration-200',
              'hover:bg-white dark:hover:bg-gray-800'
            )}
            onClick={handleSaveToggle}
            disabled={isSaving}
          >
            {isSaved ? (
              <BookmarkCheck className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </Button>
        )}

        {/* Difficulty Badge */}
        <Badge
          className={cn(
            'absolute top-3 left-3 backdrop-blur-sm border-0',
            getDifficultyColor(recipe.difficulty)
          )}
        >
          {recipe.difficulty}
        </Badge>

        {/* Category Badge */}
        {recipe.category && (
          <Badge
            variant="secondary"
            className="absolute bottom-3 left-3 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90"
          >
            {recipe.category}
          </Badge>
        )}
      </div>

      {/* Recipe Content */}
      <div className="p-5">
        {/* Title and Author */}
        <div className="mb-4">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {recipe.title}
          </h3>
          
          {showAuthor && (
            <div className="flex items-center gap-2">
              <Avatar
                src={recipe.author.avatarUrl}
                alt={recipe.author.displayName}
                size="sm"
                border
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {recipe.author.displayName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {recipe.author.username}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {recipe.description}
        </p>

        {/* Stats */}
        {showStats && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">{recipe.averageRating.toFixed(1)}</span>
                <span className="text-gray-400">({recipe.ratingCount})</span>
              </div>
              
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{formatTime(recipe.prepTime + recipe.cookTime)}</span>
              </div>
              
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4" />
                <span>{recipe.servings}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {recipe.isSpicy && (
                <Flame className="w-4 h-4 text-red-500" />
              )}
              {recipe.isVegetarian && (
                <Badge variant="success" size="sm" className="text-xs">
                  Veg
                </Badge>
              )}
              {recipe.isVegan && (
                <Badge variant="success" size="sm" className="text-xs">
                  Vegan
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );

  const renderFeatured = () => (
    <Link
      href={`/recipes/${recipe.id}`}
      className={cn(
        'group relative rounded-2xl overflow-hidden',
        'bg-gradient-to-br from-gray-900 to-black',
        'transition-all duration-500 hover:shadow-2xl',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={recipe.imageUrl}
          alt={recipe.title}
          fill
          className={cn(
            'object-cover opacity-40 transition-all duration-700',
            isHovered && 'scale-110 opacity-50'
          )}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative p-8 h-full flex flex-col justify-end min-h-[400px]">
        {/* Category and Save */}
        <div className="flex items-center justify-between mb-4">
          <Badge
            variant="primary"
            className="backdrop-blur-sm bg-primary-500/20 border-primary-500/30"
          >
            {recipe.category}
          </Badge>
          
          <Button
            variant="ghost"
            size="sm"
            className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white"
            onClick={handleSaveToggle}
            disabled={isSaving}
          >
            {isSaved ? (
              <BookmarkCheck className="w-4 h-4" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Title and Description */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary-300 transition-colors">
            {recipe.title}
          </h3>
          <p className="text-gray-300 line-clamp-2">
            {recipe.description}
          </p>
        </div>

        {/* Author and Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              src={recipe.author.avatarUrl}
              alt={recipe.author.displayName}
              size="md"
              border
              className="ring-2 ring-white/20"
            />
            <div>
              <p className="font-medium text-white">{recipe.author.displayName}</p>
              <p className="text-sm text-gray-300">@{recipe.author.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center gap-1 text-white">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-bold">{recipe.averageRating.toFixed(1)}</span>
              </div>
              <p className="text-xs text-gray-300">Rating</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center gap-1 text-white">
                <Clock className="w-4 h-4" />
                <span className="font-bold">{formatTime(recipe.prepTime + recipe.cookTime)}</span>
              </div>
              <p className="text-xs text-gray-300">Time</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center gap-1 text-white">
                <Users className="w-4 h-4" />
                <span className="font-bold">{recipe.servings}</span>
              </div>
              <p className="text-xs text-gray-300">Servings</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  switch (variant) {
    case 'compact':
      return renderCompact();
    case 'featured':
      return renderFeatured();
    default:
      return renderDefault();
  }
}