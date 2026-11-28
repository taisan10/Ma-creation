"use client";

import { Badge } from "@/components/ui/badge";

export type KnownStatus =
  | "paid"
  | "refunded"
  | "created"
  | "failed"
  | "pending_review"
  | "processing"
  | "approved"
  | "rejected"
  | "cancelled"
  | "active"
  | "locked"
  | "paid_user"
  | "registered_user"
  | "admin"
  | "customer"
  | "approved_unlocked"
  | "user_banned";

interface StatusConfig {
  label: string;
  dotClass: string;
}

const STATUS_CONFIGS: Record<KnownStatus, StatusConfig> = {
  paid: {
    label: "Paid",
    dotClass: "bg-emerald-500",
  },
  refunded: {
    label: "Refunded",
    dotClass: "bg-purple-500",
  },
  created: {
    label: "Abandoned",
    dotClass: "bg-amber-500",
  },
  failed: {
    label: "Failed",
    dotClass: "bg-destructive",
  },
  pending_review: {
    label: "Pending Review",
    dotClass: "bg-amber-500",
  },
  processing: {
    label: "Processing",
    dotClass: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    dotClass: "bg-purple-500",
  },
  rejected: {
    label: "Rejected",
    dotClass: "bg-destructive",
  },
  cancelled: {
    label: "Cancelled",
    dotClass: "bg-muted-foreground",
  },
  active: {
    label: "Active",
    dotClass: "bg-emerald-500",
  },
  locked: {
    label: "Locked",
    dotClass: "bg-destructive",
  },
  paid_user: {
    label: "Paid User",
    dotClass: "bg-emerald-500",
  },
  registered_user: {
    label: "Registered User",
    dotClass: "bg-muted-foreground/60",
  },
  admin: {
    label: "Admin",
    dotClass: "bg-primary",
  },
  customer: {
    label: "Customer",
    dotClass: "bg-muted-foreground/60",
  },
  approved_unlocked: {
    label: "Approved & Unlocked",
    dotClass: "bg-emerald-500",
  },
  user_banned: {
    label: "User Banned",
    dotClass: "bg-destructive",
  },
};

export interface StatusBadgeProps {
  status: string;
  customLabel?: string;
  showDot?: boolean;
  className?: string;
}

/**
 * Decent Professional Status Badge (Neutral Outline with Subdued Indicator Dot)
 * Respects monochrome theme without harsh multi-color background fills.
 */
export function StatusBadge({
  status,
  customLabel,
  showDot = true,
  className = "",
}: StatusBadgeProps) {
  const normalizedKey = status.toLowerCase() as KnownStatus;
  const config = STATUS_CONFIGS[normalizedKey] || {
    label: customLabel || status,
    dotClass: "bg-muted-foreground",
  };

  const label = customLabel || config.label;

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1.5 text-[10px] font-normal py-0.5 px-2 text-foreground/80 border-border bg-transparent ${className}`}
    >
      {showDot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${config.dotClass}`}
        />
      )}
      <span>{label}</span>
    </Badge>
  );
}
