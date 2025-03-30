"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ArrowRight,
  Loader2,
  InfoIcon,
  EditIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import Link from "next/link";
import { handleDelete } from "@/components/ui/data-table-row-actions-clients";
import { clientSchema } from "@/app/transactions/data/schema";

export default function ClientView() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<z.infer<typeof clientSchema> | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clients/${id}/`,
          { credentials: "include" }
        );

        const data = await response.json();
        const validatedClient = clientSchema.parse(data);
        setClient(validatedClient);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast.error("Failed to load client data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[36rem] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <InfoIcon className="h-8 w-8 text-destructive" />
        <p className="text-lg">Client not found</p>
        <Link href="/transactions">
          <Button variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <Link href="/clients">
          <Button variant="ghost">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clients/edit/${id}`}>
              <EditIcon className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              handleDelete(client.id, client.name);
              router.back();
            }}
          >
            <Trash2Icon className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Client Card */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex justify-between">
            <div>
              <CardTitle className="text-3xl">{client.name}</CardTitle>
              <p className="text-muted-foreground mt-1">
                Client ID: {client.id}
              </p>
            </div>
            <h3 className="text-sm font-light tracking-tight pb-4">
              Created by:{" "}
              <span className="text-xl tracking-tight font-semibold">
                {client.invoice_owner.name}
              </span>
            </h3>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Details */}
            <div className="space-y-2">
              <h3 className="font-medium text-lg">Contact Information</h3>
              <Separator />
              <div className="space-y-1.5">
                <p>
                  <span className="text-muted-foreground">Phone:</span>{" "}
                  {client.phone || "N/A"}
                </p>
                <p>
                  <span className="text-muted-foreground">NTN:</span>{" "}
                  {client.ntn_number || "N/A"}
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <h3 className="font-medium text-lg">Address</h3>
              <Separator />
              <div className="space-y-1.5">
                <p>{client.address || "No address provided"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Client Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link href={"/transactions"}>
              <Button variant="outline">
                <ArrowRight className="mr-2 h-4 w-4" />
                View Transactions
              </Button>
            </Link>
            <Link href={"/transactions/create"}>
              <Button variant="outline">
                <ArrowRight className="mr-2 h-4 w-4" />
                Create Transaction
              </Button>
            </Link>
            <Link href={"/clients/create"}>
              <Button variant="outline">
                <ArrowRight className="mr-2 h-4 w-4" />
                Create Client
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
