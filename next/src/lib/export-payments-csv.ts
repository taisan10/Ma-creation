import type { PaymentRecord } from "@/hooks/queries/use-payments";
import { formatSafeDate } from "@/lib/utils";

/**
 * Zero-Server-Load Client-Side CSV Generator for Payments.
 * Enforces CWE-1236 Formula Injection Neutralization.
 */
function sanitizeCell(val?: string | number | null): string {
  const str = String(val ?? "");
  // Neutralize CSV Formula Injection (CWE-1236)
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function exportPaymentsToCsv(
  payments: PaymentRecord[],
  filenamePrefix = "payments-export"
): void {
  if (!payments || payments.length === 0) return;

  const headers = [
    "Customer Name",
    "Email",
    "Phone",
    "Company",
    "Plan Name",
    "Amount (INR)",
    "Status",
    "Razorpay Payment ID",
    "Razorpay Order ID",
    "Order Date",
    "Verified Date",
  ];

  const rows = payments.map((p) => {
    const planName =
      typeof p.plan === "object" && p.plan?.name ? p.plan.name : "Custom Plan";
    const customerName =
      p.name || (typeof p.user === "object" ? p.user?.name : "") || "Customer";
    const customerEmail =
      p.email || (typeof p.user === "object" ? p.user?.email : "") || "";
    const customerPhone =
      p.phone || (typeof p.user === "object" ? p.user?.phone : "") || "";
    const customerCompany =
      p.company || (typeof p.user === "object" ? p.user?.company : "") || "Individual";

    const statusLabel =
      p.status === "paid"
        ? "Verified Paid"
        : p.status === "created"
        ? "Abandoned Checkout"
        : "Payment Failed";

    return [
      sanitizeCell(customerName),
      sanitizeCell(customerEmail),
      sanitizeCell(customerPhone),
      sanitizeCell(customerCompany),
      sanitizeCell(planName),
      p.amount || 0,
      sanitizeCell(statusLabel),
      sanitizeCell(p.razorpayPaymentId || "—"),
      sanitizeCell(p.razorpayOrderId || "—"),
      sanitizeCell(formatSafeDate(p.createdAt, "dd/MM/yyyy")),
      sanitizeCell(formatSafeDate(p.verifiedAt, "dd/MM/yyyy")),
    ];
  });

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  const today = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `${filenamePrefix}-${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
