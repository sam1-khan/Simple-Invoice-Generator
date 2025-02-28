"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function Search() {
  const [shortcut, setShortcut] = useState<string>("Ctrl+K");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key === "k") {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
    if (isMac) {
      setShortcut("⌘+K");
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="relative">
      <Input
        ref={searchInputRef}
        type="search"
        placeholder="Search..."
        className="md:w-[100px] lg:w-[300px] pr-12"
      />
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
        <Badge variant={"outline"} className="text-xs p-1">{shortcut}</Badge>
      </div>
    </div>
  );
}
