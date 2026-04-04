'use client';

import Link from 'next/link';
import { User } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ChefHat, TrendingUp, Users, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendingChefsProps {
  chefs: User[];
  className?: string;
}

export function TrendingChefs({ chefs, className }: TrendingChefsProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary-500" />
            Trending Chefs
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Discover popular recipe creators
          </p>
        </div>
        <Link href="/chefs">
          <Button variant="ghost" size="sm">
            View all
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chefs.map((chef, index) => (
          <Link
            key={chef.id}
            href={`/profile/${chef.username}`}
            className="group block"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 group-hover:border-primary-300 dark:group-hover:border-primary-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar
                      src={chef.avatarUrl}
                      alt={chef.displayName}
                      size="lg"
                      border
                    />
                    {index < 3 && (
                      <div className="absolute -top-2 -right-2">
                        <Badge
                          variant={index === 0 ? 'warning' : index === 1 ? 'secondary' : 'primary'}
                          size="sm"
                          className="font-bold"
                        >
                          #{index + 1}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {chef.displayName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{chef.username}
                    </p>
                  </div>
                </div>
                <ChefHat className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>

              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                {chef.bio || 'Passionate recipe creator'}
              </p>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {chef.followers.length}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">followers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ChefHat className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {chef.recipeCount}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">recipes</span>
                  </div>
                </div>
                <Badge variant="success" size="sm">
                  <Star className="w-3 h-3 mr-1" />
                  Top Chef
                </Badge>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}