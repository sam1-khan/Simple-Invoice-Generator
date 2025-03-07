import { Metadata } from "next";
import { Suspense } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarNavWrapper } from "@/components/sidebar-nav-wrapper";
import SettingsLoading from "./loading";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-foreground space-y-6 p-10 pb-16 md:block">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and set email preferences.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <SidebarNavWrapper />
        </aside>
        <Suspense fallback={<SettingsLoading />}>
          <div className="flex-1 lg:max-w-2xl">{children}</div>
        </Suspense>
      </div>
    </div>
  );
}
