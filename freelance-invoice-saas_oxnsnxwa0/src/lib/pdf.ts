import { Invoice, User, Client, InvoiceItem, TaxRate } from './types';
import { formatCurrency } from './invoice-utils';

/**
 * Generate HTML for invoice PDF with print-optimized styling
 */
export function generateInvoiceHtml(
  invoice: Invoice,
  user: User,
  client: Client,
  items: InvoiceItem[],
  taxRates: TaxRate[] = []
): string {
  const issueDate = new Date(invoice.issueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const dueDate = new Date(invoice.dueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Calculate tax breakdown
  const taxMap = new Map<string | null, { name: string; rate: number; amount: number }>();
  
  items.forEach(item => {
    const lineTotal = item.quantity * item.rate;
    if (item.taxRateId) {
      const taxRate = taxRates.find(tr => tr.id === item.taxRateId);
      if (taxRate && taxRate.isActive) {
        const current = taxMap.get(item.taxRateId) || { 
          name: taxRate.name, 
          rate: taxRate.rate, 
          amount: 0 
        };
        current.amount += lineTotal * taxRate.rate / 100;
        taxMap.set(item.taxRateId, current);
      }
    }
  });
  
  const taxBreakdown = Array.from(taxMap.values());

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        
        body {
            padding: 40px;
            color: #333;
            line-height: 1.6;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .business-info h1 {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        .invoice-title {
            font-size: 32px;
            font-weight: 800;
            color: #111827;
            text-align: right;
            margin-bottom: 5px;
        }
        
        .invoice-number {
            font-size: 18px;
            color: #6b7280;
            text-align: right;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 40px;
            margin-bottom: 40px;
        }
        
        .detail-section h3 {
            font-size: 14px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 10px;
        }
        
        .detail-section p {
            font-size: 16px;
            color: #1f2937;
            margin-bottom: 8px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
        }
        
        .items-table th {
            text-align: left;
            padding: 16px 12px;
            background: #f9fafb;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .items-table td {
            padding: 16px 12px;
            border-bottom: 1px solid #e5e7eb;
            color: #4b5563;
        }
        
        .items-table tr:last-child td {
            border-bottom: none;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .totals-section {
            margin-left: auto;
            width: 300px;
            margin-bottom: 40px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .total-row:last-child {
            border-bottom: none;
            font-weight: 700;
            font-size: 20px;
            color: #111827;
        }
        
        .total-label {
            color: #6b7280;
        }
        
        .total-value {
            font-weight: 600;
        }
        
        .notes-section {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 2px solid #e5e7eb;
        }
        
        .notes-section h3 {
            font-size: 14px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 10px;
        }
        
        .notes-content {
            white-space: pre-wrap;
            line-height: 1.8;
            color: #4b5563;
        }
        
        .footer {
            margin-top: 60px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #9ca3af;
            font-size: 14px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .status-draft { background: #f3f4f6; color: #6b7280; }
        .status-sent { background: #dbeafe; color: #1e40af; }
        .status-paid { background: #d1fae5; color: #065f46; }
        .status-overdue { background: #fee2e2; color: #991b1b; }
        .status-void { background: #f3f4f6; color: #6b7280; }
        
        @media print {
            body {
                padding: 0;
            }
            
            .invoice-container {
                max-width: 100%;
            }
            
            .no-print {
                display: none !important;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="business-info">
                <h1>${user.businessName}</h1>
                <div style="white-space: pre-line;">${user.businessAddress}</div>
            </div>
            <div>
                <h1 class="invoice-title">INVOICE</h1>
                <div class="invoice-number">${invoice.invoiceNumber}</div>
                <div style="margin-top: 10px;">
                    <span class="status-badge status-${invoice.status}">${invoice.status}</span>
                </div>
            </div>
        </div>
        
        <div class="details-grid">
            <div class="detail-section">
                <h3>Bill To</h3>
                <p><strong>${client.name}</strong></p>
                ${client.companyName ? `<p>${client.companyName}</p>` : ''}
                <p>${client.email}</p>
                <div style="white-space: pre-line;">
${client.billingAddress.street}
${client.billingAddress.city}, ${client.billingAddress.state} ${client.billingAddress.postalCode}
${client.billingAddress.country}
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Invoice Details</h3>
                <p><strong>Issue Date:</strong> ${issueDate}</p>
                <p><strong>Due Date:</strong> ${dueDate}</p>
                <p><strong>Payment Terms:</strong> ${invoice.paymentTerms} days</p>
                <p><strong>Currency:</strong> ${invoice.currency}</p>
            </div>
        </div>
        
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 45%;">Description</th>
                    <th style="width: 15%;" class="text-center">Quantity</th>
                    <th style="width: 15%;" class="text-right">Rate</th>
                    <th style="width: 20%;" class="text-right">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${items.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.description}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">${formatCurrency(item.rate, invoice.currency)}</td>
                    <td class="text-right">${formatCurrency(item.quantity * item.rate, invoice.currency)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="totals-section">
            <div class="total-row">
                <span class="total-label">Subtotal</span>
                <span class="total-value">${formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            
            ${taxBreakdown.map(tax => `
            <div class="total-row">
                <span class="total-label">${tax.name} (${tax.rate}%)</span>
                <span class="total-value">${formatCurrency(tax.amount, invoice.currency)}</span>
            </div>
            `).join('')}
            
            ${invoice.taxAmount > 0 && taxBreakdown.length === 0 ? `
            <div class="total-row">
                <span class="total-label">Tax</span>
                <span class="total-value">${formatCurrency(invoice.taxAmount, invoice.currency)}</span>
            </div>
            ` : ''}
            
            <div class="total-row">
                <span class="total-label">Total</span>
                <span class="total-value">${formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
        </div>
        
        ${invoice.notes ? `
        <div class="notes-section">
            <h3>Notes</h3>
            <div class="notes-content">${invoice.notes}</div>
        </div>
        ` : ''}
        
        ${invoice.terms ? `
        <div class="notes-section">
            <h3>Terms & Conditions</h3>
            <div class="notes-content">${invoice.terms}</div>
        </div>
        ` : ''}
        
        <div class="footer">
            <p>Thank you for your business!</p>
            <p>Invoice generated on ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</p>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Get URL for viewing invoice PDF (public view)
 */
export function getInvoicePdfUrl(invoice: { id: string; token: string }): string {
  return `/invoice/view/${invoice.token}`;
}

/**
 * Get URL for downloading invoice PDF
 */
export function getInvoiceDownloadUrl(invoiceId: string): string {
  return `/api/invoices/${invoiceId}/pdf`;
}