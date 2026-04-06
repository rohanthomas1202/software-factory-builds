import { CheckCircle, Clock, AlertCircle, FileText, XCircle } from 'lucide-react';

export interface InvoiceStatusBadgeProps {
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function InvoiceStatusBadge({
  status,
  size = 'md',
  showIcon = false
}: InvoiceStatusBadgeProps) {
  const statusConfig = {
    draft: {
      label: 'Draft',
      color: 'bg-gray-100 text-gray-800',
      icon: FileText,
      iconColor: 'text-gray-500'
    },
    sent: {
      label: 'Sent',
      color: 'bg-blue-100 text-blue-800',
      icon: Clock,
      iconColor: 'text-blue-500'
    },
    paid: {
      label: 'Paid',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-500'
    },
    overdue: {
      label: 'Overdue',
      color: 'bg-red-100 text-red-800',
      icon: AlertCircle,
      iconColor: 'text-red-500'
    },
    void: {
      label: 'Void',
      color: 'bg-yellow-100 text-yellow-800',
      icon: XCircle,
      iconColor: 'text-yellow-500'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSize = {
    sm: 12,
    md: 14,
    lg: 16
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.color} ${sizeClasses[size]}`}>
      {showIcon && <Icon size={iconSize[size]} className={config.iconColor} />}
      {config.label}
    </span>
  );
}