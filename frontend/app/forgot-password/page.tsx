"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(ForgotPasswordSchema),
  });
  const { user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-100 dark:bg-zinc-800">
        <p className="text-xl">Redirecting...</p>
      </div>
    );
  }

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    setRateLimited(false);
    setError(null);
    setResponseMessage(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/forgot-password/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email }),
          credentials: "include",
        }
      );
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError("Calm down bro, let me catch my breath!");
          setRateLimited(true);
          setTimeout(() => {
            setIsSubmitting(false);
            setRateLimited(false);
          }, 20000);
        } else {
          setError(result.detail || "Password reset failed");
          setIsSubmitting(false);
        }
        return;
      }

      setTimeout(() => {
        setResponseMessage("Password reset email sent successfully.");
        setIsSubmitting(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-100 p-6 md:p-10 dark:bg-zinc-800">
      <div className="w-full max-w-sm md:max-w-md lg:max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Forgot Password</CardTitle>
            <CardDescription>
              Enter your email to receive a password reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isSubmitting) {
                  e.preventDefault();
                  handleSubmit(onSubmit)(e);
                }
              }}
            >
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {responseMessage && (
                  <p className="text-green-500 text-sm">{responseMessage}</p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {rateLimited
                    ? "Taking a rest..."
                    : isSubmitting
                    ? "Sending password reset mail..."
                    : "Reset password"}
                </Button>
              </div>
            </form>
            <div className="text-center text-sm mt-4">
              Remembered your password?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Log in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
