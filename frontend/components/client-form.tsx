"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, invoiceOwnerSchema } from "@/app/transactions/data/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useState } from "react";
import { PhoneInput } from "./phone-input";

// Create form schema by omitting unnecessary fields and enhancing validation
const formSchema = clientSchema
  .omit({ 
    id: true,
    created_at: true,
    updated_at: true,
    invoice_owner: true 
  })
  .extend({
    name: z.string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters"),
    address: z.string()
      .min(5, "Address must be at least 5 characters")
      .max(200, "Address must be less than 200 characters")
      .nullable(),
    ntn_number: z.string()
      .regex(/^[0-9]{7}-[0-9]$|^$/, "NTN must be in format 1234567-8 or empty")
      .nullable(),
    phone: z.string()
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number must be less than 15 digits")
      .nullable()
  });

type ClientFormValues = z.infer<typeof formSchema>;

interface ClientFormProps {
  onSubmit: (data: ClientFormValues) => Promise<void>;
  defaultValues?: Partial<ClientFormValues>;
  isUpdate?: boolean;
}

export function ClientForm({
  onSubmit,
  defaultValues,
  isUpdate = false,
}: ClientFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    trigger,
  } = useForm<ClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: null,
      ntn_number: null,
      phone: null,
      ...defaultValues,
    },
    mode: "onChange",
  });

  const handleFormSubmit = async (data: ClientFormValues) => {
    setLoading(true);
    try {
      await onSubmit({
        ...data,
        // Ensure null fields are properly handled
        address: data.address || null,
        ntn_number: data.ntn_number || null,
        phone: data.phone || null,
      });
      toast.success(isUpdate ? "Client updated successfully!" : "Client created successfully!");
      router.refresh();
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

  const handlePhoneChange = (value: string) => {
    const processedValue = value.trim() === "" ? null : value;
    setValue("phone", processedValue, { shouldValidate: true });
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-4 w-auto mx-auto md:w-full"
    >
      {/* Name (required) */}
      <div className="grid grid-cols-1 gap-1">
        <Label htmlFor="name">Name*</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Enter client name"
          className="w-full"
        />
        {errors.name && (
          <span className="text-red-500 text-sm">{errors.name.message}</span>
        )}
      </div>

      {/* Address (optional) */}
      <div className="grid grid-cols-1 gap-1">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          {...register("address")}
          placeholder="Enter client address"
          className="w-full"
          value={watch("address") || ""}
          onChange={(e) => 
            setValue("address", e.target.value || null, { shouldValidate: true })
          }
        />
        {errors.address && (
          <span className="text-red-500 text-sm">{errors.address.message}</span>
        )}
      </div>

      {/* NTN Number (optional) */}
      <div className="grid grid-cols-1 gap-1">
        <Label htmlFor="ntn_number">NTN Number</Label>
        <Input
          id="ntn_number"
          {...register("ntn_number")}
          placeholder="Enter NTN number (format: 1234567-8)"
          className="w-full"
          value={watch("ntn_number") || ""}
          onChange={(e) => 
            setValue("ntn_number", e.target.value || null, { shouldValidate: true })
          }
        />
        {errors.ntn_number && (
          <span className="text-red-500 text-sm">{errors.ntn_number.message}</span>
        )}
      </div>

      {/* Phone (optional) */}
      <div className="grid grid-cols-1 gap-1">
        <Label htmlFor="phone">Phone</Label>
        <PhoneInput
          id="phone"
          placeholder="Enter phone number"
          value={watch("phone") || ""}
          onChange={handlePhoneChange}
        />
        {errors.phone && (
          <span className="text-red-500 text-sm">{errors.phone.message}</span>
        )}
      </div>

      {/* Save Button */}
      <Button 
        type="submit" 
        className="w-full mt-6" 
        disabled={loading || !isValid}
      >
        {loading ? (isUpdate ? "Updating..." : "Saving...") : isUpdate ? "Update Client" : "Save Client"}
      </Button>
    </form>
  );
}