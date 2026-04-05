'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Label } from '@/components/UI/Label';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, Sparkles, Users, BarChart3, Zap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, login } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success('Welcome back!');
        router.push('/dashboard');
      } else {
        toast.error('Invalid email or password');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      const success = await login('demo@example.com', 'demo123');
      if (success) {
        toast.success('Welcome to the demo!');
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error('Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        {/* Left side - Branding & Features */}
        <div className="relative hidden h-full flex-col bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 p-10 text-white lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10" />
          
          <div className="relative z-20 flex items-center text-lg font-medium">
            <Sparkles className="mr-2 h-6 w-6" />
            Kanban Team Collaboration
          </div>
          
          <div className="relative z-20 mt-auto">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight">
                Streamline Your Team&apos;s Workflow
              </h1>
              <p className="text-lg text-gray-300">
                A modern project management tool that combines visual Kanban boards with real-time team collaboration.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-500/20 p-2">
                      <Users className="h-5 w-5 text-blue-400" />
                    </div>
                    <span className="font-medium">Team Collaboration</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Real-time updates and contextual communication
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="rounded-lg bg-purple-500/20 p-2">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                  </div>
                  <span className="font-medium">Progress Tracking</span>
                  <p className="text-sm text-gray-400">
                    Visual insights into team performance
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="rounded-lg bg-green-500/20 p-2">
                    <Zap className="h-5 w-5 text-green-400" />
                  </div>
                  <span className="font-medium">Fast & Responsive</span>
                  <p className="text-sm text-gray-400">
                    Lightning-fast drag and drop interface
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="rounded-lg bg-orange-500/20 p-2">
                    <Lock className="h-5 w-5 text-orange-400" />
                  </div>
                  <span className="font-medium">Secure & Private</span>
                  <p className="text-sm text-gray-400">
                    Enterprise-grade security for your data
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Welcome back
              </h1>
              <p className="text-sm text-gray-400">
                Enter your credentials to access your workspace
              </p>
            </div>
            
            <div className="rounded-2xl bg-gray-800/50 backdrop-blur-sm p-8 border border-gray-700/50">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gray-800/50 px-2 text-gray-500">Or continue with</span>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-gray-700 bg-gray-900/50 text-gray-300 hover:bg-gray-800 hover:text-white"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Try Demo Account
                </Button>
              </form>
              
              <div className="mt-6 text-center text-sm text-gray-500">
                <p>
                  Don&apos;t have an account?{' '}
                  <Link
                    href="#"
                    className="font-medium text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      toast.success('Contact your administrator for account creation');
                    }}
                  >
                    Request access
                  </Link>
                </p>
              </div>
            </div>
            
            <div className="text-center text-xs text-gray-500">
              <p>
                By continuing, you agree to our{' '}
                <Link href="#" className="underline underline-offset-4 hover:text-gray-400">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="#" className="underline underline-offset-4 hover:text-gray-400">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}