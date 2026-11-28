"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Eye,
  Copy,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { usePayments } from "@/hooks/queries/use-payments";
import { useRefundTickets } from "@/hooks/queries/use-refund-tickets";
import { useUsersIntelligence, type EnrichedUser } from "@/hooks/queries/use-users";
import { useDebounce } from "@/hooks/use-debounce";
import { formatSafeDate, formatINR, getInitials } from "@/lib/utils";
import { exportPaymentsToCsv } from "@/lib/export-payments-csv";
import { filterItemsByDatePreset, type DatePreset, type CustomDateRange } from "@/lib/date-filters";
import { PaymentsKpiCards } from "@/components/payments/payments-kpi-cards";
import { PaymentDetailsSheet } from "@/components/payments/payment-details-sheet";
import { RefundReviewSheet } from "@/components/payments/refund-review-sheet";
import { UserProfileSheet } from "@/components/users/user-profile-sheet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { DatePresetFilter } from "@/components/ui/date-preset-filter";
import {
  DataTablePagination,
  DataTableSearch,
  DataTableSort,
  DataTableEmpty,
  DataTableFilterTabs,
  type SortOptionItem,
  type FilterTabItem,
} from "@/components/ui/data-table";

type FilterTab = "all" | "paid" | "created" | "failed" | "refunds";
type SortOption = "newest" | "oldest" | "amount_high" | "amount_low";

const SORT_OPTIONS: SortOptionItem<SortOption>[] = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "amount_high", label: "Highest ₹" },
  { key: "amount_low", label: "Lowest ₹" },
];

