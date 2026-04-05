"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import { Invoice, Client, TaxRate, User, InvoiceStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";
import { getCurrentUser } from "@/lib/auth";

export default function InvoiceDetailPage() {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [taxRate, setTaxRate] = useState<TaxRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const response = await fetch(`/api/invoices/${invoiceId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Invoice not found");
          }
          throw new Error("Failed to fetch invoice");
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        const invoiceData: Invoice = data.data;
        setInvoice(invoiceData);

        // Fetch client and tax rate
        const [clientRes, taxRateRes] = await Promise.all([
          fetch(`/api/clients/${invoiceData.clientId}`),
          fetch(`/api/tax-rates/${invoiceData.taxRateId}`),
        ]);

        if (clientRes.ok) {
          const clientData = await clientRes.json();
          if (!clientData.error) {
            setClient(clientData.data);
          }
        }

        if (taxRateRes.ok) {
          const taxRateData = await taxRateRes.json();
          if (!taxRateData.error) {
            setTaxRate(taxRateData.data);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId, router]);

  const handleSendInvoice = async () => {
    if (!invoice) return;

    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send invoice");
      }

      // Refresh the page to show updated status
      router.refresh();
      window.location.reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to send invoice");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice) return;

    setActionLoading(true);
    setActionError("");

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/mark-paid`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to mark as paid");
      }

      // Refresh the page to show updated status
      router.refresh();
      window.location.reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to mark as paid");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                {error || "Invoice not found"}
              </div>
              <Link
                href="/invoices"
                className="mt-4 inline-block rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-200"
              >
                Back to Invoices
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const canEdit = invoice.status === "draft";
  const canSend = invoice.status === "draft";
  const canMarkPaid = invoice.status === "sent";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/invoices"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Invoices
        </Link>
      </div>

      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {invoice.invoiceNumber}
            </h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="mt-2 text-gray-600">
            Created {formatDate(invoice.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {canEdit && (
            <Link
              href={`/invoices/${invoiceId}/edit`}
              className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Edit
            </Link>
          )}
          {canSend && (
            <button
              onClick={handleSendInvoice}
              disabled={actionLoading}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-70"
            >
              {actionLoading ? "Sending..." : "Send Invoice"}
            </button>
          )}
          {canMarkPaid && (
            <button
              onClick={handleMarkAsPaid}
              disabled={actionLoading}
              className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-70"
            >
              {actionLoading ? "Processing..." : "Mark as Paid"}
            </button>
          )}
          {invoice.status !== "draft" && (
            <button
              onClick={() => {
                // Copy public link to clipboard
                navigator.clipboard.writeText(
                  `${window.location.origin}/view/${invoice.publicToken}`
                );
                alert("Public link copied to clipboard!");
              }}
              className="inline-flex items-center justify-center rounded-md bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-200"
            >
              Copy Public Link
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Action Error</h3>
              <div className="mt-2 text-sm text-red-700">{actionError}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Invoice Details
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {invoice.lineItems.map((item, index) => (
                    <tr key={index}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {formatCurrency(item.unitPriceCents)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {formatCurrency(item.quantity * item.unitPriceCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-200 px-6 py-4">
              <div className="ml-auto max-w-xs space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(invoice.subtotalCents)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Discount</span>
                  <span className="text-sm font-medium text-gray-900">
                    {invoice.discount.type === "percentage"
                      ? `${invoice.discount.value}%`
                      : formatCurrency(invoice.discount.value)}{" "}
                    (
                    {formatCurrency(invoice.discountAmountCents)})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tax</span>
                  <span className="text-sm font-medium text-gray-900">
                    {taxRate ? `${taxRate.rate}%` : "N/A"} (
                    {formatCurrency(invoice.taxAmountCents)})
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3">
                  <span className="text-base font-semibold text-gray-900">
                    Total
                  </span>
                  <span className="text-base font-semibold text-gray-900">
                    {formatCurrency(invoice.totalCents)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="text-lg font-semibold text-gray-900">Client</h3>
            </div>
            <div className="p-4">
              {client ? (
                <div className="space-y-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{client.name}</h4>
                    <p className="text-sm text-gray-600">{client.email}</p>
                  </div>
                  {client.billingAddress && (
                    <div>
                      <p className="text-sm text-gray-600">
                        {client.billingAddress}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Client information not available</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Invoice Information
              </h3>
            </div>
            <div className="space-y-4 p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Invoice Number
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {invoice.invoiceNumber}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Issue Date
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(invoice.createdAt)}
                </p>
              </div>
              {invoice.dueDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Due Date
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
              )}
              {invoice.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {invoice.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}