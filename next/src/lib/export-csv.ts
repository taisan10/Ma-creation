import type { PaymentRecord } from "@/hooks/queries/use-payments";
import { formatSafeDate } from "@/lib/utils";

/**
 * Neutralizes CSV Formula Injection (CWE-1236) for spreadsheet processors.
 */
export function sanitizeCsvCell(val?: string | number | null | undefined): string {
  const str = String(val ?? "");
  // Neutralize CSV Formula Injection (CWE-1236)
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

/**
 * Zero-Server-Load Client-Side CSV Download Engine.
 * Generates and triggers download directly in browser RAM with UTF-8 BOM.
 */
export function downloadCsv(
  filenamePrefix: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
): void {
  if (!rows || rows.length === 0) return;

  const sanitizedHeaders = headers.map((h) => sanitizeCsvCell(h)).join(",");
  const sanitizedRows = rows.map((row) =>
    row.map((cell) => sanitizeCsvCell(cell)).join(",")
  );

  // \uFEFF enables UTF-8 BOM for Microsoft Excel compatibility
  const csvContent = "\uFEFF" + [sanitizedHeaders, ...sanitizedRows].join("\r\n");
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

export interface ExportableUser {
  name?: string;
  email: string;
  phone?: string;
  company?: string;
  interest?: string;
  role: string;
  hasPaid: boolean;
  totalSpent: number;
  purchasedPlans: string[];
  createdAt: string;
}

/**
 * Export Users to CSV using the Unified CSV Engine
 */
export function exportUsersToCsv(
  users: ExportableUser[],
  filenamePrefix = "users-export"
): void {
  if (!users || users.length === 0) return;

  const headers = [
    "Name",
    "Email",
    "Phone",
    "Company",
    "Primary Interest",
    "Role",
    "User Type",
    "Total Spent (INR)",
    "Purchased Plans",
    "Registered Date",
  ];

  const rows = users.map((u) => [
    u.name,
    u.email,
    u.phone,
    u.company,
    u.interest || "Not specified",
    u.role,
    u.hasPaid ? "Paid User" : "Registered User",
    u.totalSpent || 0,
    (u.purchasedPlans || []).join("; "),
    new Date(u.createdAt).toLocaleDateString("en-IN"),
  ]);

  downloadCsv(filenamePrefix, headers, rows);
}

/**
 * Export Payments to CSV using the Unified CSV Engine
 */
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
        : p.status === "refunded"
        ? "Refunded"
        : p.status === "created"
        ? "Abandoned Checkout"
        : "Payment Failed";

    return [
      customerName,
      customerEmail,
      customerPhone,
      customerCompany,
      planName,
      p.amount || 0,
      statusLabel,
      p.razorpayPaymentId || "—",
      p.razorpayOrderId || "—",
      formatSafeDate(p.createdAt, "dd/MM/yyyy"),
      formatSafeDate(p.verifiedAt, "dd/MM/yyyy"),
    ];
  });

  downloadCsv(filenamePrefix, headers, rows);
}
