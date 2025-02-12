import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-100 p-6 md:p-10 dark:bg-zinc-800">
      <div className="w-full max-w-sm md:max-w-md lg:max-w-lg">
        <SignupForm />
      </div>
    </div>
  );
}
