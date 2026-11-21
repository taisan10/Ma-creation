"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  CreditCard,
  Inbox,
  BookOpen,
  Boxes,
  FileText,
  HelpCircle,
  ShieldAlert,
  GraduationCap,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface RevenuePoint {
  month: string;
  revenue: number;
}

interface UserGrowthPoint {
  month: string;
  newUsers: number;
}

interface DashboardResponse {
  success: boolean;
  stats: {
    users?: number;
    leads?: number;
    payments?: number;
    services?: number;
    plans?: number;
    pages?: number;
    faqs?: number;
    partners?: number;
    books?: number;
    revenueTrend?: RevenuePoint[];
    userGrowth?: UserGrowthPoint[];
    [key: string]: unknown;
  };
}

// Fallback preview data (renders gracefully when fresh or loading)
const sampleRevenueTrend: RevenuePoint[] = [
  { month: "Jun", revenue: 18500 },
  { month: "Jul", revenue: 24200 },
  { month: "Aug", revenue: 38900 },
  { month: "Sep", revenue: 31000 },
  { month: "Oct", revenue: 47500 },
  { month: "Nov", revenue: 59000 },
];

const sampleUserGrowth: UserGrowthPoint[] = [
  { month: "Jun", newUsers: 24 },
  { month: "Jul", newUsers: 36 },
  { month: "Aug", newUsers: 52 },
  { month: "Sep", newUsers: 48 },
  { month: "Oct", newUsers: 68 },
  { month: "Nov", newUsers: 92 },
];

const paymentChartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

const userChartConfig = {
  newUsers: {
    label: "New Registrations",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery<DashboardResponse>({
    queryKey: ["admin", "dashboard"],
    queryFn: () => api<DashboardResponse>("/admin/dashboard"),
  });

  const stats = data?.stats || {};

  const revenueData =
    stats.revenueTrend && stats.revenueTrend.length > 0
      ? stats.revenueTrend
      : sampleRevenueTrend;

  const userData =
    stats.userGrowth && stats.userGrowth.length > 0
      ? stats.userGrowth
      : sampleUserGrowth;

  // Primary business metrics (Top Row)
  const primaryCards = [
    { title: "Registered Users", value: stats.users ?? 0, icon: Users, desc: "Customers & Admins", href: "/admin/users" },
    { title: "Total Payments", value: stats.payments ?? 0, icon: CreditCard, desc: "Razorpay transactions", href: "/admin/payments" },
    { title: "Demo Leads", value: stats.leads ?? 0, icon: Inbox, desc: "Website inquiries", href: "/admin/leads" },
    { title: "GeM Books", value: stats.books ?? 0, icon: BookOpen, desc: "Published guides", href: "/admin/books" },
  ];

  // Secondary content metrics
  const secondaryCards = [
    { title: "Services", value: stats.services ?? 0, icon: Boxes, href: "/admin/catalog" },
    { title: "Pricing Plans", value: stats.plans ?? 0, icon: CreditCard, href: "/admin/catalog" },
    { title: "CMS Pages", value: stats.pages ?? 0, icon: FileText, href: "/admin/pages" },
    { title: "FAQs", value: stats.faqs ?? 0, icon: HelpCircle, href: "/admin/faqs" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
          <p className="text-muted-foreground text-sm">
            Control room & real-time platform metrics.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5 text-destructive p-4">
          <p className="text-sm font-medium">
            Could not fetch dashboard stats. Please ensure backend is running.
          </p>
        </Card>
      )}

      {/* Primary Metrics (Top 4 Cards) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))
          : primaryCards.map((item) => (
              <Card key={item.title} className="hover:border-primary/40 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {item.title}
                  </CardTitle>
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{item.value}</div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                    <Link
                      href={item.href}
                      className="text-xs font-medium text-primary hover:underline inline-flex items-center"
                    >
                      View <ArrowUpRight className="h-3 w-3 ml-0.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Graph 1: Revenue & Payments Trajectory (Full Horizontal Space) */}
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Revenue & Payments Trajectory
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monthly collection from Razorpay transactions and plan subscriptions
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
              Monthly Revenue
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {isLoading ? (
            <Skeleton className="h-[260px] w-full rounded-lg" />
          ) : (
            <ChartContainer
              config={paymentChartConfig}
              className="aspect-auto h-[260px] w-full"
            >
              <AreaChart
                data={revenueData}
                margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
              >
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(val) => `₹${Number(val).toLocaleString("en-IN")}`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  dataKey="revenue"
                  type="natural"
                  fill="url(#fillRevenue)"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Graph 2: User Signups & Growth (Full Horizontal Space - Bar Chart) */}
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Student & User Growth
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monthly new student registrations & portal accounts
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
              Monthly Volume
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {isLoading ? (
            <Skeleton className="h-[260px] w-full rounded-lg" />
          ) : (
            <ChartContainer
              config={userChartConfig}
              className="aspect-auto h-[260px] w-full"
            >
              <BarChart
                data={userData}
                margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  allowDecimals={false}
                />
                <ChartTooltip
                  cursor={{ fill: "var(--color-muted)", opacity: 0.25 }}
                  content={<ChartTooltipContent indicator="dashed" />}
                />
                <Bar
                  dataKey="newUsers"
                  fill="var(--color-primary)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Secondary Content Counters */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))
          : secondaryCards.map((item) => (
              <Link key={item.title} href={item.href}>
                <Card className="hover:bg-muted/40 transition-colors cursor-pointer p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    <span className="text-lg font-bold">{item.value}</span>
                  </div>
                </Card>
              </Link>
            ))}
      </div>

      {/* Quick Action Shortcuts */}
      <div className="space-y-3 pt-2">
        <h2 className="text-base font-semibold">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/admin/courses">
            <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-sm">Courses & Videos</div>
                  <div className="text-xs text-muted-foreground">Manage LMS & uploads</div>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/security">
            <Card className="p-4 hover:border-destructive/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-sm">Security Alerts</div>
                  <div className="text-xs text-muted-foreground">Session replacements</div>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/catalog">
            <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Boxes className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-sm">Manage Pricing</div>
                  <div className="text-xs text-muted-foreground">Services & plans</div>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}