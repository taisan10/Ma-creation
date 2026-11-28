"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Eye, AlertTriangle } from "lucide-react";
import { useUsersIntelligence, type EnrichedUser } from "@/hooks/queries/use-users";
import { useDebounce } from "@/hooks/use-debounce";
import { exportUsersToCsv } from "@/lib/export-csv";
import { formatSafeDate, formatINR, getInitials } from "@/lib/utils";
import {
  DatePreset,
  CustomDateRange,
  filterItemsByDatePreset,
} from "@/lib/date-filters";
import { UsersKpiCards } from "@/components/users/users-kpi-cards";
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

type FilterTab = "all" | "paid" | "free" | "admin";
type SortOption = "newest" | "oldest" | "ltv";

const SORT_OPTIONS: SortOptionItem<SortOption>[] = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "ltv", label: "Highest ₹" },
];

export default function AdminUsersPage() {
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("search") || "";
    }
    return "";
  });
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customRange, setCustomRange] = useState<CustomDateRange | undefined>();
  const [selectedUser, setSelectedUser] = useState<EnrichedUser | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // TanStack Query Intelligence Hook
  const { users, summary, isLoading, isFetching, error, refetch } = useUsersIntelligence();

  // Filtered & Sorted users dataset
  const processedUsers = useMemo(() => {
    let result = [...users];

    // 1. Tab Filtering
    if (filterTab === "paid") {
      result = result.filter((u) => u.hasPaid);
    } else if (filterTab === "free") {
      result = result.filter((u) => !u.hasPaid && u.role !== "admin");
    } else if (filterTab === "admin") {
      result = result.filter((u) => u.role === "admin");
    }

    // 2. Date Filtering via Unified Date Engine
    result = filterItemsByDatePreset(result, (u) => u.createdAt, datePreset, customRange);

    // 3. Debounced Search Filtering
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((u) => {
        const name = (u.name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const phone = (u.phone || "").toLowerCase();
        const company = (u.company || "").toLowerCase();
        const interest = (u.interest || "").toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          company.includes(q) ||
          interest.includes(q)
        );
      });
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortOption === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOption === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortOption === "ltv") {
        return b.totalSpent - a.totalSpent;
      }
      return 0;
    });

    return result;
  }, [users, filterTab, datePreset, customRange, debouncedSearch, sortOption]);

  // Pagination calculations
  const totalItems = processedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedUsers = useMemo(() => {
    return processedUsers.slice(startIndex, endIndex);
  }, [processedUsers, startIndex, endIndex]);

  const handleExportCsv = () => {
    if (processedUsers.length === 0) {
      toast.error("No users to export in current filter.");
      return;
    }
    const filterSuffix = filterTab !== "all" ? `-${filterTab}` : "";
    const dateSuffix = datePreset !== "all" ? `-${datePreset}` : "";
    toast.success(`Exporting ${processedUsers.length} user records to CSV...`);
    exportUsersToCsv(processedUsers, `users${filterSuffix}${dateSuffix}`);
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
    { key: "all", label: "All Users", count: summary.totalUsers },
    { key: "paid", label: "Paid", count: summary.paidCount },
    { key: "free", label: "Registered", count: summary.registeredCount },
    { key: "admin", label: "Admins", count: summary.adminsCount },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner (Global AdminPageHeader) */}
      <AdminPageHeader
        title="Student & User Intelligence"
        description="Monitor user acquisition, paid course enrollments, customer lifetime value (LTV), and DRM security."
        onExportCsv={handleExportCsv}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      {/* Top 4 KPI Metrics */}
      <UsersKpiCards summary={summary} isLoading={isLoading} error={error} />

      {/* Search, Filter Tabs & Sorter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Search Input with Instant Clear (Global DataTableSearch) */}
        <DataTableSearch
          value={searchQuery}
          onChange={(val) => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          placeholder="Search by user, email, phone, company..."
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

      {/* Main Users Table Card */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Student / User</TableHead>
              <TableHead className="w-[180px]">Phone & Company</TableHead>
              <TableHead className="w-[140px]">Primary Interest</TableHead>
              <TableHead className="w-[120px]">Account Type</TableHead>
              <TableHead className="w-[110px]">Role</TableHead>
              <TableHead className="w-[140px]">Registered Date</TableHead>
              <TableHead className="w-[130px] text-right">Total Spent (LTV)</TableHead>
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
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-2.5 w-40" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-3 w-16 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-7 w-7 rounded ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-destructive">
                    <AlertTriangle className="h-8 w-8" />
                    <div className="font-semibold text-sm">Failed to load user intelligence records</div>
                    <p className="text-xs text-muted-foreground">{error.message}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs mt-1"
                      onClick={() => refetch()}
                    >
                      Retry Connection
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : totalItems === 0 ? (
              /* Global DataTableEmpty */
              <DataTableEmpty
                colSpan={8}
                title="No user records found"
                description={
                  searchQuery.trim()
                    ? `No users matched "${searchQuery}". Check for typos or reset your search.`
                    : `No user records under the "${filterTab}" filter.`
                }
                onReset={
                  searchQuery.trim() || filterTab !== "all" || datePreset !== "all"
                    ? resetAllFilters
                    : undefined
                }
              />
            ) : (
              paginatedUsers.map((user) => {
                const initials = getInitials(user.name);

                return (
                  <TableRow
                    key={user._id}
                    className="h-[52px] hover:bg-muted/40 transition-colors"
                  >
                    {/* User Identity Column */}
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
                            onClick={() => setSelectedUser(user)}
                            className="font-medium text-xs text-foreground hover:underline truncate text-left block max-w-[200px]"
                            title={user.name || "User"}
                          >
                            {user.name || "Customer"}
                          </button>
                          <div
                            className="text-[11px] text-muted-foreground truncate max-w-[200px]"
                            title={user.email}
                          >
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Phone & Company Column */}
                    <TableCell>
                      <div className="text-xs text-foreground">
                        {user.phone || <span className="text-muted-foreground/60">—</span>}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                        {user.company || <span className="text-muted-foreground/60">—</span>}
                      </div>
                    </TableCell>

                    {/* Primary Interest Column */}
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {user.interest || <span className="text-muted-foreground/60">—</span>}
                      </span>
                    </TableCell>

                    {/* Account Type Badge (Global StatusBadge) */}
                    <TableCell>
                      <StatusBadge
                        status={user.hasPaid ? "paid_user" : "registered_user"}
                      />
                    </TableCell>

                    {/* Role Badge (Global StatusBadge) */}
                    <TableCell>
                      <StatusBadge
                        status={user.role}
                        showDot={false}
                      />
                    </TableCell>

                    {/* Registered Date Column */}
                    <TableCell className="text-xs text-muted-foreground">
                      {formatSafeDate(user.createdAt, "dd MMM yyyy")}
                    </TableCell>

                    {/* Total Spent (LTV) Column */}
                    <TableCell className="text-right">
                      <span className="text-xs font-semibold font-sans text-foreground">
                        {formatINR(user.totalSpent)}
                      </span>
                    </TableCell>

                    {/* Inspect User 360° Profile Button */}
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setSelectedUser(user)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="View User 360° Profile"
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
        {!isLoading && totalItems > 0 && (
          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemName="users"
          />
        )}
      </Card>

      {/* Student 360° Intelligence Sheet */}
      <UserProfileSheet
        user={selectedUser}
        open={Boolean(selectedUser)}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
      />
    </div>
  );
}
