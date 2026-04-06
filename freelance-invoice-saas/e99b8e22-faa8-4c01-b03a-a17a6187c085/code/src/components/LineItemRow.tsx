'use client';

import { useState, useEffect } from 'react';
import { TaxRate, InvoiceItemRequest } from '@/lib/types';
import { Trash2 } from 'lucide-react';

export interface LineItemRowProps {
  item: InvoiceItemRequest;
  taxRates: TaxRate[];
  currency: string;
  onUpdate: (item: InvoiceItemRequest) => void;
  onRemove: () => void;
  isRemovable: boolean;
  isLoading?: boolean;
  error?: string;
}

export default function LineItemRow({
  item,
  taxRates,
  currency,
  onUpdate,
  onRemove,
  isRemovable,
  isLoading = false,
  error
}: LineItemRowProps) {
  const [description, setDescription] = useState(item.description);
  const [quantity, setQuantity] = useState(item.quantity.toString());
  const [rate, setRate] = useState(item.rate.toString());
  const [taxRateId, setTaxRateId] = useState(item.taxRateId || '');

  useEffect(() => {
    const newItem: InvoiceItemRequest = {
      description,
      quantity: parseFloat(quantity) || 0,
      rate: parseFloat(rate) || 0,
      taxRateId: taxRateId || null,
      sortOrder: item.sortOrder
    };
    onUpdate(newItem);
  }, [description, quantity, rate, taxRateId]);

  const itemTotal = (parseFloat(quantity) || 0) * (parseFloat(rate) || 0);
  const selectedTaxRate = taxRates.find(rate => rate.id === taxRateId);
  const taxAmount = selectedTaxRate ? itemTotal * (selectedTaxRate.rate / 100) : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className={`border rounded-lg p-4 ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
      {error && (
        <p className="text-sm text-red-600 mb-2">{error}</p>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Service description"
            disabled={isLoading}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={isLoading}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rate ({currency})
          </label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={isLoading}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tax Rate
          </label>
          <select
            value={taxRateId}
            onChange={(e) => setTaxRateId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={isLoading}
          >
            <option value="">No Tax</option>
            {taxRates.map((taxRate) => (
              <option key={taxRate.id} value={taxRate.id}>
                {taxRate.name} ({taxRate.rate}%)
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-1 flex items-center justify-end">
          {isRemovable && (
            <button
              type="button"
              onClick={onRemove}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors"
              disabled={isLoading}
              aria-label="Remove item"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
        <div>
          {selectedTaxRate && (
            <span className="inline-block bg-gray-100 px-2 py-1 rounded">
              Tax: {selectedTaxRate.name} ({selectedTaxRate.rate}%)
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="font-medium">Item Total: {formatCurrency(itemTotal + taxAmount)}</div>
          <div className="text-xs">
            Subtotal: {formatCurrency(itemTotal)}
            {taxAmount > 0 && ` + Tax: ${formatCurrency(taxAmount)}`}
          </div>
        </div>
      </div>
    </div>
  );
}