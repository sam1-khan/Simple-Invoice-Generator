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
import { useState } from "react";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const [isPaid, setIsPaid] = useState<boolean>(row.getValue("is_paid"));

  const togglePaymentStatus = async () => {
    const newStatus = !isPaid;

    try {
      const csrfToken = Cookies.get("csrftoken");
      if (!csrfToken) {
        throw new Error("CSRF token not found!");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/${row.getValue("id")}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          credentials: "include",
          body: JSON.stringify({
            is_paid: newStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update invoice status");
      }

      const data = await response.json();
      const updatedAt = new Date(data.updated_at).toLocaleString();

      setIsPaid(newStatus);

      toast(
        `${row.getValue("is_quotation") ? "Quotation" : "Invoice"} ${row.getValue("reference_number")} has been marked as ${
          newStatus ? "paid" : "unpaid"
        }`,
        {
          description: `Updated on: ${updatedAt}`,
          action: {
            label: "Undo",
            onClick: togglePaymentStatus,
          },
        }
      );
    } catch (error) {
      toast("Error", {
        description: "Failed to update invoice status.",
      });
    }
  };

  const downloadPdf = async () => {
    return;
  };

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
        <DropdownMenuItem onClick={togglePaymentStatus}>
          Mark as {isPaid ? "Unpaid" : "Paid"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadPdf}>Download pdf</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
