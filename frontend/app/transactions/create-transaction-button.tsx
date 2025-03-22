"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function CreateTransactionButton() {
  const router = useRouter();
  return (
    <>
      <Button onClick={() => router.push("/transactions/create")}>Create Transaction</Button>
    </>
  );
}