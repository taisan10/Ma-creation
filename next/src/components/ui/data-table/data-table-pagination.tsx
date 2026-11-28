"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number | ((prev: number) => number)) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  className?: string;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  itemName = "records",
  className = "",
}: DataTablePaginationProps) {
  if (totalItems <= 0) return null;

  const safeCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-muted/10 text-xs ${className}`}
    >
      <div className="text-muted-foreground">
        Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
        <span className="font-medium text-foreground">{endIndex}</span> of{" "}
        <span className="font-medium text-foreground">{totalItems}</span> {itemName}
      </div>

      <div className="flex items-center gap-3">
        {/* Rows per page selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Rows:</span>
          {pageSizeOptions.map((size) => (
            <Button
              key={size}
              variant={pageSize === size ? "secondary" : "ghost"}
              size="sm"
              className="h-6 w-7 p-0 text-xs font-normal"
              onClick={() => {
                onPageSizeChange(size);
                onPageChange(1);
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
            onClick={() => onPageChange((p) => Math.max(1, p - 1))}
            title="Previous Page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground px-1 font-sans">
            Page <span className="font-medium text-foreground">{safeCurrentPage}</span> of{" "}
            <span className="font-medium text-foreground">{Math.max(1, totalPages)}</span>
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            className="h-7 w-7"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
            title="Next Page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
