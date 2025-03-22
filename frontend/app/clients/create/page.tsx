"use client";

import { ClientForm } from "@/components/client-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Cookies from "js-cookie";

export default function CreateClientPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      const csrfToken = Cookies.get("csrftoken");
      if (!csrfToken) {
        throw new Error("CSRF token not found. Please refresh the page and try again.");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/clients/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create client.");
      }

      toast.success("Client created successfully!");
      router.push("/clients");
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create client.");
    }
  };

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create Client</h2>
          <p className="text-muted-foreground">
            Create a new client.
          </p>
        </div>
      </div>
      <ClientForm onSubmit={handleSubmit} />
    </div>
  );
}