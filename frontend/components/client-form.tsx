"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema } from "@/app/transactions/data/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { useState } from "react";
import { PhoneInput } from "./phone-input";

const formSchema = clientSchema
  .omit({ 
    id: true,
    created_at: true,
    updated_at: true,
    invoice_owner: true 
  })
  .extend({
    name: z.string()
      .min(1, "Name is required")
      .max(100, "Name must be less than 100 characters"),
    address: z.string()
      .max(200, "Address must be less than 200 characters")
      .optional()
      .nullable(),
    ntn_number: z.string()
      .optional()
      .nullable(),
    phone: z.string()
      .optional()
      .nullable()
  });

export type ClientFormValues = z.infer<typeof formSchema>;

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
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
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
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    setValue("phone", value || null, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 w-auto mx-auto md:w-full">
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

      <div className="grid grid-cols-1 gap-1">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          {...register("address")}
          placeholder="Enter client address"
          className="w-full"
        />
        {errors.address && (
          <span className="text-red-500 text-sm">{errors.address.message}</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-1">
        <Label htmlFor="ntn_number">NTN Number</Label>
        <Input
          id="ntn_number"
          {...register("ntn_number")}
          placeholder="Enter NTN number"
          className="w-full"
        />
        {errors.ntn_number && (
          <span className="text-red-500 text-sm">{errors.ntn_number.message}</span>
        )}
      </div>

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