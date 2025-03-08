"use client";

import { SidebarNav } from "./ui/sidebar-nav";

const sidebarNavItems = [
  { title: "Account", href: "/settings" },
  { title: "Appearance", href: "/settings/appearance" },
  { title: "Notifications", href: "/settings/notifications" },
  { title: "Media", href: "/settings/media" },
];

export function SidebarNavWrapper() {
  return <SidebarNav items={sidebarNavItems} />;
}
