"use client";

import { toast } from "sonner";
import { formatSafeDate, getInitials } from "@/lib/utils";
import {
  MessageSquare,
  Mail,
  Copy,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Calendar,
  Compass,
  UserCheck,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EnrichedUser } from "@/hooks/queries/use-users";

interface UserProfileSheetProps {
  user: EnrichedUser | null;
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
}

export function UserProfileSheet({
  user,
  isOpen,
  open,
  onClose,
  onOpenChange,
}: UserProfileSheetProps) {
  if (!user) return null;

  const isSheetOpen = open !== undefined ? open : (isOpen ?? false);
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      if (onOpenChange) onOpenChange(false);
      if (onClose) onClose();
    }
  };

  const initials = getInitials(user.name || user.email);

  const rawPhone = (user.phone || "").replace(/\D/g, "");
  const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(
    user.name || "User"
  )}%2C%20welcome%20to%20MA%20Creation!`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${label} copied to clipboard!`))
      .catch(() => toast.error(`Failed to copy ${label}`));
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto">
        <SheetHeader className="text-left pb-4 border-b">
          <div className="flex items-center gap-3 pr-10">
            <Avatar className="h-12 w-12 border">
              <AvatarFallback className="font-semibold text-sm bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base font-bold truncate">
                {user.name || "User Account"}
              </SheetTitle>
              <SheetDescription className="text-xs truncate">
                {user.email}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="py-4 space-y-5 text-xs">
          {/* Quick Communication Actions */}
          <div className="flex flex-wrap gap-2">
            {cleanPhone && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => window.open(whatsappUrl, "_blank", "noopener,noreferrer")}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                WhatsApp
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => window.open(`mailto:${user.email}`, "_blank", "noopener,noreferrer")}
            >
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => copyToClipboard(user.email, "Email")}
            >
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              Copy Email
            </Button>
            {user.phone && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => copyToClipboard(user.phone || "", "Phone")}
              >
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                Copy Phone
              </Button>
            )}
          </div>

          {/* Lifetime Value & Financials */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Customer LTV
              </span>
              <Badge variant="outline" className="gap-1 text-[10px] font-normal">
                {user.hasPaid ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Paid User
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                    Registered User
                  </>
                )}
              </Badge>
            </div>

            <div className="text-2xl font-bold tracking-tight text-foreground">
              ₹{user.totalSpent.toLocaleString("en-IN")}
            </div>

            <p className="text-[11px] text-muted-foreground">
              {user.paymentsCount > 0
                ? `${user.paymentsCount} completed Razorpay ${
                    user.paymentsCount === 1 ? "transaction" : "transactions"
                  }`
                : "No course transactions recorded yet"}
            </p>
          </div>

          {/* Primary Interest for Sales & Guidance */}
          <div className="rounded-xl border bg-card p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <Compass className="h-3.5 w-3.5" />
              <span>Primary Course / Training Interest</span>
            </div>
            <div className="text-sm font-semibold text-foreground pt-0.5">
              {user.interest?.trim() || "Not specified"}
            </div>
          </div>

          {/* Purchased Plans & Transaction Ledger */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Purchased Courses & Orders ({user.transactions?.length || 0})
            </span>
            {user.transactions && user.transactions.length > 0 ? (
              <div className="space-y-2">
                {user.transactions.map((tx) => (
                  <div
                    key={tx._id}
                    className="p-3 rounded-lg border bg-card text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate max-w-[200px]">{tx.planName}</span>
                      </div>
                      <div className="font-semibold text-xs text-foreground">
                        ₹{tx.amount.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{formatSafeDate(tx.createdAt, "MMM dd, yyyy • hh:mm a")}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">#{tx._id.slice(-6)}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(tx._id, "Order ID")}
                          className="hover:text-foreground text-muted-foreground"
                          title="Copy Transaction ID"
                        >
                          <Copy className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg border bg-muted/20 text-muted-foreground text-xs text-center">
                User has not purchased any training plans yet.
              </div>
            )}
          </div>

          {/* Contact & Company Details */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Profile Details
            </span>
            <div className="divide-y rounded-lg border bg-card text-xs">
              <div className="flex items-center justify-between p-2.5">
                <span className="text-muted-foreground">Account ID</span>
                <div className="flex items-center gap-1 text-[11px] text-foreground">
                  <span className="font-medium">{user._id}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(user._id, "User ID")}
                    className="text-muted-foreground hover:text-foreground"
                    title="Copy User ID"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-muted-foreground">Phone Number</span>
                <span className="font-medium text-foreground">{user.phone || "—"}</span>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5" /> Account Role
                </span>
                <Badge
                  variant={user.role === "admin" ? "secondary" : "outline"}
                  className="text-[10px] font-normal"
                >
                  {user.role === "admin" ? "System Admin" : "Student / User"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Company / Org
                </span>
                <span className="font-medium text-foreground">{user.company || "Individual"}</span>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Registered Date
                </span>
                <span className="font-medium text-foreground">
                  {formatSafeDate(user.createdAt, "MMM dd, yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* DRM & Security Stream Status */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              DRM & Playback Health
            </span>
            <div className="p-3 rounded-lg border bg-card flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {user.playbackLocked ? (
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                )}
                <div>
                  <div className="font-medium text-foreground">
                    {user.playbackLocked ? "Playback Frozen (Incident)" : "Stream Active (Normal)"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Strikes accumulated: {user.recordingStrikes || 0}
                  </div>
                </div>
              </div>
              <Badge
                variant={user.playbackLocked ? "destructive" : "outline"}
                className="text-[10px]"
              >
                {user.playbackLocked ? "Locked" : "Clean"}
              </Badge>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
