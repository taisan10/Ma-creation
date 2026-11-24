"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";

// Types
export interface RevenuePoint {
  month: string;
  revenue: number;
}

export interface UserGrowthPoint {
  month: string;
  newUsers: number;
}

export interface DashboardStats {
  users?: number;
  leads?: number;
  payments?: number;
  services?: number;
  plans?: number;
  pages?: number;
  faqs?: number;
  books?: number;
  revenueTrend?: RevenuePoint[];
  userGrowth?: UserGrowthPoint[];
  [key: string]: unknown;
}

export interface DashboardResponse {
  success: boolean;
  stats: DashboardStats;
}

export interface DashboardFilterParams {
  from?: string;
  to?: string;
}

/**
 
 * Decouples API & caching logic from the UI.
 * Features:
 * - 30s freshness window (staleTime)
 * - Zero-flicker graph morphing (placeholderData: keepPreviousData)
 * - Type-safe returns
 */
export function useAdminDashboard(filters?: DashboardFilterParams) {
  return useQuery<DashboardResponse>({
    queryKey: adminKeys.dashboard(filters),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (filters?.from) searchParams.set("from", filters.from);
      if (filters?.to) searchParams.set("to", filters.to);
      const query = searchParams.toString();
      return api<DashboardResponse>(
        `/admin/dashboard${query ? `?${query}` : ""}`,
      );
    },
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}
