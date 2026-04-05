"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Invoice, Client, TaxRate, LineItem, Discount, InvoiceStatus } from "@/lib/types";
import { formatCurrency, parseCurrencyToCents } from "@/lib/calculations";
import ClientForm from "@/components/ClientForm";

interface InvoiceFormProps {
  invoice?: Invoice;
  clients: Client[];
  taxRates: TaxRate[];
  onSuccess: () => void;
}

interface InvoiceFormData {
  clientId: string;
  taxRateId: string;
  discountType: Discount["type"];
  discountValue: number;
  dueDate: string;
  notes: string;
  lineItems: (LineItem & { id: string })[];
}

export default function InvoiceForm({ invoice, clients, taxRates, onSuccess }: InvoiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: "",
    taxRateId: "",
    discountType: "percentage",
    discountValue: 0,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
    lineItems: [
      {
        id: "line-1",
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
    ],
  });

  useEffect(() => {
    if (invoice) {
      const taxRate = taxRates.find((tr) => tr.id === invoice.taxRateId);
      const client = clients.find((c) => c.id === invoice.clientId);
      
      if (taxRate && client) {
        setFormData({
          clientId: invoice.clientId,
          taxRateId: invoice.taxRateId,
          discountType: invoice.discount.type,
          discountValue: invoice.discount.value,
          dueDate: new Date(invoice.dueDate).toISOString().split("T")[0],
          notes: invoice.notes || "",
          lineItems: invoice.lineItems.map((item) => ({
            ...item,
            id: `line-${Date.now()}-${Math.random()}`,
          })),
        });
      }
    } else if (taxRates.length > 0 && clients.length > 0) {
      setFormData((prev) => ({
        ...prev,
        clientId: clients[0]?.id || "",
        taxRateId: taxRates[0]?.id || "",
      }));
    }
  }, [invoice, clients, taxRates]);

  const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const updatedItems = [...formData.lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData({ ...formData, lineItems: updatedItems });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [
        ...formData.lineItems,
        {
          id: `line-${Date.now()}-${Math.random()}`,
          description: "",
          quantity: 1,
          unitPrice: 0,
        },
      ],
    });
  };

  const removeLineItem = (index: number) => {
    if (formData.lineItems.length > 1) {
      const updatedItems = formData.lineItems.filter((_, i) => i !== index);
      setFormData({ ...formData, lineItems: updatedItems });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        clientId: formData.clientId,
        taxRateId: formData.taxRateId,
        discount: {
          type: formData.discountType,
          value: formData.discountValue,
        },
        dueDate: formData.dueDate,
        notes: formData.notes,
        lineItems: formData.lineItems.map(({ id, ...item }) => ({
          ...item,
          unitPrice: parseCurrencyToCents(item.unitPrice.toString()),
        })),
      };

      const url = invoice ? `/api/invoices/${invoice.id}` : "/api/invoices";
      const method = invoice ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save invoice");
      }

      onSuccess();
      router.push("/invoices");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return formData.lineItems.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const discountAmount = formData.discountType === "percentage" 
    ? subtotal * (formData.discountValue / 100)
    : formData.discountValue;
  const taxableAmount = subtotal - discountAmount;
  const selectedTaxRate = taxRates.find((tr) => tr.id === formData.taxRateId);
  const taxAmount = taxableAmount * ((selectedTaxRate?.rate || 0) / 100);
  const total = taxableAmount + taxAmount;

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Client Selection */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Client</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Client
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
                disabled={clients.length === 0}
              >
                {clients.length === 0 ? (
                  <option value="">No clients available</option>
                ) : (
                  clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </option>
                  ))
                )}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowClientForm(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              + New Client
            </button>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Line Items</h2>
            <button
              type="button"
              onClick={addLineItem}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-4">
            {formData.lineItems.map((item, index) => (
              <div key={item.id} className="flex gap-4 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleLineItemChange(index, "description", e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleLineItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-md"
                    min="1"
                    step="1"
                    required
                  />
                </div>
                <div className="w-40">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={item.unitPrice}
                      onChange={(e) => handleLineItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 border rounded-md"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div className="w-32 flex items-center">
                  <span className="text-gray-600">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </span>
                </div>
                {formData.lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Discount & Tax */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Discount</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    discountType: e.target.value as Discount["type"] 
                  })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="percentage">Percentage</option>
                  <option value="flat">Flat Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value
                </label>
                <div className="relative">
                  {formData.discountType === "percentage" && (
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">%</span>
                    </div>
                  )}
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      discountValue: parseFloat(e.target.value) || 0 
                    })}
                    className="w-full px-3 py-2 border rounded-md"
                    min="0"
                    step={formData.discountType === "percentage" ? "1" : "0.01"}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Tax</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate
              </label>
              <select
                value={formData.taxRateId}
                onChange={(e) => setFormData({ ...formData, taxRateId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                {taxRates.map((rate) => (
                  <option key={rate.id} value={rate.id}>
                    {rate.name} ({rate.rate}%)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notes & Due Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Notes</h2>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              placeholder="Additional notes for the client"
            />
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Due Date</h2>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Discount:</span>
              <span className="font-medium text-red-600">-${discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax ({selectedTaxRate?.rate || 0}%):</span>
              <span className="font-medium">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : invoice ? "Update Invoice" : "Create Invoice"}
          </button>
        </div>
      </form>

      {/* Client Creation Modal */}
      {showClientForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <ClientForm
              onSuccess={() => {
                setShowClientForm(false);
                router.refresh();
              }}
              onCancel={() => setShowClientForm(false)}
              compact={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}