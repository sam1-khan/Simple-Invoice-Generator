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
import Link from "next/link";

const OnboardingSchema = z.object({
  address: z.string().min(1, "Address is required"),
  logo: z
    .any()
    .refine((files) => files && files.length > 0, "Logo is required"),
  signature: z
    .any()
    .refine((files) => files && files.length > 0, "Signature is required"),
  ntn_number: z.string().optional(),
  bank: z.string().optional(),
  account_title: z.string().optional(),
  iban: z.string().optional(),
  phone_2: z.string().optional(),
});

type OnboardingFormValues = z.infer<typeof OnboardingSchema>;

export default function OnboardingPage() {
  const { user, loading } = useAuth();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-100 dark:bg-zinc-800 p-6">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-800 p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Not Logged In</CardTitle>
            <CardDescription>
              Please log in to complete onboarding.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/login")} className="mt-4">
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
      const formData = new FormData();
      formData.append("address", data.address);
      if (data.logo && data.logo[0]) formData.append("logo", data.logo[0]);
      if (data.signature && data.signature[0])
        formData.append("signature", data.signature[0]);
      if (data.ntn_number) formData.append("ntn_number", data.ntn_number);
      if (data.bank) formData.append("bank", data.bank);
      if (data.account_title)
        formData.append("account_title", data.account_title);
      if (data.iban) formData.append("iban", data.iban);
      if (data.phone_2) formData.append("phone_2", data.phone_2);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoice-owners/${userId}/`,
        {
          method: "PATCH",
          body: formData,
        }
      );
      const resData = await response.json();
      if (!response.ok) {
        setError(
          Array.isArray(resData.detail)
            ? resData.detail
            : [resData.detail || "Failed to update profile"]
        );
        return;
      }
      router.push("/");
    } catch (err: any) {
      setError([err.message || "An error occurred."]);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        "min-h-screen items-center justify-center bg-zinc-100 p-6 md:p-10 dark:bg-zinc-800"
      )}
    >
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Provide the additional information to complete your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Enter your address"
                  {...register("address")}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm">
                    {errors.address.message as string}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="logo">Upload Logo (PNG)</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/png"
                  {...register("logo")}
                />
                {errors.logo && (
                  <p className="text-red-500 text-sm">
                    {errors.logo.message as string}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signature">Upload Signature (PNG)</Label>
                <Input
                  id="signature"
                  type="file"
                  accept="image/png"
                  {...register("signature")}
                />
                {errors.signature && (
                  <p className="text-red-500 text-sm">
                    {errors.signature.message as string}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ntn_number">NTN Number</Label>
                <Input
                  id="ntn_number"
                  type="text"
                  placeholder="Enter your NTN number"
                  {...register("ntn_number")}
                />
                {errors.ntn_number && (
                  <p className="text-red-500 text-sm">
                    {errors.ntn_number.message as string}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bank">Bank</Label>
                <Input
                  id="bank"
                  type="text"
                  placeholder="Enter your bank name"
                  {...register("bank")}
                />
                {errors.bank && (
                  <p className="text-red-500 text-sm">
                    {errors.bank.message as string}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account_title">Account Title</Label>
                <Input
                  id="account_title"
                  type="text"
                  placeholder="Enter your account title"
                  {...register("account_title")}
                />
                {errors.account_title && (
                  <p className="text-red-500 text-sm">
                    {errors.account_title.message as string}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  type="text"
                  placeholder="Enter your IBAN"
                  {...register("iban")}
                />
                {errors.iban && (
                  <p className="text-red-500 text-sm">
                    {errors.iban.message as string}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone_2">Alternate Phone</Label>
                <Input
                  id="phone_2"
                  type="text"
                  placeholder="Enter alternate phone number"
                  {...register("phone_2")}
                />
                {errors.phone_2 && (
                  <p className="text-red-500 text-sm">
                    {errors.phone_2.message as string}
                  </p>
                )}
              </div>
              {error && Array.isArray(error) ? (
                <ul className="text-red-500 text-sm">
                  {error.map((errMsg, idx) => (
                    <li key={idx}>{errMsg}</li>
                  ))}
                </ul>
              ) : error ? (
                <p className="text-red-500 text-sm">{error}</p>
              ) : null}
              <Button type="submit" className="w-full" disabled={formLoading}>
                {formLoading ? "Saving..." : "Complete Onboarding"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        <p>
          Please ensure your details are accurate.{" "}
          <Link href="/" className="underline">
            Back to Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
