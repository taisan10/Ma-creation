"use client";

import { Users, CreditCard, UserCheck, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { UsersIntelligenceSummary } from "@/hooks/queries/use-users";

interface UsersKpiCardsProps {
  summary: UsersIntelligenceSummary;
  isLoading: boolean;
  error?: Error | null;
}

export function UsersKpiCards({ summary, isLoading, error }: UsersKpiCardsProps) {
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

  const paidRatio =
    !isError && summary.totalUsers > 0
      ? `${Math.round((summary.paidCount / summary.totalUsers) * 100)}% of total`
      : undefined;

  const registeredRatio =
    !isError && summary.totalUsers > 0
      ? `${Math.round((summary.registeredCount / summary.totalUsers) * 100)}% of total`
      : undefined;

  const cards = [
    {
      title: "Total Accounts",
      value: isError ? "—" : summary.totalUsers,
      desc: isError ? "Unable to load accounts" : "All portal registrations",
      badge: !isError && summary.adminsCount > 0 ? `${summary.adminsCount} Admins` : undefined,
      icon: Users,
    },
    {
      title: "Paid Users",
      value: isError ? "—" : summary.paidCount,
      desc: isError ? "Unable to load revenue" : `₹${summary.totalRevenue.toLocaleString("en-IN")} collected`,
      badge: paidRatio,
      icon: CreditCard,
      hasDot: true,
    },
    {
      title: "Registered Users",
      value: isError ? "—" : summary.registeredCount,
      desc: isError ? "Unable to load users" : "Standard exploratory accounts",
      badge: registeredRatio,
      icon: UserCheck,
    },
    {
      title: "Sales Conversion Rate",
      value: isError ? "—" : summary.conversionRate,
      desc: isError ? "Unable to calculate rate" : "Paid vs Registered user ratio",
      badge: undefined,
      icon: TrendingUp,
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
              <div className="text-2xl font-bold tracking-tight text-foreground">{item.value}</div>
              {item.badge && (
                <Badge
                  variant="outline"
                  className="text-[11px] font-normal gap-1"
                >
                  {item.hasDot && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
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
