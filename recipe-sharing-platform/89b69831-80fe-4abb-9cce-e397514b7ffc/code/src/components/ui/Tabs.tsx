import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  disabled?: boolean;
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  items: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'underline' | 'pills' | 'segmented';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  showCount?: boolean;
}

const Tabs: React.FC<TabsProps> = ({
  items,
  activeTab,
  onTabChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  showCount = true,
  className,
  ...props
}) => {
  const handleTabClick = (tabId: string, disabled?: boolean) => {
    if (!disabled) {
      onTabChange(tabId);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm px-3 py-1.5';
      case 'lg':
        return 'text-lg px-6 py-3';
      default:
        return 'text-base px-4 py-2';
    }
  };

  const getVariantClasses = (isActive: boolean, disabled?: boolean) => {
    const baseClasses = cn(
      'flex items-center justify-center gap-2 font-medium transition-all duration-200',
      getSizeClasses(),
      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
      disabled && 'opacity-50 cursor-not-allowed',
      fullWidth && 'flex-1'
    );

    switch (variant) {
      case 'underline':
        return cn(
          baseClasses,
          'border-b-2',
          isActive
            ? 'border-primary-600 text-primary-700 dark:text-primary-400 dark:border-primary-500'
            : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
        );

      case 'pills':
        return cn(
          baseClasses,
          'rounded-full',
          isActive
            ? 'bg-primary-600 text-white shadow-md'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
        );

      case 'segmented':
        return cn(
          baseClasses,
          'rounded-lg',
          isActive
            ? 'bg-white dark:bg-gray-800 text-primary-700 dark:text-primary-400 shadow-sm border border-gray-200 dark:border-gray-700'
            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        );

      default:
        return cn(
          baseClasses,
          'border-b-2',
          isActive
            ? 'border-primary-600 text-primary-700 dark:text-primary-400 dark:border-primary-500'
            : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
        );
    }
  };

  const getContainerClasses = () => {
    switch (variant) {
      case 'segmented':
        return cn(
          'inline-flex p-1 bg-gray-100 dark:bg-gray-900 rounded-xl',
          fullWidth && 'w-full',
          className
        );
      case 'pills':
        return cn(
          'inline-flex gap-1',
          fullWidth && 'w-full',
          className
        );
      default:
        return cn(
          'flex border-b border-gray-200 dark:border-gray-800',
          fullWidth && 'w-full',
          className
        );
    }
  };

  return (
    <div className={getContainerClasses()} {...props}>
      {items.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id, tab.disabled)}
            disabled={tab.disabled}
            className={getVariantClasses(isActive, tab.disabled)}
            aria-selected={isActive}
            role="tab"
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            <span className="truncate">{tab.label}</span>
            {showCount && tab.count !== undefined && (
              <span
                className={cn(
                  'flex items-center justify-center min-w-6 h-6 px-1.5 text-xs font-semibold rounded-full',
                  isActive && variant === 'pills'
                    ? 'bg-white/20 text-white'
                    : isActive
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;