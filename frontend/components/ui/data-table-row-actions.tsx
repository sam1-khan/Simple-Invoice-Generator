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
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { pdf } from "@react-pdf/renderer";
import TransactionPDF from "@/components/transaction-pdf"; // Adjust the import path as needed

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const [isPaid, setIsPaid] = useState<boolean>(row.getValue("is_paid"));
  const router = useRouter();
  const { mutate } = useSWRConfig(); // Use SWR's mutate function

  const togglePaymentStatus = async () => {
    if (row.getValue("is_quotation")) {
      toast.info("Not an Invoice", {
        description: "Quotation can't be marked as paid.",
      });
      return;
    }

    const newStatus = !isPaid;

    try {
      const csrfToken = Cookies.get("csrftoken");
      if (!csrfToken) {
        throw new Error("CSRF token not found!");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/${row.getValue(
          "id"
        )}/`,
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

      // Update the local state
      setIsPaid(newStatus);

      // Show success toast
      toast.success(
        `${row.getValue("reference_number")} has been marked as ${
          newStatus ? "paid" : "unpaid"
        }`,
        {
          description: `Updated on: ${updatedAt}`,
        }
      );

      // Revalidate the transactions list
      mutate(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/`);
    } catch (error) {
      console.error("Error toggling payment status:", error); // Debugging
      toast.error("Error", {
        description: "Failed to update invoice status.",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const csrfToken = Cookies.get("csrftoken");
      if (!csrfToken) {
        throw new Error("CSRF token not found!");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/${row.getValue(
          "id"
        )}/`,
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
        throw new Error(
          `Failed to delete ${row.getValue("reference_number")}.`
        );
      }

      toast.success(`${row.getValue("reference_number")} has been deleted.`, {
        description: "This action can't be undone.",
      });

      mutate(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/`); // Revalidate the transactions list
    } catch (error) {
      toast.error("Error", {
        description: `Failed to delete ${row.getValue("reference_number")}.`,
      });
    }
  };

  const handleEdit = async () => {
    const invoice_id = row.getValue("id");
    router.push(`/transactions/edit/${invoice_id}`);
  };

  const downloadPdf = async () => {
    try {
      const invoiceId = row.getValue("id");

      // Fetch invoice and items data
      const invoiceUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/${invoiceId}/`;
      const itemsUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/${invoiceId}/items/`;

      const [invoiceResponse, itemsResponse] = await Promise.all([
        fetch(invoiceUrl, {credentials: "include"}).then((res) => res.json()),
        fetch(itemsUrl, {credentials: "include"}).then((res) => res.json()),
      ]);

      const invoice = invoiceResponse;
      const items = itemsResponse;

      // Generate PDF blob
      const blob = await pdf(
        <TransactionPDF invoice={invoice} items={items} />
      ).toBlob();

      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice.reference_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Error", {
        description: "Failed to download PDF.",
      });
    }
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
        <DropdownMenuItem onClick={togglePaymentStatus}>
          Mark as {isPaid ? "Unpaid" : "Paid"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadPdf}>Download PDF</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}