'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/UI/Button';
import Link from 'next/link';
import { 
  ArrowRight, 
  CheckCircle, 
  Users, 
  BarChart3, 
  Zap, 
  Shield, 
  Sparkles,
  TrendingUp,
  Clock,
  Globe,
  MessageSquare,
  Layers,
  GitBranch,
  Lock,
  Bell,
  Target,
  Cloud,
  Heart
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  const features = [
    {
      icon: <Layers className="h-6 w-6" />,
      title: 'Visual Kanban Boards',
      description: 'Drag and drop interface to organize tasks across customizable workflow stages.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Real-time Collaboration',
      description: 'Work together with your team through live updates, comments, and mentions.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Progress Analytics',
      description: 'Track team performance and project progress with detailed insights.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <Bell className="h-6 w-6" />,
      title: 'Smart Notifications',
      description: 'Stay informed with contextual notifications and activity feeds.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: 'Goal Tracking',
      description: 'Set and track project goals with clear milestones and deadlines.',
      color: 'from-indigo-500 to-blue-500'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Enterprise Security',
      description: 'Bank-level security with role-based access control and audit logs.',
      color: 'from-gray-700 to-gray-900'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Product Manager at TechCorp',
      content: 'Reduced our project coordination time by 40%. The visual workflow makes everything so clear.',
      avatar: 'SC'
    },
    {
      name: 'Marcus Johnson',
      role: 'Engineering Lead at StartupXYZ',
      content: 'Our team velocity increased by 30% after switching to this tool. The collaboration features are game-changing.',
      avatar: 'MJ'
    },
    {
      name: 'Elena Rodriguez',
      role: 'Design Director at CreativeCo',
      content: 'Finally, a tool that both designers and developers love to use. It just works.',
      avatar: 'ER'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold">Kanban Team Collaboration</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10" />
        <div className="container relative mx-auto max-w-7xl">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-gray-700 bg-gray-800/50 px-4 py-2 text-sm">
              <Sparkles className="mr-2 h-4 w-4 text-yellow-400" />
              Trusted by 500+ teams worldwide
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Streamline Your Team&apos;s
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Workflow & Collaboration
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-400">
              A modern project management tool that combines visual Kanban boards with real-time team collaboration. 
              Reduce coordination overhead and boost productivity.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-6 text-lg font-semibold"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-gray-700 bg-gray-800/50 hover:bg-gray-800 px-8 py-6 text-lg"
                onClick={() => router.push('/login?demo=true')}
              >
                <Zap className="mr-2 h-5 w-5" />
                Try Live Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Everything Your Team Needs
            </h2>
            <p className="mx-auto max-w-2xl text-gray-400">
              Built with modern teams in mind. All the features you need, none of the complexity.
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 p-6 transition-all duration-300 hover:border-gray-700 hover:bg-gray-900 hover:shadow-xl hover:shadow-blue-500/10"
              >
                <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-r ${feature.color} p-3`}>
                  <div className="text-white">{feature.icon}</div>
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid gap-8 rounded-3xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800 p-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-blue-400">40%</div>
              <div className="text-gray-400">Faster Project Completion</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-purple-400">30%</div>
              <div className="text-gray-400">Reduced Meeting Time</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-green-400">99.9%</div>
              <div className="text-gray-400">Uptime Reliability</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-pink-400">500+</div>
              <div className="text-gray-400">Happy Teams</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Loved by Teams Worldwide
            </h2>
            <p className="mx-auto max-w-2xl text-gray-400">
              See what teams are saying about their experience.
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-gray-300">&ldquo;{testimonial.content}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 p-8 sm:p-12">
            <div className="relative z-10 text-center">
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                Ready to Transform Your Team&apos;s Workflow?
              </h2>
              <p className="mb-8 text-xl text-gray-300">
                Join thousands of teams who have streamlined their project management.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button
                  onClick={handleGetStarted}
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-6 text-lg font-semibold"
                >
                  Get Started For Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white bg-transparent text-white hover:bg-white/10 px-8 py-6 text-lg"
                  onClick={() => router.push('/login?demo=true')}
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Try Demo First
                </Button>
              </div>
              <p className="mt-6 text-sm text-gray-400">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-4 py-12 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold">Kanban Team Collaboration</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="#" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Security
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Contact
              </Link>
            </div>
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} Kanban Team Collaboration. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}