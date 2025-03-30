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

export type TransactionFormValues = z.infer<typeof extendedSchema>;

interface TransactionFormProps {
  isQuotation?: boolean;
  onSubmit: (data: TransactionFormValues) => Promise<void>;
  defaultValues?: Partial<TransactionFormValues>;
  isUpdate?: boolean;
}

export function TransactionForm({
  isQuotation = false,
  onSubmit,
  defaultValues,
  isUpdate = false,
}: TransactionFormProps) {
  const router = useRouter();
  const [clients, setClients] = useState<z.infer<typeof clientSchema>[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(extendedSchema),
    defaultValues: {
      is_taxed: false,
      tax_percentage: 0,
      transit_charges: 0,
      is_quotation: isQuotation,
      items: [],
      ...defaultValues, // Override with provided default values
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Watch the values of `is_taxed` and `tax_percentage`
  const isTaxed = watch("is_taxed");
  const taxPercentage = watch("tax_percentage");

  // Hide the input if the checkbox is checked
  const showTaxPercentageInput = !isTaxed;

  // Hide the checkbox if the input is changed (not empty or not 0)
  const showTaxIncludedCheckbox = taxPercentage === 0 || taxPercentage === null;

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

  // Set the client value when defaultValues change
  useEffect(() => {
    if (defaultValues?.client) {
      setValue("client", defaultValues.client); // Set the client object
    }
  }, [defaultValues, setValue]);

  const handleFormSubmit = async (data: TransactionFormValues) => {
    setLoading(true);
    try {
      await onSubmit(data); // Call the provided onSubmit function
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit form. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-4 w-auto mx-auto md:w-full"
    >
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
            value={watch("client")?.id?.toString()} // Set the value to the client's ID
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

      {/* Tax Included Checkbox with Bordered Container */}
      {showTaxIncludedCheckbox && (
        <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
          <Checkbox
            id="is_taxed"
            {...register("is_taxed")}
            checked={isTaxed} // Set the checked state based on the `is_taxed` value
            onCheckedChange={(checked) => {
              setValue("is_taxed", !!checked);
              // Reset tax percentage if checkbox is checked
              if (checked) {
                setValue("tax_percentage", 0);
              }
            }}
          />
          <div className="space-y-1 leading-none">
            <Label htmlFor="is_taxed">Tax Included</Label>
            <p className="text-sm text-muted-foreground">
              Enable this if tax is included in the transaction.
            </p>
          </div>
        </div>
      )}

      {/* Tax Percentage Input */}
      {showTaxPercentageInput && (
        <div className="grid grid-cols-1 gap-4">
          <Label>Tax Percentage</Label>
          <Input
            type="number"
            {...register("tax_percentage", { valueAsNumber: true })}
            placeholder="Enter tax percentage"
            className="w-full"
            onChange={(e) => {
              const value = e.target.value;
              // Update the tax percentage value in the form state
              setValue("tax_percentage", value === "" ? 0 : parseFloat(value), {
                shouldValidate: true,
              });
              // Hide the checkbox if the input is changed (not empty or not 0)
              if (value !== "" && value !== "0") {
                setValue("is_taxed", false);
              }
            }}
          />
          {errors.tax_percentage && (
            <span className="text-red-500">{errors.tax_percentage.message}</span>
          )}
        </div>
      )}

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
          variant="outline"
          className="w-full"
        >
          Add Item
        </Button>
      </div>

      {/* Save Button */}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (isUpdate ? "Updating..." : "Saving...") : isUpdate ? "Update Invoice" : "Save"}
      </Button>
    </form>
  );
}