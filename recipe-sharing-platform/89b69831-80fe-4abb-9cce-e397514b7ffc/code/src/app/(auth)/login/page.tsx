import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { LoginForm } from '@/components/auth/LoginForm';
import { getCurrentUser } from '@/lib/auth';
import { ChefHat, Apple, Facebook, Github } from 'lucide-react';

export const metadata = {
  title: 'Login - RecipeShare',
  description: 'Login to your RecipeShare account',
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  
  // If user is already logged in, redirect to home
  if (user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="w-full max-w-md">
            {/* Logo and Header */}
            <div className="mb-8 text-center">
              <Link href="/" className="inline-flex items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500">
                  <ChefHat className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  Recipe<span className="text-primary-600 dark:text-primary-400">Share</span>
                </span>
              </Link>
              <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Sign in to your account to continue your culinary journey
              </p>
            </div>

            {/* Login Form */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900">
              <LoginForm />

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  fullWidth
                >
                  <Github className="h-4 w-4" />
                  <span className="sr-only">GitHub</span>
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  fullWidth
                >
                  <Facebook className="h-4 w-4 text-blue-600" />
                  <span className="sr-only">Facebook</span>
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  fullWidth
                >
                  <Apple className="h-4 w-4" />
                  <span className="sr-only">Apple</span>
                </Button>
              </div>

              {/* Sign Up Link */}
              <div className="mt-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/register"
                    className="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Sign up for free
                  </Link>
                </p>
              </div>

              {/* Terms */}
              <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-500">
                By continuing, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                  Privacy Policy
                </Link>
              </p>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Demo Credentials
              </h3>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Try out the platform with these test accounts:
              </p>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Username:</span>
                  <code className="rounded bg-gray-200 px-2 py-1 font-mono text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                    chef_john
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Password:</span>
                  <code className="rounded bg-gray-200 px-2 py-1 font-mono text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                    password123
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}