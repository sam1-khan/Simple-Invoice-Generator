"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDateRangePicker } from "@/components/ui/date-range-picker";
import { Overview } from "@/components/ui/overview";
import { RecentSales } from "@/components/ui/recent-sales";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { z } from "zod";
import { transactionSchema, clientSchema } from "@/app/transactions/data/schema";

// Utility function to format currency
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount);
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // State for dashboard stats
  const [stats, setStats] = useState({
    revenue: 0,
    invoices: 0,
    quotations: 0,
    clients: 0,
    recentInvoices: [] as { name: string; phone: string; ntn_number: string; purchase: number }[],
  });

  // State for currency
  const [currency, setCurrency] = useState<string>("PKR");

  // Fetch currency based on user's IP
  useEffect(() => {
    const getCountryFromIP = async (): Promise<string> => {
      try {
        const res = await fetch("https://ipinfo.io/json?token=a7b20789cf45dd");
        const data = await res.json();
        return data.country || "PK";
      } catch (error) {
        console.error("Error fetching country:", error);
        return "PK";
      }
    };

    const getCurrencyFromCountry = (countryCode: string): string => {
      const currencyMap: Record<string, string> = {
        US: "USD", GB: "GBP", CA: "CAD", AU: "AUD", FR: "EUR", DE: "EUR",
        IN: "INR", JP: "JPY", CN: "CNY", PK: "PKR", AE: "AED", SA: "SAR",
        RU: "RUB", BR: "BRL", MX: "MXN", ZA: "ZAR", NG: "NGN", KR: "KRW",
        TR: "TRY", ID: "IDR", MY: "MYR", TH: "THB", VN: "VND", PH: "PHP",
        BD: "BDT", EG: "EGP", SG: "SGD", HK: "HKD", NZ: "NZD", CH: "CHF",
        SE: "SEK", NO: "NOK", DK: "DKK", IL: "ILS", CL: "CLP", CO: "COP",
        AR: "ARS", KE: "KES", GH: "GHS", TW: "TWD"
      };
      return currencyMap[countryCode] || "PKR";
    };

    const fetchCurrency = async () => {
      const countryCode = await getCountryFromIP();
      const currencyCode = getCurrencyFromCountry(countryCode);
      setCurrency(currencyCode);
    };

    fetchCurrency();
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const [invoicesRes, clientsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/clients/`, { credentials: "include" }),
      ]);

      if (!invoicesRes.ok || !clientsRes.ok) throw new Error("Failed to fetch data");

      const [invoicesData, clientsData] = await Promise.all([
        invoicesRes.json(),
        clientsRes.json(),
      ]);

      const invoices = z.array(transactionSchema).parse(invoicesData);
      const clients = z.array(clientSchema).parse(clientsData);

      setStats(computeDashboardStats(invoices, clients));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }, []);

  // Fetch data when user is authenticated
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user) fetchDashboardData();
  }, [user, loading, router, fetchDashboardData]);

  const computeDashboardStats = (invoices: any[], clients: any[]) => {
    const thirtyDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let totalRevenue = 0;
    let totalInvoices = 0;
    let totalQuotations = 0;
    let recentInvoices: { name: string; phone: string; ntn_number: string; purchase: number }[] = [];
  
    invoices.forEach((invoice) => {
      let createdAt = new Date(invoice.created_at).getTime();
      if (invoice.date) {
        createdAt = new Date(invoice.date).getTime();
      }
      if (createdAt >= thirtyDaysAgo) {
        if (invoice.is_quotation) {
          totalQuotations++;
        } else {
          totalInvoices++;
          let amount = invoice.tax ? invoice.grand_total : invoice.total_price;
          totalRevenue += amount;
  
          if (recentInvoices.length < 5) {
            recentInvoices.push({
              name: invoice.client.name,
              phone: invoice.client.phone ?? "",
              ntn_number: invoice.client.ntn_number ?? "",
              purchase: amount,
            });
          }
        }
      }
    });

    return {
      revenue: totalRevenue,
      invoices: totalInvoices,
      quotations: totalQuotations,
      clients: clients.length,
      recentInvoices: recentInvoices.reverse(),
    };
  };

  // Memoize the formatted revenue value
  const formattedRevenue = useMemo(() => formatCurrency(stats.revenue, currency), [stats.revenue, currency]);
  const formattedPurchases = useMemo(() => stats.recentInvoices.map((inv) => formatCurrency(inv.purchase, currency)), [stats.recentInvoices, currency]);
  const formattedRecentInvoices = useMemo(() => 
    stats.recentInvoices.map((invoice, index) => ({
      ...invoice,
      purchase: formattedPurchases[index],
    })), 
    [stats.recentInvoices, formattedPurchases]
  );
  
  if (loading || !user) return null;
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 flex-wrap">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <CalendarDateRangePicker />
          <Button>Download</Button>
        </div>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics" disabled>
            Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" disabled>
            Reports
          </TabsTrigger>
          <TabsTrigger value="notifications" disabled>
            Notifications
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formattedRevenue}</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Invoices
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                  <path d="M14 8H8" />
                  <path d="M16 12H8" />
                  <path d="M13 16H8" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{stats.invoices.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +19% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Quotations
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" />
                  <path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{stats.quotations.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +201 since last hour
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clients</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{stats.clients.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +180.1% from last month
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Overview />
            <Card className="col-span-4 md:col-span-4 lg:col-span-3">
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentSales data={formattedRecentInvoices} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};