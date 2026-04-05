'use client';

import { DashboardSummary } from '@/lib/types';

interface SummaryCardsProps {
  summary: DashboardSummary;
  isLoading?: boolean;
  className?: string;
}

export default function SummaryCards({
  summary,
  isLoading = false,
  className = '',
}: SummaryCardsProps) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Income',
      amount: summary.totalIncomeCents,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-100',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Total Expenses',
      amount: summary.totalExpensesCents,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-100',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Net Balance',
      amount: summary.netCents,
      color: summary.netCents >= 0 ? 'text-blue-600' : 'text-amber-600',
      bgColor: summary.netCents >= 0 ? 'bg-blue-50' : 'bg-amber-50',
      borderColor: summary.netCents >= 0 ? 'border-blue-100' : 'border-amber-100',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {cards.map((card) => (
        <div
          key={card.title}
          className={`${card.bgColor} border ${card.borderColor} rounded-xl p-6 transition-all hover:shadow-md`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 font-medium">{card.title}</h3>
            <div className={card.color}>{card.icon}</div>
          </div>
          <div className={`text-3xl font-bold ${card.color}`}>
            {formatCurrency(card.amount)}
          </div>
          {card.title === 'Net Balance' && (
            <div className="mt-3 text-sm text-gray-500">
              {summary.netCents >= 0 ? 'Positive cash flow' : 'Negative cash flow'} this month
            </div>
          )}
        </div>
      ))}
    </div>
  );
}