"use client";

import { ReactNode } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AdminPageHeaderProps {
  title: string;
  description?: string;
  onExportCsv?: () => void;
  exportCsvLabel?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  children?: ReactNode;
  className?: string;
}

/**
 * Decent Professional Admin Page Header
 * Standard clean typography and action buttons matching Shadcn theme.
 */
export function AdminPageHeader({
  title,
  description,
  onExportCsv,
  exportCsvLabel = "Export CSV",
  onRefresh,
  isRefreshing = false,
  children,
  className = "",
}: AdminPageHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onExportCsv && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCsv}
            className="text-xs gap-1.5 border-border bg-transparent hover:bg-muted/50"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{exportCsvLabel}</span>
          </Button>
        )}

        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-xs gap-1.5 border-border bg-transparent hover:bg-muted/50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>
        )}

        {children}
      </div>
    </div>
  );
}
