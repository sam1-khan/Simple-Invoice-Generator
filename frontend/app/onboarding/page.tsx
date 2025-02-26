"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Cookies from "js-cookie";

const OnboardingSchema = z.object({
  address: z.string().min(1, "Address is required"),
  ntn_number: z.string().optional(),
  bank: z.string().optional(),
  account_title: z.string().optional(),
  iban: z.string().optional(),
  phone_2: z.string().optional(),
  logo: z
    .any()
    .refine((files) => files && files.length > 0, "Logo is required"),
  signature: z
    .any()
    .refine((files) => files && files.length > 0, "Signature is required"),
});

type OnboardingFormValues = z.infer<typeof OnboardingSchema>;

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(OnboardingSchema),
    mode: "onBlur",
  });

  const [error, setError] = useState<string | string[] | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-800 p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold my-1">Not Logged In</CardTitle>
            <CardDescription>
              Please log in to complete onboarding.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/login")} className="mt-2">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userId = user.id;

  const onSubmit = async (data: OnboardingFormValues) => {
    setError(null);
    setFormLoading(true);

    try {
      const csrfToken = Cookies.get("csrftoken");
      if (!csrfToken) {
        setError(
          "CSRF token not found. Please refresh the page and try again."
        );
        return;
      }

      const formDataResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoice-owners/${userId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          credentials: "include",
          body: JSON.stringify({
            address: data.address,
            ntn_number: data.ntn_number,
            bank: data.bank,
            account_title: data.account_title,
            iban: data.iban,
            phone_2: data.phone_2,
          }),
        }
      );

      const formDataRes = await formDataResponse.json();

      if (!formDataResponse.ok) {
        setError(formDataRes.detail || "Failed to update profile");
        return;
      }

      const fileFormData = new FormData();
      if (data.logo && data.logo[0]) {
        fileFormData.append("logo", data.logo[0]);
      }
      if (data.signature && data.signature[0]) {
        fileFormData.append("signature", data.signature[0]);
      }

      const fileUploadResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoice-owners/${userId}/upload-files/`,
        {
          method: "POST",
          headers: {
            "X-CSRFToken": csrfToken,
          },
          credentials: "include",
          body: fileFormData,
        }
      );

      const fileUploadRes = await fileUploadResponse.json();

      if (!fileUploadResponse.ok) {
        setError(fileUploadRes.detail || "Failed to upload files");
        return;
      }

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 min-h-screen items-center justify-center bg-zinc-100 p-6 md:p-10 dark:bg-zinc-800">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Provide the additional information to complete your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" type="text" placeholder="Enter your address" {...register("address")} />
                {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={formLoading}>
                {formLoading ? "Saving..." : "Complete Onboarding"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
