"use client";

import { useState } from "react";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionTypeSelector } from "@/components/transaction-type-selector";

export default function CreateTransactionPage() {
  const [isQuotation, setIsQuotation] = useState<boolean | null>(null);

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create Transaction</h2>
          <p className="text-muted-foreground">
            What would you like to create today?
          </p>
        </div>
      </div>
      {/* Show the cards form or main form based on the state */}
      {isQuotation === null ? (
        <TransactionTypeSelector onSelect={setIsQuotation} />
      ) : (
        <TransactionForm isQuotation={isQuotation} />
      )}
    </div>
  );
}