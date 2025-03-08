"use client";

import { SidebarNav } from "./ui/sidebar-nav";

const sidebarNavItems = [
  { title: "Account", href: "/settings" },
  { title: "Media", href: "/settings/media" },
  { title: "Appearance", href: "/settings/appearance" },
];

export function SidebarNavWrapper() {
  return <SidebarNav items={sidebarNavItems} />;
}
