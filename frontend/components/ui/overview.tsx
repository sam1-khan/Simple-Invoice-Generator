"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface Invoice {
  id: number;
  is_quotation: boolean;
  date?: string;
  created_at: string;
}

interface ChartData {
  month: string;
  year: number;
  invoice: number;
  quotation: number;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const chartConfig = {
  invoice: {
    label: "Invoice",
    color: "hsl(var(--chart-1))",
  },
  quotation: {
    label: "Quotation",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function Overview() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [trend, setTrend] = useState<{ percentage: number; isUp: boolean }>({
    percentage: 0,
    isUp: true,
  });

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices/`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch invoices");

      const invoices: Invoice[] = await res.json();

      const monthYearMap = new Map<string, { invoice: number; quotation: number }>();

      invoices.forEach((invoice) => {
        const date = new Date(invoice.date || invoice.created_at);
        const monthName = months[date.getMonth()];
        const year = date.getFullYear();
        const key = `${year}-${monthName}`;

        if (!monthYearMap.has(key)) {
          monthYearMap.set(key, { invoice: 0, quotation: 0 });
        }

        const data = monthYearMap.get(key)!;

        if (invoice.is_quotation) {
          data.quotation++;
        } else {
          data.invoice++;
        }

        monthYearMap.set(key, data);
      });

      const updatedChartData = Array.from(monthYearMap.entries())
        .map(([key, value]) => {
          const [year, month] = key.split("-");
          return {
            month,
            year: parseInt(year),
            invoice: value.invoice,
            quotation: value.quotation,
          };
        })
        .sort((a, b) => a.year - b.year || months.indexOf(a.month) - months.indexOf(b.month));

      setChartData(updatedChartData);

      if (updatedChartData.length >= 2) {
        const currentMonth = updatedChartData[updatedChartData.length - 1];
        const lastMonth = updatedChartData[updatedChartData.length - 2];

        const totalCurrent = currentMonth.invoice + currentMonth.quotation;
        const totalLast = lastMonth.invoice + lastMonth.quotation;

        const changePercentage =
          totalLast === 0 ? (totalCurrent > 0 ? 100 : 0) : ((totalCurrent - totalLast) / totalLast) * 100;

        setTrend({
          percentage: Math.abs(Number(changePercentage.toFixed(1))),
          isUp: changePercentage >= 0,
        });
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Invoices vs Quotations</CardTitle>
        <CardDescription>Chronological Order by Year & Month</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value: string) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="invoice" fill="var(--color-invoice)" radius={4} />
            <Bar dataKey="quotation" fill="var(--color-quotation)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Trending {trend.isUp ? "up" : "down"} by {trend.percentage}% this month{" "}
          {trend.isUp ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </div>
        <div className="leading-none text-muted-foreground">
          Showing invoices and quotations in order of year and month.
        </div>
      </CardFooter>
    </Card>
  );
}
