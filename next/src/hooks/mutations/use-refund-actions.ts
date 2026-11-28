"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";
import type { RefundTicket } from "@/hooks/queries/use-refund-tickets";

interface ApproveRefundParams {
  ticketId: string;
  adminNotes?: string;
}

interface RejectRefundParams {
  ticketId: string;
  adminNotes?: string;
}

interface ApproveResponse {
  success: boolean;
  refundId: string;
  ticket: RefundTicket;
}

interface RejectResponse {
  success: boolean;
  ticket: RefundTicket;
}

/**
 * Enterprise Mutation Hook for Admin Refund Decisions.
 * Synchronizes Refund Tickets, Payments table, and Dashboard revenue caches.
 */
export function useRefundActions() {
  const queryClient = useQueryClient();

  // 1. Approve Refund (Gateway Refund + Access Revocation)
  const approveMutation = useMutation<ApproveResponse, Error, ApproveRefundParams>({
    mutationFn: ({ ticketId, adminNotes }) =>
      api<ApproveResponse>(`/admin/refunds/${ticketId}/approve`, {
        method: "POST",
        body: JSON.stringify({ adminNotes }),
      }),

    onSuccess: (data) => {
      // Invalidate all related caches simultaneously
      queryClient.invalidateQueries({ queryKey: adminKeys.refunds() });
      queryClient.invalidateQueries({ queryKey: adminKeys.payments() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });

      toast.success("Refund approved successfully", {
        description: `Gateway Refund ID: ${data.refundId || "Processed"}`,
      });
    },

    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to process refund on gateway";
      toast.error("Refund approval failed", {
        description: message,
      });
    },
  });

  // 2. Reject Refund (Keep Enrollment & Video Access)
  const rejectMutation = useMutation<RejectResponse, Error, RejectRefundParams>({
    mutationFn: ({ ticketId, adminNotes }) =>
      api<RejectResponse>(`/admin/refunds/${ticketId}/reject`, {
        method: "POST",
        body: JSON.stringify({ adminNotes }),
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.refunds() });

      toast.success("Refund request rejected", {
        description: "Student retains active course and video access.",
      });
    },

    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "An error occurred while updating ticket";
      toast.error("Failed to reject refund", {
        description: message,
      });
    },
  });

  return {
    approveRefund: approveMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    rejectRefund: rejectMutation.mutateAsync,
    isRejecting: rejectMutation.isPending,
    isProcessing: approveMutation.isPending || rejectMutation.isPending,
  };
}
