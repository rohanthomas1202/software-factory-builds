"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import InvoiceForm from "@/components/InvoiceForm";
import { Client, TaxRate } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        // Verify user is authenticated
        const user = await getCurrentUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Fetch clients and tax rates in parallel
        const [clientsRes, taxRatesRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/tax-rates"),
        ]);

        if (!clientsRes.ok) {
          throw new Error(`Failed to load clients: ${clientsRes.status}`);
        }
        if (!taxRatesRes.ok) {
          throw new Error(`Failed to load tax rates: ${taxRatesRes.status}`);
        }

        const clientsData = await clientsRes.json();
        const taxRatesData = await taxRatesRes.json();

        setClients(clientsData.data || []);
        setTaxRates(taxRatesData.data || []);
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleSuccess = (invoice: any) => {
    router.push(`/invoices/${invoice.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <h3 className="font-semibold">Error loading data</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded bg-red-100 px-3 py-1 text-sm font-medium hover:bg-red-200"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Invoice</h1>
        <p className="mt-2 text-gray-600">
          Fill in the details below to create a new invoice.
        </p>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h3 className="font-semibold text-amber-800">No clients found</h3>
          <p className="mt-2 text-amber-700">
            You need to create at least one client before creating an invoice.
          </p>
          <div className="mt-4">
            <button
              onClick={() => router.push("/clients")}
              className="rounded bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700"
            >
              Go to Clients
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <InvoiceForm
            clients={clients}
            taxRates={taxRates}
            onSuccess={handleSuccess}
          />
        </div>
      )}
    </div>
  );
}