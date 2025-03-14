"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Cookies from "js-cookie";
import { useEffect } from "react";
import { logout } from "@/lib/utils";

const isInputField = (element: HTMLElement) => {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element?.closest(".shadcn-input")
  );
};

export function UserNav() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    const res = await logout();
    if (res && res.ok) {
      refreshUser();
      router.push("/login");
    } else {
      console.error("Logout failed");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;

      if (isInputField(activeElement)) {
        return;
      }

      if (!user) return;

      if (e.shiftKey) {
        // Appearance Shortcut: shift+s
        if (e.key.toLowerCase() === "d") {
          router.replace("settings/appearance");
        }
        // Account Shortcut: shift+a
        if (e.key.toLowerCase() === "a") {
          router.replace("/settings/");
        }
        // Logout Shortcut: shift+q
        if (e.key.toLowerCase() === "q") {
          handleLogout();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [user, router]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src="/avatars/01.png"
              alt={user ? user.name : "User"}
            />
            <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            Account
            <div className="ml-auto">
              <Badge variant={"outline"} className="text-xs p-1">
                Shift+a
              </Badge>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings/appearance")}>
            Appearance
            <div className="ml-auto">
              <Badge variant={"outline"} className="text-xs p-1">
                Shift+d
              </Badge>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          Log out
          <div className="ml-auto">
            <Badge variant={"outline"} className="text-xs p-1">
              Shift+q
            </Badge>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
