import { notFound } from "next/navigation";
import { verifyInvoiceToken } from "@/lib/token";
import { getInvoiceWithRelations } from "@/lib/store";
import { generateInvoiceHtml } from "@/lib/pdf";
import { formatCurrency } from "@/lib/calculations";
import StatusBadge from "@/components/StatusBadge";
import { InvoiceStatus } from "@/lib/types";

interface PublicInvoiceViewPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function PublicInvoiceViewPage({
  params,
}: PublicInvoiceViewPageProps) {
  const { token } = await params;
  
  // Verify the token
  const tokenPayload = verifyInvoiceToken(token);
  if (!tokenPayload) {
    notFound();
  }

  // Get invoice with relations
  const invoiceWithRelations = getInvoiceWithRelations(tokenPayload.invoiceId);
  if (!invoiceWithRelations) {
    notFound();
  }

  const { invoice, client, user, taxRate } = invoiceWithRelations;

  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate totals
  const lineItemTotal = invoice.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0
  );
  const discountAmount =
    invoice.discount.type === "percentage"
      ? (lineItemTotal * invoice.discount.value) / 100
      : invoice.discount.value;
  const taxableAmount = lineItemTotal - discountAmount;
  const taxAmount = (taxableAmount * taxRate.rate) / 100;
  const total = lineItemTotal - discountAmount + taxAmount;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user.companyName || "Freelance Invoice"}
              </h1>
              {user.email && (
                <p className="mt-1 text-gray-600">{user.email}</p>
              )}
            </div>
            <div className="mt-4 md:mt-0">
              <StatusBadge status={invoice.status as InvoiceStatus} size="lg" />
            </div>
          </div>
        </header>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {/* Invoice header */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
              <div className="mt-4 space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Invoice Number
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {invoice.invoiceNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date Issued</p>
                  <p className="text-gray-900">{formatDate(invoice.issuedAt)}</p>
                </div>
                {invoice.dueDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Due Date</p>
                    <p className="text-gray-900">{formatDate(invoice.dueDate)}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="font-semibold text-gray-700">Bill To</h3>
                <div className="mt-2">
                  <p className="font-medium text-gray-900">{client.name}</p>
                  <p className="text-gray-700">{client.email}</p>
                  {client.billingAddress && (
                    <p className="mt-2 whitespace-pre-line text-gray-700">
                      {client.billingAddress}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div className="mb-8 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.lineItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-gray-900">{item.quantity}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {formatCurrency(item.unitPriceCents)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatCurrency(item.quantity * item.unitPriceCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="ml-auto max-w-xs">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(lineItemTotal)}
                </span>
              </div>

              {invoice.discount.value > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Discount{" "}
                    {invoice.discount.type === "percentage"
                      ? `(${invoice.discount.value}%)`
                      : ""}
                  </span>
                  <span className="font-medium text-gray-900">
                    -{formatCurrency(discountAmount)}
                  </span>
                </div>
              )}

              {taxRate.rate > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Tax ({taxRate.name} {taxRate.rate}%)
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(taxAmount)}
                  </span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900">Notes</h3>
              <p className="mt-2 whitespace-pre-line text-gray-700">
                {invoice.notes}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
            <p>
              This invoice was generated by {user.companyName || user.name}.
              Please contact {user.email} with any questions.
            </p>
            <p className="mt-1">
              Invoice ID: {invoice.id} | Status: {invoice.status}
            </p>
          </div>
        </div>

        {/* Action buttons for logged-in users */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            This is a public view of invoice {invoice.invoiceNumber}
          </p>
        </div>
      </div>
    </div>
  );
}