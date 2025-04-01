"use client";

import { UserCheck2Icon } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useEffect, useState } from "react";

export default function AdminLabel() {
  const [isClient, setIsClient] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;
  return (
    <>
      {loading ||
        (user && user.is_staff && (
          <div className="w-full bg-slate-800 text-slate-100 px-9 py-2 border border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-indigo-500/20 rounded-full">
                <UserCheck2Icon className="h-4 w-4 text-indigo-300" />
              </div>
              <span className="text-sm font-medium">
                You are logged in as <span className="font-bold">Admin</span>
              </span>
            </div>
          </div>
        ))}
    </>
  );
}
