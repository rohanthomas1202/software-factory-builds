"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Users, CreditCard, TrendingUp, Calendar } from "lucide-react";
import DashboardCard from "@/components/DashboardCard";
import { getCurrentUser } from "@/lib/auth";
import { User, Invoice } from "@/lib/types";
import { getInvoicesByUser } from "@/lib/store";
import { formatCurrency } from "@/lib/invoice-utils";
import { calculateTotalOverdueAmount, getUpcomingInvoices } from "@/lib/overdue";
import { InvoiceStatusBadge } from "@/components/InvoiceStatusBadge";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<(Invoice & { items: any[] })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;
        
        setUser(currentUser);
        const userInvoices = getInvoicesByUser(currentUser.id);
        setInvoices(userInvoices);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const paidInvoices = invoices.filter((inv) => inv.status === "paid");
  const unpaidInvoices = invoices.filter(
    (inv) => inv.status === "sent" || inv.status === "overdue"
  );
  const draftInvoices = invoices.filter((inv) => inv.status === "draft");

  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const overdueAmount = calculateTotalOverdueAmount(user.id);
  const upcomingInvoices = getUpcomingInvoices(user.id);

  const recentInvoices = [...invoices]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalPaid, user.currency),
      icon: <TrendingUp className="h-6 w-6 text-green-600" />,
      trend: { value: 12, label: "from last month" },
      accentColor: "green" as const,
    },
    {
      title: "Outstanding",
      value: formatCurrency(totalUnpaid, user.currency),
      icon: <CreditCard className="h-6 w-6 text-amber-600" />,
      trend: { value: -5, label: "from last month" },
      accentColor: "amber" as const,
    },
    {
      title: "Overdue",
      value: formatCurrency(overdueAmount, user.currency),
      icon: <Calendar className="h-6 w-6 text-red-600" />,
      trend: { value: 2, label: "invoices overdue" },
      accentColor: "red" as const,
    },
    {
      title: "Active Clients",
      value: invoices
        .filter((inv) => inv.status !== "void")
        .reduce((clients, inv) => {
          if (!clients.includes(inv.clientId)) {
            clients.push(inv.clientId);
          }
          return clients;
        }, [] as string[]).length,
      icon: <Users className="h-6 w-6 text-blue-600" />,
      trend: { value: 3, label: "new this month" },
      accentColor: "blue" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.businessName.split(" ")[0]}!
          </h1>
          <p className="text-gray-600">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="btn-primary flex items-center space-x-2"
        >
          <FileText className="h-4 w-4" />
          <span>Create Invoice</span>
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <DashboardCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            accentColor={stat.accentColor}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Invoices</h2>
            <Link
              href="/invoices"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Invoice
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Client
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Due Date
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Amount
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="font-medium text-gray-900 hover:text-primary"
                          >
                            {invoice.invoiceNumber}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          Client
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <InvoiceStatusBadge status={invoice.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                    {recentInvoices.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-8 text-center text-sm text-gray-500"
                        >
                          No invoices yet. Create your first invoice!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
          </div>
          <div className="mt-4 grid gap-4">
            <Link
              href="/invoices/new"
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="rounded-md bg-blue-100 p-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    Create New Invoice
                  </h3>
                  <p className="text-sm text-gray-500">
                    Send a new invoice to a client
                  </p>
                </div>
              </div>
              <div className="text-gray-400">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>

            <Link
              href="/clients"
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="rounded-md bg-green-100 p-2">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Manage Clients</h3>
                  <p className="text-sm text-gray-500">
                    Add or update client information
                  </p>
                </div>
              </div>
              <div className="text-gray-400">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>

            <Link
              href="/tax-rates"
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="rounded-md bg-purple-100 p-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Set Up Tax Rates</h3>
                  <p className="text-sm text-gray-500">
                    Configure tax rates for your invoices
                  </p>
                </div>
              </div>
              <div className="text-gray-400">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}