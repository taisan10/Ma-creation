"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  Users,
  Inbox,
  CreditCard,
  Boxes,
  FileText,
  HelpCircle,
  Settings,
  BookOpen,
  GraduationCap,
  Sparkles,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";

// 11 Core Admin Modules (Old frontend ka exact replica)
const adminNavItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Security Alerts", url: "/admin/security", icon: ShieldAlert },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Demo Leads", url: "/admin/leads", icon: Inbox },
  { title: "Payments", url: "/admin/payments", icon: CreditCard },
  { title: "Services & Plans", url: "/admin/catalog", icon: Boxes },
  { title: "CMS Pages", url: "/admin/pages", icon: FileText },
  { title: "FAQs", url: "/admin/faqs", icon: HelpCircle },
  { title: "GeM Books", url: "/admin/books", icon: BookOpen },
  { title: "Courses & Videos", url: "/admin/courses", icon: GraduationCap },
  { title: "Site Settings", url: "/admin/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      {/* Brand Header */}
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm leading-tight">MA Creation</span>
            <span className="text-[11px] text-muted-foreground">Admin Console</span>
          </div>
        </Link>
      </SidebarHeader>

      {/* 11 Modules Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton render={<Link href={item.url} />} isActive={isActive} tooltip={item.title}>
  <item.icon className="h-4 w-4" />
  <span>{item.title}</span>
</SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer Info */}
      <SidebarFooter className="border-t p-3 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
        <div className="truncate">Enterprise Admin v1.0</div>
      </SidebarFooter>
    </Sidebar>
  );
}