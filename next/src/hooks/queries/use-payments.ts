"use client";

import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";

export interface PaymentUser {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
}

export interface PaymentPlan {
  _id: string;
  name: string;
  price?: number;
}

export interface PaymentRecord {
  _id: string;
  user?: PaymentUser | string;
  plan?: PaymentPlan | string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;
  currency: string;
  status: "created" | "paid" | "failed";
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentsSummary {
  totalRevenue: number;
  totalOrders: number;
  paidCount: number;
  abandonedCount: number;
  failedCount: number;
  averageOrderValue: number;
  conversionRate: string;
}

interface PaymentsApiResponse {
  success: boolean;
  payments: PaymentRecord[];
}

/**
 * Enterprise Hook: Fetches and calculates financial intelligence for Payments.
 * Caches for 30s with keepPreviousData for zero UI flickering.
 */
export function usePayments() {
  const query = useQuery<PaymentsApiResponse>({
    queryKey: adminKeys.payments(),
    queryFn: () => api<PaymentsApiResponse>("/admin/payments"),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

  const payments = useMemo<PaymentRecord[]>(() => {
    return query.data?.payments || [];
  }, [query.data?.payments]);

  const summary = useMemo<PaymentsSummary>(() => {
    const totalOrders = payments.length;
    let totalRevenue = 0;
    let paidCount = 0;
    let abandonedCount = 0;
    let failedCount = 0;

    payments.forEach((p) => {
      if (p.status === "paid") {
        totalRevenue += p.amount || 0;
        paidCount++;
      } else if (p.status === "created") {
        abandonedCount++;
      } else if (p.status === "failed") {
        failedCount++;
      }
    });

    const averageOrderValue = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;
    const rate = totalOrders > 0 ? ((paidCount / totalOrders) * 100).toFixed(1) : "0.0";

    return {
      totalRevenue,
      totalOrders,
      paidCount,
      abandonedCount,
      failedCount,
      averageOrderValue,
      conversionRate: `${rate}%`,
    };
  }, [payments]);

  return {
    payments,
    summary,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
