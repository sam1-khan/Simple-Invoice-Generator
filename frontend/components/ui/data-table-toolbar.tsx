"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { taxStatusOptions, paymentOptions, invoiceTypeOptions, transitChargeOptions } from "@/app/transactions/data/data";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between space-x-2">
        <Input
          placeholder="Filter by Reference..."
          value={(table.getColumn("reference_number")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("reference_number")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
      <div className="flex flex-1 items-center space-x-2 overflow-auto">
        {table.getColumn("is_taxed") && (
          <DataTableFacetedFilter
            column={table.getColumn("is_taxed")}
            title="Tax Status"
            options={taxStatusOptions}
          />
        )}
        {table.getColumn("is_paid") && (
          <DataTableFacetedFilter
            column={table.getColumn("is_paid")}
            title="Payment"
            options={paymentOptions}
          />
        )}
        {table.getColumn("is_quotation") && (
          <DataTableFacetedFilter
            column={table.getColumn("is_quotation")}
            title="Type"
            options={invoiceTypeOptions}
          />
        )}
        {table.getColumn("transit_charges") && (
          <DataTableFacetedFilter
            column={table.getColumn("transit_charges")}
            title="Transit Charges"
            options={transitChargeOptions}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
