import { Metadata } from "next";
import { cookies } from "next/headers";
import { z } from "zod";

import { columns } from "@/components/ui/columns";
import { DataTable } from "@/components/ui/data-table";
import { transactionSchema } from "./data/schema";

export const metadata: Metadata = {
  title: "Transactions",
  description: "A transaction tracker built using Tanstack Table.",
};

async function getTransactions() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/`;
  const res = await fetch(url, {
    headers: {
      Cookie: cookieHeader,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Error fetching transactions:", res.status, errorText);
    throw new Error("Failed to fetch transactions");
  }

  const data = await res.json();
  const transactions = z.array(transactionSchema).parse(data);

  const updatedTransactions = transactions.map((transaction) => {
    const tax = transaction.tax;

    if (tax != null && tax != 0) {
      return {
        ...transaction,
        is_taxed: true,
      };
    }
    return transaction;
  });

  return updatedTransactions;
}

export default async function TransactionPage() {
  const transactions = await getTransactions();

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
          <p className="text-muted-foreground">
            Here's a list of your transactions for this month!
          </p>
        </div>
      </div>
      <DataTable data={transactions} columns={columns} />
    </div>
  );
}
