import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InvoiceFlow - Freelance Invoicing Made Simple",
  description: "Streamline your freelance invoicing with our easy-to-use SaaS platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <div className="min-h-screen">
          <Nav />
          <main className="pb-8">{children}</main>
          <footer className="border-t border-gray-200 bg-white py-6">
            <div className="container mx-auto px-4">
              <div className="flex flex-col items-center justify-between md:flex-row">
                <div className="mb-4 md:mb-0">
                  <p className="text-sm text-gray-600">
                    © {new Date().getFullYear()} InvoiceFlow. All rights reserved.
                  </p>
                </div>
                <div className="flex space-x-6">
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Terms
                  </a>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Privacy
                  </a>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Contact
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}