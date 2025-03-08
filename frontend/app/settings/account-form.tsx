"use client";

import { useEffect, useState, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Cookies from "js-cookie";
import { toast } from "sonner";

import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { invoiceOwnerSchema } from "@/app/transactions/data/schema";
import { absoluteUrl } from "@/lib/utils";

const accountFormSchema = invoiceOwnerSchema.pick({
  name: true,
  email: true,
  phone: true,
  phone_2: true,
  address: true,
  ntn_number: true,
  bank: true,
  account_title: true,
  iban: true,
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

export function AccountForm() {
  const { user } = useAuth();
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {},
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<AccountFormValues | null>(
    null
  );

  const fetchInvoiceOwner = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(
        absoluteUrl(`/api/v1/invoice-owners/${user.id}/`),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch invoice owner data");
      const data = await response.json();
      form.reset(data);
      setInitialValues(data); // Store initial values
    } catch (error) {
      console.error("Error fetching invoice owner:", error);
    } finally {
      setLoading(false);
    }
  }, [user, form]);

  useEffect(() => {
    fetchInvoiceOwner();
  }, [fetchInvoiceOwner]);

  const onSubmit = useCallback(
    async (data: AccountFormValues) => {
      if (!user || !initialValues) return;

      // Check if any field has changed
      const hasChanged = Object.keys(data).some(
        (key) => data[key as keyof AccountFormValues] !== initialValues[key as keyof AccountFormValues]
      );

      if (!hasChanged) {
        toast.info("No changes detected.");
        return;
      }

      setLoading(true);
      setErrorMessage(null);
      try {
        const csrfToken = Cookies.get("csrftoken");
        if (!csrfToken) {
          setErrorMessage(
            "CSRF token not found. Please refresh the page and try again."
          );
          return;
        }
        const response = await fetch(
          absoluteUrl(`/api/v1/invoice-owners/${user.id}/`),
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": csrfToken,
            },
            credentials: "include",
            body: JSON.stringify(data),
          }
        );
        const responseData = await response.json();
        if (!response.ok) {
          setErrorMessage(
            typeof responseData.detail === "string"
              ? responseData.detail
              : responseData.detail.join(", ")
          );
          return;
        }

        // Update initial values after successful submission
        setInitialValues(data);
        toast.success("Account updated successfully!", {
          description: "Your account information has been saved.",
        });
      } catch (error) {
        console.error("Error updating account:", error);
        setErrorMessage("Failed to update account");
      } finally {
        setLoading(false);
      }
    },
    [user, initialValues]
  );

  const fields = [
    {
      name: "name",
      label: "Name",
      placeholder: "Your name",
      description:
        "This is the name that will be displayed on your profile and in transactions.",
    },
    {
      name: "email",
      label: "Email",
      placeholder: "Your email",
      description:
        "This is the email used for communication and notifications.",
      type: "email",
    },
    {
      name: "phone",
      label: "Phone",
      placeholder: "Your phone number",
      description: "Your primary contact number.",
    },
    {
      name: "phone_2",
      label: "Alternate Phone",
      placeholder: "Your alternate phone number",
      description: "A secondary phone number (optional).",
    },
    {
      name: "address",
      label: "Address",
      placeholder: "Your address",
      description: "Your primary business address.",
    },
    {
      name: "ntn_number",
      label: "NTN Number",
      placeholder: "Your NTN number",
      description:
        "Your National Tax Number for tax-related purposes.",
    },
    {
      name: "bank",
      label: "Bank",
      placeholder: "Your bank name",
      description:
        "The bank where your business account is registered.",
    },
    {
      name: "account_title",
      label: "Account Title",
      placeholder: "Your account title",
      description: "The title of your bank account.",
    },
    {
      name: "iban",
      label: "IBAN",
      placeholder: "Your IBAN",
      description: "Your International Bank Account Number.",
    },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        {fields.map(({ name, label, placeholder, description, type }) => (
          <FormField
            key={name}
            control={form.control}
            name={name as keyof AccountFormValues}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={placeholder}
                    type={type || "text"}
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>{description}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Update Account"}
        </Button>
      </form>
    </Form>
  )
}