"use client";

import useSWR from "swr";
import { z } from "zod";
import { transactionSchema } from "./data/schema";
import { TransactionsTable } from "@/components/transactions-table";
import CreateTransactionButton from "./create-transaction-button";

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((res) => res.json());

export default function TransactionPage() {
  const { data: transactions, error, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/`,
    fetcher
  );

  if (!transactions) return;

  const parsedTransactions = z.array(transactionSchema).parse(transactions);

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
          <p className="text-muted-foreground">
            Here's a list of all your transactions!
          </p>
        </div>
      </div>
      <CreateTransactionButton onTransactionCreated={() => mutate()} />
      <TransactionsTable transactions={parsedTransactions} />
    </div>
  );
}