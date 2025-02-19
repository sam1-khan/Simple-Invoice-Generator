"use client";

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
import { FcGoogle } from "react-icons/fc";
import { AiFillGithub } from "react-icons/ai";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";

const SignupSchema = z
  .object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(10, "Phone number is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[!@#$%^&*(),.?\":{}|<>]/,
        "Password must contain one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof SignupSchema>;

export function SignupForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isValid },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(SignupSchema),
    mode: "onBlur",
  });

  const [error, setError] = useState<string | string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // This function is similar to your login form's handler
  const customSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const values = getValues();
    // Check manually if any required field is empty
    if (
      !values.name.trim() ||
      !values.email.trim() ||
      !values.phone.trim() ||
      !values.password.trim() ||
      !values.confirmPassword.trim()
    ) {
      setError("All fields are required.");
      return;
    }
    // Call the react-hook-form validated onSubmit
    await handleSubmit(onSubmit)();
  };

  const onSubmit = async (data: SignupFormValues) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            phone: data.phone,
            password: data.password,
            confirm_password: data.confirmPassword,
          }),
        }
      );

      const resData = await response.json();
      if (!response.ok) {
        if (Array.isArray(resData.detail)) {
          setError(resData.detail); // assuming it's an array of strings
        } else {
          setError([resData.detail || "Failed to sign up"]);
        }
        return;
      }

      router.push(resData.is_onboarded ? "/" : "/onboarding");
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create an Account</CardTitle>
          <CardDescription>
            Sign up with your Github or Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={customSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                customSubmit(e);
              }
            }}
          >
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                <Link href={"#"}>
                  <Button variant="outline" className="w-full">
                    <FcGoogle size={32} />
                    Sign up with Google
                  </Button>
                </Link>
                <Link href={"#"}>
                  <Button variant="outline" className="w-full">
                    <AiFillGithub size={32} />
                    Sign up with Github
                  </Button>
                </Link>
              </div>
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-zinc-200 dark:after:border-zinc-800">
                <span className="relative z-10 bg-white px-2 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                  Or continue with
                </span>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="text"
                    placeholder="Enter your phone number"
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm">
                      {errors.confirmPassword.message}
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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing up..." : "Sign Up"}
                </Button>
              </div>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline underline-offset-4">
                  Log in
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        <p>
          By clicking continue, you agree to our{" "}
          <Link href="#" className="underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
