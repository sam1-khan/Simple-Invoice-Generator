"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import InvoiceForm from "./transaction-form";

export default function CreateTransactionButton() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsFormOpen(true)}>Create Transaction</Button>
      {isFormOpen && <InvoiceForm onClose={() => setIsFormOpen(false)} />}
    </>
  );
}