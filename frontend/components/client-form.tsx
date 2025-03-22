"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema } from "@/app/transactions/data/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useState } from "react";
import { PhoneInput } from "./phone-input"; // Import the PhoneInput component

// Define the schema and types
const formSchema = clientSchema.omit({ id: true, created_at: true, updated_at: true, invoice_owner: true });

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
    formState: { errors },
    setValue,
    watch,
  } = useForm<ClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues, // Override with provided default values
    },
  });

  const handleFormSubmit = async (data: ClientFormValues) => {
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
      {/* Name */}
      <div className="grid grid-cols-1 gap-4">
        <Label>Name</Label>
        <Input
          {...register("name")}
          placeholder="Enter client name"
          className="w-full"
        />
        {errors.name && (
          <span className="text-red-500 text-sm">{errors.name.message}</span>
        )}
      </div>

      {/* Address */}
      <div className="grid grid-cols-1 gap-4">
        <Label>Address</Label>
        <Textarea
          {...register("address")}
          placeholder="Enter client address"
          className="w-full"
        />
        {errors.address && (
          <span className="text-red-500 text-sm">{errors.address.message}</span>
        )}
      </div>

      {/* NTN Number */}
      <div className="grid grid-cols-1 gap-4">
        <Label>NTN Number</Label>
        <Input
          {...register("ntn_number")}
          placeholder="Enter NTN number"
          className="w-full"
        />
        {errors.ntn_number && (
          <span className="text-red-500 text-sm">{errors.ntn_number.message}</span>
        )}
      </div>

      {/* Phone */}
      <div className="grid grid-cols-1 gap-4">
        <Label>Phone</Label>
        <PhoneInput
          placeholder="Enter phone number"
          value={watch("phone") || ""}
          onChange={(value) => setValue("phone", value, { shouldValidate: true })}
        />
        {errors.phone && (
          <span className="text-red-500 text-sm">{errors.phone.message}</span>
        )}
      </div>

      {/* Save Button */}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (isUpdate ? "Updating..." : "Saving...") : isUpdate ? "Update Client" : "Save"}
      </Button>
    </form>
  );
}