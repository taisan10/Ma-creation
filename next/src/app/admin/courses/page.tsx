"use client";

import { useState, useMemo } from "react";
import { Plus, Video, Trash2, Layers, Filter, ChevronDown, Check } from "lucide-react";
import { AdminPageHeader } from "@/components/ui/admin-page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DataTableSearch,
  DataTableFilterTabs,
  DataTableEmpty,
  DataTablePagination,
  type FilterTabItem,
} from "@/components/ui/data-table";
import { formatSafeDate } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useCourses,
  useCategories,
  useCatalogPlans,
  useCourseMutations,
  type CourseItem,
} from "@/hooks/queries/use-courses";
import { CoursesKpiCards } from "@/components/courses/courses-kpi-cards";
import { CourseDialog } from "@/components/courses/course-dialog";
import { CourseLessonsSheet } from "@/components/courses/course-lessons-sheet";
import { CategoryManagerDialog } from "@/components/courses/category-manager-dialog";

type FilterTab = "all" | "active" | "inactive";

export default function AdminCoursesPage() {
  const { data: courses = [], isLoading, isRefetching, refetch, error } = useCourses();
  const { data: categories = [] } = useCategories();
  const { data: plans = [] } = useCatalogPlans();
  const { deleteCourse } = useCourseMutations();

  // Filters & State
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Dynamic filter tabs with counts
  const filterTabs = useMemo<FilterTabItem<FilterTab>[]>(() => {
    const activeCount = courses.filter((c) => c.active).length;
    const inactiveCount = courses.filter((c) => !c.active).length;
    return [
      { key: "all", label: "All Courses", count: courses.length },
      { key: "active", label: "Published", count: activeCount },
      { key: "inactive", label: "Drafts", count: inactiveCount },
    ];
  }, [courses]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Dialog / Sheet states
  const [createOpen, setCreateOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [activeCourseForLessons, setActiveCourseForLessons] = useState<CourseItem | null>(null);

  // Filtering
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // 1. Tab filter
      if (filterTab === "active" && !course.active) return false;
      if (filterTab === "inactive" && course.active) return false;

      // 2. Category filter
      if (categoryFilter !== "all") {
        const catId = typeof course.category === "object" ? course.category?._id : course.category;
        if (catId !== categoryFilter) return false;
      }

      // 3. Search query
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const titleMatch = course.title?.toLowerCase().includes(q);
        const descMatch = course.description?.toLowerCase().includes(q);
        const catName = typeof course.category === "object" ? course.category?.name?.toLowerCase() : "";
        const planName = typeof course.plan === "object" ? course.plan?.name?.toLowerCase() : "";
        if (!titleMatch && !descMatch && !catName?.includes(q) && !planName?.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [courses, filterTab, categoryFilter, debouncedSearch]);

  const totalPages = Math.ceil(filteredCourses.length / pageSize) || 1;
  const paginatedCourses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCourses.slice(start, start + pageSize);
  }, [filteredCourses, page, pageSize]);

  const handleDeleteCourse = async (course: CourseItem) => {
    if (confirm(`Are you sure you want to delete course "${course.title}"? Associated video streams will be removed.`)) {
      try {
        await deleteCourse.mutateAsync(course._id);
        if (activeCourseForLessons?._id === course._id) {
          setActiveCourseForLessons(null);
        }
      } catch {
        // Handled in mutation hook
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title="Courses & Video Studio"
        description="Organize curricula, link paid plans for student access, and stream AES-128 HLS lessons."
        onRefresh={() => refetch()}
        isRefreshing={isRefetching}
      >
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs font-medium gap-1.5"
          onClick={() => setCategoryManagerOpen(true)}
        >
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          Categories
        </Button>
        <Button
          size="sm"
          className="h-8 text-xs font-medium gap-1.5"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Create Course
        </Button>
      </AdminPageHeader>

      {/* KPI Cards */}
      <CoursesKpiCards
        courses={courses}
        categories={categories}
        plans={plans}
        isLoading={isLoading}
        error={error as Error | null}
      />

      {/* Search, Filter Tabs & Category Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Search Input with Instant Clear (Global DataTableSearch) */}
        <DataTableSearch
          value={searchQuery}
          onChange={(q) => {
            setSearchQuery(q);
            setPage(1);
          }}
          placeholder="Search curriculum, lessons, or plans…"
          className="w-full lg:w-80"
        />

        {/* Filters and Category Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs with Clean Count Pills */}
          <DataTableFilterTabs
            tabs={filterTabs}
            activeTab={filterTab}
            onChange={(tab) => {
              setFilterTab(tab);
              setPage(1);
            }}
          />

          {/* Clean Enterprise Category Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 text-xs font-normal border-border bg-transparent hover:bg-muted/50"
                >
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>
                    Category: {categoryFilter === "all" ? "All" : categories.find((c) => c._id === categoryFilter)?.name || "All"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-52 text-xs">
              <DropdownMenuItem
                onClick={() => {
                  setCategoryFilter("all");
                  setPage(1);
                }}
                className="flex items-center justify-between cursor-pointer text-xs"
              >
                <span>All Categories</span>
                {categoryFilter === "all" && <Check className="h-3.5 w-3.5 text-foreground ml-auto" />}
              </DropdownMenuItem>
              {categories.map((cat) => (
                <DropdownMenuItem
                  key={cat._id}
                  onClick={() => {
                    setCategoryFilter(cat._id);
                    setPage(1);
                  }}
                  className="flex items-center justify-between cursor-pointer text-xs"
                >
                  <span className="truncate">{cat.name}</span>
                  {categoryFilter === cat._id && <Check className="h-3.5 w-3.5 text-foreground ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Courses Table Card */}
      <Card className="overflow-hidden border-border/60">
        <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold">Course Curriculum</TableHead>
                <TableHead className="text-xs font-semibold">Category</TableHead>
                <TableHead className="text-xs font-semibold">Linked Plan</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold">Created</TableHead>
                <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-7 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedCourses.length === 0 ? (
                <DataTableEmpty
                  title="No courses found"
                  description={
                    searchQuery || categoryFilter !== "all"
                      ? "Try adjusting your search query or category filter."
                      : "Get started by creating your first course curriculum."
                  }
                  colSpan={6}
                  onReset={
                    searchQuery || categoryFilter !== "all" || filterTab !== "all"
                      ? () => {
                          setSearchQuery("");
                          setCategoryFilter("all");
                          setFilterTab("all");
                        }
                      : undefined
                  }
                  resetLabel="Clear Filters"
                />
              ) : (
                paginatedCourses.map((course) => {
                  const catName = typeof course.category === "object" ? course.category?.name : "General";
                  const planName = typeof course.plan === "object" ? course.plan?.name : "Linked Plan";
                  const planPrice = typeof course.plan === "object" ? course.plan?.price : undefined;

                  return (
                    <TableRow key={course._id} className="transition-colors hover:bg-muted/40">
                      {/* Title & Description */}
                      <TableCell className="max-w-[300px]">
                        <div className="font-medium text-sm text-foreground truncate">
                          {course.title}
                        </div>
                        {course.description && (
                          <div className="text-xs text-muted-foreground truncate mt-0.5">
                            {course.description}
                          </div>
                        )}
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
                          {catName}
                        </Badge>
                      </TableCell>

                      {/* Linked Plan */}
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] font-mono font-normal tracking-wide text-muted-foreground">
                          {planName} {planPrice ? `(₹${planPrice.toLocaleString("en-IN")})` : ""}
                        </Badge>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {course.active ? (
                          <Badge variant="outline" className="text-[10px] font-normal tracking-wide text-muted-foreground gap-1">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-normal tracking-wide text-muted-foreground gap-1">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                            Draft
                          </Badge>
                        )}
                      </TableCell>

                      {/* Created Date */}
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {formatSafeDate(course.createdAt, "dd MMM yyyy")}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2.5 gap-1.5 font-medium text-foreground hover:bg-muted/50"
                            onClick={() => setActiveCourseForLessons(course)}
                          >
                            <Video className="h-3 w-3 text-muted-foreground" />
                            Manage Lessons
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive transition-colors"
                            onClick={() => handleDeleteCourse(course)}
                            disabled={deleteCourse.isPending}
                            title="Delete course"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

        {/* Global Pagination Bar */}
        {filteredCourses.length > pageSize && (
          <DataTablePagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={filteredCourses.length}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemName="courses"
          />
        )}
      </Card>

      {/* Create Course Dialog */}
      <CourseDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Category Manager Dialog */}
      <CategoryManagerDialog
        open={categoryManagerOpen}
        onOpenChange={setCategoryManagerOpen}
      />

      {/* Course Lessons Slide-over Sheet */}
      <CourseLessonsSheet
        course={activeCourseForLessons}
        open={Boolean(activeCourseForLessons)}
        onOpenChange={(open) => !open && setActiveCourseForLessons(null)}
      />
    </div>
  );
}
