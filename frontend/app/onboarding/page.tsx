"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
  logo: z.string().min(1, "Logo is required"),
  signature: z.string().min(1, "Signature is required"),
  ntn_number: z.string().optional(),
  bank: z.string().optional(),
  account_title: z.string().optional(),
  iban: z.string().optional(),
  phone_2: z.string().optional(),
});

type OnboardingFormValues = z.infer<typeof OnboardingSchema>;

export default function OnboardingPage() {
  // Replace with your actual user ID retrieval logic.
  const userId = 11;
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(OnboardingSchema),
    mode: "onBlur",
  });
  const [error, setError] = useState<string | string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: OnboardingFormValues) => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoice-owners/${userId}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      const resData = await response.json();
      if (!response.ok) {
        if (Array.isArray(resData.detail)) {
          setError(resData.detail);
        } else {
          setError([resData.detail || "Failed to update profile"]);
        }
        return;
      }
      router.push("/");
    } catch (err: any) {
      setError([err.message || "An error occurred."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", "min-h-screen items-center justify-center bg-zinc-100 p-6 md:p-10 dark:bg-zinc-800")}>
      <Card className="w-full max-w-md">
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
                <Input id="address" type="text" placeholder="Enter your address" {...register("address")} />
                {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="logo">Logo URL</Label>
                <Input id="logo" type="text" placeholder="Enter your logo URL" {...register("logo")} />
                {errors.logo && <p className="text-red-500 text-sm">{errors.logo.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signature">Signature URL</Label>
                <Input id="signature" type="text" placeholder="Enter your signature URL" {...register("signature")} />
                {errors.signature && <p className="text-red-500 text-sm">{errors.signature.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ntn_number">NTN Number</Label>
                <Input id="ntn_number" type="text" placeholder="Enter your NTN number" {...register("ntn_number")} />
                {errors.ntn_number && <p className="text-red-500 text-sm">{errors.ntn_number.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bank">Bank</Label>
                <Input id="bank" type="text" placeholder="Enter your bank name" {...register("bank")} />
                {errors.bank && <p className="text-red-500 text-sm">{errors.bank.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account_title">Account Title</Label>
                <Input id="account_title" type="text" placeholder="Enter your account title" {...register("account_title")} />
                {errors.account_title && <p className="text-red-500 text-sm">{errors.account_title.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input id="iban" type="text" placeholder="Enter your IBAN" {...register("iban")} />
                {errors.iban && <p className="text-red-500 text-sm">{errors.iban.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone_2">Alternate Phone</Label>
                <Input id="phone_2" type="text" placeholder="Enter alternate phone number" {...register("phone_2")} />
                {errors.phone_2 && <p className="text-red-500 text-sm">{errors.phone_2.message}</p>}
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Complete Onboarding"}
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
