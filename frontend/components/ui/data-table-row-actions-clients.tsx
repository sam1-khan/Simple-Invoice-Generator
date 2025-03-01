"use client";

import { Row } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const handleDelete = async () => {
    try {
      const csrfToken = Cookies.get("csrftoken");
      if (!csrfToken) {
        throw new Error("CSRF token not found!");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clients/${row.getValue("id")}/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete ${row.getValue('name')}.`);
      }

      toast(
        `${row.getValue("name")} has been deleted.`,
        {
          description: "This action can't be undone.",
        }
      );
    } catch (error) {
      toast("Error", {
        description: `Failed to delete ${row.getValue('name')}.`,
      });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
          <MoreHorizontal />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
