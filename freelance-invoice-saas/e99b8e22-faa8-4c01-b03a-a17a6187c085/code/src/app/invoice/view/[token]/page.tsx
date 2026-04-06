"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Printer, Download, ArrowLeft, Calendar, Mail, Building, FileText } from "lucide-react";
import { Invoice, Client, User, InvoiceItem, TaxRate } from "@/lib/types";
import { formatCurrency, calculateInvoiceTotals } from "@/lib/invoice-utils";
import InvoiceStatusBadge from "@/components/InvoiceStatusBadge";
import Link from "next/link";

interface InvoiceWithDetails {
  invoice: Invoice & { items: InvoiceItem[] };
  client: Client;
  user: User;
  taxRates: TaxRate[];
}

export default function PublicInvoiceViewPage() {
  const params = useParams();
  const token = params.token as string;
  const [invoiceData, setInvoiceData] = useState<InvoiceWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        setLoading(true);
        const response = await fetch(`/api/invoices/view/${token}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Invoice not found or link has expired");
          }
          throw new Error("Failed to load invoice");
        }
        
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        
        setInvoiceData(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoiceData) return;
    
    try {
      const response = await fetch(`/api/invoices/${invoiceData.invoice.id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${invoiceData.invoice.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      setError("Failed to download PDF");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoiceData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Invoice Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "The invoice you're looking for doesn't exist."}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const { invoice, client, user, taxRates } = invoiceData;
  const { subtotal, taxAmount, total, taxBreakdown } = calculateInvoiceTotals(invoice.items, taxRates);
  const issueDate = new Date(invoice.issueDate);
  const dueDate = new Date(invoice.dueDate);

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8 print:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoice #{invoice.invoiceNumber}</h1>
              <div className="flex items-center gap-4 mt-2">
                <InvoiceStatusBadge status={invoice.status} size="md" showIcon />
                <span className="text-gray-600">
                  {invoice.paidAt ? `Paid on ${format(new Date(invoice.paidAt), "PPP")}` : `Due on ${format(dueDate, "PPP")}`}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              {invoice.status !== "paid" && invoice.status !== "void" && (
                <a
                  href={`https://checkout.stripe.com/pay/${invoice.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Pay Now
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                </div>
                <p className="text-gray-600">
                  {user.businessName || "Your Business"}
                </p>
                {user.businessAddress && (
                  <p className="text-gray-500 text-sm mt-1">{user.businessAddress}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 mb-2">#{invoice.invoiceNumber}</div>
                <div className="space-y-1 text-gray-600">
                  <div className="flex items-center justify-end gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Issued: {format(issueDate, "PPP")}</span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Due: {format(dueDate, "PPP")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Info */}
          <div className="p-8 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">From</h3>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">{user.businessName || "Your Business"}</p>
                  {user.businessAddress && (
                    <p className="text-gray-600 whitespace-pre-line">{user.businessAddress}</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Bill To</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <p className="font-semibold text-gray-900">{client.name}</p>
                  </div>
                  {client.companyName && (
                    <p className="text-gray-600">{client.companyName}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-600">{client.email}</p>
                  </div>
                  <div className="text-gray-600">
                    {client.billingAddress.street && <p>{client.billingAddress.street}</p>}
                    {client.billingAddress.city && client.billingAddress.state && (
                      <p>{client.billingAddress.city}, {client.billingAddress.state} {client.billingAddress.postalCode}</p>
                    )}
                    {client.billingAddress.country && <p>{client.billingAddress.country}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="p-8 border-b border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Rate</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Tax</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => {
                    const taxRate = taxRates.find(t => t.id === item.taxRateId);
                    const itemTotal = item.quantity * item.rate;
                    const itemTax = taxRate ? itemTotal * (taxRate.rate / 100) : 0;
                    
                    return (
                      <tr key={item.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{item.description}</div>
                        </td>
                        <td className="py-4 px-4 text-right text-gray-900">{item.quantity}</td>
                        <td className="py-4 px-4 text-right text-gray-900">{formatCurrency(item.rate, invoice.currency)}</td>
                        <td className="py-4 px-4 text-right text-gray-900">
                          {taxRate ? `${taxRate.name} (${taxRate.rate}%)` : "—"}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-900 font-medium">
                          {formatCurrency(itemTotal + itemTax, invoice.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="p-8">
            <div className="flex justify-end">
              <div className="w-full md:w-96">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal, invoice.currency)}</span>
                  </div>
                  
                  {taxBreakdown.map((tax) => (
                    <div key={tax.taxRateId || "no-tax"} className="flex justify-between">
                      <span className="text-gray-600">
                        {tax.name} ({tax.rate}%)
                      </span>
                      <span className="font-medium">{formatCurrency(tax.amount, invoice.currency)}</span>
                    </div>
                  ))}
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(total, invoice.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="p-8 border-t border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {invoice.notes && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Notes</h4>
                    <p className="text-gray-700 whitespace-pre-line">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Terms & Conditions</h4>
                    <p className="text-gray-700 whitespace-pre-line">{invoice.terms}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm print:hidden">
          <p>This invoice was generated using InvoiceFlow. For any questions, please contact {user.businessName || "the sender"}.</p>
          {invoice.viewedAt && (
            <p className="mt-2">Viewed on {format(new Date(invoice.viewedAt), "PPP 'at' p")}</p>
          )}
        </div>
      </div>
    </div>
  );
}