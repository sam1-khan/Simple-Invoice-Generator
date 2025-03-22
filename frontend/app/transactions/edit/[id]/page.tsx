"use client";

import { TransactionForm } from "@/components/transaction-form";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

export default function EditTransactionPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<any>(null);
  const { mutate } = useSWRConfig(); // Use SWR's mutate function

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch transaction data
        const transactionResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/${id}/`,
          {
            credentials: "include",
          }
        );
        if (!transactionResponse.ok) {
          throw new Error("Failed to fetch transaction data.");
        }
        const transactionData = await transactionResponse.json();

        // Fetch invoice items
        const itemsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/${id}/items/`,
          {
            credentials: "include",
          }
        );
        if (!itemsResponse.ok) {
          throw new Error("Failed to fetch invoice items.");
        }
        const itemsData = await itemsResponse.json();

        // Combine transaction data and items data
        const combinedData = {
          ...transactionData,
          items: itemsData, // Add items to the transaction data
        };

        setInitialData(combinedData); // Set the combined data as initialData
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch transaction data.");
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (data: any) => {
    try {
      const csrfToken = Cookies.get("csrftoken");
      if (!csrfToken) {
        throw new Error(
          "CSRF token not found. Please refresh the page and try again."
        );
      }

      // Prepare the payload for the API
      const payload = {
        ...data,
        client_id: data.client.id, // Use client_id instead of client object
      };

      // Step 1: Update the invoice
      const invoiceResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/${id}/`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!invoiceResponse.ok) {
        const errorData = await invoiceResponse.json();
        throw new Error(errorData.detail || "Failed to update invoice.");
      }

      // Step 2: Handle invoice items
      const updatedItems = data.items || [];
      const removedItems = initialData.items.filter(
        (initialItem: any) =>
          !updatedItems.some((item: any) => item.id === initialItem.id)
      );

      // Delete removed items
      for (const item of removedItems) {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/${id}/items/${item.id}/`,
          {
            method: "DELETE",
            credentials: "include",
            headers: {
              "X-CSRFToken": csrfToken,
            },
          }
        );
      }

      // Update or create items
      for (const item of updatedItems) {
        const itemEndpoint = item.id
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/${id}/items/${item.id}/` // Update existing item
          : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/${id}/items/`; // Create new item

        const itemResponse = await fetch(itemEndpoint, {
          method: item.id ? "PATCH" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify(item),
        });

        if (!itemResponse.ok) {
          const errorData = await itemResponse.json();
          throw new Error(
            errorData.detail || "Failed to update invoice item. Please try again."
          );
        }
      }

      // Success
      toast.success("Invoice updated successfully!");
      mutate(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/`); // Revalidate the transactions list
      router.push("/transactions");
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update invoice."
      );
    }
  };

  if (!initialData) return;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Invoice</h1>
      <TransactionForm
        onSubmit={handleSubmit}
        defaultValues={initialData}
        isUpdate
      />
    </div>
  );
}