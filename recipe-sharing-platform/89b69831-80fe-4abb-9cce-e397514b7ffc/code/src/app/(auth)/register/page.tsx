import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { getCurrentUser } from '@/lib/auth';
import { ChefHat, Apple, Facebook, Github, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Register - RecipeShare',
  description: 'Create a new RecipeShare account',
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  
  // If user is already logged in, redirect to home
  if (user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="w-full max-w-4xl">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Left Column - Form */}
              <div>
                {/* Logo and Header */}
                <div className="mb-8">
                  <Link href="/" className="inline-flex items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500">
                      <ChefHat className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      Recipe<span className="text-primary-600 dark:text-primary-400">Share</span>
                    </span>
                  </Link>
                  <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
                    Join our culinary community
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Share your recipes, discover new dishes, and connect with food lovers worldwide
                  </p>
                </div>

                {/* Registration Form */}
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900">
                  <RegisterForm />

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                        Or sign up with
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

                  {/* Login Link */}
                  <div className="mt-8 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                      Already have an account?{' '}
                      <Link
                        href="/login"
                        className="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        Sign in here
                      </Link>
                    </p>
                  </div>

                  {/* Terms */}
                  <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-500">
                    By creating an account, you agree to our{' '}
                    <Link href="/terms" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </div>

              {/* Right Column - Benefits */}
              <div className="flex flex-col justify-center">
                <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 p-8 text-white shadow-xl">
                  <h2 className="text-2xl font-bold">Why Join RecipeShare?</h2>
                  <p className="mt-2 text-primary-100">
                    Become part of the world&apos;s largest community of food enthusiasts
                  </p>

                  <div className="mt-8 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                        <ChefHat className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Share Your Creations</h3>
                        <p className="mt-1 text-sm text-primary-100">
                          Upload your favorite recipes with step-by-step instructions and photos
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Discover Amazing Recipes</h3>
                        <p className="mt-1 text-sm text-primary-100">
                          Find thousands of recipes from home cooks and professional chefs worldwide
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                        <ChefHat className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Connect with Food Lovers</h3>
                        <p className="mt-1 text-sm text-primary-100">
                          Follow your favorite chefs, join discussions, and build your culinary network
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Personalized Experience</h3>
                        <p className="mt-1 text-sm text-primary-100">
                          Get recipe recommendations based on your preferences and cooking history
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/20 pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">50K+</div>
                      <div className="text-sm text-primary-100">Recipes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">10K+</div>
                      <div className="text-sm text-primary-100">Chefs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">1M+</div>
                      <div className="text-sm text-primary-100">Food Lovers</div>
                    </div>
                  </div>
                </div>

                {/* Testimonial */}
                <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400" />
                    <div>
                      <p className="text-sm italic text-gray-600 dark:text-gray-400">
                        &ldquo;RecipeShare transformed how I cook. I&apos;ve discovered amazing recipes and made friends with fellow food enthusiasts from around the world!&rdquo;
                      </p>
                      <div className="mt-2">
                        <div className="font-semibold text-gray-900 dark:text-white">Sarah Chen</div>
                        <div className="text-sm text-gray-500 dark:text-gray-500">Home Cook & Food Blogger</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}