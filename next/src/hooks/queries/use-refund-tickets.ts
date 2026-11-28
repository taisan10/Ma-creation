"use client";

import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";

export type RefundStatus =
  | "pending_review"
  | "processing"
  | "approved"
  | "rejected"
  | "cancelled";

export interface RefundUser {
  _id: string;
  name?: string;
  email: string;
  phone?: string;
  company?: string;
}

export interface RefundPlan {
  _id: string;
  name: string;
  price?: number;
}

export interface RefundPayment {
  _id: string;
  razorpayOrderId?: string;
  createdAt: string;
  amount: number;
}

export interface RefundTicket {
  _id: string;
  user: RefundUser;
  payment: RefundPayment;
  plan: RefundPlan;
  amount: number;
  currency: string;
  razorpayPaymentId: string;
  reason: string;
  status: RefundStatus;
  adminNotes?: string | null;
  razorpayRefundId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RefundsApiResponse {
  success: boolean;
  tickets: RefundTicket[];
}

export interface RefundStats {
  totalTickets: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalRefundedAmount: number;
}

/**
 * Enterprise Query Hook for LMS & Course Refund Requests.
 * Caches for 30s with keepPreviousData for zero layout shift.
 */
export function useRefundTickets() {
  const query = useQuery<RefundsApiResponse>({
    queryKey: adminKeys.refunds(),
    queryFn: () => api<RefundsApiResponse>("/admin/refunds"),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

  const tickets = useMemo(() => query.data?.tickets || [], [query.data?.tickets]);

  const stats: RefundStats = useMemo(() => {
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let totalRefundedAmount = 0;

    for (const t of tickets) {
      if (t.status === "pending_review" || t.status === "processing") {
        pendingCount++;
      } else if (t.status === "approved") {
        approvedCount++;
        totalRefundedAmount += t.amount || 0;
      } else if (t.status === "rejected") {
        rejectedCount++;
      }
    }

    return {
      totalTickets: tickets.length,
      pendingCount,
      approvedCount,
      rejectedCount,
      totalRefundedAmount,
    };
  }, [tickets]);

  return {
    ...query,
    tickets,
    stats,
  };
}

export { useRefundActions } from "@/hooks/mutations/use-refund-actions";
