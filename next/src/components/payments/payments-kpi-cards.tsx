"use client";

import { TrendingUp, CheckCircle2, Clock, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaymentsSummary } from "@/hooks/queries/use-payments";

interface PaymentsKpiCardsProps {
  summary: PaymentsSummary;
  isLoading: boolean;
  error?: Error | null;
}

export function PaymentsKpiCards({ summary, isLoading, error }: PaymentsKpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const isError = Boolean(error);

  const cards = [
    {
      title: "Total Revenue Collected",
      value: isError ? "—" : `₹${summary.totalRevenue.toLocaleString("en-IN")}`,
      desc: isError ? "Unable to load revenue" : `${summary.paidCount} completed Razorpay orders`,
      badge: undefined,
      icon: TrendingUp,
      hasDot: false,
      dotColor: "",
    },
    {
      title: "Completed Orders",
      value: isError ? "—" : summary.paidCount,
      desc: isError ? "Unable to load orders" : `${summary.conversionRate} overall checkout success`,
      badge: isError ? undefined : "Verified Paid",
      icon: CheckCircle2,
      hasDot: true,
      dotColor: "bg-emerald-500",
    },
    {
      title: "Abandoned Checkouts",
      value: isError ? "—" : summary.abandonedCount,
      desc: isError ? "Unable to load checkouts" : "Checkout opened but not finalized",
      badge: !isError && summary.abandonedCount > 0 ? "Sales Recovery" : undefined,
      icon: Clock,
      hasDot: true,
      dotColor: "bg-amber-500",
    },
    {
      title: "Average Order Value (AOV)",
      value: isError ? "—" : `₹${summary.averageOrderValue.toLocaleString("en-IN")}`,
      desc: isError ? "Unable to calculate AOV" : "Revenue per completed customer",
      badge: undefined,
      icon: CreditCard,
      hasDot: false,
      dotColor: "",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((item) => (
        <Card key={item.title} className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.title}
            </CardTitle>
            <item.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold tracking-tight text-foreground font-sans">
                {item.value}
              </div>
              {item.badge && (
                <Badge variant="outline" className="text-[11px] font-normal gap-1">
                  {item.hasDot && <span className={`h-1.5 w-1.5 rounded-full ${item.dotColor}`} />}
                  {item.badge}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{item.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
