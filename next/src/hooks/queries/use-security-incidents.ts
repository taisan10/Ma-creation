"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";

export type IncidentType =
  | "recording_suspected"
  | "screenshot_suspected"
  | "incognito_suspected"
  | "blur_suspected";

export type IncidentStatus =
  | "pending_review"
  | "approved_unlocked"
  | "user_banned"
  | "plan_revoked";

export interface IncidentUser {
  _id: string;
  name?: string;
  email: string;
  phone?: string;
  company?: string;
  role: string;
  recordingStrikes?: number;
  playbackLocked?: boolean;
}

export interface IncidentVideo {
  _id: string;
  title: string;
  durationSeconds?: number;
}

export interface IncidentCourse {
  _id: string;
  title: string;
}

export interface SecurityIncident {
  _id: string;
  user?: IncidentUser;
  video?: IncidentVideo;
  course?: IncidentCourse;
  type: IncidentType;
  ip?: string;
  userAgent?: string;
  lastWatchedSeconds: number;
  status: IncidentStatus;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityIncidentsResponse {
  success: boolean;
  incidents: SecurityIncident[];
}

/**
 * Enterprise Query Hook for LMS DRM Security Incidents
 * Features:
 * - Centralized query key caching via adminKeys.security(status)
 * - 30s freshness window
 * - Zero-flicker tab switching via keepPreviousData
 */
export function useSecurityIncidents(status?: string) {
  const normalizedStatus = status === "all" ? undefined : status;

  return useQuery<SecurityIncidentsResponse>({
    queryKey: adminKeys.security(normalizedStatus),
    queryFn: () => {
      const query = normalizedStatus ? `?status=${encodeURIComponent(normalizedStatus)}` : "";
      return api<SecurityIncidentsResponse>(`/admin/security-incidents${query}`);
    },
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}
