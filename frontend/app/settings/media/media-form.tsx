"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "sonner";
import {
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
  FileInput,
} from "@/components/file-upload";
import { Paperclip } from "lucide-react";

const mediaFormSchema = z.object({
  logo: z
    .custom<File>()
    .optional()
    .refine(
      (file) => !file || (file instanceof File && file.type === "image/png"),
      "Only PNG files are allowed for the logo"
    ),
  signature: z
    .custom<File>()
    .optional()
    .refine(
      (file) => !file || (file instanceof File && file.type === "image/png"),
      "Only PNG files are allowed for the signature"
    ),
});

type MediaFormValues = z.infer<typeof mediaFormSchema>;

export function MediaForm() {
  const { user } = useAuth();
  const [error, setError] = useState<string | string[] | null>(null);

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

    if (!data.logo && !data.signature) {
      toast.info("No changes detected. Please upload a logo or signature.");
      return;
    }

    try {
      const csrfToken = Cookies.get("csrftoken");
      if (!csrfToken) {
        setError(
          "CSRF token not found. Please refresh the page and try again."
        );
        toast.error(
          "CSRF token not found. Please refresh the page and try again."
        );
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
        toast.error("Failed to upload files. Please try again.");
        return;
      }

      toast.success("Files uploaded successfully!");

      form.reset({
        logo: undefined,
        signature: undefined,
      });
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
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          encType="multipart/form-data"
        >
          <div className="grid gap-6">
            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Logo (PNG)</FormLabel>
                  <FormControl>
                    <FileUploader
                      value={field.value ? [field.value] : []}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onValueChange={(files: any) =>
                        field.onChange(files ? files[0] : null)
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
                            <span className="font-semibold">
                              Click to upload
                            </span>
                            &nbsp; or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PNG
                          </p>
                        </div>
                      </FileInput>
                      <FileUploaderContent>
                        {field.value && (
                          <FileUploaderItem index={0}>
                            <Paperclip className="h-4 w-4 stroke-current" />
                            <span>{field.value?.name}</span>
                          </FileUploaderItem>
                        )}
                      </FileUploaderContent>
                    </FileUploader>
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.logo?.message}
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
                    <FileUploader
                      value={field.value ? [field.value] : []}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onValueChange={(files: any) =>
                        field.onChange(files ? files[0] : null)
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
                            <span className="font-semibold">
                              Click to upload
                            </span>
                            &nbsp; or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PNG
                          </p>
                        </div>
                      </FileInput>
                      <FileUploaderContent>
                        {field.value && (
                          <FileUploaderItem index={0}>
                            <Paperclip className="h-4 w-4 stroke-current" />
                            <span>{field.value?.name}</span>
                          </FileUploaderItem>
                        )}
                      </FileUploaderContent>
                    </FileUploader>
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.signature?.message}
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
          </div>
          <Button type="submit" className="mt-4">
            Update media
          </Button>
        </form>
      </Form>
    </>
  );
}