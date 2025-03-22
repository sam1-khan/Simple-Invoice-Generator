"use client";

import { useState } from "react";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionTypeSelector } from "@/components/transaction-type-selector";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Cookies from "js-cookie";

export default function CreateTransactionPage() {
  const [isQuotation, setIsQuotation] = useState<boolean | null>(null);
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      const csrfToken = Cookies.get("csrftoken");
      if (!csrfToken) {
        throw new Error("CSRF token not found. Please refresh the page and try again.");
      }

      // Step 1: Save the invoice
      const invoicePayload = {
        client_id: data.client.id,
        is_taxed: data.is_taxed,
        tax_percentage: data.tax_percentage,
        date: data.date || new Date().toISOString().split("T")[0],
        notes: data.notes,
        transit_charges: data.transit_charges,
        is_quotation: isQuotation,
      };

      const invoiceResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify(invoicePayload),
        }
      );

      if (!invoiceResponse.ok) {
        const errorData = await invoiceResponse.json();
        throw new Error(errorData.detail || "Failed to create invoice.");
      }

      const invoiceData = await invoiceResponse.json();
      const invoiceId = invoiceData.id; // Extract the invoice ID

      // Step 2: Save the invoice items
      for (const item of data.items) {
        const itemPayload = {
          name: item.name,
          unit: item.unit,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        };

        const itemResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/${invoiceId}/items/`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": csrfToken,
            },
            body: JSON.stringify(itemPayload),
          }
        );

        if (!itemResponse.ok) {
          const errorData = await itemResponse.json();
          throw new Error(errorData.detail || "Failed to save invoice item.");
        }
      }

      toast.success("Invoice and items saved successfully!");
      router.push("/transactions");
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create invoice.");
    }
  };

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Create Transaction
          </h2>
          <p className="text-muted-foreground">
            What would you like to create today?
          </p>
        </div>
      </div>
      {isQuotation === null ? (
        <TransactionTypeSelector onSelect={setIsQuotation} />
      ) : (
        <TransactionForm isQuotation={isQuotation} onSubmit={handleSubmit} />
      )}
    </div>
  );
}