"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getValidToken, getDirectApiUrl } from "@/lib/api";
import { useAuthStore } from "@/store/use-auth-store";
import type { VideoItem } from "@/hooks/queries/use-courses";

interface VideoPreviewDialogProps {
  video: VideoItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoPreviewDialog({
  video,
  open,
  onOpenChange,
}: VideoPreviewDialogProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoMounted, setIsVideoMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setVideoNode = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    setIsVideoMounted(Boolean(node));
  }, []);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setLoading(true);
        setError(null);
      }
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!open || !video || !videoEl || !isVideoMounted) return;

    let isMounted = true;
    let hls: Hls | null = null;

    const stopLoading = () => {
      if (isMounted) setLoading(false);
    };

    videoEl.addEventListener("playing", stopLoading);
    videoEl.addEventListener("canplay", stopLoading);
    videoEl.addEventListener("loadeddata", stopLoading);

    async function initStream() {
      try {
        let token = useAuthStore.getState().token;
        if (!token) {
          token = await getValidToken();
        }
        if (!isMounted) return;

        const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";
        const manifestUrl = getDirectApiUrl(
          `/videos/${encodeURIComponent(video!._id)}/hls/manifest.m3u8${tokenQuery}`
        );

        // 1. Prioritize HLS.js (MSE Engine)
        if (Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90,
            xhrSetup: (xhr) => {
              const currentToken = useAuthStore.getState().token || token;
              if (currentToken) {
                xhr.setRequestHeader("Authorization", `Bearer ${currentToken}`);
              }
              xhr.withCredentials = true;
            },
          });

          hls.loadSource(manifestUrl);
          hls.attachMedia(videoEl!);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!isMounted) return;
            setLoading(false);
            // Muted autoplay allows immediate playback check without browser user-gesture block
            videoEl!.muted = true;
            videoEl!.play().catch(() => {});
          });

          hls.on(Hls.Events.LEVEL_LOADED, () => {
            if (isMounted) setLoading(false);
          });

          hls.on(Hls.Events.FRAG_BUFFERED, () => {
            if (isMounted) setLoading(false);
          });

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              console.warn("[HLS Fatal Error]", data.type, data.details);
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls?.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls?.recoverMediaError();
                  break;
                default:
                  if (isMounted) {
                    setError("Failed to decrypt or load HLS video stream.");
                    setLoading(false);
                  }
                  hls?.destroy();
                  break;
              }
            }
          });
        } else if (
          videoEl!.canPlayType("application/vnd.apple.mpegurl") === "probably" ||
          videoEl!.canPlayType("application/vnd.apple.mpegurl") === "maybe"
        ) {
          // 2. Native HLS fallback (Safari / Apple iOS only)
          videoEl!.src = manifestUrl;
          videoEl!.onloadedmetadata = () => {
            if (isMounted) {
              setLoading(false);
              videoEl!.muted = true;
              videoEl!.play().catch(() => {});
            }
          };
          videoEl!.onerror = () => {
            if (isMounted) {
              setError("Failed to stream video. Please check authentication or permissions.");
              setLoading(false);
            }
          };
        } else {
          if (isMounted) {
            setError("Your browser does not support HLS video playback.");
            setLoading(false);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Initialization error";
          setError(msg);
          setLoading(false);
        }
      }
    }

    initStream();

    return () => {
      isMounted = false;
      videoEl.removeEventListener("playing", stopLoading);
      videoEl.removeEventListener("canplay", stopLoading);
      videoEl.removeEventListener("loadeddata", stopLoading);
      if (hls) {
        hls.destroy();
        hls = null;
      }
      videoEl.pause();
      videoEl.removeAttribute("src");
      videoEl.load();
    };
  }, [open, video, isVideoMounted]);

  if (!video) return null;

  const minutes = Math.floor((video.durationSeconds || 0) / 60);
  const seconds = (video.durationSeconds || 0) % 60;
  const durationText = `${minutes}m ${seconds}s`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[720px] p-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 pb-2 border-b border-border/60">
          <div className="flex items-center justify-between pr-6">
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight truncate max-w-[500px]">
                {video.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Lesson Order #{video.order + 1} · Duration: {durationText}
              </DialogDescription>
            </div>
            <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              AES-128 HLS
            </Badge>
          </div>
        </DialogHeader>

        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
          {loading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 z-10 text-white">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Connecting to HLS stream…</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/90 z-10 text-destructive p-6 text-center">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
              <p className="text-xs text-muted-foreground">
                Ensure the video is fully processed and you are logged in as admin.
              </p>
            </div>
          )}

          <video
            ref={setVideoNode}
            controls
            playsInline
            className="h-full w-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
