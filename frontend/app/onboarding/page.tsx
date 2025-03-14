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
import {
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
  FileInput,
} from "@/components/file-upload";
import { Paperclip } from "lucide-react";
import { PhoneInput } from "@/components/phone-input";

const OnboardingSchema = z.object({
  address: z.string().min(1, "Address is required"),
  ntn_number: z.string().optional(),
  bank: z.string().optional(),
  account_title: z.string().optional(),
  iban: z.string().optional(),
  phone_2: z.string().optional(),
  logo: z
    .custom<File>()
    .refine(
      (file) =>
        file instanceof File && file.size > 0 && file.type === "image/png",
      "Logo is required & must be a PNG file"
    ),
  signature: z
    .custom<File>()
    .refine(
      (file) =>
        file instanceof File && file.size > 0 && file.type === "image/png",
      "Signature is required & must be a PNG file"
    ),
});

type OnboardingFormValues = z.infer<typeof OnboardingSchema>;

const FileSvgDraw = () => {
  return (
    <>
      <svg
        className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 20 16"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
        />
      </svg>
      <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
        <span className="font-semibold">Click to upload</span>
        &nbsp; or drag and drop
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">PNG</p>
    </>
  );
};

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(OnboardingSchema),
    mode: "onBlur",
  });

  const [error, setError] = useState<string | string[] | null>(null);

  const userId = user?.id;

  const onSubmit = async (data: OnboardingFormValues) => {
    setError(null);

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
            is_onboarded: true,
          }),
        }
      );

      const formDataRes = await formDataResponse.json();

      if (!formDataResponse.ok) {
        const errorMessages = Array.isArray(formDataRes.detail)
          ? formDataRes.detail
          : [formDataRes.detail || "Failed to update profile"];
        setError(errorMessages);
        return;
      }

      const fileFormData = new FormData();
      if (data.logo) {
        fileFormData.append("logo", data.logo);
      }
      if (data.signature) {
        fileFormData.append("signature", data.signature);
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
        const errorMessages = Array.isArray(fileUploadRes.detail)
          ? fileUploadRes.detail
          : [fileUploadRes.detail || "Failed to upload files"];
        setError(errorMessages);
        return;
      }

      router.push("/");
    } catch (err) {
      if (err instanceof Error) {
        setError([err.message || "An error occurred."]);
      } else {
        setError(["An unknown error occurred."]);
      }
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
          <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
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
                    {errors.address.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="logo">Upload Logo (PNG)</Label>
                <FileUploader
                  value={watch("logo") ? [watch("logo")] : []}
                  onValueChange={(files: any) =>
                    setValue("logo", files ? files[0] : null)
                  }
                  dropzoneOptions={{
                    accept: { "image/png": [".png"] },
                    maxFiles: 1,
                    multiple: false,
                  }}
                  className="relative bg-background rounded-lg p-2"
                >
                  <FileInput className="outline-dashed outline-1 outline-gray-300 dark:outline-gray-600">
                    <div className="flex items-center justify-center flex-col pt-3 pb-4 w-full">
                      <FileSvgDraw />
                    </div>
                  </FileInput>
                  <FileUploaderContent>
                    {watch("logo") && (
                      <FileUploaderItem index={0}>
                        <Paperclip className="h-4 w-4 stroke-current" />
                        <span>{watch("logo")?.name}</span>
                      </FileUploaderItem>
                    )}
                  </FileUploaderContent>
                </FileUploader>
                {errors.logo && (
                  <p className="text-red-500 text-sm">
                    {errors.logo.message?.toString()}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signature">Upload Signature (PNG)</Label>
                <FileUploader
                  value={watch("signature") ? [watch("signature")] : []}
                  onValueChange={(files: any) =>
                    setValue("signature", files ? files[0] : null)
                  }
                  dropzoneOptions={{
                    accept: { "image/png": [".png"] },
                    maxFiles: 1,
                    multiple: false,
                  }}
                  className="relative bg-background rounded-lg p-2"
                >
                  <FileInput className="outline-dashed outline-1 outline-gray-300 dark:outline-gray-600">
                    <div className="flex items-center justify-center flex-col pt-3 pb-4 w-full">
                      <FileSvgDraw />
                    </div>
                  </FileInput>
                  <FileUploaderContent>
                    {watch("signature") && (
                      <FileUploaderItem index={0}>
                        <Paperclip className="h-4 w-4 stroke-current" />
                        <span>{watch("signature")?.name}</span>
                      </FileUploaderItem>
                    )}
                  </FileUploaderContent>
                </FileUploader>
                {errors.signature && (
                  <p className="text-red-500 text-sm">
                    {errors.signature.message?.toString()}
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
                    {errors.ntn_number.message}
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
                  <p className="text-red-500 text-sm">{errors.bank.message}</p>
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
                    {errors.account_title.message}
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
                  <p className="text-red-500 text-sm">{errors.iban.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone_2">Alternate Phone</Label>
                <PhoneInput
                  id="phone_2"
                  placeholder="Enter alternate phone number"
                  value={watch("phone_2") || ""}
                  onChange={(value: string | undefined) =>
                    setValue("phone_2", value)
                  }
                />
                {errors.phone_2 && (
                  <p className="text-red-500 text-sm">
                    {errors.phone_2.message}
                  </p>
                )}
              </div>
              {error && Array.isArray(error) ? (
                <ul className="text-red-500 text-sm">
                  {error.map((errMsg, index) => (
                    <li key={index}>{errMsg}</li>
                  ))}
                </ul>
              ) : (
                error && <p className="text-red-500 text-sm">{error}</p>
              )}
              <Button type="submit" className="w-full">
                Complete Onboarding
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        <p>Please ensure your details are accurate. Complete onboarding to proceed further.</p>
      </div>
    </div>
  );
}
