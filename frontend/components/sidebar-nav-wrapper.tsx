"use client";

import { usePathname } from "next/navigation";
import { SidebarNav } from "./ui/sidebar-nav";

const sidebarNavItems = [
  { title: "Profile", href: "/settings" },
  { title: "Account", href: "/settings/account" },
  { title: "Appearance", href: "/settings/appearance" },
  { title: "Notifications", href: "/settings/notifications" },
  { title: "Display", href: "/settings/display" },
];

export function SidebarNavWrapper() {
  return <SidebarNav items={sidebarNavItems} />;
}
