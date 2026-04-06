"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, FileText, Download, Send, MoreVertical } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { User, Invoice } from "@/lib/types";
import { getInvoicesByUser } from "@/lib/store";
import { formatCurrency } from "@/lib/invoice-utils";
import { InvoiceStatusBadge } from "@/components/InvoiceStatusBadge";
import { getInvoiceDownloadUrl } from "@/lib/pdf";

type InvoiceWithItems = Invoice & { items: any[] };

export default function InvoicesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<InvoiceWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;
        
        setUser(currentUser);
        const userInvoices = getInvoicesByUser(currentUser.id);
        setInvoices(userInvoices);
      } catch (error) {
        console.error("Failed to load invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesNumber = invoice.invoiceNumber.toLowerCase().includes(query);
        const matchesClient = true; // Would match client name if we had it
        if (!matchesNumber && !matchesClient) return false;
      }

      // Status filter
      if (statusFilter !== "all" && invoice.status !== statusFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== "all") {
        const now = Date.now();
        const invoiceDate = invoice.dueDate;
        const diffDays = Math.ceil((invoiceDate - now) / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case "overdue":
            if (diffDays >= 0 || invoice.status !== "overdue") return false;
            break;
          case "due_this_week":
            if (diffDays > 7 || diffDays < 0) return false;
            break;
          case "due_next_week":
            if (diffDays > 14 || diffDays <= 7) return false;
            break;
        }
      }

      return true;
    });
  }, [invoices, searchQuery, statusFilter, dateFilter]);

  const handleDownloadPDF = async (invoiceId: string) => {
    try {
      const url = getInvoiceDownloadUrl(invoiceId);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Failed to download PDF:", error);
    }
  };

  const stats = {
    total: invoices.length,
    draft: invoices.filter((inv) => inv.status === "draft").length,
    sent: invoices.filter((inv) => inv.status === "sent").length,
    paid: invoices.filter((inv) => inv.status === "paid").length,
    overdue: invoices.filter((inv) => inv.status === "overdue").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">
            Manage and track all your invoices in one place.
          </p>
        </div>
        <Link href="/invoices/new" className="btn-primary flex items-center space-x-2">
          <FileText className="h-4 w-4" />
          <span>New Invoice</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-medium text-gray-600">Total</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-medium text-gray-600">Draft</div>
          <div className="mt-1 text-2xl font-bold text-blue-600">{stats.draft}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-medium text-gray-600">Sent</div>
          <div className="mt-1 text-2xl font-bold text-amber-600">{stats.sent}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-medium text-gray-600">Paid</div>
          <div className="mt-1 text-2xl font-bold text-green-600">{stats.paid}</div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm font-medium text-gray-600">Overdue</div>
          <div className="mt-1 text-2xl font-bold text-red-600">{stats.overdue}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="search"
              className="input-field pl-10"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-4">
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="void">Void</option>
            </select>
            <select
              className="input-field"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Dates</option>
              <option value="overdue">Overdue</option>
              <option value="due_this_week">Due This Week</option>
              <option value="due_next_week">Due Next Week</option>
            </select>
            <button className="btn-outline flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Issue Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div>
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="font-medium text-gray-900 hover:text-primary"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                      <div className="text-sm text-gray-500">
                        {invoice.notes ? invoice.notes.substring(0, 30) + "..." : "No description"}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    Client #{invoice.clientId.substring(0, 8)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(invoice.issueDate).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <InvoiceStatusBadge status={invoice.status} size="sm" />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownloadPDF(invoice.id)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {invoice.status === "draft" && (
                        <Link
                          href={`/invoices/${invoice.id}/send`}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                          title="Send Invoice"
                        >
                          <Send className="h-4 w-4" />
                        </Link>
                      )}
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                        title="View Details"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="mx-auto max-w-md">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-sm font-medium text-gray-900">
                        No invoices found
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchQuery || statusFilter !== "all" || dateFilter !== "all"
                          ? "Try adjusting your filters."
                          : "Get started by creating your first invoice."}
                      </p>
                      {!searchQuery && statusFilter === "all" && dateFilter === "all" && (
                        <div className="mt-6">
                          <Link href="/invoices/new" className="btn-primary">
                            <FileText className="mr-2 h-4 w-4" />
                            New Invoice
                          </Link>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}