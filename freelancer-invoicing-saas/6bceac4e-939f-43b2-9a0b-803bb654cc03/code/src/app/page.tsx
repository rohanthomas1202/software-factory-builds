```tsx
import Link from 'next/link'
import { ArrowRight, CheckCircle, CreditCard, FileText, Globe, Shield, TrendingUp, Users, Zap, Sparkles, Star, BarChart, Clock, DollarSign, Mail, ShieldCheck, Globe as GlobeIcon, Lock, PieChart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

export const metadata = {
  title: 'InvoiceFlow - Professional Invoicing for Freelancers',
  description: 'Create, send, and track invoices effortlessly. Get paid faster with automated reminders and professional billing tools.',
}

export default function HomePage() {
  const features = [
    {
      icon: <FileText className="h-6 w-6" />,
      title: 'Professional Invoices',
      description: 'Create beautiful, customizable invoices that impress clients and get you paid faster.',
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Automated Reminders',
      description: 'Set up automatic payment reminders to reduce late payments and follow-ups.',
    },
    {
      icon: <GlobeIcon className="h-6 w-6" />,
      title: 'Multi-Currency',
      description: 'Bill international clients in their local currency with real-time exchange rates.',
    },
    {
      icon: <BarChart className="h-6 w-6" />,
      title: 'Financial Reports',
      description: 'Track your income, expenses, and profitability with detailed analytics.',
    },
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: 'Tax Compliant',
      description: 'Automatically calculate taxes and generate reports for tax season.',
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: 'Client Portal',
      description: 'Let clients view invoices, make payments, and download receipts in one place.',
    },
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Freelance Designer',
      content: 'InvoiceFlow cut my invoicing time in half. The automated reminders alone have improved my cash flow significantly.',
      avatar: 'SC',
    },
    {
      name: 'Marcus Johnson',
      role: 'Software Developer',
      content: 'As someone who works with international clients, the multi-currency support is a game-changer. Highly recommended!',
      avatar: 'MJ',
    },
    {
      name: 'Elena Rodriguez',
      role: 'Marketing Consultant',
      content: 'The reporting features give me clear insights into my business finances. It\'s like having a financial assistant.',
      avatar: 'ER',
    },
  ]

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        'Up to 5 invoices/month',
        'Basic invoice templates',
        'Email support',
        'Client management',
        'Payment tracking',
      ],
      cta: 'Get Started Free',
      highlighted: false,
    },
    {
      name: 'Professional',
      price: '$12',
      period: 'per month',
      description: 'For growing freelancers',
      features: [
        'Unlimited invoices',
        'Advanced templates',
        'Automated reminders',
        'Multi-currency support',
        'Financial reports',
        'Priority support',
      ],
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      name: 'Business',
      price: '$24',
      period: 'per month',
      description: 'For established professionals',
      features: [
        'Everything in Professional',
        'Team collaboration',
        'Custom branding',
        'API access',
        'White-label portal',
        'Dedicated account manager',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Trusted by 10,000+ freelancers worldwide
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Get Paid Faster with
              <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Professional Invoicing
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground">
              Create beautiful invoices, track payments, and automate your billing workflow. 
              Designed specifically for freelancers who value their time.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="group px-8 py-6 text-lg" asChild>
                <Link href="/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg" asChild>
                <Link href="#features">
                  See Features
                </Link>
              </Button>
            </div>
          </div>

          {/* Hero Image/Preview */}
          <div className="relative mt-20">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/20 to-primary/10 blur-3xl" />
            <div className="relative rounded-2xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm">
              <div className="overflow-hidden rounded-xl border border-border shadow-2xl">
                <div className="flex items-center justify-between border-b border-border bg-muted/50 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">Invoice Preview</div>
                  <div className="h-6 w-20 rounded-full bg-muted" />
                </div>
                <div className="bg-white p-8 dark:bg-gray-900">
                  <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <div className="space-y-6">
                      <div>
                        <div className="h-4 w-32 rounded-full bg-muted" />
                        <div className="mt-2 h-8 w-48 rounded-lg bg-muted" />
                      </div>
                      <div className="space-y-4">
                        <div className="h-4 w-24 rounded-full bg-muted" />
                        <div className="h-10 rounded-lg bg-muted" />
                      </div>
                      <div className="space-y-4">
                        <div className="h-4 w-20 rounded-full bg-muted" />
                        <div className="h-32 rounded-lg bg-muted" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="rounded-lg border border-border p-6">
                        <div className="mb-4 h-4 w-40 rounded-full bg-muted" />
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="h-3 w-24 rounded-full bg-muted" />
                              <div className="h-3 w-16 rounded-full bg-muted" />
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 border-t border-border pt-4">
                          <div className="flex items-center justify-between">
                            <div className="h-4 w-20 rounded-full bg-muted" />
                            <div className="h-6 w-24 rounded-full bg-primary/20" />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="h-10 flex-1 rounded-lg bg-primary/10" />
                        <div className="h-10 flex-1 rounded-lg bg-muted" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to manage your billing
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground">
              Streamline your invoicing process with powerful features designed for modern freelancers.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="group border-border/50 bg-card/50 transition-all hover:border-primary/50 hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 rounded-3xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">50%</div>
              <div className="text-sm text-muted-foreground">Less time spent on invoicing</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">2.5x</div>
              <div className="text-sm text-muted-foreground">Faster payment collection</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">10k+</div>
              <div className="text-sm text-muted-foreground">Freelancers trust InvoiceFlow</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">4.9/5</div>
              <div className="text-sm text-muted-foreground">Average user rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Loved by freelancers worldwide
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground">
              See what other freelancers are saying about InvoiceFlow.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border/50 bg-card/50">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{testimonial.content}</p>
                  <div className="mt-4 flex text-yellow-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground">
              Start free, upgrade as you grow. No hidden fees, no surprises.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative border-2 transition-all hover:shadow-xl ${plan.highlighted ? 'border-primary bg-primary/5' : 'border-border/50'}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground">
                      Most Popular
                    </div>
                  </div>
                )}
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="ml-2 text-muted-foreground">/{plan.period}</span>
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <div className="px-6 pb-6">
                  <Button 
                    className={`w-full ${plan.highlighted ? '' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                    variant={plan.highlighted ? 'default' : 'outline'}
                    size="lg"
                    asChild
                  >
                    <Link href={plan.name === 'Business' ? '/contact' : '/register'}>
                      {plan.cta}
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center backdrop-blur-sm sm:p-12">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ready to streamline your invoicing?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
              Join thousands of freelancers who trust InvoiceFlow to handle their billing.
              Start your free trial today — no credit card required.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="px-8 py-6 text-lg" asChild>
                <Link href="/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg" asChild>
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Free 14-day trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">InvoiceFlow</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional invoicing made simple for freelancers worldwide.
              </p>
            </div>
            <div>
              <h3 className="mb-4 font-semibold">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="/api" className="hover:text-foreground">API</Link></li>
                <li><Link href="/changelog" className="hover:text-foreground">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/docs" className="hover:text-foreground">Documentation</Link></li>
                <li><Link href="/support" className="hover:text-foreground">Support</Link></li>
                <li><Link href="/community" className="hover:text-foreground">Community</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-foreground">Cookie Policy</Link></li>
                <li><Link href="/security" className="hover:text-foreground">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} InvoiceFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
```