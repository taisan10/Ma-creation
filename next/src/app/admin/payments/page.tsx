"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  Download,
  RefreshCw,
  Search,
  X,
  Eye,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  SearchX,
  Copy,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { usePayments, type PaymentRecord } from "@/hooks/queries/use-payments";
import { useDebounce } from "@/hooks/use-debounce";
import { formatSafeDate } from "@/lib/utils";
import { exportPaymentsToCsv } from "@/lib/export-payments-csv";
import { PaymentsKpiCards } from "@/components/payments/payments-kpi-cards";
import { PaymentDetailsSheet } from "@/components/payments/payment-details-sheet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FilterTab = "all" | "paid" | "created" | "failed";
type SortOption = "newest" | "oldest" | "amount_high" | "amount_low";
type DatePreset = "all" | "today" | "7d" | "this_month" | "last_month";

const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  all: "All Dates",
  today: "Today",
  "7d": "Last 7 Days",
  this_month: "This Month",
  last_month: "Last Month",
};

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  oldest: "Oldest",
  amount_high: "Highest ₹",
  amount_low: "Lowest ₹",
};

export default function AdminPaymentsPage() {
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // TanStack Query Intelligence Hook
  const { payments, summary, isLoading, isFetching, error, refetch } = usePayments();

  // Filtered & Sorted dataset
  const processedPayments = useMemo(() => {
    let result = [...payments];

    // 1. Tab Filtering
    if (filterTab !== "all") {
      result = result.filter((p) => p.status === filterTab);
    }

    // 2. Date Preset Filtering
    if (datePreset !== "all") {
      const now = new Date();
      result = result.filter((p) => {
        if (!p.createdAt) return false;
        const createdAt = new Date(p.createdAt);

        if (datePreset === "today") {
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return createdAt >= startOfToday;
        }
        if (datePreset === "7d") {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return createdAt >= sevenDaysAgo;
        }
        if (datePreset === "this_month") {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return createdAt >= startOfMonth;
        }
        if (datePreset === "last_month") {
          const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          return createdAt >= startOfLastMonth && createdAt <= endOfLastMonth;
        }
        return true;
      });
    }

    // 3. Debounced Search Filtering
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((p) => {
        const name = (p.name || (typeof p.user === "object" ? p.user?.name : "") || "").toLowerCase();
        const email = (p.email || (typeof p.user === "object" ? p.user?.email : "") || "").toLowerCase();
        const phone = (p.phone || (typeof p.user === "object" ? p.user?.phone : "") || "").toLowerCase();
        const company = (p.company || (typeof p.user === "object" ? p.user?.company : "") || "").toLowerCase();
        const planName = (typeof p.plan === "object" && p.plan?.name ? p.plan.name : "").toLowerCase();
        const payId = (p.razorpayPaymentId || "").toLowerCase();
        const orderId = (p.razorpayOrderId || "").toLowerCase();

        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          company.includes(q) ||
          planName.includes(q) ||
          payId.includes(q) ||
          orderId.includes(q)
        );
      });
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortOption === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOption === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortOption === "amount_high") {
        return (b.amount || 0) - (a.amount || 0);
      }
      if (sortOption === "amount_low") {
        return (a.amount || 0) - (b.amount || 0);
      }
      return 0;
    });

    return result;
  }, [payments, filterTab, datePreset, debouncedSearch, sortOption]);

  // Pagination calculations
  const totalItems = processedPayments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedPayments = useMemo(() => {
    return processedPayments.slice(startIndex, endIndex);
  }, [processedPayments, startIndex, endIndex]);

  const handleExportCsv = () => {
    if (processedPayments.length === 0) {
      toast.error("No payment records to export in current filter.");
      return;
    }
    const filterSuffix = filterTab !== "all" ? `-${filterTab}` : "";
    const dateSuffix = datePreset !== "all" ? `-${datePreset}` : "";
    toast.success(`Exporting ${processedPayments.length} payment records to CSV...`);
    exportPaymentsToCsv(processedPayments, `payments${filterSuffix}${dateSuffix}`);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${label} copied!`))
      .catch(() => toast.error(`Failed to copy ${label}`));
  };

  const resetAllFilters = () => {
    setSearchQuery("");
    setFilterTab("all");
    setDatePreset("all");
    setSortOption("newest");
    setCurrentPage(1);
  };

  const filterTabs = [
    { key: "all" as const, label: "All", count: summary.totalOrders },
    { key: "paid" as const, label: "Paid", count: summary.paidCount },
    { key: "created" as const, label: "Abandoned", count: summary.abandonedCount },
    { key: "failed" as const, label: "Failed", count: summary.failedCount },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Payments & Order Records
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Audit Razorpay transaction settlements, order IDs, and follow up with abandoned checkouts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={isLoading || Boolean(error) || processedPayments.length === 0}
            className="gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Top 4 Financial KPI Metrics */}
      <PaymentsKpiCards summary={summary} isLoading={isLoading} error={error} />

      {/* Search, Filter Tabs & Sorter Toolbar (Matching Users Module Single-Row Standard) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Search Input with Instant Clear */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search customer, email, plan, razorpay ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 pr-8 h-9 text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters and Sorters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs with Clean Count Pills */}
          <div className="flex items-center gap-1 border rounded-lg bg-muted/40 p-1">
            {filterTabs.map((tab) => {
              const isActive = filterTab === tab.key;
              return (
                <Button
                  key={tab.key}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-xs rounded-md font-medium"
                  onClick={() => {
                    setFilterTab(tab.key);
                    setCurrentPage(1);
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted-foreground/15 text-muted-foreground"
                    }`}
                  >
                    {tab.count}
                  </span>
                </Button>
              );
            })}
          </div>

          {/* Date Preset Filter Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant={datePreset !== "all" ? "secondary" : "outline"}
                  size="sm"
                  className="h-9 gap-1.5 text-xs font-normal"
                >
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Date: {DATE_PRESET_LABELS[datePreset]}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-36 text-xs">
              {(Object.keys(DATE_PRESET_LABELS) as DatePreset[]).map((key) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => {
                    setDatePreset(key);
                    setCurrentPage(1);
                  }}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span>{DATE_PRESET_LABELS[key]}</span>
                  {datePreset === key && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Compact Sorter Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-normal">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Sort: {SORT_LABELS[sortOption]}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-36 text-xs">
              {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setSortOption(key)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span>{SORT_LABELS[key]}</span>
                  {sortOption === key && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Payments Table Card */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[260px]">Customer</TableHead>
              <TableHead className="w-[190px]">Plan / Course</TableHead>
              <TableHead className="w-[190px]">Gateway Ref</TableHead>
              <TableHead className="w-[130px]">Status</TableHead>
              <TableHead className="w-[150px]">Date</TableHead>
              <TableHead className="w-[130px] text-right">Payment</TableHead>
              <TableHead className="text-right w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="h-[52px]">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-2.5 w-16" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-3.5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-3.5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-3.5 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-3.5 w-16 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-7 w-7 ml-auto rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="h-56 text-center">
                  <div className="flex flex-col items-center justify-center gap-2.5 max-w-sm mx-auto py-6">
                    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="font-semibold text-sm text-foreground">
                      Failed to load payment records
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {error instanceof Error
                        ? error.message
                        : "An unexpected network or server error occurred while retrieving transactions."}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs mt-1 gap-1.5 border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                      onClick={() => refetch()}
                      disabled={isFetching}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                      Retry Connection
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-52 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto py-6">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <SearchX className="h-5 w-5" />
                    </div>
                    <div className="font-semibold text-sm">No payment records found</div>
                    <p className="text-xs text-muted-foreground text-center">
                      {searchQuery.trim()
                        ? `No transactions matched "${searchQuery}". Check for typos or reset your search.`
                        : datePreset !== "all"
                        ? `No payment records found for "${DATE_PRESET_LABELS[datePreset]}" under the "${filterTab}" filter.`
                        : `No payment records under the "${filterTab}" filter.`}
                    </p>
                    {(searchQuery.trim() || filterTab !== "all" || datePreset !== "all") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs mt-1"
                        onClick={resetAllFilters}
                      >
                        Reset Filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPayments.map((p) => {
                const planName =
                  typeof p.plan === "object" && p.plan?.name ? p.plan.name : "Custom Plan";
                const customerName =
                  p.name || (typeof p.user === "object" ? p.user?.name : "") || "Customer";
                const customerEmail =
                  p.email || (typeof p.user === "object" ? p.user?.email : "") || "";

                const initials = customerName
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                const refId = p.razorpayPaymentId || p.razorpayOrderId || "—";

                return (
                  <TableRow
                    key={p._id}
                    className="h-[52px] hover:bg-muted/40 transition-colors"
                  >
                    {/* Customer */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 border shrink-0">
                          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setSelectedPayment(p)}
                            className="font-semibold text-xs text-foreground hover:underline text-left truncate block max-w-[170px]"
                            title={customerName}
                          >
                            {customerName}
                          </button>
                          <div className="text-[11px] text-muted-foreground truncate max-w-[170px]" title={customerEmail}>
                            {customerEmail}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Plan */}
                    <TableCell>
                      <div className="text-xs font-medium text-foreground truncate max-w-[180px]" title={planName}>
                        {planName}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                        {p.company || "Individual"}
                      </div>
                    </TableCell>

                    {/* Gateway Ref */}
                    <TableCell>
                      <div className="flex items-center gap-1 text-[11px] text-foreground">
                        <span className="font-medium truncate max-w-[120px]" title={refId}>
                          {refId.length > 14 ? `${refId.slice(0, 6)}...${refId.slice(-6)}` : refId}
                        </span>
                        {refId !== "—" && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(refId, "Reference ID")}
                            className="text-muted-foreground hover:text-foreground shrink-0"
                            title="Copy ID"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {p.razorpayPaymentId ? "Payment Captured" : "Order Created"}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge variant="outline" className="gap-1 text-[10px] font-normal py-0.5">
                        {p.status === "paid" ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Paid
                          </>
                        ) : p.status === "created" ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Abandoned
                          </>
                        ) : (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                            Failed
                          </>
                        )}
                      </Badge>
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <div className="text-xs text-foreground">
                        {formatSafeDate(p.createdAt, "MMM dd, yyyy")}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {formatSafeDate(p.createdAt, "hh:mm a")}
                      </div>
                    </TableCell>

                    {/* Payment Amount (Right-aligned standard font) */}
                    <TableCell className="text-right">
                      <div className="text-xs font-semibold text-foreground font-sans">
                        ₹{(p.amount || 0).toLocaleString("en-IN")}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {p.currency || "INR"}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="View Order Details"
                          onClick={() => setSelectedPayment(p)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Order Details</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        {!isLoading && totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-muted/10 text-xs">
            <div className="text-muted-foreground">
              Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
              <span className="font-medium text-foreground">{endIndex}</span> of{" "}
              <span className="font-medium text-foreground">{totalItems}</span> records
            </div>

            <div className="flex items-center gap-3">
              {/* Rows per page selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Rows:</span>
                {[10, 25, 50].map((size) => (
                  <Button
                    key={size}
                    variant={pageSize === size ? "secondary" : "ghost"}
                    size="sm"
                    className="h-6 w-7 p-0 text-xs font-normal"
                    onClick={() => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                  >
                    {size}
                  </Button>
                ))}
              </div>

              {/* Prev / Next controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="h-7 w-7"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="Previous Page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs text-muted-foreground px-1 font-sans">
                  Page <span className="font-medium text-foreground">{safeCurrentPage}</span> of{" "}
                  <span className="font-medium text-foreground">{totalPages}</span>
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="h-7 w-7"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Next Page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 360° Payment & Order Slide-over Sheet */}
      <PaymentDetailsSheet
        payment={selectedPayment}
        isOpen={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
      />
    </div>
  );
}
