"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "@/components/ui/overview";
import { RecentSales } from "@/components/ui/recent-sales";
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
import { InteractiveAreaChartComponent } from "@/components/area-chart";
import { PieChartComponent } from "@/components/pie-chart";
import { LineChartComponent } from "@/components/line-chart";

export default function Dashboard() {
  const [stats, setStats] = useState({
    revenue_change: "0%",
    invoices_change: "0%",
    quotations_change: "0%",
    clients_change: "0%",
    overallRevenue: 0,
    overallInvoices: 0,
    overallQuotations: 0,
    overallClients: 0,
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
  const [revenueData, setRevenueData] = useState<
    { name: string; value: number }[]
  >([]);
  const [invoiceData, setInvoiceData] = useState<
    { name: string; value: number }[]
  >([]);
  const [clientGrowthData, setClientGrowthData] = useState<
    { name: string; value: number }[]
  >([]);

  useEffect(() => {
    (async () => {
      const countryCode = await getCountryFromIP();
      setCurrency(getCurrencyFromCountry(countryCode));
    })();
  }, []);

  const computeDashboardStats = useCallback(
    (invoices: any[], clients: any[]) => {
      const now = Date.now();
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
      const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
      const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

      let totalRevenue = 0,
        prevRevenue = 0;
      let totalInvoices = 0,
        prevInvoices = 0;
      let totalQuotations = 0,
        prevQuotations = 0;
      let totalClients = 0,
        prevClients = 0;
      let recentInvoices: {
        name: string;
        phone: string;
        ntn_number: string;
        purchase: string;
      }[] = [];

      // Calculate overall totals
      let overallRevenue = 0;
      let overallInvoices = 0;
      let overallQuotations = 0;
      let overallClients = clients.length;

      invoices.forEach((invoice) => {
        const createdAt = new Date(
          invoice.date || invoice.created_at
        ).getTime();
        const amount = invoice.tax ? invoice.grand_total : invoice.total_price;

        // Overall totals
        if (!invoice.is_quotation) {
          overallRevenue += amount;
          overallInvoices++;
        } else {
          overallQuotations++;
        }

        // Growth calculations (last week vs. the week before)
        if (createdAt >= oneWeekAgo) {
          invoice.is_quotation
            ? totalQuotations++
            : (totalInvoices++, (totalRevenue += amount));
        } else if (createdAt >= twoWeeksAgo) {
          invoice.is_quotation
            ? prevQuotations++
            : (prevInvoices++, (prevRevenue += amount));
        }

        // Recent invoices (last 30 days)
        if (
          createdAt >= oneMonthAgo &&
          !invoice.is_quotation &&
          recentInvoices.length < 6
        ) {
          recentInvoices.push({
            name: invoice.client.name,
            phone: invoice.client.phone ?? "",
            ntn_number: invoice.client.ntn_number ?? "",
            purchase: amount,
          });
        }
      });

      // Calculate client growth
      clients.forEach((client) => {
        const createdAt = new Date(client.created_at).getTime();
        if (createdAt >= oneWeekAgo) {
          totalClients++;
        } else if (createdAt >= twoWeeksAgo) {
          prevClients++;
        }
      });

      const percentageChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? "+100%" : "0%";
        const change = ((current - previous) / previous) * 100;
        return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
      };

      const actualChange = (current: number, previous: number) => {
        return current - previous;
      };

      return {
        overallRevenue: overallRevenue,
        overallQuotations: overallQuotations,
        overallInvoices: overallInvoices,
        overallClients: overallClients,
        revenue: totalRevenue,
        invoices: totalInvoices,
        quotations: totalQuotations,
        clients: totalClients,
        recentInvoices: recentInvoices,
        revenue_change: percentageChange(totalRevenue, prevRevenue),
        invoices_change: percentageChange(totalInvoices, prevInvoices),
        quotations_change: percentageChange(totalQuotations, prevQuotations),
        clients_change: percentageChange(totalClients, prevClients),
        revenue_increase: actualChange(totalRevenue, prevRevenue),
        invoices_increase: actualChange(totalInvoices, prevInvoices),
        quotations_increase: actualChange(totalQuotations, prevQuotations),
        clients_increase: actualChange(totalClients, prevClients),
      };
    },
    []
  );

  const fetchDashboardData = useCallback(async () => {
    try {
      const [invoicesRes, clientsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/`, {
          credentials: "include",
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/clients/`, {
          credentials: "include",
        }),
      ]);

      if (!invoicesRes.ok || !clientsRes.ok)
        throw new Error("Failed to fetch data");

      const [invoicesData, clientsData] = await Promise.all([
        invoicesRes.json(),
        clientsRes.json(),
      ]);

      const invoices = z.array(transactionSchema).parse(invoicesData);
      const clients = z.array(clientSchema).parse(clientsData);

      setStats(computeDashboardStats(invoices, clients));

      // Dynamic date calculations
      const now = new Date();
      const oneMonthAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate()
      );

      // Revenue Trends: Group by week for the last 4 weeks
      const revenueTrends = invoices
        .filter((invoice) => !invoice.is_quotation)
        .reduce((acc, invoice) => {
          const invoiceDate = new Date(invoice.date || invoice.created_at);
          if (invoiceDate >= oneMonthAgo) {
            const weekNumber = Math.floor(
              (now.getTime() - invoiceDate.getTime()) /
                (7 * 24 * 60 * 60 * 1000)
            );
            const weekLabel = `Week ${4 - weekNumber}`;
            acc[weekLabel] =
              (acc[weekLabel] || 0) +
              (invoice.tax ? invoice.grand_total : invoice.total_price);
          }
          return acc;
        }, {} as Record<string, number>);

      setRevenueData(
        Object.entries(revenueTrends).map(([name, value]) => ({ name, value }))
      );

      // Invoice Status: Paid, Unpaid
      const invoiceStatus = {
        Paid: invoices.filter((invoice) => invoice.is_paid === true).length,
        Unpaid: invoices.filter((invoice) => invoice.is_paid === false).length,
      };

      setInvoiceData(
        Object.entries(invoiceStatus).map(([name, value]) => ({ name, value }))
      );

      // Client Growth: Group by month for the last 5 months
      const clientGrowth = clients.reduce((acc, client) => {
        const clientDate = new Date(client.created_at);
        if (
          clientDate >=
          new Date(now.getFullYear(), now.getMonth() - 5, now.getDate())
        ) {
          const month = clientDate.toLocaleString("default", {
            month: "short",
          });
          acc[month] = (acc[month] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      setClientGrowthData(
        Object.entries(clientGrowth).map(([name, value]) => ({ name, value }))
      );
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }, [computeDashboardStats]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formattedRevenue = useMemo(
    () => formatCurrency(stats.revenue, currency),
    [stats.revenue, currency]
  );
  const formattedOverallRevenue = useMemo(
    () => formatCurrency(stats.overallRevenue, currency),
    [stats.overallRevenue, currency]
  );

  const formattedRecentInvoices = useMemo(
    () =>
      stats.recentInvoices.map((inv) => ({
        ...inv,
        purchase: formatCurrency(parseFloat(inv.purchase), currency),
      })),
    [stats.recentInvoices, currency]
  );

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 flex-wrap">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports" disabled>
            Reports
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
                <div className="text-2xl font-bold">
                  {formattedOverallRevenue}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.revenue_change} ({formattedRevenue}) from last week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
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
                  {stats.overallInvoices.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.invoices_change} (+{stats.invoices.toLocaleString()})
                  from last week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Quotations
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
                  {stats.overallQuotations.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.quotations_change} (+{stats.quotations}) from last week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
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
                  {stats.overallClients.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.clients_change} (+{stats.clients.toLocaleString()}) from last week
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
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Last 4 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChartComponent
                  data={revenueData}
                  xAxisKey="name"
                  yAxisKey="value"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Invoice Status</CardTitle>
                <CardDescription>Current month</CardDescription>
              </CardHeader>
              <CardContent>
                <PieChartComponent data={invoiceData} activeIndex={0} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Client Growth</CardTitle>
                <CardDescription>Last 5 months</CardDescription>
              </CardHeader>
              <CardContent>
                <InteractiveAreaChartComponent
                  data={clientGrowthData}
                  xAxisKey="name"
                  yAxisKey="value"
                />
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Clients</CardTitle>
                <CardDescription>By revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentSales data={formattedRecentInvoices} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Quotation Trends</CardTitle>
                <CardDescription>Last 4 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChartComponent
                  data={revenueData}
                  xAxisKey="name"
                  yAxisKey="value"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
