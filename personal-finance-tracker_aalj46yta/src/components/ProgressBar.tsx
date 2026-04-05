'use client';

interface ProgressBarProps {
  spentCents: number;
  limitCents: number;
  showLabels?: boolean;
  className?: string;
}

export default function ProgressBar({
  spentCents,
  limitCents,
  showLabels = true,
  className = '',
}: ProgressBarProps) {
  if (limitCents === 0) {
    return (
      <div className={`${className}`}>
        {showLabels && (
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>No budget set</span>
            <span>$0 / $0</span>
          </div>
        )}
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div className="bg-gray-400 h-4 rounded-full" style={{ width: '100%' }} />
        </div>
      </div>
    );
  }

  const percentage = Math.min((spentCents / limitCents) * 100, 100);
  const isWarning = percentage >= 90 && percentage < 100;
  const isDanger = percentage >= 100;
  const isHealthy = percentage < 90;

  const getBarColor = () => {
    if (isDanger) return 'bg-red-500';
    if (isWarning) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <div className={`${className}`}>
      {showLabels && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span className="font-medium">
            {formatCurrency(spentCents)} spent
          </span>
          <span className="font-medium">
            {formatCurrency(limitCents)} limit
          </span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className={`h-4 rounded-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabels && (
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>
            {percentage.toFixed(1)}% used
            {isDanger && ' • Over budget!'}
            {isWarning && ' • Approaching limit'}
          </span>
          <span>
            {formatCurrency(Math.max(limitCents - spentCents, 0))} remaining
          </span>
        </div>
      )}
    </div>
  );
}