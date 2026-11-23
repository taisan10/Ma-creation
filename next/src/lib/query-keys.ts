/**
 * Centralized Query Key Factory (Pillar 1)
 * Single Source of Truth for TanStack Query cache keys across the entire platform.
 * Ensures 100% type safety, autocomplete, and bug-free cache invalidations.
 */

export const adminKeys = {
  all: ["admin"] as const,

  // Admin Dashboard
  dashboard: (filters?: { from?: string; to?: string }) =>
    [...adminKeys.all, "dashboard", filters] as const,

  // Users Management
  users: (filters?: { search?: string; role?: string; page?: number }) =>
    [...adminKeys.all, "users", filters] as const,
  user: (id: string) =>
    [...adminKeys.all, "users", "detail", id] as const,

  // Demo Leads
  leads: (filters?: { status?: string; search?: string }) =>
    [...adminKeys.all, "leads", filters] as const,

  // Payments & Transactions
  payments: (filters?: { status?: string; page?: number }) =>
    [...adminKeys.all, "payments", filters] as const,

  // Catalog (Services & Plans)
  catalog: (resource?: "services" | "plans") =>
    [...adminKeys.all, "catalog", resource] as const,

  // CMS Pages
  pages: () =>
    [...adminKeys.all, "pages"] as const,
  page: (idOrSlug: string) =>
    [...adminKeys.all, "pages", idOrSlug] as const,

  // FAQs
  faqs: () =>
    [...adminKeys.all, "faqs"] as const,

  // Partners
  partners: () =>
    [...adminKeys.all, "partners"] as const,

  // GeM Books
  books: () =>
    [...adminKeys.all, "books"] as const,

  // Courses & Videos LMS
  courses: () =>
    [...adminKeys.all, "courses"] as const,
  course: (id: string) =>
    [...adminKeys.all, "courses", "detail", id] as const,

  // Security Incidents & DRM Strikes
  security: (status?: string) =>
    [...adminKeys.all, "security", status] as const,

  // Site Settings
  settings: (key?: string) =>
    [...adminKeys.all, "settings", key] as const,
};

export const publicKeys = {
  all: ["public"] as const,
  faqs: () => [...publicKeys.all, "faqs"] as const,
  page: (slug: string) => [...publicKeys.all, "page", slug] as const,
  partners: () => [...publicKeys.all, "partners"] as const,
  settings: (key: string) => [...publicKeys.all, "settings", key] as const,
  services: () => [...publicKeys.all, "services"] as const,
  plans: () => [...publicKeys.all, "plans"] as const,
  books: () => [...publicKeys.all, "books"] as const,
};

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};
