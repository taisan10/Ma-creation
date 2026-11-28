"use client";

import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";

export interface DataTableEmptyProps {
  title?: string;
  description?: string;
  onReset?: () => void;
  resetLabel?: string;
  colSpan?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

export function DataTableEmpty({
  title = "No records found",
  description = "No matching records found for the current search or filters.",
  onReset,
  resetLabel = "Reset Filters",
  colSpan = 7,
  icon: Icon = SearchX,
}: DataTableEmptyProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-52 text-center">
        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto py-6">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Icon className="h-5 w-5" />
          </div>
          <div className="font-semibold text-sm">{title}</div>
          <p className="text-xs text-muted-foreground text-center">{description}</p>
          {onReset && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs mt-1"
              onClick={onReset}
            >
              {resetLabel}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