export default function AdminPaymentsPage() {
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customRange, setCustomRange] = useState<CustomDateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedRefundTicketId, setSelectedRefundTicketId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // TanStack Query Intelligence Hooks
  const { payments, summary, isLoading, isFetching, error, refetch } = usePayments();
  const {
    tickets: refundTickets,
    stats: refundStats,
    isLoading: isRefundsLoading,
    isFetching: isRefundsFetching,
    error: refundsError,
    refetch: refetchRefunds,
  } = useRefundTickets();

  // Users Hook for Student 360° Profile inspection
  const { users } = useUsersIntelligence();
  const selectedStudentUser = useMemo(
    () => (selectedStudentId ? users.find((u: EnrichedUser) => u._id === selectedStudentId) || null : null),
    [users, selectedStudentId]
  );

  // Reactive Sheet Selectors (Always live & synced with TanStack Query cache)
  const activePayment = useMemo(
    () => (selectedPaymentId ? payments.find((p) => p._id === selectedPaymentId) || null : null),
    [payments, selectedPaymentId]
  );

  const activeRefundTicket = useMemo(
    () =>
      selectedRefundTicketId
        ? refundTickets.find((t) => t._id === selectedRefundTicketId) || null
        : null,
    [refundTickets, selectedRefundTicketId]
  );

  const activeRefundStudentUser = useMemo(() => {
    if (!activeRefundTicket?.user?._id) return null;
    return users.find((u: EnrichedUser) => u._id === activeRefundTicket.user._id) || null;
  }, [users, activeRefundTicket]);

  const isRefundsTab = filterTab === "refunds";

  // Filtered & Sorted Payments dataset
  const processedPayments = useMemo(() => {
    let result = [...payments];

    // 1. Tab Filtering
    if (filterTab !== "all" && filterTab !== "refunds") {
      result = result.filter((p) => p.status === filterTab);
    }

    // 2. Date Filtering via Unified Date Engine
    result = filterItemsByDatePreset(result, (p) => p.createdAt, datePreset, customRange);

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
  }, [payments, filterTab, datePreset, customRange, debouncedSearch, sortOption]);

  // Filtered & Sorted Refund Tickets dataset
  const processedRefunds = useMemo(() => {
    let result = [...refundTickets];

    // Date Filtering via Unified Date Engine
    result = filterItemsByDatePreset(result, (t) => t.createdAt, datePreset, customRange);

    // Search Filtering
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter((t) => {
        const name = (t.user?.name || "").toLowerCase();
        const email = (t.user?.email || "").toLowerCase();
        const phone = (t.user?.phone || "").toLowerCase();
        const plan = (t.plan?.name || "").toLowerCase();
        const reason = (t.reason || "").toLowerCase();
        const payId = (t.razorpayPaymentId || "").toLowerCase();
        const orderId = (t.payment?.razorpayOrderId || "").toLowerCase();

        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          plan.includes(q) ||
          reason.includes(q) ||
          payId.includes(q) ||
          orderId.includes(q)
        );
      });
    }

    // Sorting
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
  }, [refundTickets, datePreset, customRange, debouncedSearch, sortOption]);

  // Unified pagination calculations
  const totalItems = isRefundsTab ? processedRefunds.length : processedPayments.length;
  const isTableLoading = isRefundsTab ? isRefundsLoading : isLoading;
  const isTableFetching = isRefundsTab ? isRefundsFetching : isFetching;
  const tableError = isRefundsTab ? refundsError : error;
  const handleRefetchTable = isRefundsTab ? refetchRefunds : refetch;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedPayments = useMemo(() => {
    return processedPayments.slice(startIndex, endIndex);
  }, [processedPayments, startIndex, endIndex]);

  const paginatedRefunds = useMemo(() => {
    return processedRefunds.slice(startIndex, endIndex);
  }, [processedRefunds, startIndex, endIndex]);

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
    setCustomRange(undefined);
    setSortOption("newest");
    setCurrentPage(1);
  };

  const filterTabs: FilterTabItem<FilterTab>[] = [
    { key: "all", label: "All", count: summary.totalOrders },
    { key: "paid", label: "Paid", count: summary.paidCount },
    { key: "created", label: "Abandoned", count: summary.abandonedCount },
    { key: "failed", label: "Failed", count: summary.failedCount },
    {
      key: "refunds",
      label: "Refunds",
      count: refundStats.pendingCount,
      hasAlert: refundStats.pendingCount > 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner (Global AdminPageHeader) */}
      <AdminPageHeader
        title="Payments & Order Records"
        description="Audit Razorpay transaction settlements, order IDs, and follow up with abandoned checkouts."
        onExportCsv={handleExportCsv}
        onRefresh={handleRefetchTable}
        isRefreshing={isTableFetching}
      />

      {/* Top 4 KPI Metrics */}
      <PaymentsKpiCards summary={summary} isLoading={isLoading} error={error} />

      {/* Search, Filter Tabs & Sorter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Search Input with Instant Clear (Global DataTableSearch) */}
        <DataTableSearch
          value={searchQuery}
          onChange={(val) => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          placeholder={
            isRefundsTab
              ? "Search student, email, plan, refund ID..."
              : "Search customer, email, plan, razorpay ID..."
          }
        />

        {/* Filters and Sorters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs with Clean Count Pills (Global DataTableFilterTabs) */}
          <DataTableFilterTabs
            tabs={filterTabs}
            activeTab={filterTab}
            onChange={(key) => {
              setFilterTab(key);
              setCurrentPage(1);
            }}
          />

          {/* Unified Date Preset Filter (Global DatePresetFilter) */}
          <DatePresetFilter
            value={datePreset}
            onChange={(preset) => {
              setDatePreset(preset);
              setCurrentPage(1);
            }}
            customRange={customRange}
            onCustomRangeChange={(range) => {
              setCustomRange(range);
              setCurrentPage(1);
            }}
          />

          {/* Sorter Dropdown (Global DataTableSort) */}
          <DataTableSort
            value={sortOption}
            onChange={setSortOption}
            options={SORT_OPTIONS}
          />
        </div>
      </div>

      {/* Main Payments Table Card */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            {isRefundsTab ? (
              <TableRow>
                <TableHead className="w-[240px]">Student</TableHead>
                <TableHead className="w-[180px]">Plan / Course</TableHead>
                <TableHead className="w-[120px]">Refund Amount</TableHead>
                <TableHead className="w-[230px]">Student Reason</TableHead>
                <TableHead className="w-[140px]">Status</TableHead>
                <TableHead className="w-[150px]">Date Raised</TableHead>
                <TableHead className="text-right w-[80px]">Action</TableHead>
              </TableRow>
            ) : (
              <TableRow>
                <TableHead className="w-[260px]">Customer</TableHead>
                <TableHead className="w-[190px]">Plan / Course</TableHead>
                <TableHead className="w-[190px]">Gateway Ref</TableHead>
                <TableHead className="w-[130px]">Status</TableHead>
                <TableHead className="w-[150px]">Date</TableHead>
                <TableHead className="w-[130px] text-right">Payment</TableHead>
                <TableHead className="text-right w-[60px]">Actions</TableHead>
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {isTableLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="h-[52px]">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-2.5 w-36" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3.5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3.5 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3.5 w-20" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-3.5 w-16 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-7 w-7 rounded ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : tableError ? (
              <TableRow>
                <TableCell colSpan={7} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-destructive">
                    <AlertTriangle className="h-8 w-8" />
                    <div className="font-semibold text-sm">Failed to load records from gateway</div>
                    <p className="text-xs text-muted-foreground">{tableError.message}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs mt-1"
                      onClick={() => handleRefetchTable()}
                      disabled={isTableFetching}
                    >
                      Retry Connection
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : totalItems === 0 ? (
              /* Global DataTableEmpty */
              <DataTableEmpty
                colSpan={7}
                title={isRefundsTab ? "No refund requests found" : "No payment records found"}
                description={
                  searchQuery.trim()
                    ? `No records matched "${searchQuery}". Check for typos or reset your search.`
                    : isRefundsTab
                    ? "All student course enrollments are in good standing. No pending tickets."
                    : `No payment records under the "${filterTab}" filter.`
                }
                onReset={
                  searchQuery.trim() || filterTab !== "all" || datePreset !== "all"
                    ? resetAllFilters
                    : undefined
                }
              />
            ) : isRefundsTab ? (
              paginatedRefunds.map((ticket) => {
                const studentName = ticket.user?.name || "Student";
                const studentEmail = ticket.user?.email || "—";
                const planName = ticket.plan?.name || "Training Plan";
                const initials = getInitials(studentName);

                return (
                  <TableRow
                    key={ticket._id}
                    className="h-[52px] hover:bg-muted/40 transition-colors"
                  >
                    {/* Student */}
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
                            onClick={() => {
                              if (ticket.user?._id) setSelectedStudentId(ticket.user._id);
                            }}
                            className="font-medium text-xs text-foreground hover:underline truncate text-left block max-w-[180px]"
                            title="View student 360 profile"
                          >
                            {studentName}
                          </button>
                          <div
                            className="text-[11px] text-muted-foreground truncate max-w-[180px]"
                            title={studentEmail}
                          >
                            {studentEmail}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Plan */}
                    <TableCell>
                      <span className="font-medium text-xs text-foreground line-clamp-1" title={planName}>
                        {planName}
                      </span>
                    </TableCell>

                    {/* Amount */}
                    <TableCell>
                      <span className="font-semibold text-xs font-sans text-foreground">
                        {formatINR(ticket.amount)}
                      </span>
                    </TableCell>

                    {/* Reason */}
                    <TableCell>
                      <p className="text-xs text-muted-foreground line-clamp-2 max-w-[220px]" title={ticket.reason}>
                        {ticket.reason}
                      </p>
                    </TableCell>

                    {/* Status Badge (Global StatusBadge) */}
                    <TableCell>
                      <StatusBadge status={ticket.status} />
                    </TableCell>

                    {/* Date Raised */}
                    <TableCell className="text-xs text-muted-foreground">
                      {formatSafeDate(ticket.createdAt, "dd MMM yyyy, hh:mm a")}
                    </TableCell>

                    {/* Action Button */}
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRefundTicketId(ticket._id)}
                        className="h-7 text-xs px-2.5 gap-1 font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Review</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              paginatedPayments.map((p) => {
                const planName =
                  typeof p.plan === "object" && p.plan?.name ? p.plan.name : "Custom Plan";
                const customerName =
                  p.name || (typeof p.user === "object" ? p.user?.name : "") || "Customer";
                const customerEmail =
                  p.email || (typeof p.user === "object" ? p.user?.email : "") || "—";
                const initials = getInitials(customerName);

                return (
                  <TableRow
                    key={p._id}
                    className="h-[52px] hover:bg-muted/40 transition-colors"
                  >
                    {/* Customer Identity */}
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
                            onClick={() => {
                              const userId = typeof p.user === "object" ? p.user?._id : p.user;
                              if (userId) setSelectedStudentId(userId);
                            }}
                            className="font-medium text-xs text-foreground hover:underline truncate text-left block max-w-[190px]"
                            title="Inspect Student Profile"
                          >
                            {customerName}
                          </button>
                          <div
                            className="text-[11px] text-muted-foreground truncate max-w-[190px]"
                            title={customerEmail}
                          >
                            {customerEmail}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Plan */}
                    <TableCell>
                      <span className="font-medium text-xs text-foreground line-clamp-1" title={planName}>
                        {planName}
                      </span>
                    </TableCell>

                    {/* Gateway Ref */}
                    <TableCell>
                      {p.razorpayPaymentId ? (
                        <div className="flex items-center gap-1.5 group">
                          <span
                            className="font-mono text-[11px] text-muted-foreground truncate max-w-[130px]"
                            title={p.razorpayPaymentId}
                          >
                            {p.razorpayPaymentId}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(p.razorpayPaymentId!, "Payment ID")}
                            className="text-muted-foreground/60 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy Payment ID"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      ) : p.razorpayOrderId ? (
                        <div className="flex items-center gap-1.5 group">
                          <span
                            className="font-mono text-[11px] text-muted-foreground/80 truncate max-w-[130px]"
                            title={p.razorpayOrderId}
                          >
                            {p.razorpayOrderId}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(p.razorpayOrderId!, "Order ID")}
                            className="text-muted-foreground/60 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy Order ID"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">—</span>
                      )}
                    </TableCell>

                    {/* Status Badge (Global StatusBadge) */}
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-xs text-muted-foreground">
                      {formatSafeDate(p.createdAt, "dd MMM yyyy, hh:mm a")}
                    </TableCell>

                    {/* Payment Amount */}
                    <TableCell className="text-right">
                      <span className="text-xs font-semibold font-sans text-foreground">
                        {formatINR(p.amount)}
                      </span>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setSelectedPaymentId(p._id)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="View Payment Breakdown"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Global Pagination Bar */}
        {!isTableLoading && totalItems > 0 && (
          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemName={isRefundsTab ? "refund requests" : "payments"}
          />
        )}
      </Card>

      {/* Transaction Details Inspector Sheet */}
      <PaymentDetailsSheet
        payment={activePayment}
        open={Boolean(activePayment)}
        onOpenChange={(open) => {
          if (!open) setSelectedPaymentId(null);
        }}
      />

      {/* Refund Decision Sheet */}
      <RefundReviewSheet
        ticket={activeRefundTicket}
        studentUser={activeRefundStudentUser}
        open={Boolean(activeRefundTicket)}
        onOpenChange={(open) => {
          if (!open) setSelectedRefundTicketId(null);
        }}
        onViewStudent={(studentId) => {
          setSelectedStudentId(studentId);
        }}
      />

      {/* Student 360° Intelligence Sheet */}
      <UserProfileSheet
        user={selectedStudentUser}
        open={Boolean(selectedStudentUser)}
        onOpenChange={(open) => {
          if (!open) setSelectedStudentId(null);
        }}
      />
    </div>
  );
}
