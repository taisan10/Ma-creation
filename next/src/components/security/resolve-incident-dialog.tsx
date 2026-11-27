"use client";

import { useState } from "react";
import { CheckCircle2, Ban, Loader2, User, Video as VideoIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { SecurityIncident } from "@/hooks/queries/use-security-incidents";

export type ResolutionMode = "unlock" | "ban";

interface ResolveIncidentDialogProps {
  incident: SecurityIncident | null;
  mode: ResolutionMode | null;
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (incidentId: string, adminNotes?: string) => void;
}

export function ResolveIncidentDialog({
  incident,
  mode,
  isOpen,
  isPending,
  onClose,
  onConfirm,
}: ResolveIncidentDialogProps) {
  const [notes, setNotes] = useState("");

  if (!incident || !mode) return null;

  const isUnlock = mode === "unlock";

  const handleConfirm = () => {
    onConfirm(incident._id, notes.trim() || undefined);
    setNotes("");
  };

  const handleClose = () => {
    if (isPending) return;
    setNotes("");
    onClose();
  };

  const mins = Math.floor((incident.lastWatchedSeconds || 0) / 60);
  const secs = (incident.lastWatchedSeconds || 0) % 60;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isUnlock ? (
              <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            ) : (
              <div className="p-2 rounded-full bg-destructive/10 text-destructive">
                <Ban className="h-5 w-5" />
              </div>
            )}
            <div>
              <DialogTitle className="text-base font-semibold">
                {isUnlock ? "Approve & Unlock Playback" : "Ban User Permanently"}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {isUnlock
                  ? "Restore student's lecture stream access. They will resume from their exact saved timestamp."
                  : "Deactivate user account and permanently lock all video playback."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Incident Summary Card */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              {incident.user?.name || "Student"} ({incident.user?.email})
            </span>
            <Badge variant="outline" className="text-[10px]">
              Strikes: {incident.user?.recordingStrikes || 1}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5 truncate max-w-[220px]">
              <VideoIcon className="h-3.5 w-3.5" />
              {incident.video?.title || "Video Lecture"}
            </span>
            <span className="font-mono">
              Stopped at: {mins}m {secs}s
            </span>
          </div>

          <div className="text-[11px] text-muted-foreground">
            Trigger: <span className="font-medium text-foreground">{incident.type}</span>
          </div>
        </div>

        {/* Admin Notes Input */}
        <div className="space-y-1.5">
          <Label htmlFor="admin-notes" className="text-xs font-medium">
            Investigation Notes (Optional)
          </Label>
          <Input
            id="admin-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              isUnlock
                ? "e.g. Student verified accidental Snipping Tool shortcut."
                : "e.g. Confirmed OBS capture running; repeated strike."
            }
            className="text-xs"
            disabled={isPending}
          />
          <p className="text-[11px] text-muted-foreground">
            Saved to the audit trail for regulatory compliance.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            variant={isUnlock ? "default" : "destructive"}
            onClick={handleConfirm}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Processing...
              </>
            ) : isUnlock ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Unlock Playback
              </>
            ) : (
              <>
                <Ban className="h-3.5 w-3.5" />
                Confirm Ban
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
