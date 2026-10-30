import { useState } from 'react'
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  HardDrive,
  Cpu
} from 'lucide-react'

/**
 * YouTube Studio Style Floating Upload Dock
 * Floats at the bottom right corner so the admin can continue working while
 * files upload and background processing progresses.
 */
export default function VideoUploadFloatingDock({
  upload,
  onCancel,
  onDismiss
}) {
  const [minimized, setMinimized] = useState(false)

  if (!upload) return null

  const isUploading = upload.status === 'UPLOADING'
  const isQueued = upload.status === 'QUEUED'
  const isProcessing = upload.status === 'PROCESSING'
  const isReady = upload.status === 'READY'
  const isFailed = upload.status === 'FAILED'

  // If minimized, display a sleek compact floating pill
  if (minimized) {
    return (
      <div
        onClick={() => setMinimized(false)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full bg-card border border-gold/40 shadow-xl cursor-pointer hover:border-gold transition-all animate-bounce-subtle"
        title="Click to expand upload details"
      >
        {isUploading ? (
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-gold" />
            </span>
            <span className="text-xs font-semibold text-ink truncate max-w-[150px]">
              {upload.title || 'Uploading video'}
            </span>
            <span className="font-mono text-xs font-bold text-gold">{upload.percent}%</span>
          </div>
        ) : isReady ? (
          <div className="flex items-center gap-1.5 text-teal text-xs font-semibold">
            <CheckCircle2 size={16} />
            <span>Upload & Transcode Complete</span>
          </div>
        ) : isFailed ? (
          <div className="flex items-center gap-1.5 text-rust text-xs font-semibold">
            <AlertCircle size={16} />
            <span>Upload Failed</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-gold text-xs font-semibold">
            <Loader2 size={14} className="animate-spin" />
            <span>Processing ({upload.title})</span>
          </div>
        )}
        <ChevronUp size={16} className="text-ink/60 hover:text-ink" />
      </div>
    )
  }

  // Expanded YouTube Studio style dock
  return (
    <aside
      aria-label="Upload progress"
      className="fixed bottom-5 right-5 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl bg-card border border-ink/15 shadow-2xl overflow-hidden transition-all duration-300 animate-slide-up"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-paper2/70 border-b border-ink/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              isReady
                ? 'bg-teal/15 text-teal'
                : isFailed
                ? 'bg-rust/15 text-rust'
                : 'bg-gold/15 text-gold'
            }`}
          >
            {isReady ? (
              <CheckCircle2 size={16} />
            ) : isFailed ? (
              <AlertCircle size={16} />
            ) : isUploading ? (
              <Upload size={16} className="animate-pulse" />
            ) : (
              <Cpu size={16} className="animate-spin" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-ink truncate">
              {upload.title || upload.fileName || 'Video Lesson'}
            </h4>
            <p className="text-[10px] text-ink/50 font-mono truncate">
              {upload.fileSizeFormatted ? `${upload.fileSizeFormatted} · ` : ''}
              {isUploading
                ? 'Phase 1: Network Ingestion'
                : isReady
                ? 'Stream Ready'
                : 'Phase 2: Worker Transcoding'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="p-1 rounded-md text-ink/60 hover:text-ink hover:bg-paper transition-colors"
            title="Minimize"
          >
            <ChevronDown size={16} />
          </button>
          {!isUploading && onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 rounded-md text-ink/60 hover:text-rust hover:bg-paper transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 space-y-3">
        {/* Status text & Percentage */}
        <div className="flex items-center justify-between text-xs font-semibold text-ink">
          <span className="flex items-center gap-1.5">
            {isUploading && <HardDrive size={13} className="text-gold" />}
            {isUploading
              ? 'Streaming file to NVMe storage...'
              : isQueued
              ? '✓ File stored on server! Queued for CPU worker...'
              : isProcessing
              ? 'FFmpeg ABR multi-bitrate transcoding...'
              : isReady
              ? '✓ Multi-bitrate HLS stream published!'
              : 'Upload error'}
          </span>
          <span className="font-mono text-sm font-bold text-gold">
            {isUploading ? `${upload.percent}%` : isReady ? '100%' : `${upload.percent || 10}%`}
          </span>
        </div>

        {/* Real-time Progress Bar */}
        <div className="w-full bg-paper2 rounded-full h-2.5 overflow-hidden border border-ink/10">
          <div
            className={`h-2.5 rounded-full transition-all duration-200 ${
              isReady
                ? 'bg-teal'
                : isFailed
                ? 'bg-rust'
                : 'bg-gold'
            }`}
            style={{
              width: `${isUploading ? upload.percent : isReady ? 100 : Math.max(15, upload.percent || 15)}%`
            }}
          />
        </div>

        {/* Live Byte & Speed Metrics (Only active during network upload) */}
        {isUploading && (
          <div className="flex items-center justify-between text-[11px] text-ink/70 font-mono">
            <span>{upload.formattedLoaded || 'Calculating bytes…'}</span>
            <div className="flex items-center gap-2">
              {upload.formattedSpeed && <span>{upload.formattedSpeed}</span>}
              {upload.formattedEta && (
                <span className="text-gold font-semibold">· {upload.formattedEta}</span>
              )}
            </div>
          </div>
        )}

        {/* Footer / Guidance */}
        <div className="pt-2 flex items-center justify-between border-t border-ink/10">
          {isUploading ? (
            <>
              <span className="text-[10px] text-rust font-medium">
                ⚠️ Keep tab open until upload reaches 100%
              </span>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-[11px] text-rust hover:underline font-semibold"
                >
                  Cancel
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] text-teal font-medium flex items-center gap-1">
                ✓ Safe to close tab or edit other courses
              </span>
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="text-[11px] text-ink/60 hover:text-ink font-semibold"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

