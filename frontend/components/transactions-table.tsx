"use client";

import { DataTable } from "@/components/ui/data-table";
import { Transaction } from "@/app/transactions/data/schema";
import { TransactionTableColumns } from "@/components/ui/columns";

interface TransactionsTableProps {
  transactions: Transaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const columns = TransactionTableColumns();
  return <DataTable data={transactions} columns={columns} />;
}
