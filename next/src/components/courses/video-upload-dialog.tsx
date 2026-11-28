"use client";

import { useState, useRef } from "react";
import { Upload, X, Film, AlertTriangle } from "lucide-react";
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
import { useQueryClient } from "@tanstack/react-query";
import { adminKeys } from "@/lib/query-keys";
import { getValidToken, getDirectApiUrl } from "@/lib/api";
import { toast } from "sonner";

interface VideoUploadDialogProps {
  courseId: string;
  courseTitle: string;
  nextOrder: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function VideoUploadDialog({
  courseId,
  courseTitle,
  nextOrder,
  open,
  onOpenChange,
}: VideoUploadDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Upload progress tracking
  const [isUploading, setIsUploading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState("");
  const [loadedFormatted, setLoadedFormatted] = useState("");
  const [etaFormatted, setEtaFormatted] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [".mp4", ".webm", ".mov", ".mkv"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowed.includes(ext)) {
      toast.error("Invalid file format. Please select an MP4, WebM, MOV, or MKV video.");
      return;
    }

    setSelectedFile(file);
    if (!title.trim()) {
      // Auto-populate title from filename (strip extension)
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(cleanName);
    }
  };

  const handleCancel = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setIsUploading(false);
    setProgressPercent(0);
    setUploadError(null);
  };

  const handleClose = (newOpen: boolean) => {
    if (isUploading && !newOpen) {
      if (confirm("An upload is currently in progress. Are you sure you want to cancel?")) {
        handleCancel();
        onOpenChange(false);
      }
      return;
    }
    if (!isUploading) {
      // Reset state
      setTitle("");
      setDescription("");
      setSelectedFile(null);
      setProgressPercent(0);
      setUploadError(null);
      onOpenChange(newOpen);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please choose a video file to upload");
      return;
    }
    if (!title.trim()) {
      toast.error("Please provide a title for this lesson");
      return;
    }

    const token = await getValidToken();
    if (!token) {
      toast.error("Session expired. Please log in again.");
      return;
    }

    setIsUploading(true);
    setProgressPercent(0);
    setUploadError(null);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    const formData = new FormData();
    formData.append("video", selectedFile, selectedFile.name);

    const startTime = Date.now();
    let lastTime = startTime;
    let lastLoaded = 0;
    let smoothedSpeed = 0;

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;

      const now = Date.now();
      const timeDiff = (now - lastTime) / 1000;

      if (timeDiff >= 0.3) {
        const bytesDiff = event.loaded - lastLoaded;
        const currentSpeed = bytesDiff / timeDiff;
        smoothedSpeed = smoothedSpeed === 0 ? currentSpeed : smoothedSpeed * 0.7 + currentSpeed * 0.3;
        lastTime = now;
        lastLoaded = event.loaded;
      }

      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
      const remainingBytes = Math.max(0, event.total - event.loaded);
      const etaSeconds = smoothedSpeed > 0 ? Math.round(remainingBytes / smoothedSpeed) : 0;

      setProgressPercent(percent);
      setLoadedFormatted(`${formatBytes(event.loaded)} / ${formatBytes(event.total)}`);
      setUploadSpeed(smoothedSpeed > 0 ? `${formatBytes(smoothedSpeed)}/s` : "Uploading…");
      setEtaFormatted(
        etaSeconds > 0
          ? etaSeconds < 60
            ? `${etaSeconds}s left`
            : `${Math.floor(etaSeconds / 60)}m ${etaSeconds % 60}s left`
          : ""
      );
    };

    xhr.onload = () => {
      setIsUploading(false);
      xhrRef.current = null;
      if (xhr.status >= 200 && xhr.status < 300) {
        toast.success("Video uploaded! Transcoding queued in background.");
        queryClient.invalidateQueries({ queryKey: adminKeys.videos(courseId) });
        // Reset and close
        setTitle("");
        setDescription("");
        setSelectedFile(null);
        onOpenChange(false);
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          setUploadError(res.message || `Upload failed with HTTP ${xhr.status}`);
        } catch {
          setUploadError(`Upload failed with HTTP ${xhr.status}`);
        }
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      xhrRef.current = null;
      setUploadError("Network connection interrupted or server timed out. Please check backend connection.");
    };

    const uploadUrl = getDirectApiUrl("/admin/lms/videos/upload");
    xhr.open("POST", uploadUrl);
    xhr.setRequestHeader("x-course-id", courseId);
    xhr.setRequestHeader("x-video-title", title.trim());
    if (description.trim()) {
      xhr.setRequestHeader("x-video-description", description.trim());
    }
    xhr.setRequestHeader("x-video-order", String(nextOrder));
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.withCredentials = true;

    xhr.send(formData);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">Upload Video Lesson</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground truncate">
            Adding lesson #{nextOrder + 1} to <span className="font-medium text-foreground">{courseTitle}</span>
          </DialogDescription>
        </DialogHeader>

        {isUploading ? (
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">Streaming to VPS NVMe Storage…</span>
              <span className="font-mono text-muted-foreground">{progressPercent}%</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-foreground transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
              <span>{loadedFormatted || "Calculating…"}</span>
              <span>{uploadSpeed} {etaFormatted ? `· ${etaFormatted}` : ""}</span>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="h-8 text-xs text-destructive hover:text-destructive"
              >
                Cancel Upload
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {uploadError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* File Dropzone */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Video File (.mp4, .mkv, .mov)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp4,.mkv,.mov,.webm"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-muted/40">
                  <div className="flex items-center gap-2.5 truncate">
                    <Film className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-medium truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {formatBytes(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-border/80 rounded-xl p-6 text-center cursor-pointer hover:border-foreground/40 transition-colors bg-muted/20"
                >
                  <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs font-medium">Click to select raw video from computer</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Supports high-bitrate MP4, MOV, MKV up to 5 GB
                  </p>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="video-title" className="text-xs font-medium">
                Lesson Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="video-title"
                placeholder="e.g. Chapter 1: Introduction to GeM Portal"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="video-desc" className="text-xs font-medium">
                Lesson Summary <span className="text-muted-foreground text-[11px]">(Optional)</span>
              </Label>
              <Input
                id="video-desc"
                placeholder="Key takeaways or instructions for this lesson..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedFile || !title.trim()}
                className="h-9 text-xs font-medium"
              >
                Start Upload &amp; Transcoding
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
