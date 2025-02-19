"use client";

import { TrendingUp } from "lucide-react";

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

const chartData = [
  { month: "January", invoice: 186, quotation: 80 },
  { month: "February", invoice: 305, quotation: 200 },
  { month: "March", invoice: 237, quotation: 120 },
  { month: "April", invoice: 73, quotation: 190 },
  { month: "May", invoice: 209, quotation: 130 },
  { month: "June", invoice: 214, quotation: 140 },
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
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Invoices vs Quotations</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
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
              tickFormatter={(value) => value.slice(0, 3)}
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
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing invoices and quotations created for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}
