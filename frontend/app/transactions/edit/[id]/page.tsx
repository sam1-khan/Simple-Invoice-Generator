"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema, clientSchema } from "@/app/transactions/data/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { z } from "zod";
import Cookies from "js-cookie";

// Define the schema and types
const formSchema = transactionSchema.pick({
  client: true,
  is_taxed: true,
  tax_percentage: true,
  date: true,
  notes: true,
  transit_charges: true,
  is_quotation: true,
});

const extendedSchema = formSchema.extend({
  items: z.array(
    z.object({
      id: z.number().optional(), // Include id for updates
      name: z.string().min(1, "Item name is required"),
      unit: z.string().min(1, "Unit is required"),
      description: z.string().optional(),
      quantity: z.number().min(1, "Quantity must be at least 1"),
      unit_price: z.number().min(0, "Unit price must be a positive number"),
    })
  ),
});

type TransactionFormValues = z.infer<typeof extendedSchema>;

export default function TransactionUpdateForm() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>(); // Get the invoice ID from the URL
  const [clients, setClients] = useState<z.infer<typeof clientSchema>[]>([]);
  const [loading, setLoading] = useState(false);
  const [invoiceNotFound, setInvoiceNotFound] = useState(false);
  const [initialItems, setInitialItems] = useState<z.infer<typeof extendedSchema>["items"]>([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
    reset,
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(extendedSchema),
    defaultValues: {
      is_taxed: false,
      tax_percentage: 0,
      transit_charges: 0,
      is_quotation: false,
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Fetch clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clients/`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) throw new Error("Failed to fetch clients");
        const data = await response.json();
        setClients(data);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };
    fetchClients();
  }, []);

  // Fetch transaction data when the component mounts
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/${id}/`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) {
          if (response.status === 404) {
            setInvoiceNotFound(true); // Invoice not found
          } else {
            throw new Error("Failed to fetch transaction");
          }
          return;
        }
        const data = await response.json();
        reset(data); // Populate the form with fetched data

        // Fetch invoice items
        const itemsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/${id}/items/`,
          {
            credentials: "include",
          }
        );
        if (!itemsResponse.ok) throw new Error("Failed to fetch invoice items");
        const itemsData = await itemsResponse.json();
        setInitialItems(itemsData); // Store initial items for comparison
        setValue("items", itemsData); // Populate the form with invoice items
      } catch (error) {
        console.error("Error fetching transaction:", error);
        toast.error("Failed to fetch transaction data");
      }
    };

    if (id) fetchTransaction();
  }, [id, reset, setValue]);

  const onSubmit = async (data: TransactionFormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        client_id: data.client.id,
        is_quotation: data.is_quotation,
        date: data.date || new Date().toISOString().split("T")[0],
      };

      const csrfToken = Cookies.get("csrftoken");
      if (!csrfToken) {
        throw new Error("CSRF token not found. Please refresh the page and try again.");
      }

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
        throw new Error(
          errorData.detail || "Failed to update invoice. Please try again."
        );
      }

      // Step 2: Handle invoice items
      const updatedItems = data.items || [];
      const removedItems = initialItems.filter(
        (initialItem) => !updatedItems.some((item) => item.id === initialItem.id)
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
      router.push("/transactions"); // Redirect to the transactions page
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update transaction. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // If the invoice is not found, render a message
  if (invoiceNotFound) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-red-500">Invoice Not Found</h1>
        <p className="text-gray-600">The invoice you are trying to edit does not exist.</p>
        <Button
          onClick={() => router.push("/transactions")}
          className="mt-4"
        >
          Go Back to Transactions
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Invoice</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Client Select */}
        <div className="grid grid-cols-1 gap-4">
          <Label>Client</Label>
          <div className="flex gap-2">
            <Select
              onValueChange={(value) => {
                const selectedClient = clients.find(
                  (client) => client.id.toString() === value
                );
                if (selectedClient) {
                  setValue("client", selectedClient, { shouldValidate: true });
                }
              }}
            >
              <SelectTrigger className="w-full truncate">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={() => router.push("/clients/create")}
              variant="outline"
            >
              Create New Client
            </Button>
          </div>
          {errors.client && (
            <span className="text-red-500">{errors.client.message}</span>
          )}
        </div>

        {/* Tax Percentage or Tax Included */}
        <div className="grid grid-cols-1 gap-4">
          <Label>Tax</Label>
          <div className="flex items-center gap-2">
            <Checkbox
              {...register("is_taxed")}
              onCheckedChange={(checked) => {
                setValue("is_taxed", !!checked);
              }}
            />
            <Label>Tax Included</Label>
          </div>
          <Input
            type="number"
            {...register("tax_percentage", { valueAsNumber: true })}
            placeholder="Enter tax percentage"
            className="w-full"
          />
          {errors.tax_percentage && (
            <span className="text-red-500">{errors.tax_percentage.message}</span>
          )}
        </div>

        {/* Date */}
        <div className="grid grid-cols-1 gap-4">
          <Label>Date</Label>
          <Input
            type="date"
            {...register("date")}
            placeholder="Select date"
            className="w-full"
          />
          {errors.date && (
            <span className="text-red-500">{errors.date.message}</span>
          )}
        </div>

        {/* Notes */}
        <div className="grid grid-cols-1 gap-4">
          <Label>Notes</Label>
          <Textarea
            {...register("notes")}
            placeholder="Enter notes"
            className="w-full"
          />
          {errors.notes && (
            <span className="text-red-500">{errors.notes.message}</span>
          )}
        </div>

        {/* Transit Charges */}
        <div className="grid grid-cols-1 gap-4">
          <Label>Transit Charges</Label>
          <Input
            type="number"
            {...register("transit_charges", { valueAsNumber: true })}
            placeholder="Enter transit charges"
            className="w-full"
          />
          {errors.transit_charges && (
            <span className="text-red-500">{errors.transit_charges.message}</span>
          )}
        </div>

        {/* Invoice Items */}
        <div className="space-y-4">
          <Label>Invoice Items</Label>
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-2 border p-4 rounded-lg">
              <div className="grid grid-cols-1 gap-4">
                <Label>Item Name</Label>
                <Input
                  {...register(`items.${index}.name`)}
                  placeholder="Enter item name"
                  className="w-full"
                />
                {errors.items?.[index]?.name && (
                  <span className="text-red-500">
                    {errors.items[index].name.message}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  {...register(`items.${index}.quantity`, {
                    valueAsNumber: true,
                  })}
                  placeholder="Enter quantity"
                  className="w-full"
                />
                {errors.items?.[index]?.quantity && (
                  <span className="text-red-500">
                    {errors.items[index].quantity.message}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Label>Unit Price</Label>
                <Input
                  type="number"
                  {...register(`items.${index}.unit_price`, {
                    valueAsNumber: true,
                  })}
                  placeholder="Enter unit price"
                  className="w-full"
                />
                {errors.items?.[index]?.unit_price && (
                  <span className="text-red-500">
                    {errors.items[index].unit_price.message}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Label>Unit</Label>
                <Input
                  {...register(`items.${index}.unit`)}
                  placeholder="Enter unit (e.g., pc, box)"
                  className="w-full"
                />
                {errors.items?.[index]?.unit && (
                  <span className="text-red-500">
                    {errors.items[index].unit.message}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Label>Description</Label>
                <Textarea
                  {...register(`items.${index}.description`)}
                  placeholder="Enter description"
                  className="w-full"
                />
                {errors.items?.[index]?.description && (
                  <span className="text-red-500">
                    {errors.items[index].description.message}
                  </span>
                )}
              </div>

              <Button
                type="button"
                onClick={() => remove(index)}
                variant="destructive"
                className="w-full"
              >
                Remove Item
              </Button>
            </div>
          ))}

          <Button
            type="button"
            onClick={() =>
              append({
                name: "",
                quantity: 0,
                unit_price: 0,
                unit: "",
                description: "",
              })
            }
            className="w-full"
          >
            Add Item
          </Button>
        </div>

        {/* Save Button */}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Updating..." : "Update Invoice"}
        </Button>
      </form>
    </div>
  );
}