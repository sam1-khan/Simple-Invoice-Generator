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
import {
  transactionSchema,
  clientSchema,
} from "@/app/transactions/data/schema";
import {
  getCountryFromIP,
  getCurrencyFromCountry,
  formatCurrency,
} from "@/lib/utils";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({
    revenue_change: "0%",
    invoices_change: "0%",
    quotations_change: "0%",
    clients_change: "0%",
    revenue: 0,
    invoices: 0,
    quotations: 0,
    clients: 0,
    recentInvoices: [] as {
      name: string;
      phone: string;
      ntn_number: string;
      purchase: string;
    }[],
  });

  const [currency, setCurrency] = useState<string>("PKR");

  useEffect(() => {
    (async () => {
      const countryCode = await getCountryFromIP();
      setCurrency(getCurrencyFromCountry(countryCode));
    })();
  }, []);

  const computeDashboardStats = useCallback((invoices: any[], clients: any[]) => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    let totalRevenue = 0, prevRevenue = 0;
    let totalInvoices = 0, prevInvoices = 0;
    let totalQuotations = 0, prevQuotations = 0;
    let recentInvoices: { name: string; phone: string; ntn_number: string; purchase: string }[] = [];

    invoices.forEach((invoice) => {
      const createdAt = new Date(invoice.date || invoice.created_at).getTime();
      const amount = invoice.tax ? invoice.grand_total : invoice.total_price;

      if (createdAt >= thirtyDaysAgo) {
        invoice.is_quotation ? totalQuotations++ : (totalInvoices++, totalRevenue += amount);
        if (!invoice.is_quotation && recentInvoices.length < 6) {
          recentInvoices.push({
            name: invoice.client.name,
            phone: invoice.client.phone ?? "",
            ntn_number: invoice.client.ntn_number ?? "",
            purchase: amount,
          });
        }
      } else if (createdAt >= sixtyDaysAgo) {
        invoice.is_quotation ? prevQuotations++ : (prevInvoices++, prevRevenue += amount);
      }
    });

    const percentageChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? "+100%" : "0%";
      const change = ((current - previous) / previous) * 100;
      return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
    };

    return {
      revenue: totalRevenue,
      invoices: totalInvoices,
      quotations: totalQuotations,
      clients: clients.length,
      recentInvoices: recentInvoices.reverse(),
      revenue_change: percentageChange(totalRevenue, prevRevenue),
      invoices_change: percentageChange(totalInvoices, prevInvoices),
      quotations_change: percentageChange(totalQuotations, prevQuotations),
      clients_change: percentageChange(clients.length, clients.length - prevInvoices - prevQuotations),
    };
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [invoicesRes, clientsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/clients/`, { credentials: "include" }),
      ]);

      if (!invoicesRes.ok || !clientsRes.ok) throw new Error("Failed to fetch data");

      const [invoicesData, clientsData] = await Promise.all([invoicesRes.json(), clientsRes.json()]);

      const invoices = z.array(transactionSchema).parse(invoicesData);
      const clients = z.array(clientSchema).parse(clientsData);

      setStats(computeDashboardStats(invoices, clients));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }, [computeDashboardStats]);

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace("/login");
      else fetchDashboardData();
    }
  }, [user, loading, router, fetchDashboardData]);

  const formattedRevenue = useMemo(() => formatCurrency(stats.revenue, currency), [stats.revenue, currency]);
  const formattedRecentInvoices = useMemo(() => 
    stats.recentInvoices.map((inv) => ({ ...inv, purchase: formatCurrency(parseFloat(inv.purchase), currency) })), 
    [stats.recentInvoices, currency]
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
                  {stats.revenue_change} from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Invoices</CardTitle>
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
                <div className="text-2xl font-bold">
                  +{stats.invoices.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                {stats.invoices_change} from last month
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
                <div className="text-2xl font-bold">
                  +{stats.quotations.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                {stats.quotations_change} from last month
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
                <div className="text-2xl font-bold">
                  +{stats.clients.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                {stats.clients_change} from last month
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
}