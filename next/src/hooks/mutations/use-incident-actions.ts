"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";
import type { SecurityIncident, SecurityIncidentsResponse } from "@/hooks/queries/use-security-incidents";

interface ResolveIncidentParams {
  incidentId: string;
  adminNotes?: string;
}

interface BanUserParams {
  incidentId: string;
  adminNotes?: string;
}

interface ActionResponse {
  success: boolean;
  incident: SecurityIncident;
}

interface MutationContext {
  previousData?: [readonly unknown[], SecurityIncidentsResponse | undefined][];
}

/**
 * Enterprise Mutation Hook for Security Incidents (Pillar 3: Optimistic Updates)
 * - Instant UI reaction when unlocking honest users or banning violators
 * - Automatic cache rollback if the server reports an error
 * - Auto-invalidates dashboard DRM stats and incidents list
 */
export function useIncidentActions() {
  const queryClient = useQueryClient();

  // 1. Approve & Unlock Mutation
  const unlockMutation = useMutation<ActionResponse, Error, ResolveIncidentParams, MutationContext>({
    mutationFn: ({ incidentId, adminNotes }) =>
      api<ActionResponse>(`/admin/security-incidents/${incidentId}/resolve`, {
        method: "POST",
        body: JSON.stringify({ adminNotes }),
      }),

    onMutate: async ({ incidentId, adminNotes }) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.all });

      // Snapshot previous caches across all active security status queries
      const previousData = queryClient.getQueriesData<SecurityIncidentsResponse>({
        queryKey: adminKeys.all,
      });

      // Optimistically update incident in cache
      queryClient.setQueriesData<SecurityIncidentsResponse>(
        { queryKey: adminKeys.all },
        (old) => {
          if (!old?.incidents) return old;
          return {
            ...old,
            incidents: old.incidents.map((item) =>
              item._id === incidentId
                ? {
                    ...item,
                    status: "approved_unlocked",
                    adminNotes: adminNotes || item.adminNotes,
                    resolvedAt: new Date().toISOString(),
                    user: item.user
                      ? { ...item.user, playbackLocked: false }
                      : undefined,
                  }
                : item
            ),
          };
        }
      );

      return { previousData };
    },

    onError: (err, _vars, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      toast.error(`Unlock failed: ${err.message}`);
    },

    onSuccess: () => {
      toast.success("Student playback unlocked. Stream access restored.");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });

  // 2. Ban User Mutation
  const banMutation = useMutation<ActionResponse, Error, BanUserParams, MutationContext>({
    mutationFn: ({ incidentId, adminNotes }) =>
      api<ActionResponse>(`/admin/security-incidents/${incidentId}/ban-user`, {
        method: "POST",
        body: JSON.stringify({ adminNotes }),
      }),

    onMutate: async ({ incidentId, adminNotes }) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.all });

      const previousData = queryClient.getQueriesData<SecurityIncidentsResponse>({
        queryKey: adminKeys.all,
      });

      queryClient.setQueriesData<SecurityIncidentsResponse>(
        { queryKey: adminKeys.all },
        (old) => {
          if (!old?.incidents) return old;
          return {
            ...old,
            incidents: old.incidents.map((item) =>
              item._id === incidentId
                ? {
                    ...item,
                    status: "user_banned",
                    adminNotes: adminNotes || item.adminNotes,
                    resolvedAt: new Date().toISOString(),
                    user: item.user
                      ? { ...item.user, playbackLocked: true }
                      : undefined,
                  }
                : item
            ),
          };
        }
      );

      return { previousData };
    },

    onError: (err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      toast.error(`Ban failed: ${err.message}`);
    },

    onSuccess: () => {
      toast.error("User banned and playback locked permanently.");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });

  return {
    unlockIncident: unlockMutation.mutate,
    isUnlocking: unlockMutation.isPending,
    banUser: banMutation.mutate,
    isBanning: banMutation.isPending,
  };
}
