"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import InvoiceForm from "@/components/InvoiceForm";
import { Invoice, Client, TaxRate } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";

export default function EditInvoicePage() {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  useEffect(() => {
    async function fetchData() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Fetch invoice
        const invoiceRes = await fetch(`/api/invoices/${invoiceId}`);
        if (!invoiceRes.ok) {
          if (invoiceRes.status === 404) {
            throw new Error("Invoice not found");
          }
          throw new Error("Failed to fetch invoice");
        }

        const invoiceData = await invoiceRes.json();
        if (invoiceData.error) {
          throw new Error(invoiceData.error);
        }

        const invoice: Invoice = invoiceData.data;

        // Check if invoice is editable
        if (invoice.status !== "draft") {
          router.push(`/invoices/${invoiceId}`);
          return;
        }

        setInvoice(invoice);

        // Fetch clients and tax rates
        const [clientsRes, taxRatesRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/tax-rates"),
        ]);

        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          if (!clientsData.error) {
            setClients(clientsData.data || []);
          }
        }

        if (taxRatesRes.ok) {
          const taxRatesData = await taxRatesRes.json();
          if (!taxRatesData.error) {
            setTaxRates(taxRatesData.data || []);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    if (invoiceId) {
      fetchData();
    }
  }, [invoiceId, router]);

  const handleSuccess = () => {
    router.push(`/invoices/${invoiceId}`);
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading invoice data...</div>
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
              <button
                onClick={() => router.push("/invoices")}
                className="mt-4 rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-200"
              >
                Back to Invoices
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Edit Invoice
        </h1>
        <p className="mt-2 text-gray-600">
          Update invoice details and line items
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <InvoiceForm
          invoice={invoice}
          clients={clients}
          taxRates={taxRates}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}