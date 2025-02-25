"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { DataTableRowActions } from "@/components/ui/data-table-row-actions";
import { taxStatusOptions, invoiceTypeOptions, transitChargeOptions } from "@/app/transactions/data/data";
import { Transaction } from "@/app/transactions/data/schema";

export const columns: ColumnDef<Transaction>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "reference_number",
    accessorKey: "reference_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reference #" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate">
        {row.getValue("reference_number")}
      </div>
    ),
  },
  {
    id: "clientName",
    accessorFn: (row) => row.client?.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Client" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate">{row.getValue("clientName")}</div>
    ),
  },
  {
    id: "total",
    accessorFn: (row) => (row.is_taxed ? row.grand_total : row.total_price),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    cell: ({ getValue }) => {
      const value = getValue() as number;
      return <div>${value.toFixed(2)}</div>;
    },
  },  
  {
    id: "date",
    accessorFn: (row) => row.date || row.created_at,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ getValue }) => {
      const value = getValue() as string;
      // Create a date object from the value
      const d = new Date(value);
      // Format date using en-GB options then convert to lower-case for month
      const formattedDate = d
        .toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      return <div>{formattedDate}</div>;
    },
  },  
  {
    id: "is_taxed",
    accessorKey: "is_taxed",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tax Status" />
    ),
    cell: ({ row }) => {
      const taxed = row.getValue("is_taxed");
      return (
        <Badge variant={taxed ? "default" : "secondary"}>
          {taxed ? "Taxed" : "Not Taxed"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id) ? "true" : "false");
    },
  },
  {
    id: "is_quotation",
    accessorKey: "is_quotation",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const isQuotation = row.getValue("is_quotation");
      return (
        <Badge variant={isQuotation ? "outline" : "default"}>
          {isQuotation ? "Quotation" : "Invoice"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id) ? "quotation" : "invoice");
    },
  },
  {
    id: "transit_charges",
    accessorKey: "transit_charges",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Transit Charges" />
    ),
    cell: ({ row }) => {
      // Ensure the value is a number; if not, default to 0.
      const charges = row.getValue("transit_charges");
      const amount = typeof charges === "number" ? charges : 0;
      return <div>${amount.toFixed(2)}</div>;
    },
    filterFn: (row, id, value) => {
      const charges = row.getValue(id);
      const amount = typeof charges === "number" ? charges : 0;
      if (value.includes("has") && amount > 0) return true;
      if (value.includes("none") && amount <= 0) return true;
      return false;
    },
  },  
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
