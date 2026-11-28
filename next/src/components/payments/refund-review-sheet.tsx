"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatSafeDate, getInitials, formatINR } from "@/lib/utils";
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Copy,
  Clock,
  Layers,
  FileText,
  UserCheck,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { useRefundActions, type RefundTicket } from "@/hooks/queries/use-refund-tickets";
import type { EnrichedUser } from "@/hooks/queries/use-users";

interface RefundReviewSheetProps {
  ticket: RefundTicket | null;
  studentUser?: EnrichedUser | null;
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onOpenStudentProfile?: (userId: string) => void;
  onViewStudent?: (studentId: string) => void;
}

export function RefundReviewSheet({
  ticket,
  studentUser,
  isOpen,
  open,
  onClose,
  onOpenChange,
  onOpenStudentProfile,
  onViewStudent,
}: RefundReviewSheetProps) {
  const [adminNotes, setAdminNotes] = useState("");
  const { approveRefund, rejectRefund, isApproving, isRejecting, isProcessing } = useRefundActions();

  if (!ticket) return null;

  const isSheetOpen = open !== undefined ? open : (isOpen ?? false);
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      if (onOpenChange) onOpenChange(false);
      if (onClose) onClose();
    }
  };

  const handleInspectStudent = (studentId: string) => {
    if (onViewStudent) onViewStudent(studentId);
    if (onOpenStudentProfile) onOpenStudentProfile(studentId);
  };

  const customerName = ticket.user?.name || "Student";
  const customerEmail = ticket.user?.email || "—";
  const customerPhone = ticket.user?.phone || "";
  const planName = ticket.plan?.name || "Training Plan";

  const initials = getInitials(customerName);

  const isPending = ticket.status === "pending_review" || ticket.status === "processing";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${label} copied to clipboard!`))
      .catch(() => toast.error(`Failed to copy ${label}`));
  };

  const handleApprove = async () => {
    try {
      await approveRefund({
        ticketId: ticket._id,
        adminNotes: adminNotes.trim() || undefined,
      });
      setAdminNotes("");
      handleOpenChange(false);
    } catch {
      // Error toast already fired by mutation hook
    }
  };

  const handleReject = async () => {
    try {
      await rejectRefund({
        ticketId: ticket._id,
        adminNotes: adminNotes.trim() || undefined,
      });
      setAdminNotes("");
      handleOpenChange(false);
    } catch {
      // Error toast already fired by mutation hook
    }
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={(open) => !open && !isProcessing && handleOpenChange(false)}>
      <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto">
        <SheetHeader className="space-y-1 text-left pb-4 border-b">
          <div className="flex items-center justify-between pr-10">
            <SheetTitle className="text-lg font-bold flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-primary" />
              Refund Request Review
            </SheetTitle>
            <StatusBadge status={ticket.status} />
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Review the student&apos;s refund request, verify learning progress, and take action.
          </SheetDescription>
        </SheetHeader>

        <div className="py-5 space-y-5">
          {/* Student Profile Card */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-card">
            <Avatar className="h-11 w-11 border shrink-0">
              <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm text-foreground truncate">{customerName}</h3>
              <p className="text-xs text-muted-foreground truncate">{customerEmail}</p>
              {customerPhone && (
                <p className="text-[11px] text-muted-foreground truncate">{customerPhone}</p>
              )}
            </div>
            {ticket.user?._id && (onViewStudent || onOpenStudentProfile) && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 shrink-0"
                onClick={() => handleInspectStudent(ticket.user._id)}
                title="View full watch logs, DRM strikes & enrolled courses"
              >
                <UserCheck className="h-3.5 w-3.5 text-primary" />
                Student 360°
              </Button>
            )}
          </div>

          {/* Student Account Standing & DRM Security */}
          <div className="rounded-xl border bg-card p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Student Account Standing
              </span>
              {studentUser?.playbackLocked ? (
                <Badge
                  variant="outline"
                  className="text-[10px] text-destructive border-destructive/30 gap-1 font-normal bg-transparent"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                  Playback Locked
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-[10px] text-foreground/80 border-border gap-1 font-normal bg-transparent"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Normal Standing
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg border bg-muted/20">
                <span className="text-muted-foreground block text-[10px]">Total Courses / Orders</span>
                <span className="font-semibold text-foreground text-xs">
                  {studentUser?.paymentsCount ?? 1} Purchased
                </span>
              </div>
              <div className="p-2 rounded-lg border bg-muted/20">
                <span className="text-muted-foreground block text-[10px]">DRM Security Strikes</span>
                <span className="font-semibold text-foreground text-xs">
                  {studentUser?.recordingStrikes ?? 0} Strikes
                </span>
              </div>
            </div>
          </div>

          {/* Refund Amount & Plan Banner */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Refund Amount
              </span>
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate max-w-[170px]">{planName}</span>
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground font-sans">
              {formatINR(ticket.amount)}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Raised on {formatSafeDate(ticket.createdAt, "MMM dd, yyyy • hh:mm a")}
            </p>
          </div>

          {/* Student Reason */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span>Student&apos;s Reason</span>
            </div>
            <div className="rounded-lg border bg-card p-3.5 text-xs text-foreground leading-relaxed italic bg-muted/20">
              &ldquo;{ticket.reason}&rdquo;
            </div>
          </div>

          {/* Gateway & Order Ledger */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Transaction Ledger
            </span>
            <div className="divide-y rounded-lg border bg-card text-xs">
              <div className="flex items-center justify-between p-2.5">
                <span className="text-muted-foreground">Payment ID</span>
                <div className="flex items-center gap-1 text-[11px] text-foreground">
                  <span className="font-medium">{ticket.razorpayPaymentId || "—"}</span>
                  {ticket.razorpayPaymentId && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(ticket.razorpayPaymentId, "Payment ID")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {ticket.payment?.razorpayOrderId && (
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-muted-foreground">Order ID</span>
                  <div className="flex items-center gap-1 text-[11px] text-foreground">
                    <span className="font-medium">{ticket.payment.razorpayOrderId}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(ticket.payment.razorpayOrderId!, "Order ID")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              {ticket.razorpayRefundId && (
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-muted-foreground">Gateway Refund ID</span>
                  <div className="flex items-center gap-1 text-[11px] text-foreground">
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {ticket.razorpayRefundId}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(ticket.razorpayRefundId!, "Refund ID")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              {ticket.resolvedAt && (
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-muted-foreground">Resolved Date</span>
                  <span className="font-medium text-foreground">
                    {formatSafeDate(ticket.resolvedAt, "MMM dd, yyyy • hh:mm a")}
                  </span>
                </div>
              )}

              {ticket.adminNotes && (
                <div className="p-2.5 space-y-1">
                  <span className="text-muted-foreground block text-[11px] font-medium">
                    Admin Resolution Notes
                  </span>
                  <p className="font-medium text-foreground text-xs bg-muted/30 p-2 rounded border border-border leading-relaxed">
                    &ldquo;{ticket.adminNotes}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Decision Action Area (When Pending) */}
          {isPending ? (
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <label htmlFor="admin-notes" className="text-xs font-semibold text-foreground">
                  Admin Resolution Notes (Optional)
                </label>
                <Input
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Approved under 7-day SLA policy."
                  className="text-xs"
                  disabled={isProcessing}
                  maxLength={500}
                />
                <p className="text-[11px] text-muted-foreground">
                  Saved with ticket audit record and logged to ledger.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-9 text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
                  onClick={handleReject}
                  disabled={isProcessing}
                >
                  {isRejecting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  Reject Request
                </Button>
                <Button
                  type="button"
                  className="flex-1 h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleApprove}
                  disabled={isProcessing}
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Refunding...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve & Refund
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border bg-muted/20 text-xs text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>
                  Request {ticket.status === "rejected" ? "Rejected" : "Approved & Processed"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground pl-6">
                {ticket.status === "rejected"
                  ? "Student retains active course enrollment and full lecture video playback."
                  : `Razorpay Refund settlement ID: ${ticket.razorpayRefundId || "Processed"}. Student video playback revoked.`}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
