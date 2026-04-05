'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/categories', label: 'Categories' },
  { href: '/budget', label: 'Budget' },
  { href: '/charts', label: 'Charts' },
];

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        router.push('/login');
        router.refresh();
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href="/dashboard" 
              className="text-xl font-bold tracking-tight hover:text-blue-100 transition-colors"
            >
              💰 Finance Tracker
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-white/20 text-white'
                    : 'hover:bg-white/10 hover:text-blue-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="ml-4 px-4 py-2 bg-white/20 hover:bg-white/30 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging out...' : 'Logout'}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-white/20 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-blue-700/95 backdrop-blur-sm">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === item.href
                    ? 'bg-white/20 text-white'
                    : 'hover:bg-white/10 hover:text-blue-100'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}