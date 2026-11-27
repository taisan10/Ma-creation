"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatSafeDate } from "@/lib/utils";
import {
  MessageSquare,
  Mail,
  Copy,
  Building2,
  Calendar,
  Layers,
  User,
  UserCheck,
  ExternalLink,
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
import type { PaymentRecord } from "@/hooks/queries/use-payments";

interface PaymentDetailsSheetProps {
  payment: PaymentRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentDetailsSheet({ payment, isOpen, onClose }: PaymentDetailsSheetProps) {
  const router = useRouter();
  if (!payment) return null;

  const planName =
    typeof payment.plan === "object" && payment.plan?.name
      ? payment.plan.name
      : "Custom Training Plan";

  const customerName = payment.name || (typeof payment.user === "object" ? payment.user?.name : "") || "Customer";
  const customerEmail = payment.email || (typeof payment.user === "object" ? payment.user?.email : "") || "—";
  const customerPhone = payment.phone || (typeof payment.user === "object" ? payment.user?.phone : "") || "";
  const customerCompany = payment.company || (typeof payment.user === "object" ? payment.user?.company : "") || "Individual";

  const initials = customerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const rawPhone = customerPhone.replace(/\D/g, "");
  const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

  // Smart high-conversion personalized WhatsApp recovery and support messages
  const getWhatsAppMessage = () => {
    if (payment.status === "paid") {
      return `Hello ${customerName}, thank you for your enrollment in ${planName} with MA Creation! Your payment is confirmed. Please let us know if you need any assistance getting started with your training.`;
    }
    if (payment.status === "created") {
      return `Hello ${customerName}, we noticed you were enrolling in ${planName} on MA Creation, but the checkout was not completed. Did you face any UPI or payment gateway issue? Please reply here if you need any help or guidance from our team!`;
    }
    return `Hello ${customerName}, we noticed your payment attempt for ${planName} on MA Creation was unsuccessful. If the amount was debited from your account or if you faced a bank error, please let us know so we can verify and assist you right away.`;
  };

  const whatsappMessage = getWhatsAppMessage();

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${label} copied to clipboard!`))
      .catch(() => toast.error(`Failed to copy ${label}`));
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto">
        <SheetHeader className="text-left pb-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border">
              <AvatarFallback className="font-semibold text-sm bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base font-bold truncate">
                {customerName}
              </SheetTitle>
              <SheetDescription className="text-xs truncate">
                {customerEmail}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="py-4 space-y-5 text-xs">
          {/* Quick Communication & Recovery Actions */}
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
            {customerEmail && customerEmail !== "—" && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => window.open(`mailto:${customerEmail}`, "_blank", "noopener,noreferrer")}
              >
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email
              </Button>
            )}
            {customerEmail && customerEmail !== "—" && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => copyToClipboard(customerEmail, "Email")}
              >
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                Copy Email
              </Button>
            )}
            {customerPhone && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => copyToClipboard(customerPhone, "Phone")}
              >
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                Copy Phone
              </Button>
            )}
          </div>

          {/* Transaction Amount & Status Card */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Transaction Amount
              </span>
              <Badge variant="outline" className="gap-1 text-[10px] font-normal">
                {payment.status === "paid" ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Verified Paid
                  </>
                ) : payment.status === "created" ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Abandoned Checkout
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    Payment Failed
                  </>
                )}
              </Badge>
            </div>

            <div className="text-2xl font-bold tracking-tight text-foreground font-sans">
              ₹{payment.amount.toLocaleString("en-IN")}
            </div>

            <p className="text-[11px] text-muted-foreground">
              Currency: {payment.currency || "INR"} • Recorded on{" "}
              {formatSafeDate(payment.createdAt, "MMM dd, yyyy • hh:mm a")}
            </p>
          </div>

          {/* Purchased Plan Info */}
          <div className="rounded-xl border bg-card p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <Layers className="h-3.5 w-3.5" />
              <span>Target Plan / Service</span>
            </div>
            <div className="text-sm font-semibold text-foreground pt-0.5">
              {planName}
            </div>
          </div>

          {/* Gateway Ledger Details */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment Gateway Ledger
            </span>
            <div className="divide-y rounded-lg border bg-card text-xs">
              <div className="flex items-center justify-between p-2.5">
                <span className="text-muted-foreground">Payment ID</span>
                <div className="flex items-center gap-1 text-[11px] text-foreground">
                  <span className="font-medium">
                    {payment.razorpayPaymentId || "—"}
                  </span>
                  {payment.razorpayPaymentId && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(payment.razorpayPaymentId!, "Payment ID")}
                      className="text-muted-foreground hover:text-foreground"
                      title="Copy Payment ID"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5">
                <span className="text-muted-foreground">Order ID</span>
                <div className="flex items-center gap-1 text-[11px] text-foreground">
                  <span className="font-medium">
                    {payment.razorpayOrderId || "—"}
                  </span>
                  {payment.razorpayOrderId && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(payment.razorpayOrderId!, "Order ID")}
                      className="text-muted-foreground hover:text-foreground"
                      title="Copy Order ID"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5">
                <span className="text-muted-foreground">Gateway Status</span>
                <span className="font-medium capitalize text-foreground">
                  {payment.status}
                </span>
              </div>

              {payment.verifiedAt && (
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-muted-foreground">Verified Timestamp</span>
                  <span className="font-medium text-foreground">
                    {formatSafeDate(payment.verifiedAt, "MMM dd, yyyy • hh:mm a")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Profile Details */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Customer Details
            </span>
            <div className="divide-y rounded-lg border bg-card text-xs">
              <div className="flex items-center justify-between p-2.5">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Full Name
                </span>
                <span className="font-medium text-foreground">{customerName}</span>
              </div>

              <div className="flex items-center justify-between p-2.5">
                <span className="text-muted-foreground">Phone Number</span>
                <span className="font-medium text-foreground">{customerPhone || "—"}</span>
              </div>

              <div className="flex items-center justify-between p-2.5">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Company / Org
                </span>
                <span className="font-medium text-foreground">{customerCompany}</span>
              </div>

              <div className="flex items-center justify-between p-2.5">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Order Created
                </span>
                <span className="font-medium text-foreground">
                  {formatSafeDate(payment.createdAt, "MMM dd, yyyy • hh:mm a")}
                </span>
              </div>
            </div>

            {/* Cross-Module Link to User 360 Profile */}
            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between h-9 text-xs border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
                onClick={() => {
                  onClose();
                  const targetSearch = customerEmail && customerEmail !== "—" ? customerEmail : customerName;
                  router.push(`/admin/users?search=${encodeURIComponent(targetSearch)}`);
                }}
              >
                <span className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <span className="font-medium">View Complete User 360° Profile</span>
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
