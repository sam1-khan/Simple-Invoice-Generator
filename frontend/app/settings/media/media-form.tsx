"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRef, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { toast, Toaster } from "sonner";

const mediaFormSchema = z.object({
  logo: z
    .custom<FileList>()
    .optional()
    .refine(
      (files) => !files || files.length === 0 || files[0]?.type === "image/png",
      "Only PNG files are allowed for the logo"
    ),
  signature: z
    .custom<FileList>()
    .optional()
    .refine(
      (files) =>
        !files || files.length === 0 || files[0]?.type === "image/png",
      "Only PNG files are allowed for the signature"
    ),
});

type MediaFormValues = z.infer<typeof mediaFormSchema>;

export function MediaForm() {
  const { user } = useAuth();
  const [error, setError] = useState<string | string[] | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<MediaFormValues>({
    resolver: zodResolver(mediaFormSchema),
    mode: "onBlur",
    defaultValues: {
      logo: undefined,
      signature: undefined,
    },
  });

  const userId = user?.id;

  const onSubmit = async (data: MediaFormValues) => {
    setError(null);

    if (!data.logo?.length && !data.signature?.length) {
      toast.info("No changes detected. Please upload a logo or signature.");
      return;
    }

    try {
      const csrfToken = Cookies.get("csrftoken");
      if (!csrfToken) {
        setError("CSRF token not found. Please refresh the page and try again.");
        toast.error("CSRF token not found. Please refresh the page and try again.");
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
        const errorMessages = Array.isArray(fileUploadRes.detail)
          ? fileUploadRes.detail
          : [fileUploadRes.detail || "Failed to upload files"];
        setError(errorMessages);
        toast.error("Failed to upload files. Please try again.");
        return;
      }

      toast.success("Files uploaded successfully!");

      form.reset({
        logo: undefined,
        signature: undefined,
      });

      if (logoInputRef.current) logoInputRef.current.value = "";
      if (signatureInputRef.current) signatureInputRef.current.value = "";
    } catch (err) {
      if (err instanceof Error) {
        setError([err.message || "An error occurred."]);
        toast.error(err.message || "An error occurred.");
      } else {
        setError(["An unknown error occurred."]);
        toast.error("An unknown error occurred.");
      }
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} encType="multipart/form-data">
          <div className="grid gap-6">
            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Logo (PNG)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/png"
                      onChange={(e) => field.onChange(e.target.files)}
                      ref={logoInputRef}
                    />
                  </FormControl>
                  <FormMessage>
                    {typeof form.formState.errors.logo?.message === "string"
                      ? form.formState.errors.logo?.message
                      : (form.formState.errors.logo?.message as { msg?: string })?.msg}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="signature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Signature (PNG)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/png"
                      onChange={(e) => field.onChange(e.target.files)}
                      ref={signatureInputRef}
                    />
                  </FormControl>
                  <FormMessage>
                    {typeof form.formState.errors.signature?.message === "string"
                      ? form.formState.errors.signature?.message
                      : (form.formState.errors.signature?.message as { msg?: string })?.msg}
                  </FormMessage>
                </FormItem>
              )}
            />

            {error && Array.isArray(error) ? (
              <ul className="text-red-500 text-sm">
                {error.map((errMsg, index) => (
                  <li key={index}>{errMsg}</li>
                ))}
              </ul>
            ) : (
              error && <p className="text-red-500 text-sm">{error}</p>
            )}

            <Button type="submit">Update media</Button>
          </div>
        </form>
      </Form>
    </>
  );
}