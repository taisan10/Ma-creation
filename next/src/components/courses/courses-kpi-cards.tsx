"use client";

import { GraduationCap, Layers, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { CourseItem, CategoryItem, PlanItem } from "@/hooks/queries/use-courses";

interface CoursesKpiCardsProps {
  courses: CourseItem[];
  categories: CategoryItem[];
  plans: PlanItem[];
  isLoading: boolean;
  error?: Error | null;
}

export function CoursesKpiCards({
  courses,
  categories,
  plans,
  isLoading,
  error,
}: CoursesKpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const isError = Boolean(error);
  const activeCount = courses.filter((c) => c.active).length;
  const planMappedCount = new Set(
    courses.map((c) => (typeof c.plan === "string" ? c.plan : c.plan?._id)).filter(Boolean)
  ).size;

  const cards = [
    {
      title: "Total Courses",
      value: isError ? "—" : courses.length,
      desc: isError ? "Unable to load courses" : `${activeCount} published & active`,
      badge: "LMS Catalog",
      icon: GraduationCap,
      hasDot: true,
      dotColor: "bg-emerald-500",
    },
    {
      title: "Course Categories",
      value: isError ? "—" : categories.length,
      desc: isError ? "Unable to load categories" : "Content domain groupings",
      badge: undefined,
      icon: Layers,
      hasDot: false,
      dotColor: "",
    },
    {
      title: "Plan Entitlements",
      value: isError ? "—" : `${planMappedCount} / ${plans.length}`,
      desc: isError ? "Unable to load plans" : "Plans with attached courses",
      badge: "Monetized",
      icon: Sparkles,
      hasDot: true,
      dotColor: "bg-blue-500",
    },
    {
      title: "HLS Cloud Delivery",
      value: isError ? "—" : "MinIO ABR",
      desc: isError ? "System error" : "1080p, 720p, 360p AES-128",
      badge: "Ready",
      icon: CheckCircle2,
      hasDot: true,
      dotColor: "bg-teal-500",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <Card key={i} className="border-border/60 bg-card/60 backdrop-blur-xs transition-colors hover:border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {c.title}
              </CardTitle>
              <div className="flex items-center gap-1.5">
                {c.badge && (
                  <Badge variant="outline" className="text-[10px] font-normal tracking-wide text-muted-foreground">
                    {c.hasDot && (
                      <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${c.dotColor}`} />
                    )}
                    {c.badge}
                  </Badge>
                )}
                <Icon className="h-4 w-4 text-muted-foreground/70" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">{c.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
