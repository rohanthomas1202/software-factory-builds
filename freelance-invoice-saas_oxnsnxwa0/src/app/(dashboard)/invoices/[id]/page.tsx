import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import { getInvoiceWithItems } from "@/lib/store";
import { clientStore, paymentStore } from "@/lib/store";
import { formatCurrency, calculateDaysUntilDue, getPaymentStatusStyle } from "@/lib/invoice-utils";
import InvoiceStatusBadge from "@/components/InvoiceStatusBadge";
import { ArrowLeft, Download, Mail, Edit, DollarSign, Clock, User, Building } from "lucide-react";

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireAuth();
  const invoice = getInvoiceWithItems(params.id);

  if (!invoice || invoice.userId !== user.id) {
    notFound();
  }

  const client = clientStore.findById(invoice.clientId);
  if (!client) {
    notFound();
  }

  const payments = paymentStore.getAll().filter((payment) => payment.invoiceId === invoice.id);

  async function sendInvoice() {
    "use server";
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/invoices/${params.id}/send`, {
      method: "POST",
    });
    if (response.ok) {
      redirect(`/invoices/${params.id}`);
    }
  }

  async function markAsPaid() {
    "use server";
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/invoices/${params.id}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: invoice.total,
        currency: invoice.currency,
        method: "bank_transfer",
        reference: `PAY-${invoice.invoiceNumber}`,
      }),
    });
    if (response.ok) {
      redirect(`/invoices/${params.id}`);
    }
  }

  const remainingBalance = invoice.total - payments.reduce((sum, payment) => sum + payment.amount, 0);
  const isFullyPaid = remainingBalance <= 0;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Link
          href="/invoices"
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Invoices
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Invoice {invoice.invoiceNumber}</h1>
            <InvoiceStatusBadge status={invoice.status} size="lg" showIcon />
          </div>
          <p className="text-gray-600">
            Issued on {new Date(invoice.issueDate).toLocaleDateString()} • Due on{" "}
            {new Date(invoice.dueDate).toLocaleDateString()} •{" "}
            {calculateDaysUntilDue(invoice.dueDate) > 0
              ? `${calculateDaysUntilDue(invoice.dueDate)} days until due`
              : "Past due"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {invoice.status === "draft" && (
            <Link
              href={`/invoices/${invoice.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Edit className="w-4 h-4" />
              Edit Invoice
            </Link>
          )}
          <Link
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Link>
          {invoice.status === "draft" && (
            <form action={sendInvoice}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Mail className="w-4 h-4" />
                Send Invoice
              </button>
            </form>
          )}
          {!isFullyPaid && invoice.status !== "void" && (
            <form action={markAsPaid}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
              >
                <DollarSign className="w-4 h-4" />
                Mark as Paid
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Invoice Number</dt>
              <dd className="text-sm text-gray-900">{invoice.invoiceNumber}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd>
                <InvoiceStatusBadge status={invoice.status} size="sm" />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Issue Date</dt>
              <dd className="text-sm text-gray-900">
                {new Date(invoice.issueDate).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Due Date</dt>
              <dd className="text-sm text-gray-900">
                {new Date(invoice.dueDate).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Payment Terms</dt>
              <dd className="text-sm text-gray-900">{invoice.paymentTerms} days</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Currency</dt>
              <dd className="text-sm text-gray-900">{invoice.currency}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Client</h3>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-gray-900">{client.name}</p>
            {client.companyName && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Building className="w-4 h-4" />
                {client.companyName}
              </p>
            )}
            <p className="text-sm text-gray-600">{client.email}</p>
            <div className="text-sm text-gray-600 mt-3">
              <p>{client.billingAddress.street}</p>
              <p>
                {client.billingAddress.city}, {client.billingAddress.state}{" "}
                {client.billingAddress.postalCode}
              </p>
              <p>{client.billingAddress.country}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(invoice.subtotal, invoice.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tax</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(invoice.taxAmount, invoice.currency)}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3">
              <span className="text-base font-semibold text-gray-900">Total</span>
              <span className="text-base font-bold text-gray-900">
                {formatCurrency(invoice.total, invoice.currency)}
              </span>
            </div>
            {payments.length > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount Paid</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(
                      payments.reduce((sum, payment) => sum + payment.amount, 0),
                      invoice.currency
                    )}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3">
                  <span className="text-base font-semibold text-gray-900">Remaining Balance</span>
                  <span
                    className={`text-base font-bold ${
                      remainingBalance > 0 ? "text-amber-600" : "text-green-600"
                    }`}
                  >
                    {formatCurrency(remainingBalance, invoice.currency)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tax
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatCurrency(item.rate, invoice.currency)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.taxRateId ? "Tax" : "None"}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                    {formatCurrency(item.quantity * item.rate, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {payments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(payment.paidAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{payment.method}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{payment.reference}</td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600 text-right">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(invoice.notes || invoice.terms) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {invoice.notes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
          {invoice.terms && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{invoice.terms}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}