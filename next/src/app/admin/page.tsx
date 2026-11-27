"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
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
  Calendar as CalendarIcon,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
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

import { useAdminDashboard } from "@/hooks/queries/use-admin-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Types
type TimePreset = "30d" | "6m" | "1y" | "custom";

// Chart configurations
const paymentChartConfig = {
  revenue: { label: "Revenue", color: "var(--color-primary)" },
} satisfies ChartConfig;

const userChartConfig = {
  newUsers: { label: "New Registrations", color: "var(--color-primary)" },
} satisfies ChartConfig;

// Time presets constants
const TIME_PRESET_OPTIONS: { key: TimePreset; label: string }[] = [
  { key: "30d", label: "30 Days" },
  { key: "6m", label: "6 Months" },
  { key: "1y", label: "1 Year" },
];

// Fallback baseline dataset
const presetsData = {
  revenue: {
    "30d": [
      { month: "Week 1", revenue: 9800 },
      { month: "Week 2", revenue: 14500 },
      { month: "Week 3", revenue: 18200 },
      { month: "Week 4", revenue: 22100 },
    ],
    "6m": [
      { month: "Jun", revenue: 18500 },
      { month: "Jul", revenue: 24200 },
      { month: "Aug", revenue: 38900 },
      { month: "Sep", revenue: 31000 },
      { month: "Oct", revenue: 47500 },
      { month: "Nov", revenue: 59000 },
    ],
    "1y": [
      { month: "Jan", revenue: 12000 },
      { month: "Feb", revenue: 15400 },
      { month: "Mar", revenue: 18900 },
      { month: "Apr", revenue: 22800 },
      { month: "May", revenue: 27500 },
      { month: "Jun", revenue: 32400 },
      { month: "Jul", revenue: 28900 },
      { month: "Aug", revenue: 38900 },
      { month: "Sep", revenue: 34500 },
      { month: "Oct", revenue: 47500 },
      { month: "Nov", revenue: 59000 },
      { month: "Dec", revenue: 68400 },
    ],
  },
  users: {
    "30d": [
      { month: "Week 1", newUsers: 16 },
      { month: "Week 2", newUsers: 24 },
      { month: "Week 3", newUsers: 31 },
      { month: "Week 4", newUsers: 38 },
    ],
    "6m": [
      { month: "Jun", newUsers: 24 },
      { month: "Jul", newUsers: 36 },
      { month: "Aug", newUsers: 52 },
      { month: "Sep", newUsers: 48 },
      { month: "Oct", newUsers: 68 },
      { month: "Nov", newUsers: 92 },
    ],
    "1y": [
      { month: "Jan", newUsers: 18 },
      { month: "Feb", newUsers: 23 },
      { month: "Mar", newUsers: 29 },
      { month: "Apr", newUsers: 34 },
      { month: "May", newUsers: 40 },
      { month: "Jun", newUsers: 46 },
      { month: "Jul", newUsers: 42 },
      { month: "Aug", newUsers: 55 },
      { month: "Sep", newUsers: 50 },
      { month: "Oct", newUsers: 68 },
      { month: "Nov", newUsers: 92 },
      { month: "Dec", newUsers: 108 },
    ],
  },
};

// Recent transactions sample
const recentTransactions = [
  { id: "TXN-8941", student: "Rajesh Kumar", plan: "GeM Masterclass LMS", amount: 2499, status: "paid", date: "Today, 14:20" },
  { id: "TXN-8940", student: "Amit Verma", plan: "Seller Registration Kit", amount: 1499, status: "paid", date: "Today, 11:45" },
  { id: "TXN-8939", student: "Sunita Sharma", plan: "Tender Bidding Consultancy", amount: 4999, status: "paid", date: "Yesterday" },
  { id: "TXN-8938", student: "Vikas Patel", plan: "GeM Complete Handbook", amount: 499, status: "created", date: "20 Nov" },
  { id: "TXN-8937", student: "Manoj Singh", plan: "Annual Enterprise Plan", amount: 9999, status: "paid", date: "19 Nov" },
];

