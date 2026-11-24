"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Route to Label Map
const ROUTE_LABELS: Record<string, string> = {
  admin: "Dashboard",
  security: "Security Alerts",
  users: "Users",
  leads: "Demo Leads",
  payments: "Payments & Orders",
  catalog: "Services & Plans",
  pages: "CMS Pages",
  faqs: "FAQs",
  books: "GeM Books",
  courses: "Courses & Videos",
  settings: "Site Settings",
};

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean); // e.g. ['admin', 'users']

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden sm:block">
          <BreadcrumbLink render={<Link href="/admin" />}>Admin</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden sm:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>
            {segments.length > 1
              ? ROUTE_LABELS[segments[1]] || segments[1].charAt(0).toUpperCase() + segments[1].slice(1)
              : "Control Room"}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
