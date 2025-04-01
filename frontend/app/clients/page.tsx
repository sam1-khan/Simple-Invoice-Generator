"use client";

import useSWR from "swr";
import { z } from "zod";
import { columns } from "@/components/ui/columns-clients";
import { DataTable } from "@/components/ui/data-table-clients";
import { clientSchema } from "../transactions/data/schema";
import CreateClientButton from "./create-client-button";

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((res) => res.json());

export default function ClientPage() {
  const { data: clients, error, mutate } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/clients/`,
    fetcher
  );

  if (error) {
    return (
      <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
            <p className="text-muted-foreground">
              Here&apos;s a list of all your clients!
            </p>
          </div>
        </div>
        <div className="text-red-500">
          Failed to load clients. Please try again later.
        </div>
      </div>
    );
  }

  if (!clients) return;

  const parsedClients = z.array(clientSchema).parse(clients);

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
          <p className="text-muted-foreground">
            Here&apos;s a list of all your clients!
          </p>
        </div>
      </div>
      <CreateClientButton onClientCreated={() => mutate()} />
      <DataTable data={parsedClients} columns={columns} />
    </div>
  );
}