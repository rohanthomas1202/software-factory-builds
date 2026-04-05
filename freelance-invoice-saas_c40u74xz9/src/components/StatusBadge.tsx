"use client";

import type { InvoiceStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: InvoiceStatus;
  size?: "sm" | "md" | "lg";
}

const statusConfig: Record<InvoiceStatus, { color: string; bgColor: string; label: string }> = {
  draft: {
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    label: "Draft",
  },
  sent: {
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    label: "Sent",
  },
  viewed: {
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    label: "Viewed",
  },
  paid: {
    color: "text-green-700",
    bgColor: "bg-green-100",
    label: "Paid",
  },
  overdue: {
    color: "text-red-700",
    bgColor: "bg-red-100",
    label: "Overdue",
  },
  cancelled: {
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    label: "Cancelled",
  },
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClass = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${config.bgColor} ${config.color}`}
    >
      {config.label}
    </span>
  );
}