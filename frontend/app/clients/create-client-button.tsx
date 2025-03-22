"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function CreateClientButton({
  onClientCreated,
}: {
  onClientCreated: () => void;
}) {
  const router = useRouter();
  return (
    <Button onClick={() => router.push("/clients/create")}>
      Create Client
    </Button>
  );
}