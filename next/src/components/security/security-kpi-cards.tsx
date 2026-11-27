"use client";

import { useMemo } from "react";
import {
  Lock,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { SecurityIncident } from "@/hooks/queries/use-security-incidents";

interface SecurityKpiCardsProps {
  incidents: SecurityIncident[];
  isLoading: boolean;
  error?: Error | null;
}

export function SecurityKpiCards({ incidents, isLoading, error }: SecurityKpiCardsProps) {
  const isError = Boolean(error);

  const metrics = useMemo(() => {
    if (isError) {
      return [
        {
          title: "Active Playback Locks",
          value: "—",
          desc: "Unable to load locks",
          badge: undefined,
          badgeVariant: "secondary",
          icon: Lock,
        },
        {
          title: "Pending Audits",
          value: "—",
          desc: "Unable to load incidents",
          badge: undefined,
          badgeVariant: "secondary",
          icon: Clock,
        },
        {
          title: "Repeat Offenders",
          value: "—",
          desc: "Unable to verify strikes",
          badge: undefined,
          badgeVariant: "secondary",
          icon: AlertTriangle,
        },
        {
          title: "DRM Shield Status",
          value: "Unavailable",
          desc: "Audit service offline",
          badge: "Offline",
          badgeVariant: "destructive",
          icon: ShieldCheck,
        },
      ];
    }

    const activeLocks = incidents.filter(
      (i) => i.status === "pending_review" || i.user?.playbackLocked
    ).length;

    const pendingReview = incidents.filter(
      (i) => i.status === "pending_review"
    ).length;

    const repeatOffenders = incidents.filter(
      (i) => (i.user?.recordingStrikes || 0) >= 2
    ).length;

    return [
      {
        title: "Active Playback Locks",
        value: activeLocks,
        desc: "Students currently frozen",
        badge: activeLocks > 0 ? `${activeLocks} Locked` : "0 Locked",
        badgeVariant: activeLocks > 0 ? "destructive" : "secondary",
        icon: Lock,
      },
      {
        title: "Pending Audits",
        value: pendingReview,
        desc: "Incidents awaiting decision",
        badge: pendingReview > 0 ? "Requires Review" : "All Clear",
        badgeVariant: pendingReview > 0 ? "destructive" : "secondary",
        icon: Clock,
      },
      {
        title: "Repeat Offenders",
        value: repeatOffenders,
        desc: "Users with 2+ strikes",
        badge: repeatOffenders > 0 ? "High Risk" : "None",
        badgeVariant: repeatOffenders > 0 ? "destructive" : "secondary",
        icon: AlertTriangle,
      },
      {
        title: "DRM Shield Status",
        value: "Protected",
        desc: "Screen-grab detection live",
        badge: "Active 24/7",
        badgeVariant: "secondary",
        icon: ShieldCheck,
      },
    ];
  }, [incidents, isError]);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((item) => (
        <Card key={item.title} className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.title}
            </CardTitle>
            <item.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{item.value}</div>
              <Badge
                variant={item.badgeVariant as "destructive" | "secondary"}
                className="text-[11px] font-normal"
              >
                {item.badge}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{item.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
