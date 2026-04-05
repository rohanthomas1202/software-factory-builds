import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default async function HomePage() {
  const user = await getCurrentUser();
  
  // Redirect logged-in users to dashboard
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg"></div>
            <span className="text-xl font-bold text-gray-900">InvoiceFlow</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/login" 
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Sign In
            </Link>
            <Link href="/register">
              <Button variant="primary">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Invoice Management
            <span className="block text-blue-600">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Create professional invoices, manage clients, and get paid faster. 
            Built for freelancers who value their time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/register" className="inline-block">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login" className="inline-block">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <div className="h-6 w-6 text-blue-600">📄</div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Professional Invoices
              </h3>
              <p className="text-gray-600">
                Create beautiful, branded invoices with automatic calculations and tax support.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <div className="h-6 w-6 text-blue-600">📧</div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Email Delivery
              </h3>
              <p className="text-gray-600">
                Send invoices directly to clients via email with PDF attachments.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <div className="h-6 w-6 text-blue-600">📊</div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Real-time Dashboard
              </h3>
              <p className="text-gray-600">
                Track paid and overdue invoices with our simple, intuitive dashboard.
              </p>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 mb-8">
              Start free, upgrade when you need more.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="border border-gray-200 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900 mb-4">
                  $0<span className="text-lg text-gray-500">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <div className="h-5 w-5 text-green-500 mr-2">✓</div>
                    <span>5 clients</span>
                  </li>
                  <li className="flex items-center">
                    <div className="h-5 w-5 text-green-500 mr-2">✓</div>
                    <span>10 invoices/month</span>
                  </li>
                  <li className="flex items-center">
                    <div className="h-5 w-5 text-green-500 mr-2">✓</div>
                    <span>PDF generation</span>
                  </li>
                  <li className="flex items-center">
                    <div className="h-5 w-5 text-green-500 mr-2">✓</div>
                    <span>Email delivery</span>
                  </li>
                </ul>
                <Link href="/register">
                  <Button variant="outline" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
              
              <div className="border-2 border-blue-600 rounded-xl p-6 bg-blue-50">
                <div className="inline-block px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full mb-4">
                  Most Popular
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                <div className="text-4xl font-bold text-gray-900 mb-4">
                  $12<span className="text-lg text-gray-500">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <div className="h-5 w-5 text-green-500 mr-2">✓</div>
                    <span>Unlimited clients</span>
                  </li>
                  <li className="flex items-center">
                    <div className="h-5 w-5 text-green-500 mr-2">✓</div>
                    <span>Unlimited invoices</span>
                  </li>
                  <li className="flex items-center">
                    <div className="h-5 w-5 text-green-500 mr-2">✓</div>
                    <span>Custom branding</span>
                  </li>
                  <li className="flex items-center">
                    <div className="h-5 w-5 text-green-500 mr-2">✓</div>
                    <span>Priority support</span>
                  </li>
                </ul>
                <Link href="/register">
                  <Button variant="primary" className="w-full">
                    Upgrade to Pro
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <p className="text-gray-600 mb-8">
              Join thousands of freelancers who trust InvoiceFlow to manage their billing.
            </p>
            <Link href="/register">
              <Button variant="primary" size="lg">
                Create Your First Invoice Today
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 bg-white rounded-lg"></div>
                <span className="text-xl font-bold">InvoiceFlow</span>
              </div>
              <p className="text-gray-400">
                Simple invoicing for freelancers
              </p>
            </div>
            <div className="text-gray-400 text-center md:text-right">
              <p>© {new Date().getFullYear()} InvoiceFlow. All rights reserved.</p>
              <p className="mt-2">
                <Link href="/login" className="hover:text-white">
                  Terms & Privacy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}