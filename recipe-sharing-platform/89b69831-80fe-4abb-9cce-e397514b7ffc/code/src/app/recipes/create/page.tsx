'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { RecipeForm } from '@/components/recipe/RecipeForm';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ChefHat, AlertCircle, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function CreateRecipePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (!authLoading) {
      if (!isAuthenticated || !user) {
        toast({
          title: 'Authentication Required',
          description: 'You need to be logged in to create a recipe',
          type: 'error',
        });
        router.push('/login?redirect=/recipes/create');
      } else {
        setIsCheckingAuth(false);
      }
    }
  }, [authLoading, isAuthenticated, user, router, toast]);

  if (authLoading || isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" label="Checking authentication..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Link href="/recipes">
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back to Recipes
                  </Button>
                </Link>
              </div>
              
              <div className="hidden md:flex items-center gap-2">
                <ChefHat className="w-8 h-8" />
                <span className="text-xl font-bold">RecipeShare</span>
              </div>
            </div>
            
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-6">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Share Your Culinary Creation
              </h1>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Fill in the details below to share your delicious recipe with the RecipeShare community
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Tips & Guidelines */}
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Recipe Creation Tips
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Be specific with measurements and cooking times</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Include helpful tips and variations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Use descriptive titles and engaging descriptions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Add relevant tags to help others discover your recipe</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Recipe Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              <RecipeForm />
            </div>
          </div>

          {/* User Info */}
          <div className="mt-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
                  {user?.displayName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">
                    Sharing as {user?.displayName || user?.username}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your recipe will be published under your profile
                  </p>
                </div>
              </div>
              <Link href={`/profile/${user?.username}`}>
                <Button variant="outline">
                  View Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}