import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface DashboardCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  description?: string;
  accentColor?: 'blue' | 'green' | 'red' | 'purple' | 'yellow' | 'gray';
  className?: string;
}

const colorConfig = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    iconBg: 'bg-blue-100'
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    iconBg: 'bg-green-100'
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    iconBg: 'bg-red-100'
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    iconBg: 'bg-purple-100'
  },
  yellow: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    iconBg: 'bg-yellow-100'
  },
  gray: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    iconBg: 'bg-gray-100'
  }
};

export default function DashboardCard({
  title,
  value,
  icon,
  trend,
  description,
  accentColor = 'blue',
  className = ''
}: DashboardCardProps) {
  const colors = colorConfig[accentColor];

  return (
    <div className={`border rounded-xl p-6 ${colors.bg} ${colors.border} ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
          
          {trend && (
            <div className="flex items-center gap-1">
              {trend.value > 0 ? (
                <ArrowUpRight size={16} className="text-green-600" />
              ) : trend.value < 0 ? (
                <ArrowDownRight size={16} className="text-red-600" />
              ) : (
                <Minus size={16} className="text-gray-500" />
              )}
              <span className={`text-sm font-medium ${
                trend.value > 0 ? 'text-green-600' : trend.value < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-sm text-gray-500 ml-1">{trend.label}</span>
            </div>
          )}
          
          {description && (
            <p className="text-sm text-gray-500 mt-2">{description}</p>
          )}
        </div>
        
        {icon && (
          <div className={`p-3 rounded-lg ${colors.iconBg} ${colors.text}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}