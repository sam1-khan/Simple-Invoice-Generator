"use client";

import { SignupForm } from "@/components/signup-form";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-100 p-6 md:p-10 dark:bg-zinc-800">
      <div className="w-full max-w-sm md:max-w-md lg:max-w-lg">
        <SignupForm />
      </div>
    </div>
  );
}
