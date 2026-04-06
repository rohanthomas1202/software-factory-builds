import Link from "next/link";
import { CheckCircle, FileText, Send, Shield, Zap, Users, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const features = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Professional Invoices",
      description: "Create beautiful, customizable invoices that impress clients and get paid faster.",
    },
    {
      icon: <Send className="w-6 h-6" />,
      title: "Instant Delivery",
      description: "Send invoices directly to client email with one click. Track when they're opened.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Payments",
      description: "Integrated with Stripe for secure online payments. Multiple currency support.",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Auto-Reminders",
      description: "Automatically send payment reminders for overdue invoices. Save time chasing payments.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Client Management",
      description: "Store client information, payment history, and notes in one organized place.",
    },
    {
      icon: <BarChart className="w-6 h-6" />,
      title: "Financial Insights",
      description: "Dashboard with revenue trends, outstanding balances, and tax season reports.",
    },
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: ["Up to 3 invoices/month", "Basic templates", "Email delivery", "Client management"],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$12",
      period: "per month",
      description: "For growing freelancers",
      features: ["Unlimited invoices", "Advanced templates", "Auto-reminders", "Payment tracking", "Tax reports", "Priority support"],
      cta: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Business",
      price: "$29",
      period: "per month",
      description: "For teams & agencies",
      features: ["Everything in Pro", "Multi-user access", "Custom branding", "API access", "Dedicated account manager"],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight">
              Invoicing Made
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> Simple</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              Create professional invoices, track payments, and manage clients—all in one place. 
              Designed for freelancers who value their time.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Start Free Trial
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 shadow-sm hover:shadow transition-all duration-200"
              >
                Sign In
              </Link>
            </div>
            <div className="mt-16 relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  <div className="text-center p-8">
                    <FileText className="w-24 h-24 text-blue-600 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-900">Professional Invoice Preview</h3>
                    <p className="text-gray-600 mt-2">Create invoices that get you paid 2x faster</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Everything You Need to Get Paid</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Stop wasting time with manual invoices. Focus on your work while we handle the paperwork.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="relative group p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Get started in minutes, not hours. Simple setup, powerful results.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Create Your Invoice",
                description: "Add line items, set rates, apply taxes. Use our templates or create your own.",
              },
              {
                step: "2",
                title: "Send to Client",
                description: "Email directly from the platform. Get notified when they view it.",
              },
              {
                step: "3",
                title: "Get Paid",
                description: "Accept online payments via Stripe. Track payments and send reminders.",
              },
            ].map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold mx-auto">
                  {step.step}
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              No hidden fees. Cancel anytime. Start with our free plan.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-2xl border p-8",
                  plan.highlighted
                    ? "border-blue-300 shadow-xl ring-1 ring-blue-200"
                    : "border-gray-200 shadow-lg"
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="ml-1 text-gray-600">/{plan.period}</span>
                  </div>
                  <p className="mt-2 text-gray-600">{plan.description}</p>
                </div>
                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="ml-3 text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link
                    href={plan.name === "Business" ? "/contact" : "/register"}
                    className={cn(
                      "block w-full py-3 px-4 text-center rounded-lg font-medium transition-colors",
                      plan.highlighted
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    )}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">Ready to Get Paid Faster?</h2>
            <p className="mt-4 text-xl text-blue-100 max-w-3xl mx-auto">
              Join thousands of freelancers who use InvoiceFlow to streamline their billing.
            </p>
            <div className="mt-10">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Start Your Free Trial
              </Link>
              <p className="mt-4 text-blue-200">No credit card required • 14-day free trial</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-8 h-8 text-white" />
                <span className="text-xl font-bold text-white">InvoiceFlow</span>
              </div>
              <p className="mt-4">Professional invoicing for modern freelancers.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/templates" className="hover:text-white">Templates</Link></li>
                <li><Link href="/api" className="hover:text-white">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
                <li><Link href="/cookies" className="hover:text-white">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p>&copy; {new Date().getFullYear()} InvoiceFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .bg-grid-pattern {
          background-image: linear-gradient(to right, #3b82f6 1px, transparent 1px),
                            linear-gradient(to bottom, #3b82f6 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
}