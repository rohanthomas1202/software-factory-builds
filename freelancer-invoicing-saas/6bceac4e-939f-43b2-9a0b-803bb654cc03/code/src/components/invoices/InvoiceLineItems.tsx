```typescript
'use client'

import React from 'react'
import { Trash2, Plus, Minus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { InvoiceItem } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface InvoiceLineItemsProps {
  items: InvoiceItem[]
  currency: string
  taxRate: number
  onChange: (items: InvoiceItem[]) => void
}

const InvoiceLineItems: React.FC<InvoiceLineItemsProps> = ({
  items,
  currency,
  taxRate,
  onChange
}) => {
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items]
    
    if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
      newItems[index] = {
        ...newItems[index],
        [field]: parseFloat(value) || 0
      }
    } else {
      newItems[index] = {
        ...newItems[index],
        [field]: value
      }
    }

    // Calculate item total
    const item = newItems[index]
    const itemTotal = item.quantity * item.unitPrice
    const itemTax = itemTotal * (item.taxRate / 100)
    
    newItems[index] = {
      ...newItems[index],
      total: itemTotal,
      taxAmount: itemTax
    }

    onChange(newItems)
  }

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: taxRate,
      total: 0,
      taxAmount: 0
    }
    onChange([...items, newItem])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      // Don't remove the last item, just clear it
      const newItems = [...items]
      newItems[index] = {
        id: newItems[index].id,
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: taxRate,
        total: 0,
        taxAmount: 0
      }
      onChange(newItems)
    } else {
      const newItems = items.filter((_, i) => i !== index)
      onChange(newItems)
    }
  }

  const handleQuantityChange = (index: number, delta: number) => {
    const currentQuantity = items[index].quantity
    const newQuantity = Math.max(0.1, currentQuantity + delta)
    handleItemChange(index, 'quantity', newQuantity)
  }

  const calculateItemTotal = (item: InvoiceItem) => {
    return item.quantity * item.unitPrice
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Description</TableHead>
              <TableHead className="text-center">Quantity</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Tax Rate</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.id || index} className="hover:bg-muted/50">
                <TableCell>
                  <Input
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Service or product description"
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-8"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center space-x-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleQuantityChange(index, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      min="0.1"
                      step="0.1"
                      className="w-20 text-center"
                      size="sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleQuantityChange(index, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                      {currency === 'USD' ? '$' : currency}
                    </span>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      min="0"
                      step="0.01"
                      className="pl-8 text-right"
                      size="sm"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end space-x-2">
                    <Input
                      type="number"
                      value={item.taxRate}
                      onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-20 text-right"
                      size="sm"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(calculateItemTotal(item), currency)}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
          <p className="text-muted-foreground mb-4">No items added yet</p>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddItem}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Item
          </Button>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {items.length} item{items.length !== 1 ? 's' : ''} • Subtotal: {formatCurrency(
              items.reduce((sum, item) => sum + calculateItemTotal(item), 0),
              currency
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Item
          </Button>
        </div>
      )}

      <div className="rounded-lg bg-muted/50 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">
            {formatCurrency(
              items.reduce((sum, item) => sum + calculateItemTotal(item), 0),
              currency
            )}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax ({taxRate}%)</span>
          <span className="font-medium">
            {formatCurrency(
              items.reduce((sum, item) => sum + (calculateItemTotal(item) * (item.taxRate / 100)), 0),
              currency
            )}
          </span>
        </div>

        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between font-bold">
            <span>Estimated Total</span>
            <span>
              {formatCurrency(
                items.reduce((sum, item) => {
                  const itemTotal = calculateItemTotal(item)
                  const itemTax = itemTotal * (item.taxRate / 100)
                  return sum + itemTotal + itemTax
                }, 0),
                currency
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoiceLineItems
```