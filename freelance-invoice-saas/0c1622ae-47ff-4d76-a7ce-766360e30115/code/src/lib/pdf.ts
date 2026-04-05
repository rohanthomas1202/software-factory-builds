import { Invoice, Client, User, TaxRate, PdfGenerationResult, EmailLog } from '@/lib/types';
import { generateId } from '@/lib/store';
import { formatCurrency } from '@/lib/calculations';

// In-memory storage for generated PDFs and email logs (simulation)
const generatedPdfs = new Map<string, PdfGenerationResult>();
const emailLogs = new Map<string, EmailLog[]>();

/**
 * Generates HTML for the invoice PDF
 */
export function generateInvoiceHtml(invoice: Invoice, client: Client, user: User, taxRate: TaxRate): string {
  const lineItemsHtml = invoice.lineItems.map(item => `
    <tr class="border-b border-gray-200">
      <td class="py-2 px-4">${item.description}</td>
      <td class="py-2 px-4 text-center">${item.quantity}</td>
      <td class="py-2 px-4 text-right">${formatCurrency(item.unitPriceCents)}</td>
      <td class="py-2 px-4 text-right">${formatCurrency(item.totalCents)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .company-info h2 { margin: 0 0 5px 0; color: #1a1a1a; }
    .invoice-info h1 { margin: 0 0 10px 0; color: #1a1a1a; }
    .client-info { margin-bottom: 30px; background: #f9fafb; padding: 20px; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f3f4f6; text-align: left; padding: 12px; font-weight: 600; }
    .totals { width: 300px; margin-left: auto; margin-top: 30px; }
    .totals td { padding: 8px 0; }
    .total-row { font-weight: bold; font-size: 1.1em; border-top: 2px solid #1a1a1a; }
    .footer { margin-top: 50px; text-align: center; color: #6b7280; font-size: 0.9em; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 0.875em; font-weight: 500; }
    .status-draft { background: #fef3c7; color: #92400e; }
    .status-sent { background: #dbeafe; color: #1e40af; }
    .status-paid { background: #d1fae5; color: #065f46; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h2>${user.name}</h2>
      <p>${user.email}</p>
      ${user.address ? `<p>${user.address}</p>` : ''}
    </div>
    <div class="invoice-info">
      <h1>INVOICE ${invoice.invoiceNumber}</h1>
      <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
      <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
      <span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span>
    </div>
  </div>
  
  <div class="client-info">
    <h3 style="margin-top: 0;">Bill To:</h3>
    <p><strong>${client.name}</strong><br>
    ${client.email}<br>
    ${client.billingAddress}</p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: center;">Quantity</th>
        <th style="text-align: right;">Unit Price</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemsHtml}
    </tbody>
  </table>
  
  <div class="totals">
    <table>
      <tr>
        <td>Subtotal:</td>
        <td style="text-align: right;">${formatCurrency(invoice.subtotalCents)}</td>
      </tr>
      <tr>
        <td>Discount:</td>
        <td style="text-align: right;">${formatCurrency(invoice.discountAmountCents)}</td>
      </tr>
      <tr>
        <td>Tax (${taxRate.rate}%):</td>
        <td style="text-align: right;">${formatCurrency(invoice.taxAmountCents)}</td>
      </tr>
      <tr class="total-row">
        <td>TOTAL:</td>
        <td style="text-align: right;">${formatCurrency(invoice.totalCents)}</td>
      </tr>
    </table>
  </div>
  
  <div class="footer">
    <p>Thank you for your business! Please make payment within ${invoice.paymentTerms || 30} days.</p>
    <p>Questions? Contact ${user.name} at ${user.email}</p>
  </div>
</body>
</html>
  `;
}

/**
 * Simulates PDF generation (returns HTML content and fake URL)
 */
export function generateInvoicePdf(invoice: Invoice, client: Client, user: User, taxRate: TaxRate): PdfGenerationResult {
  const html = generateInvoiceHtml(invoice, client, user, taxRate);
  const pdfId = generateId();
  const pdfUrl = `/api/invoices/${invoice.id}/pdf/${pdfId}`; // Simulated URL

  const result: PdfGenerationResult = {
    pdfId,
    invoiceId: invoice.id,
    pdfUrl,
    htmlContent: html,
    generatedAt: new Date(),
  };

  generatedPdfs.set(invoice.id, result);
  return result;
}

/**
 * Retrieves a generated PDF by invoice ID
 */
export function getGeneratedPdf(invoiceId: string): PdfGenerationResult | null {
  return generatedPdfs.get(invoiceId) || null;
}

/**
 * Logs an email send attempt
 */
export function logEmailSend(
  invoiceId: string,
  userId: string,
  recipient: string,
  status: 'sent' | 'failed',
  error?: string,
  publicToken?: string
): EmailLog {
  const log: EmailLog = {
    id: generateId(),
    invoiceId,
    userId,
    recipient,
    status,
    error,
    publicToken,
    sentAt: new Date(),
  };

  const logs = emailLogs.get(invoiceId) || [];
  logs.push(log);
  emailLogs.set(invoiceId, logs);

  return log;
}

/**
 * Retrieves email logs for an invoice
 */
export function getEmailLogs(invoiceId: string): EmailLog[] {
  return emailLogs.get(invoiceId) || [];
}