"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Users,
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
  AlertTriangle,
} from "lucide-react";
import { useUsersIntelligence, type EnrichedUser } from "@/hooks/queries/use-users";
import { useDebounce } from "@/hooks/use-debounce";
import { exportUsersToCsv } from "@/lib/export-csv";
import { formatSafeDate } from "@/lib/utils";
import { UsersKpiCards } from "@/components/users/users-kpi-cards";
import { UserProfileSheet } from "@/components/users/user-profile-sheet";
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

type FilterTab = "all" | "paid" | "free" | "admin";
type SortOption = "newest" | "oldest" | "ltv";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  oldest: "Oldest",
  ltv: "Highest ₹",
};

export default function AdminUsersPage() {
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("search") || "";
    }
    return "";
  });
  const [sortOption, setSortOption] = useState<SortOption>("newest");
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

    // 2. Debounced Search Filtering
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
  }, [users, filterTab, debouncedSearch, sortOption]);

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
    toast.success(`Exporting ${processedUsers.length} user records to CSV...`);
    exportUsersToCsv(processedUsers, `users-${filterTab}`);
  };

  const resetAllFilters = () => {
    setSearchQuery("");
    setFilterTab("all");
    setSortOption("newest");
    setCurrentPage(1);
  };

  const filterTabs = [
    { key: "all" as const, label: "All Users", count: summary.totalUsers },
    { key: "paid" as const, label: "Paid Users", count: summary.paidCount },
    { key: "free" as const, label: "Registered Users", count: summary.registeredCount },
    { key: "admin" as const, label: "Admins", count: summary.adminsCount },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            User & Customer Intelligence
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Explore user accounts, purchase histories, and WhatsApp communication shortcuts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={isLoading || Boolean(error) || processedUsers.length === 0}
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

      {/* Top 4 KPI Metrics */}
      <UsersKpiCards summary={summary} isLoading={isLoading} error={error} />

      {/* Search, Filter Tabs & Sorter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Search Input with Instant Clear */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by user, email, phone, company..."
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
          <div className="flex flex-wrap items-center gap-1 border rounded-lg bg-muted/40 p-1">
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

      {/* Main Users Table Card (Swapped Customer Type & Lifetime Value) */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">User Account</TableHead>
              <TableHead className="w-[240px]">Contact Info</TableHead>
              <TableHead className="w-[200px]">Company & Interest</TableHead>
              <TableHead className="w-[150px]">Customer Type</TableHead>
              <TableHead className="w-[130px] text-right">Lifetime Value</TableHead>
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
                  <TableCell><Skeleton className="h-3.5 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-3.5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-3.5 w-16 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-7 w-7 ml-auto rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="h-56 text-center">
                  <div className="flex flex-col items-center justify-center gap-2.5 max-w-sm mx-auto py-6">
                    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="font-semibold text-sm text-foreground">
                      Failed to load user accounts
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {error instanceof Error
                        ? error.message
                        : "An unexpected network or server error occurred while retrieving user records."}
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
            ) : paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-52 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto py-6">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <SearchX className="h-5 w-5" />
                    </div>
                    <div className="font-semibold text-sm">No user accounts found</div>
                    <p className="text-xs text-muted-foreground text-center">
                      {searchQuery.trim()
                        ? `No account records matched "${searchQuery}". Check for typos or reset your search.`
                        : `No user accounts found under the "${filterTab}" filter.`}
                    </p>
                    {(searchQuery.trim() || filterTab !== "all") && (
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
              paginatedUsers.map((user) => {
                const initials = (user.name || user.email || "U")
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <TableRow
                    key={user._id}
                    className="h-[52px] hover:bg-muted/40 transition-colors"
                  >
                    {/* User Name & Avatar */}
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
                            className="font-semibold text-xs text-foreground hover:underline text-left truncate block max-w-[190px]"
                            title={user.name || user.email}
                          >
                            {user.name || "User Account"}
                          </button>
                          <div className="text-[11px] text-muted-foreground">
                            Joined {formatSafeDate(user.createdAt, "MMM dd, yyyy")}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact Info (Clean Standard Typography) */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="text-xs font-medium text-foreground truncate max-w-[200px]" title={user.email}>
                          {user.email}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {user.phone || "—"}
                        </div>
                      </div>
                    </TableCell>

                    {/* Company / Primary Interest (Clean Standard Typography) */}
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <div className="font-medium text-foreground truncate max-w-[180px]">
                          {user.company || "Individual Learner"}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                          {user.interest?.trim() || "Not specified"}
                        </div>
                      </div>
                    </TableCell>

                    {/* Customer Status (Swapped to Column 4) */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 flex-nowrap">
                        <Badge variant="outline" className="gap-1 text-[10px] font-normal py-0.5">
                          {user.hasPaid ? (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Paid User
                            </>
                          ) : (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                              Registered
                            </>
                          )}
                        </Badge>
                        {user.role === "admin" && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-normal">
                            Admin
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Lifetime Value (Swapped to Column 5, Right-Aligned Standard Font) */}
                    <TableCell className="text-right">
                      <div className="text-xs font-semibold text-foreground">
                        {user.totalSpent > 0 ? `₹${user.totalSpent.toLocaleString("en-IN")}` : "—"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {user.paymentsCount > 0 ? `${user.paymentsCount} orders` : "0 orders"}
                      </div>
                    </TableCell>

                    {/* Actions (Direct View Profile Icon Button) */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="View 360° Profile"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View 360° Profile</span>
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
              <span className="font-medium text-foreground">{totalItems}</span> users
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

      {/* 360° Customer Profile Slide-over Sheet */}
      <UserProfileSheet
        user={selectedUser}
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}
