"use client";

import { MonthlyBudgetSummary } from "@/lib/types";

interface BudgetProgressBarProps {
  summary: MonthlyBudgetSummary;
  showDetails?: boolean;
  className?: string;
}

export default function BudgetProgressBar({ 
  summary, 
  showDetails = true,
  className = "" 
}: BudgetProgressBarProps) {
  const percentageUsed = summary.percentageUsed;
  const isOverLimit = percentageUsed >= 100;
  const isNearLimit = percentageUsed >= 90 && percentageUsed < 100;
  
  // Determine colors based on percentage
  let bgColorClass = "bg-green-500";
  let textColorClass = "text-green-700";
  
  if (isNearLimit) {
    bgColorClass = "bg-yellow-500";
    textColorClass = "text-yellow-700";
  } else if (isOverLimit) {
    bgColorClass = "bg-red-500";
    textColorClass = "text-red-700";
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  // Cap the progress bar at 100% for visual clarity
  const displayPercentage = Math.min(percentageUsed, 100);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        {/* Category Info */}
        <div className="flex items-center space-x-3 flex-1">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: summary.categoryColor }}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-gray-900 truncate">{summary.categoryName}</h4>
            {showDetails && (
              <p className="text-sm text-gray-500 md:hidden">
                {formatCurrency(summary.spentCents)} of {formatCurrency(summary.limitCents)}
              </p>
            )}
          </div>
        </div>

        {/* Progress Bar - takes 3 columns on desktop */}
        <div className="flex-1 md:col-span-3">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-medium ${textColorClass}`}>
              {percentageUsed.toFixed(1)}%
            </span>
            {showDetails && (
              <span className="text-sm text-gray-500 hidden md:inline">
                {formatCurrency(summary.spentCents)} / {formatCurrency(summary.limitCents)}
              </span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${bgColorClass}`}
              style={{ width: `${displayPercentage}%` }}
              role="progressbar"
              aria-valuenow={displayPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${summary.categoryName}: ${percentageUsed.toFixed(1)}% used`}
            />
          </div>
        </div>

        {/* Amounts - hidden on mobile, shown on desktop */}
        {showDetails && (
          <>
            <div className="hidden md:block text-right text-gray-900 font-medium min-w-[100px]">
              {formatCurrency(summary.spentCents)}
            </div>
            <div className="hidden md:block text-right text-gray-600 min-w-[100px]">
              {formatCurrency(summary.limitCents)}
            </div>
            <div className={`hidden md:block text-right font-medium min-w-[100px] ${
              summary.remainingCents >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              {formatCurrency(summary.remainingCents)}
            </div>
          </>
        )}
      </div>

      {/* Mobile details */}
      {showDetails && (
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-100 md:hidden">
          <div className="text-center">
            <p className="text-sm text-gray-500">Spent</p>
            <p className="font-medium text-gray-900">{formatCurrency(summary.spentCents)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Limit</p>
            <p className="font-medium text-gray-900">{formatCurrency(summary.limitCents)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Remaining</p>
            <p className={`font-medium ${
              summary.remainingCents >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              {formatCurrency(summary.remainingCents)}
            </p>
          </div>
        </div>
      )}

      {/* Warning messages */}
      {isNearLimit && !isOverLimit && (
        <div className="flex items-center text-yellow-700 bg-yellow-50 p-3 rounded-md text-sm">
          <svg
            className="w-5 h-5 mr-2 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>You've used {percentageUsed.toFixed(1)}% of your budget for this category.</span>
        </div>
      )}
      
      {isOverLimit && (
        <div className="flex items-center text-red-700 bg-red-50 p-3 rounded-md text-sm">
          <svg
            className="w-5 h-5 mr-2 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>You've exceeded your budget by {formatCurrency(Math.abs(summary.remainingCents))}.</span>
        </div>
      )}
    </div>
  );
}