"use client";

import { ClientForm } from "@/components/client-form";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";

export default function EditClientPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState(null);
  const { mutate } = useSWRConfig(); // Use SWR's mutate function

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clients/${id}/`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) throw new Error("Failed to fetch client data.");
        const data = await response.json();
        setInitialData(data);
      } catch (error) {
        console.error("Error fetching client data:", error);
        toast.error("Failed to fetch client data.");
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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clients/${id}/`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update client.");
      }

      toast.success("Client updated successfully!");
      mutate(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/clients/`); // Revalidate the clients list
      router.push("/clients");
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update client."
      );
    }
  };

  if (!initialData) return;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Client</h1>
      <ClientForm
        onSubmit={handleSubmit}
        defaultValues={initialData}
        isUpdate
      />
    </div>
  );
}
