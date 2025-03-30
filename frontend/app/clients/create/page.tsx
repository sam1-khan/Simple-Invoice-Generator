"use client";

import { ClientForm, ClientFormValues } from "@/components/client-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Cookies from "js-cookie";

export default function CreateClientPage() {
  const router = useRouter();

  const handleSubmit = async (data: ClientFormValues) => {
    const csrfToken = Cookies.get("csrftoken");
    if (!csrfToken) {
      toast.error("CSRF token not found");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/clients/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        toast.error(responseData.detail || responseData.message || "Failed to create client");
        return;
      }

      toast.success("Client created successfully");
      router.push("/clients");
    } catch (error) {
      toast.error(`An unexpected error occurred: ${error}`);
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