"use client";

import { useState, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search,
  CheckCircle2,
  Ban,
  User,
  Video as VideoIcon,
  Clock,
  Laptop,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useSecurityIncidents, type SecurityIncident } from "@/hooks/queries/use-security-incidents";
import { useIncidentActions } from "@/hooks/mutations/use-incident-actions";
import { useDebounce } from "@/hooks/use-debounce";
import { formatSafeDate } from "@/lib/utils";
import { SecurityKpiCards } from "@/components/security/security-kpi-cards";
import {
  ResolveIncidentDialog,
  type ResolutionMode,
} from "@/components/security/resolve-incident-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const FILTER_TABS = [
  { key: "all", label: "All Incidents" },
  { key: "pending_review", label: "Pending Review" },
  { key: "approved_unlocked", label: "Approved & Unlocked" },
  { key: "user_banned", label: "User Banned" },
] as const;

function formatTriggerLabel(type: string): string {
  switch (type) {
    case "recording_suspected":
      return "Screen Recording Suspected (OBS/Capture)";
    case "screenshot_suspected":
      return "Screenshot Attempt (PrintScreen/Snipping)";
    case "blur_suspected":
      return "Window Blur / Background Rip";
    case "incognito_suspected":
      return "Incognito Bypass Suspected";
    default:
      return type;
  }
}

export default function AdminSecurityPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Modal dialog states
  const [activeIncident, setActiveIncident] = useState<SecurityIncident | null>(null);
  const [activeMode, setActiveMode] = useState<ResolutionMode | null>(null);

  // TanStack hooks
  const { data, isLoading, isFetching, error, refetch } = useSecurityIncidents(statusFilter);
  const incidents = useMemo(() => data?.incidents || [], [data?.incidents]);

  const { unlockIncident, isUnlocking, banUser, isBanning } = useIncidentActions();

  // Search filtering
  const filteredIncidents = useMemo(() => {
    if (!debouncedSearch.trim()) return incidents;
    const query = debouncedSearch.toLowerCase();
    return incidents.filter((inc) => {
      const studentName = inc.user?.name?.toLowerCase() || "";
      const studentEmail = inc.user?.email?.toLowerCase() || "";
      const studentPhone = inc.user?.phone?.toLowerCase() || "";
      const videoTitle = inc.video?.title?.toLowerCase() || "";
      const courseTitle = inc.course?.title?.toLowerCase() || "";
      const ip = inc.ip?.toLowerCase() || "";
      const type = inc.type?.toLowerCase() || "";

      return (
        studentName.includes(query) ||
        studentEmail.includes(query) ||
        studentPhone.includes(query) ||
        videoTitle.includes(query) ||
        courseTitle.includes(query) ||
        ip.includes(query) ||
        type.includes(query)
      );
    });
  }, [incidents, debouncedSearch]);

  const handleOpenDialog = (incident: SecurityIncident, mode: ResolutionMode) => {
    setActiveIncident(incident);
    setActiveMode(mode);
  };

  const handleCloseDialog = () => {
    setActiveIncident(null);
    setActiveMode(null);
  };

  const handleConfirmResolution = (incidentId: string, notes?: string) => {
    if (activeMode === "unlock") {
      unlockIncident(
        { incidentId, adminNotes: notes },
        { onSuccess: () => handleCloseDialog() }
      );
    } else if (activeMode === "ban") {
      banUser(
        { incidentId, adminNotes: notes },
        { onSuccess: () => handleCloseDialog() }
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-destructive" />
              DRM & Anti-Piracy Monitor
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Real-time lecture stream protection, piracy strikes & student playback unlock control.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge
            variant="outline"
            className="gap-1.5 px-3 py-1.5 text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            DRM Shield: Active
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <SecurityKpiCards incidents={incidents} isLoading={isLoading} error={error} />

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search student, email, video, IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border rounded-lg bg-muted/40 p-1">
          {FILTER_TABS.map((tab) => (
            <Button
              key={tab.key}
              variant={statusFilter === tab.key ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs rounded-md"
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Incidents Stream Cards */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))
        ) : error ? (
          <Card className="p-10 text-center border-destructive/30 bg-destructive/5">
            <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Failed to Load Security Incidents</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {error instanceof Error
                ? error.message
                : "Unable to retrieve incident records from the DRM audit service."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs mt-3 gap-1.5 border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Retry Connection
            </Button>
          </Card>
        ) : filteredIncidents.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold">No Security Incidents</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              No piracy incidents or playback locks found matching this criteria. All video streams are protected.
            </p>
          </Card>
        ) : (
          filteredIncidents.map((incident) => {
            const isPending = incident.status === "pending_review";
            const mins = Math.floor((incident.lastWatchedSeconds || 0) / 60);
            const secs = (incident.lastWatchedSeconds || 0) % 60;

            return (
              <Card
                key={incident._id}
                className={`p-4 transition-colors ${
                  isPending
                    ? "border-destructive/40 bg-destructive/5 hover:border-destructive/60"
                    : "hover:border-primary/40"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left Column: Student Details & Violation Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm flex items-center gap-1.5">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {incident.user?.name || "Student"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({incident.user?.email || "No email"})
                      </span>
                      {incident.user?.phone && (
                        <span className="text-xs text-muted-foreground">
                          · {incident.user.phone}
                        </span>
                      )}

                      <Badge
                        variant="outline"
                        className="text-[11px] font-medium border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      >
                        Strikes: {incident.user?.recordingStrikes ?? 1}
                      </Badge>

                      <Badge
                        variant={isPending ? "destructive" : "secondary"}
                        className="text-[11px] font-medium"
                      >
                        {incident.status === "pending_review"
                          ? "Pending Review"
                          : incident.status === "approved_unlocked"
                          ? "Approved & Unlocked"
                          : incident.status === "user_banned"
                          ? "User Banned"
                          : incident.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <VideoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        {incident.video?.title || "Video Lecture"}
                      </span>
                      {incident.course?.title && (
                        <span>Course: {incident.course.title}</span>
                      )}
                      <Badge
                        variant="outline"
                        className="text-[11px] gap-1 border-primary/30 bg-primary/5 text-primary"
                      >
                        <Clock className="h-3 w-3" />
                        Stopped at: {mins}m {secs}s
                      </Badge>
                    </div>

                    <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-3 pt-0.5">
                      <span className="font-medium text-destructive">
                        {formatTriggerLabel(incident.type)}
                      </span>
                      {incident.ip && (
                        <span className="flex items-center gap-1">
                          <Laptop className="h-3 w-3" />
                          IP: {incident.ip}
                        </span>
                      )}
                      <span>
                        Detected:{" "}
                        {formatSafeDate(incident.createdAt, "MMM dd, yyyy · HH:mm")}
                      </span>
                    </div>

                    {incident.adminNotes && (
                      <div className="text-xs bg-muted/40 p-2 rounded-md border text-muted-foreground mt-1">
                        <span className="font-semibold text-foreground">Admin Note:</span>{" "}
                        {incident.adminNotes}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
                    {isPending ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-600"
                          onClick={() => handleOpenDialog(incident, "unlock")}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          Approve & Unlock
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => handleOpenDialog(incident, "ban")}
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Ban User
                        </Button>
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        Resolved on{" "}
                        {formatSafeDate(incident.resolvedAt, "MMM dd, yyyy", "Audit")}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Resolution Dialog */}
      <ResolveIncidentDialog
        incident={activeIncident}
        mode={activeMode}
        isOpen={Boolean(activeIncident && activeMode)}
        isPending={isUnlocking || isBanning}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmResolution}
      />
    </div>
  );
}
