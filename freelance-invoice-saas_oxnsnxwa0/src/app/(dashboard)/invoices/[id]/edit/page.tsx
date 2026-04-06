"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import InvoiceForm, { InvoiceFormProps } from "@/components/InvoiceForm";
import { Client, TaxRate, Invoice, InvoiceItem } from "@/lib/types";
import { ArrowLeft } from "lucide-react";

export default function EditInvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<(Invoice & { items: InvoiceItem[] }) | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [invoiceRes, clientsRes, taxRatesRes] = await Promise.all([
          fetch(`/api/invoices/${params.id}`),
          fetch("/api/clients"),
          fetch("/api/tax-rates"),
        ]);

        if (!invoiceRes.ok) {
          throw new Error("Failed to load invoice");
        }
        if (!clientsRes.ok) {
          throw new Error("Failed to load clients");
        }
        if (!taxRatesRes.ok) {
          throw new Error("Failed to load tax rates");
        }

        const invoiceData = await invoiceRes.json();
        const clientsData = await clientsRes.json();
        const taxRatesData = await taxRatesRes.json();

        if (invoiceData.data.status !== "draft") {
          router.push(`/invoices/${params.id}`);
          return;
        }

        setInvoice(invoiceData.data);
        setClients(clientsData.data);
        setTaxRates(taxRatesData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [params.id, router]);

  const handleSubmit: InvoiceFormProps["onSubmit"] = async (invoiceData) => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update invoice");
      }

      router.push(`/invoices/${params.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update invoice");
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link
            href={`/invoices/${params.id}`}
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoice
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading invoice</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-sm font-medium text-red-800 hover:text-red-900"
              >
                Try again →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link
          href={`/invoices/${params.id}`}
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Invoice
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Invoice</h1>
        <p className="mt-2 text-gray-600">
          Make changes to invoice {invoice.invoiceNumber}. Only draft invoices can be edited.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <InvoiceForm
          initialInvoice={invoice}
          clients={clients}
          taxRates={taxRates}
          onSubmit={handleSubmit}
          submitLabel="Update Invoice"
        />
      </div>
    </div>
  );
}