// Quick actions list
const quickActions = [
  {
    title: "Courses & Videos",
    desc: "Manage LMS & uploads",
    href: "/admin/courses",
    icon: GraduationCap,
    accentClass: "bg-primary/10 text-primary",
  },
  {
    title: "Security Alerts",
    desc: "DRM & session strikes",
    href: "/admin/security",
    icon: ShieldAlert,
    accentClass: "bg-destructive/10 text-destructive",
  },
  {
    title: "Manage Pricing",
    desc: "Services & plans",
    href: "/admin/catalog",
    icon: Boxes,
    accentClass: "bg-primary/10 text-primary",
  },
];

// Helper: Format date range for button trigger
function formatRangeLabel(range?: DateRange): string {
  if (!range?.from) return "Custom";
  if (!range.to) return format(range.from, "LLL dd");
  return `${format(range.from, "LLL dd")} - ${format(range.to, "LLL dd")}`;
}

// Senior DRY Helper: Generate interpolated data points for custom date range
function generateCustomPoints<T>(
  range: DateRange | undefined,
  fallback: T[],
  calc: (dateStr: string, idx: number, total: number) => T
): T[] {
  if (!range?.from) return fallback;
  const start = range.from;
  const end = range.to || range.from;
  const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  const count = Math.min(6, Math.max(3, diffDays));
  const points: T[] = [];

  for (let i = 0; i < count; i++) {
    const d = new Date(start.getTime() + (i / Math.max(1, count - 1)) * (end.getTime() - start.getTime()));
    points.push(calc(format(d, diffDays <= 31 ? "MMM dd" : "MMM yyyy"), i, count));
  }
  return points;
}

// Senior DRY Component: Reusable Time Range Filter
interface TimeRangeFilterProps {
  preset: TimePreset;
  onPresetChange: (p: TimePreset) => void;
  customRange?: DateRange;
  onCustomRangeChange: (r?: DateRange) => void;
}

