"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Link from "next/link";
import {
  ChevronLeft,
  DownloadIcon,
  EditIcon,
  InfoIcon,
  Loader2,
  Trash2Icon,
} from "lucide-react";
import {
  transactionSchema,
  invoiceItemSchema,
  Transaction,
  InvoiceItem,
} from "@/app/transactions/data/schema";
import {
  getCountryFromIP,
  getCurrencyFromCountry,
  formatCurrency,
} from "@/lib/utils";
import { z } from "zod";
import downloadPdf, {
  handleDelete,
} from "@/components/ui/data-table-row-actions";

export default function TransactionViewPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("PKR");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get currency based on user's country
        const country = await getCountryFromIP();
        const userCurrency = getCurrencyFromCountry(country);
        setCurrency(userCurrency);

        // Fetch transaction data
        const transactionResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/${id}/`,
          { credentials: "include" }
        );

        const transactionData = await transactionResponse.json();
        const validatedTransaction = transactionSchema.parse(transactionData);

        // Fetch invoice items
        const itemsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/${id}/items/`,
          { credentials: "include" }
        );

        const itemsData = await itemsResponse.json();
        const validatedItems = z.array(invoiceItemSchema).parse(itemsData);

        setTransaction(validatedTransaction);
        setItems(validatedItems);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast.error("Failed to fetch transaction data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[36rem] items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
    </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <InfoIcon className="h-8 w-8 text-destructive" />
        <p className="text-lg">Transaction not found</p>
        <Link href="/transactions">
          <Button variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Transactions
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
      <Link href="/transactions">
        <Button variant="ghost">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Transactions
        </Button>
      </Link>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/transactions/edit/${id}`}>
              <EditIcon className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" onClick={() => downloadPdf(parseInt(id))}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              handleDelete(parseInt(id), transaction.reference_number);
              router.back()
            }}
          >
            <Trash2Icon className="mr-2 h-4 w-4" />
            Delete {transaction.is_quotation ? "Quotation" : "Invoice"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Invoice Card */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
          <h1 className="text-3xl font-bold tracking-tight pb-4">
          {transaction.is_quotation ? "Quotation" : "Invoice"} #
          {transaction.reference_number}
        </h1>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <p className="text-sm text-muted-foreground">
                  {transaction.date}
                </p>
                <div className="flex flex-col items-end">
                  <Badge
                    variant={transaction.is_paid ? "default" : "secondary"}
                    className="w-fit"
                  >
                    {transaction.is_paid ? "Paid" : "Unpaid"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold pb-2">Client Information</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{transaction.client.name}</p>
                  {transaction.client.phone && (
                    <p>{transaction.client.phone}</p>
                  )}
                  {transaction.client.address && (
                    <p>{transaction.client.address}</p>
                  )}
                  {transaction.client.ntn_number && (
                    <p>NTN: {transaction.client.ntn_number}</p>
                  )}
                </div>
              </div>

              <Separator />

              {items.length ? (
                <div>
                  <div className="rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-bold">
                            Item
                          </th>
                          <th className="px-4 py-2 text-center text-sm font-bold">
                            Qty
                          </th>
                          <th className="px-4 py-2 text-center text-sm font-bold">
                            Unit
                          </th>
                          <th className="px-4 py-2 text-center text-sm font-bold">
                            Price
                          </th>
                          <th className="px-4 py-2 text-center text-sm font-bold">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {items.map((item) => (
                          <tr key={item.id} className="border-t-muted">
                            <td className="px-4 py-3">
                              <p className="font-medium">{item.name}</p>
                              {item.description && (
                                <p className="text-sm text-muted-foreground">
                                  {item.description}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.unit && (
                                <p className="px-4 py-3 text-center">
                                  {item.unit}
                                </p>
                              )}
                            </td>
                            <td className="py-3 text-center">
                              {formatCurrency(item.unit_price, currency)}
                            </td>
                            <td className="py-3 text-center font-medium">
                              {formatCurrency(item.total_price, currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <h3 className="font-medium mb-2 text-destructive">
                  No items to show
                </h3>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transaction.tax_percentage != null &&
                Number.isFinite(transaction.tax_percentage) &&
                transaction.tax_percentage > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tax Percentage
                    </span>
                    <span>{transaction.tax_percentage}%</span>
                  </div>
                )}

              {transaction.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(transaction.tax, currency)}</span>
                </div>
              )}

              {transaction.transit_charges != null &&
                Number.isFinite(transaction.transit_charges) &&
                transaction.transit_charges > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Transit Charges
                    </span>
                    <span>
                      {formatCurrency(transaction.transit_charges, currency)}
                    </span>
                  </div>
                )}

              {transaction.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>
                    {formatCurrency(transaction.total_price, currency)}
                  </span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>
                  Total
                  {(transaction.is_taxed ||
                    (transaction.tax != null &&
                      Number.isFinite(transaction.tax) &&
                      transaction.tax > 0)) && (
                    <span className="text-sm font-light text-muted-foreground ml-1 inline-block">
                      incl. tax
                    </span>
                  )}
                </span>
                <span>{formatCurrency(transaction.grand_total, currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
