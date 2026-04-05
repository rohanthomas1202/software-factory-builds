import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ArrowRight, CheckCircle, Users, BarChart3, Zap, Shield, Globe, Sparkles, Trello, Clock, TrendingUp, FolderKanban } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-gray-50 dark:to-gray-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Trello className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">KanbanFlow</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              How it Works
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50/20 to-transparent dark:from-blue-950/10" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-blue-300">
              <Sparkles className="mr-2 h-3 w-3" />
              Trusted by 10,000+ teams worldwide
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Visualize Your
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Workflow, Amplify
              </span>
              Productivity
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              KanbanFlow is the collaborative project management platform that helps teams visualize workflows, organize tasks, and track progress with beautiful kanban boards.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 hover:from-blue-600 hover:to-purple-700">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button size="lg" variant="outline">
                  <FolderKanban className="mr-2 h-5 w-5" />
                  View Live Demo
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <span>Unlimited team members</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need for
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                seamless collaboration
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From intuitive kanban boards to powerful analytics, we've got you covered.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all hover:border-blue-300 hover:shadow-xl dark:hover:border-blue-700">
              <div className="absolute right-4 top-4 h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 opacity-0 transition-opacity group-hover:opacity-100 dark:from-blue-900/20 dark:to-purple-900/20" />
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <Trello className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold">Smart Kanban Boards</h3>
              <p className="mt-2 text-muted-foreground">
                Drag-and-drop interface with customizable columns, swimlanes, and WIP limits for optimal workflow management.
              </p>
              <ul className="mt-6 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Real-time updates</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Custom workflows</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Keyboard shortcuts</span>
                </li>
              </ul>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all hover:border-blue-300 hover:shadow-xl dark:hover:border-blue-700">
              <div className="absolute right-4 top-4 h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 opacity-0 transition-opacity group-hover:opacity-100 dark:from-blue-900/20 dark:to-purple-900/20" />
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold">Team Collaboration</h3>
              <p className="mt-2 text-muted-foreground">
                Work together seamlessly with task assignments, comments, mentions, and real-time notifications.
              </p>
              <ul className="mt-6 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">@mentions & comments</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">File attachments</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Activity feeds</span>
                </li>
              </ul>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all hover:border-blue-300 hover:shadow-xl dark:hover:border-blue-700">
              <div className="absolute right-4 top-4 h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 opacity-0 transition-opacity group-hover:opacity-100 dark:from-blue-900/20 dark:to-purple-900/20" />
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold">Powerful Analytics</h3>
              <p className="mt-2 text-muted-foreground">
                Gain insights with burndown charts, cycle time reports, and team performance metrics.
              </p>
              <ul className="mt-6 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Progress tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Custom reports</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Export to PDF/CSV</span>
                </li>
              </ul>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all hover:border-blue-300 hover:shadow-xl dark:hover:border-blue-700">
              <div className="absolute right-4 top-4 h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 opacity-0 transition-opacity group-hover:opacity-100 dark:from-blue-900/20 dark:to-purple-900/20" />
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold">Automation</h3>
              <p className="mt-2 text-muted-foreground">
                Automate repetitive tasks with custom rules, triggers, and actions to save time and reduce errors.
              </p>
              <ul className="mt-6 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Custom rules engine</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Slack & email integrations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Scheduled actions</span>
                </li>
              </ul>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all hover:border-blue-300 hover:shadow-xl dark:hover:border-blue-700">
              <div className="absolute right-4 top-4 h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 opacity-0 transition-opacity group-hover:opacity-100 dark:from-blue-900/20 dark:to-purple-900/20" />
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold">Enterprise Security</h3>
              <p className="mt-2 text-muted-foreground">
                Bank-level security with SSO, 2FA, audit logs, and granular permissions for complete control.
              </p>
              <ul className="mt-6 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">SOC 2 compliant</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">GDPR ready</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Role-based access</span>
                </li>
              </ul>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all hover:border-blue-300 hover:shadow-xl dark:hover:border-blue-700">
              <div className="absolute right-4 top-4 h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 opacity-0 transition-opacity group-hover:opacity-100 dark:from-blue-900/20 dark:to-purple-900/20" />
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                <Globe className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold">Global Accessibility</h3>
              <p className="mt-2 text-muted-foreground">
                Access your boards from anywhere with our mobile apps, offline mode, and 99.9% uptime guarantee.
              </p>
              <ul className="mt-6 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Mobile apps</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Offline support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Multi-language</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 p-8 sm:p-12 lg:p-16">
            <div className="absolute right-0 top-0 h-64 w-64 -translate-y-32 translate-x-32 rounded-full bg-white/10 blur-3xl" />
            <div className="relative z-10 mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to transform your team's productivity?
              </h2>
              <p className="mt-4 text-lg text-blue-100">
                Join thousands of teams who have streamlined their workflows with KanbanFlow.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/register">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Schedule a Demo
                  </Button>
                </Link>
              </div>
              <div className="mt-8 text-sm text-blue-200">
                <p>No credit card required • 14-day free trial • Cancel anytime</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Trello className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">KanbanFlow</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Cookie Policy
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Contact
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Status
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} KanbanFlow. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}