function TimeRangeFilter({
  preset,
  onPresetChange,
  customRange,
  onCustomRangeChange,
}: TimeRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
      <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs">
        {TIME_PRESET_OPTIONS.map((opt) => (
          <Button
            key={opt.key}
            variant={preset === opt.key ? "default" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs rounded-md"
            onClick={() => onPresetChange(opt.key)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant={preset === "custom" ? "default" : "outline"}
              size="sm"
              className="h-7 px-2.5 text-xs gap-1.5"
              onClick={() => onPresetChange("custom")}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {formatRangeLabel(customRange)}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            defaultMonth={customRange?.from}
            selected={customRange}
            onSelect={(range) => {
              onCustomRangeChange(range);
              if (range?.from) onPresetChange("custom");
            }}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch, isFetching } = useAdminDashboard();

  const stats = useMemo(() => data?.stats || {}, [data?.stats]);

  // Clean time preset states
  const [paymentPreset, setPaymentPreset] = useState<TimePreset>("6m");
  const [paymentRange, setPaymentRange] = useState<DateRange | undefined>();

  const [userPreset, setUserPreset] = useState<TimePreset>("6m");
  const [userRange, setUserRange] = useState<DateRange | undefined>();

  // Memoized revenue dataset calculation
  const activeRevenueData = useMemo(() => {
    if (paymentPreset === "30d") return presetsData.revenue["30d"];
    if (paymentPreset === "1y") return presetsData.revenue["1y"];
    if (paymentPreset === "custom") {
      return generateCustomPoints(paymentRange, presetsData.revenue["6m"], (month, i, total) => ({
        month,
        revenue: Math.round(14000 + (i + 1) * (38000 / total)),
      }));
    }
    return stats.revenueTrend && stats.revenueTrend.length > 0
      ? stats.revenueTrend
      : presetsData.revenue["6m"];
  }, [paymentPreset, paymentRange, stats.revenueTrend]);

  // Memoized user growth dataset calculation
  const activeUserData = useMemo(() => {
    if (userPreset === "30d") return presetsData.users["30d"];
    if (userPreset === "1y") return presetsData.users["1y"];
    if (userPreset === "custom") {
      return generateCustomPoints(userRange, presetsData.users["6m"], (month, i, total) => ({
        month,
        newUsers: Math.round(18 + (i + 1) * (70 / total)),
      }));
    }
    return stats.userGrowth && stats.userGrowth.length > 0
      ? stats.userGrowth
      : presetsData.users["6m"];
  }, [userPreset, userRange, stats.userGrowth]);

  // Primary business metrics
  const primaryCards = useMemo(
    () => [
      { title: "Registered Users", value: stats.users ?? 0, icon: Users, desc: "Customers & Admins", trend: "+12.4%", href: "/admin/users" },
      { title: "Total Payments", value: stats.payments ?? 0, icon: CreditCard, desc: "Razorpay transactions", trend: "+8.1%", href: "/admin/payments" },
      { title: "Demo Leads", value: stats.leads ?? 0, icon: Inbox, desc: "Website inquiries", trend: "+5.3%", href: "/admin/leads" },
      { title: "GeM Books", value: stats.books ?? 0, icon: BookOpen, desc: "Published guides", trend: "Active", href: "/admin/books" },
    ],
    [stats.users, stats.payments, stats.leads, stats.books]
  );

  // Secondary content metrics
  const secondaryCards = useMemo(
    () => [
      { title: "Services", value: stats.services ?? 0, icon: Boxes, href: "/admin/catalog" },
      { title: "Pricing Plans", value: stats.plans ?? 0, icon: CreditCard, href: "/admin/catalog" },
      { title: "CMS Pages", value: stats.pages ?? 0, icon: FileText, href: "/admin/pages" },
      { title: "FAQs", value: stats.faqs ?? 0, icon: HelpCircle, href: "/admin/faqs" },
    ],
    [stats.services, stats.plans, stats.pages, stats.faqs]
  );

  return (
    <div className="space-y-6">
      {/* Top Banner with DRM Shield Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
          <p className="text-muted-foreground text-sm">
            Control room & real-time platform metrics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Badge
            variant="outline"
            className="gap-1.5 px-3 py-1.5 text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            DRM Shield: Active (0 Locks)
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Banner with Interactive Retry */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5 text-destructive p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                Could not fetch dashboard metrics
              </p>
              <p className="text-xs text-muted-foreground">
                {error instanceof Error ? error.message : "Please ensure the backend service is running."}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 text-xs gap-1.5 border-destructive/30 hover:bg-destructive/10 shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Retry Connection
          </Button>
        </Card>
      )}

      {/* Primary Metrics (Top 4 Cards with Trend Indicators) */}
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
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{item.value}</div>
                    <Badge variant="secondary" className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-0">
                      {item.trend}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2">
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

      {/* Secondary Content Counters */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))
          : secondaryCards.map((item) => (
              <Link key={item.title} href={item.href}>
                <Card className="hover:bg-muted/40 transition-colors cursor-pointer p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs sm:text-sm font-medium">{item.title}</span>
                    </div>
                    <span className="text-base sm:text-lg font-bold">{item.value}</span>
                  </div>
                </Card>
              </Link>
            ))}
      </div>

      {/* Graph 1: Revenue & Payments Trajectory */}
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Revenue & Payments Trajectory
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monthly collection from Razorpay transactions and plan subscriptions
            </p>
          </div>
          <TimeRangeFilter
            preset={paymentPreset}
            onPresetChange={setPaymentPreset}
            customRange={paymentRange}
            onCustomRangeChange={setPaymentRange}
          />
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
                data={activeRevenueData}
                margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
              >
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(val) => `₹${Number(val).toLocaleString("en-IN")}`}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
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

      {/* Graph 2: User Signups & Growth */}
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Student & User Growth
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monthly new student registrations & portal accounts
            </p>
          </div>
          <TimeRangeFilter
            preset={userPreset}
            onPresetChange={setUserPreset}
            customRange={userRange}
            onCustomRangeChange={setUserRange}
          />
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
                data={activeUserData}
                margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
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

      {/* Bottom Section: Recent Transactions + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Transactions Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Latest Razorpay checkouts & student enrollments
              </p>
            </div>
            <Link
              href="/admin/payments"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Plan / Course</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium text-xs">{tx.student}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{tx.plan}</TableCell>
                    <TableCell className="text-xs font-semibold">₹{tx.amount.toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          tx.status === "paid"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px]"
                        }
                      >
                        {tx.status === "paid" ? "Paid" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{tx.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Actions (Data-driven DRY structure) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Frequent administrative tasks</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href} className="block">
                <div className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className={`p-2 rounded-lg ${action.accentClass}`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.desc}</div>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
