'use client';

import { useState, useEffect } from 'react';
import { Client, TaxRate, Invoice, InvoiceItem, InvoiceRequest, InvoiceItemRequest } from '@/lib/types';
import { calculateInvoiceTotals, formatCurrency } from '@/lib/invoice-utils';
import LineItemRow from './LineItemRow';
import { Trash2, Plus } from 'lucide-react';

export interface InvoiceFormProps {
  initialInvoice?: Invoice & { items: InvoiceItem[] };
  clients: Client[];
  taxRates: TaxRate[];
  onSubmit: (invoice: InvoiceRequest, items: InvoiceItemRequest[]) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export default function InvoiceForm({
  initialInvoice,
  clients,
  taxRates,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save Invoice'
}: InvoiceFormProps) {
  const [formData, setFormData] = useState<Omit<InvoiceRequest, 'items'>>({
    clientId: initialInvoice?.clientId || '',
    issueDate: initialInvoice?.issueDate || Date.now(),
    dueDate: initialInvoice?.dueDate || Date.now() + 30 * 24 * 60 * 60 * 1000,
    paymentTerms: initialInvoice?.paymentTerms || 30,
    notes: initialInvoice?.notes || '',
    terms: initialInvoice?.terms || '',
    currency: initialInvoice?.currency || 'USD',
    status: initialInvoice?.status || 'draft'
  });

  const [items, setItems] = useState<InvoiceItemRequest[]>(
    initialInvoice?.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      taxRateId: item.taxRateId,
      sortOrder: item.sortOrder
    })) || [
      {
        description: '',
        quantity: 1,
        rate: 0,
        taxRateId: null,
        sortOrder: 0
      }
    ]
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'issueDate' || name === 'dueDate' 
        ? new Date(value).getTime()
        : name === 'paymentTerms' 
          ? parseInt(value, 10) || 0
          : value
    }));
  };

  const handleItemUpdate = (index: number, updatedItem: InvoiceItemRequest) => {
    setItems(prev => prev.map((item, i) => i === index ? updatedItem : item));
  };

  const handleItemRemove = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const addNewItem = () => {
    setItems(prev => [
      ...prev,
      {
        description: '',
        quantity: 1,
        rate: 0,
        taxRateId: null,
        sortOrder: prev.length
      }
    ]);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }

    if (formData.issueDate > formData.dueDate) {
      newErrors.dueDate = 'Due date must be after issue date';
    }

    if (formData.paymentTerms < 0) {
      newErrors.paymentTerms = 'Payment terms must be positive';
    }

    let hasItemError = false;
    items.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item-${index}-description`] = 'Description is required';
        hasItemError = true;
      }
      if (item.quantity <= 0) {
        newErrors[`item-${index}-quantity`] = 'Quantity must be greater than 0';
        hasItemError = true;
      }
      if (item.rate < 0) {
        newErrors[`item-${index}-rate`] = 'Rate cannot be negative';
        hasItemError = true;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await onSubmit(formData, items);
    } catch (error) {
      console.error('Failed to save invoice:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save invoice' });
    }
  };

  const totals = calculateInvoiceTotals(
    items.map(item => ({
      ...item,
      id: 'temp',
      invoiceId: 'temp',
      createdAt: Date.now()
    })),
    taxRates
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toISOString().split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {errors.submit}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
            Client *
          </label>
          <select
            id="clientId"
            name="clientId"
            value={formData.clientId}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md ${errors.clientId ? 'border-red-500' : 'border-gray-300'}`}
            disabled={isLoading}
          >
            <option value="">Select a client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name} {client.companyName ? `(${client.companyName})` : ''}
              </option>
            ))}
          </select>
          {errors.clientId && (
            <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>
          )}
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={isLoading}
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="void">Void</option>
          </select>
        </div>

        <div>
          <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 mb-1">
            Issue Date *
          </label>
          <input
            type="date"
            id="issueDate"
            name="issueDate"
            value={formatDate(formData.issueDate)}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md ${errors.issueDate ? 'border-red-500' : 'border-gray-300'}`}
            disabled={isLoading}
          />
          {errors.issueDate && (
            <p className="mt-1 text-sm text-red-600">{errors.issueDate}</p>
          )}
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
            Due Date *
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formatDate(formData.dueDate)}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md ${errors.dueDate ? 'border-red-500' : 'border-gray-300'}`}
            disabled={isLoading}
          />
          {errors.dueDate && (
            <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
          )}
        </div>

        <div>
          <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 mb-1">
            Payment Terms (days)
          </label>
          <input
            type="number"
            id="paymentTerms"
            name="paymentTerms"
            value={formData.paymentTerms}
            onChange={handleInputChange}
            min="0"
            className={`w-full px-3 py-2 border rounded-md ${errors.paymentTerms ? 'border-red-500' : 'border-gray-300'}`}
            disabled={isLoading}
          />
          {errors.paymentTerms && (
            <p className="mt-1 text-sm text-red-600">{errors.paymentTerms}</p>
          )}
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
            Currency
          </label>
          <select
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={isLoading}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="CAD">CAD</option>
            <option value="AUD">AUD</option>
          </select>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
          <button
            type="button"
            onClick={addNewItem}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            disabled={isLoading}
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <LineItemRow
              key={index}
              item={item}
              taxRates={taxRates}
              currency={formData.currency}
              onUpdate={(updatedItem) => handleItemUpdate(index, updatedItem)}
              onRemove={() => handleItemRemove(index)}
              isRemovable={items.length > 1}
              isLoading={isLoading}
              error={errors[`item-${index}-description`] || errors[`item-${index}-quantity`] || errors[`item-${index}-rate`]}
            />
          ))}
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={isLoading}
              placeholder="Additional notes for the client"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="terms" className="block text-sm font-medium text-gray-700">
              Terms & Conditions
            </label>
            <textarea
              id="terms"
              name="terms"
              value={formData.terms}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={isLoading}
              placeholder="Payment terms and conditions"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(totals.subtotal, formData.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium">{formatCurrency(totals.taxAmount, formData.currency)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-900 font-bold">Total:</span>
              <span className="text-gray-900 font-bold text-xl">{formatCurrency(totals.total, formData.currency)}</span>
            </div>
          </div>

          {totals.taxBreakdown.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Tax Breakdown</h5>
              <div className="space-y-1">
                {totals.taxBreakdown.map((tax) => (
                  <div key={tax.taxRateId || 'none'} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {tax.name} ({tax.rate}%)
                    </span>
                    <span className="text-gray-700">{formatCurrency(tax.amount, formData.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t pt-6 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}