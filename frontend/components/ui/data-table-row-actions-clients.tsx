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
import { useRouter } from "next/navigation";
import { mutate } from "swr";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export const handleDelete = async (id: number, name: string) => {
  try {
    const csrfToken = Cookies.get("csrftoken");
    if (!csrfToken) {
      throw new Error("CSRF token not found!");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clients/${id}/`,
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
      throw new Error(`Failed to delete ${name}.`);
    }

    toast.success(`${name} has been deleted.`, {
      description: "This action can't be undone.",
    });

    mutate(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/clients/`); // Revalidate the clients list
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    toast.error("Error", {
      description: `Failed to delete ${name}.`,
    });
  }
};

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const router = useRouter();

  const handleEdit = () => {
    const client_id = row.getValue("id");
    router.push(`/clients/edit/${client_id}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleDelete(row.getValue("id"), row.getValue("name"))}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
