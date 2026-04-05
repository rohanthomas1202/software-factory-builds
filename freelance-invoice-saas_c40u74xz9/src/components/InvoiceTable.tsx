"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Invoice, InvoiceStatus } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import { formatCurrency } from "@/lib/calculations";

interface InvoiceTableProps {
  initialInvoices?: Invoice[];
  showFilters?: boolean;
}

export default function InvoiceTable({ initialInvoices = [], showFilters = true }: InvoiceTableProps) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [loading, setLoading] = useState(!initialInvoices.length);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!initialInvoices.length) {
      fetchInvoices();
    }
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/invoices");
      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }
      const data = await response.json();
      setInvoices(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesStatus = filterStatus === "all" || invoice.status === filterStatus;
    const matchesSearch = searchTerm === "" || 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleSendInvoice = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Send this invoice to the client?")) return;

    try {
      const response = await fetch(`/api/invoices/${id}/send`, { method: "POST" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send invoice");
      }
      router.refresh();
      alert("Invoice sent successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send invoice");
    }
  };

  const handleMarkPaid = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Mark this invoice as paid?")) return;

    try {
      const response = await fetch(`/api/invoices/${id}/mark-paid`, { method: "PATCH" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to mark as paid");
      }
      router.refresh();
      alert("Invoice marked as paid!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to mark as paid");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showFilters && (
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as InvoiceStatus | "all")}
              className="px-4 py-2 border rounded-md"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded-md w-64"
            />
          </div>
          <Link
            href="/invoices/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + New Invoice
          </Link>
        </div>
      )}

      {filteredInvoices.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-gray-500">No invoices found</p>
          <Link
            href="/invoices/new"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create your first invoice
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => {
                  const dueDate = new Date(invoice.dueDate);
                  const isOverdue = invoice.status !== "paid" && dueDate < new Date();
                  const displayDate = dueDate.toLocaleDateString();

                  return (
                    <tr
                      key={invoice.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/invoices/${invoice.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium">{invoice.clientName}</div>
                          <div className="text-sm text-gray-500">{invoice.clientEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={isOverdue ? "text-red-600" : ""}>
                          {displayDate}
                          {isOverdue && <span className="ml-1 text-xs">(Overdue)</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {formatCurrency(invoice.totalCents)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {invoice.status === "draft" && (
                            <>
                              <Link
                                href={`/invoices/${invoice.id}/edit`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={(e) => handleSendInvoice(invoice.id, e)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Send
                              </button>
                            </>
                          )}
                          {invoice.status === "sent" && (
                            <button
                              onClick={(e) => handleMarkPaid(invoice.id, e)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Mark Paid
                            </button>
                          )}
                          <Link
                            href={`/invoices/${invoice.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredInvoices.length > 0 && (
        <div className="text-sm text-gray-500">
          Showing {filteredInvoices.length} of {invoices.length} invoices
        </div>
      )}
    </div>
  );
}