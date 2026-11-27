/**
 * Zero-Server-Load Client-Side CSV Generator
 * Generates and triggers download of CSV directly in browser RAM via Blob API.
 * Incurs 0.00% server CPU overhead on VPS.
 */

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

function sanitizeCell(val?: string | number | null): string {
  const str = String(val ?? "");
  // Neutralize CSV Formula Injection (CWE-1236) for spreadsheet processors
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function exportUsersToCsv(users: ExportableUser[], filenamePrefix = "users-export"): void {
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
    sanitizeCell(u.name),
    sanitizeCell(u.email),
    sanitizeCell(u.phone),
    sanitizeCell(u.company),
    sanitizeCell(u.interest || "Not specified"),
    sanitizeCell(u.role),
    sanitizeCell(u.hasPaid ? "Paid User" : "Registered User"),
    u.totalSpent || 0,
    sanitizeCell((u.purchasedPlans || []).join("; ")),
    sanitizeCell(new Date(u.createdAt).toLocaleDateString("en-IN")),
  ]);

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
