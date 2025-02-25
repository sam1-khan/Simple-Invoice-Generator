import { Metadata } from "next";
import Transactions from "./transactions";

export const metadata: Metadata = {
  title: "Tasks",
  description: "A task and issue tracker built using Tanstack Table.",
};

export default function Page() {
  return <Transactions />;
}
