import { Metadata } from "next";
import { cookies } from "next/headers";
import { z } from "zod";

import { columns } from "@/components/ui/columns-clients";
import { DataTable } from "@/components/ui/data-table-clients";
import { clientSchema } from "../transactions/data/schema";

export const metadata: Metadata = {
  title: "Clients",
  description: "A client tracker built using Tanstack Table.",
};

async function getClients() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clients/`;
  const res = await fetch(url, {
    headers: {
      Cookie: cookieHeader,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Error fetching clients:", res.status, errorText);
    throw new Error("Failed to fetch clients");
  }

  const data = await res.json();
  const clients = z.array(clientSchema).parse(data);

  return clients;
}

export default async function TransactionPage() {
  const clients = await getClients();

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
          <p className="text-muted-foreground">
            Here's a list of all your clients!
          </p>
        </div>
      </div>
      <DataTable data={clients} columns={columns} />
    </div>
  );
}
