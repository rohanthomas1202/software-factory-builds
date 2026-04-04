'use client';

import React, { useState, useEffect } from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showValue?: boolean;
  interactive?: boolean;
  recipeId?: string;
  onRatingChange?: (rating: number) => void;
  className?: string;
  maxRating?: number;
  showCount?: boolean;
  count?: number;
}

export function StarRating({
  rating,
  size = 'md',
  showValue = false,
  interactive = false,
  recipeId,
  onRatingChange,
  className,
  maxRating = 5,
  showCount = false,
  count,
}: StarRatingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hoverRating, setHoverRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(rating);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);

  useEffect(() => {
    setCurrentRating(rating);
  }, [rating]);

  useEffect(() => {
    if (recipeId && user) {
      fetchUserRating();
    }
  }, [recipeId, user]);

  const fetchUserRating = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/rating`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.rating !== null) {
          setUserRating(data.rating);
        }
      }
    } catch (error) {
      // Silently fail - user rating is optional
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'md': return 'w-5 h-5';
      case 'lg': return 'w-6 h-6';
      case 'xl': return 'w-8 h-8';
      default: return 'w-5 h-5';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-sm';
      case 'md': return 'text-base';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      default: return 'text-base';
    }
  };

  const handleStarClick = async (starValue: number) => {
    if (!interactive || !recipeId) return;

    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to rate recipes',
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/recipes/${recipeId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: starValue }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentRating(data.averageRating);
        setUserRating(starValue);
        onRatingChange?.(data.averageRating);
        toast({
          title: 'Rating submitted!',
          description: `You rated this recipe ${starValue} star${starValue !== 1 ? 's' : ''}`,
          type: 'success',
        });
      } else {
        throw new Error('Failed to submit rating');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit rating. Please try again.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarHover = (starValue: number) => {
    if (interactive && !isSubmitting) {
      setHoverRating(starValue);
    }
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const renderStars = () => {
    const stars = [];
    const displayRating = hoverRating || currentRating;
    const fullStars = Math.floor(displayRating);
    const hasHalfStar = displayRating % 1 >= 0.5;
    const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

    // Full stars
    for (let i = 1; i <= fullStars; i++) {
      stars.push(
        <button
          key={`full-${i}`}
          type="button"
          onClick={() => handleStarClick(i)}
          onMouseEnter={() => handleStarHover(i)}
          disabled={!interactive || isSubmitting}
          className={cn(
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded',
            interactive && !isSubmitting && 'cursor-pointer hover:scale-110 transition-transform',
            isSubmitting && 'cursor-not-allowed opacity-50'
          )}
        >
          <Star
            className={cn(
              getSizeClasses(),
              'text-yellow-500 fill-yellow-500',
              interactive && 'transition-colors duration-200'
            )}
          />
        </button>
      );
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <button
          key="half"
          type="button"
          onClick={() => handleStarClick(fullStars + 0.5)}
          onMouseEnter={() => handleStarHover(fullStars + 0.5)}
          disabled={!interactive || isSubmitting}
          className={cn(
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded',
            interactive && !isSubmitting && 'cursor-pointer hover:scale-110 transition-transform',
            isSubmitting && 'cursor-not-allowed opacity-50'
          )}
        >
          <StarHalf
            className={cn(
              getSizeClasses(),
              'text-yellow-500 fill-yellow-500',
              interactive && 'transition-colors duration-200'
            )}
          />
        </button>
      );
    }

    // Empty stars
    for (let i = 1; i <= emptyStars; i++) {
      const starValue = fullStars + (hasHalfStar ? 1 : 0) + i;
      stars.push(
        <button
          key={`empty-${starValue}`}
          type="button"
          onClick={() => handleStarClick(starValue)}
          onMouseEnter={() => handleStarHover(starValue)}
          disabled={!interactive || isSubmitting}
          className={cn(
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded',
            interactive && !isSubmitting && 'cursor-pointer hover:scale-110 transition-transform',
            isSubmitting && 'cursor-not-allowed opacity-50'
          )}
        >
          <Star
            className={cn(
              getSizeClasses(),
              'text-gray-300 dark:text-gray-600',
              interactive && 'hover:text-yellow-400 transition-colors duration-200'
            )}
          />
        </button>
      );
    }

    return stars;
  };

  const getRatingText = () => {
    if (showValue) {
      return (
        <span className={cn('font-semibold text-gray-900 dark:text-white', getTextSize())}>
          {currentRating.toFixed(1)}
        </span>
      );
    }
    return null;
  };

  const getCountText = () => {
    if (showCount && count !== undefined) {
      return (
        <span className={cn('text-gray-600 dark:text-gray-400', getTextSize())}>
          ({count})
        </span>
      );
    }
    return null;
  };

  const getUserRatingText = () => {
    if (userRating !== null && interactive) {
      return (
        <span className="text-sm text-primary-600 dark:text-primary-400 font-medium ml-2">
          Your rating: {userRating}
        </span>
      );
    }
    return null;
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div
        className="flex items-center gap-2"
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center gap-1">
          {renderStars()}
        </div>
        <div className="flex items-center gap-1">
          {getRatingText()}
          {getCountText()}
          {getUserRatingText()}
        </div>
      </div>
      
      {interactive && !user && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sign in to rate this recipe
        </p>
      )}
      
      {isSubmitting && (
        <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
          Submitting rating...
        </p>
      )}
    </div>
  );
}