'use client';

import { ReactNode } from 'react';
import NavBar from '@/components/NavBar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {children}
        </div>
      </main>
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-500 text-sm">
        <p>Personal Finance Tracker • Built with Next.js & TypeScript</p>
        <p className="mt-1">Data is stored in memory and will reset on server restart</p>
      </footer>
    </div>
  );
}