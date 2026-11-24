import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Grid Skeleton Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-5 border rounded-xl space-y-3 bg-card">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-20 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        ))}
      </div>

      {/* Main Table / Content Skeleton */}
      <div className="border rounded-xl p-6 bg-card space-y-4">
        <Skeleton className="h-6 w-36 rounded" />
        <Skeleton className="h-[280px] w-full rounded-lg" />
      </div>
    </div>
  );
}
