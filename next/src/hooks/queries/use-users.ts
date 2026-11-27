"use client";

import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";

export interface RawUser {
  _id: string;
  name?: string;
  email: string;
  phone?: string;
  company?: string;
  role: string;
  interest?: string;
  isActive?: boolean;
  playbackLocked?: boolean;
  recordingStrikes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RawPaymentPlan {
  _id: string;
  name: string;
}

export interface RawPaymentUser {
  _id: string;
}

export interface RawPayment {
  _id: string;
  user?: RawPaymentUser | string;
  plan?: RawPaymentPlan | string;
  amount: number;
  status: "created" | "paid" | "failed";
  createdAt: string;
}

export interface UserTransaction {
  _id: string;
  planName: string;
  amount: number;
  status: "created" | "paid" | "failed";
  createdAt: string;
}

export interface EnrichedUser extends RawUser {
  hasPaid: boolean;
  totalSpent: number;
  paymentsCount: number;
  purchasedPlans: string[];
  transactions: UserTransaction[];
}

export interface UsersIntelligenceSummary {
  totalUsers: number;
  paidCount: number;
  registeredCount: number;
  adminsCount: number;
  conversionRate: string;
  totalRevenue: number;
}

interface UsersApiResponse {
  success: boolean;
  users: RawUser[];
}

interface PaymentsApiResponse {
  success: boolean;
  payments: RawPayment[];
}

/**
 * Enterprise Hook: Cross-references Users & Payments in memory.
 * Features:
 * - Computes LTV (Lifetime Value) & Purchased Courses
 * - Clean classification: Paid Users vs Registered Users
 * - 30s freshness window + keepPreviousData
 */
export function useUsersIntelligence() {
  // 1. Fetch Users List
  const usersQuery = useQuery<UsersApiResponse>({
    queryKey: adminKeys.users(),
    queryFn: () => api<UsersApiResponse>("/admin/users"),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

  // 2. Fetch Payments List
  const paymentsQuery = useQuery<PaymentsApiResponse>({
    queryKey: adminKeys.payments(),
    queryFn: () => api<PaymentsApiResponse>("/admin/payments"),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

  // 3. High-performance client-side hash map merge (O(N + M))
  const enrichedUsers = useMemo<EnrichedUser[]>(() => {
    const rawUsers = usersQuery.data?.users || [];
    const rawPayments = paymentsQuery.data?.payments || [];

    // Map payments by userId
    const paymentsByUser = new Map<string, RawPayment[]>();
    rawPayments.forEach((payment) => {
      if (payment.status !== "paid") return;
      const uid =
        typeof payment.user === "object" && payment.user?._id
          ? payment.user._id
          : String(payment.user || "");
      if (!uid) return;

      const existing = paymentsByUser.get(uid) || [];
      existing.push(payment);
      paymentsByUser.set(uid, existing);
    });

    return rawUsers.map((user) => {
      const userPayments = paymentsByUser.get(user._id) || [];
      const totalSpent = userPayments.reduce(
        (sum, p) => sum + (p.amount || 0),
        0,
      );
      const plansList = userPayments
        .map((p) =>
          typeof p.plan === "object" && p.plan?.name
            ? p.plan.name
            : "Custom Plan",
        )
        .filter(Boolean);

      const uniquePlans = Array.from(new Set(plansList));
      const hasPaid = totalSpent > 0 || userPayments.length > 0;

      const transactions: UserTransaction[] = userPayments.map((p) => ({
        _id: p._id,
        planName: typeof p.plan === "object" && p.plan?.name ? p.plan.name : "Custom Plan",
        amount: p.amount || 0,
        status: p.status,
        createdAt: p.createdAt,
      }));

      return {
        ...user,
        hasPaid,
        totalSpent,
        paymentsCount: userPayments.length,
        purchasedPlans: uniquePlans,
        transactions,
      };
    });
  }, [usersQuery.data?.users, paymentsQuery.data?.payments]);

  // 4. Executive KPI Summary calculations
  const summary = useMemo<UsersIntelligenceSummary>(() => {
    const totalUsers = enrichedUsers.length;
    const paidCount = enrichedUsers.filter((u) => u.hasPaid).length;
    const registeredCount = enrichedUsers.filter(
      (u) => !u.hasPaid && u.role !== "admin",
    ).length;
    const adminsCount = enrichedUsers.filter((u) => u.role === "admin").length;
    const totalRevenue = enrichedUsers.reduce(
      (sum, u) => sum + u.totalSpent,
      0,
    );

    const rate =
      totalUsers > 0 ? ((paidCount / totalUsers) * 100).toFixed(1) : "0.0";

    return {
      totalUsers,
      paidCount,
      registeredCount,
      adminsCount,
      conversionRate: `${rate}%`,
      totalRevenue,
    };
  }, [enrichedUsers]);

  const refetch = () => {
    usersQuery.refetch();
    paymentsQuery.refetch();
  };

  return {
    users: enrichedUsers,
    summary,
    isLoading: usersQuery.isLoading || paymentsQuery.isLoading,
    isFetching: usersQuery.isFetching || paymentsQuery.isFetching,
    error: usersQuery.error || paymentsQuery.error,
    refetch,
  };
}
