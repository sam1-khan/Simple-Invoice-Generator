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
import { useRouter } from "next/navigation";
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

// Step 1: Use `pick` to select only the fields needed for the form
const formSchema = transactionSchema.pick({
  client: true,
  is_taxed: true,
  tax_percentage: true,
  date: true,
  notes: true,
  transit_charges: true,
  is_quotation: true, // Include is_quotation in the schema
});

// Extend the schema to include dynamic items
const extendedSchema = formSchema.extend({
  items: z.array(
    z.object({
      name: z.string().min(1, "Item name is required"),
      quantity: z.number().min(1, "Quantity must be at least 1"),
      unit_price: z.number().min(0, "Unit price must be a positive number"),
      unit: z.string().min(1, "Unit is required"),
      description: z.string().optional(),
    })
  ),
});

type TransactionFormValues = z.infer<typeof extendedSchema>;

interface TransactionFormProps {
  isQuotation?: boolean; // Prop to determine if this is a quotation
}

export function TransactionForm({ isQuotation = false }: TransactionFormProps) {
  const router = useRouter();
  const [clients, setClients] = useState<z.infer<typeof clientSchema>[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(extendedSchema),
    defaultValues: {
      is_taxed: false,
      tax_percentage: 0,
      transit_charges: 0,
      is_quotation: isQuotation, // Set default value for is_quotation
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

  const onSubmit = async (data: TransactionFormValues) => {
    setLoading(true);
    try {
      // Prepare the payload for the API
      const payload = {
        ...data,
        client_id: data.client.id, // Use `client_id` instead of `client`
        is_quotation: isQuotation, // Use the isQuotation prop
        date: data.date || new Date().toISOString().split("T")[0], // Populate with current date if not provided
      };
  
      const csrfToken = Cookies.get("csrftoken");
      if (!csrfToken) {
        throw new Error("CSRF token not found. Please refresh the page and try again.");
      }
  
      // Step 1: Create the invoice
      const invoiceResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/`,
        {
          method: "POST",
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
          errorData.detail || "Failed to create invoice. Please try again."
        );
      }
  
      const invoiceResult = await invoiceResponse.json();
      const invoiceId = invoiceResult.id;
  
      // Step 2: Create invoice items
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          const itemResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/${invoiceId}/items/`,
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken,
              },
              body: JSON.stringify(item),
            }
          );
  
          if (!itemResponse.ok) {
            const errorData = await itemResponse.json();
            throw new Error(
              errorData.detail || "Failed to create invoice item. Please try again."
            );
          }
        }
      }
  
      // Success
      toast.success("Invoice and items created successfully!");
      router.push("/transactions"); // Redirect to the transactions page
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create transaction. Please try again."
      );
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 w-auto mx-auto md:w-full"
    >
      {/* Client Select */}
      <div className="grid grid-cols-1 gap-4">
        <Label>Client</Label>
        <div className="flex gap-2">
          <Select
            onValueChange={(value) => {
              // Find the selected client object
              const selectedClient = clients.find(
                (client) => client.id.toString() === value
              );
              if (selectedClient) {
                // Set the client object in the form state
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
        {loading ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}