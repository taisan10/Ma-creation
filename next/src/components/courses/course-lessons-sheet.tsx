"use client";

import { useState } from "react";
import {
  Play,
  Plus,
  Trash2,
  Film,
  Clock,
  HardDrive,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCourseVideos,
  useCourseMutations,
  type CourseItem,
  type VideoItem,
} from "@/hooks/queries/use-courses";
import { VideoUploadDialog } from "./video-upload-dialog";
import { VideoPreviewDialog } from "./video-preview-dialog";

interface CourseLessonsSheetProps {
  course: CourseItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return "—";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function VideoStatusBadge({ video }: { video: VideoItem }) {
  switch (video.status) {
    case "READY":
      return (
        <Badge variant="outline" className="text-[10px] font-normal tracking-wide text-muted-foreground gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Ready (HLS)
        </Badge>
      );
    case "PROCESSING":
      return (
        <Badge variant="outline" className="text-[10px] font-normal tracking-wide text-blue-500 border-blue-500/20 gap-1">
          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
          Transcoding ({video.processingProgress || 10}%)
        </Badge>
      );
    case "QUEUED":
      return (
        <Badge variant="outline" className="text-[10px] font-normal tracking-wide text-amber-500 border-amber-500/20 gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
          Queued for FFmpeg
        </Badge>
      );
    case "UPLOADING":
      return (
        <Badge variant="outline" className="text-[10px] font-normal tracking-wide text-purple-500 border-purple-500/20 gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
          Uploading
        </Badge>
      );
    case "FAILED":
      return (
        <Badge variant="outline" className="text-[10px] font-normal tracking-wide text-destructive border-destructive/20 gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
          Transcode Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
          {video.status}
        </Badge>
      );
  }
}

export function CourseLessonsSheet({
  course,
  open,
  onOpenChange,
}: CourseLessonsSheetProps) {
  const { data: videos = [], isLoading } = useCourseVideos(course?._id);
  const { deleteVideo } = useCourseMutations();

  // Dialog states
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<VideoItem | null>(null);

  if (!course) return null;

  const categoryName = typeof course.category === "object" ? course.category?.name : "General";
  const planName = typeof course.plan === "object" ? course.plan?.name : "Linked Plan";

  const handleDeleteVideo = async (video: VideoItem) => {
    if (confirm(`Are you sure you want to delete lesson "${video.title}"? HLS streams will be purged from MinIO storage.`)) {
      try {
        await deleteVideo.mutateAsync({
          videoId: video._id,
          courseId: course._id,
        });
      } catch {
        // Handled in mutation hook
      }
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col bg-background">
          {/* Header */}
          <SheetHeader className="p-5 border-b border-border/60">
            <div className="pr-10 space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  {categoryName}
                </Badge>
                <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                  {planName}
                </Badge>
              </div>
              <SheetTitle className="text-base font-semibold tracking-tight">
                {course.title}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {course.description || "Manage video lessons and HLS streaming pipeline."}
              </SheetDescription>
            </div>

            {/* Action Bar below course header info */}
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/40">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Film className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  <strong className="text-foreground font-medium">{videos.length}</strong> {videos.length === 1 ? "Lesson" : "Lessons"}
                </span>
              </div>

              <Button
                size="sm"
                className="h-8 text-xs font-medium gap-1.5 shadow-xs"
                onClick={() => setUploadOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Lesson
              </Button>
            </div>
          </SheetHeader>

          {/* Lessons List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : videos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/80 p-8 text-center bg-muted/20 my-6">
                <Film className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <h3 className="text-sm font-medium">No video lessons yet</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Upload MP4, MKV, or MOV raw files. They will be automatically transcoded into secure AES-128 HLS streams.
                </p>
                <Button
                  size="sm"
                  className="mt-4 h-8 text-xs font-medium gap-1.5"
                  onClick={() => setUploadOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Upload First Lesson
                </Button>
              </div>
            ) : (
              videos.map((v, idx) => (
                <div
                  key={v._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/60 bg-card/60 hover:border-border transition-colors"
                >
                  <div className="flex items-start gap-3 truncate">
                    <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0 text-xs font-mono font-medium text-muted-foreground mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{v.title}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(v.durationSeconds)}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatBytes(v.fileSizeBytes)}
                        </span>
                      </div>
                      {v.errorMessage && (
                        <p className="text-[11px] text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          {v.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <VideoStatusBadge video={v} />

                    {v.status === "READY" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2.5 gap-1 text-foreground"
                        onClick={() => setPreviewVideo(v)}
                        title="1-click sanity check preview"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        Preview
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => handleDeleteVideo(v)}
                      disabled={deleteVideo.isPending}
                      title="Delete video"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Upload Dialog */}
      <VideoUploadDialog
        courseId={course._id}
        courseTitle={course.title}
        nextOrder={videos.length}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
      />

      {/* Video Preview Modal */}
      <VideoPreviewDialog
        video={previewVideo}
        open={Boolean(previewVideo)}
        onOpenChange={(open) => !open && setPreviewVideo(null)}
      />
    </>
  );
}
