"use client";

import { usePathname } from "next/navigation";
import { MainNav } from "@/components/ui/main-nav";
import { Search } from "@/components/ui/search";
import { UserNav } from "@/components/ui/user-nav";

export default function Navbar() {
  const pathname = usePathname();

  const noNavbarPages = ["/login", "/signup", "/forgot-password", "/reset-password/[user]/[token]", "/onboarding"];
  const resetPasswordRegex = /^\/reset-password\/[^/]+\/[^/]+$/;
  const showNavbar = !noNavbarPages.includes(pathname) && !resetPasswordRegex.test(pathname);

  return (
    <>
      {showNavbar && (
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <MainNav className="mx-6" />
            <div className="ml-auto flex items-center space-x-4">
              <Search />
              <UserNav />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
