import { useEffect, useRef, useState } from 'react'
import {
  X,
  Lock,
  Film,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Layers,
  HardDrive
} from 'lucide-react'
import { API_URL } from '../../../lib/api'
import shaka from 'shaka-player/dist/shaka-player.ui.js'
import 'shaka-player/dist/controls.css'

/**
 * Enterprise Admin In-Place Video Preview Modal
 * Allows administrators to preview encrypted multi-bitrate HLS streams
 * directly inside the admin panel with live quality switcher (1080p, 720p, 360p)
 * before publishing to students.
 */
export default function AdminVideoPreviewModal({ video, onClose }) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const playerRef = useRef(null)
  const uiRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [tracks, setTracks] = useState([])

  // Close on ESC key press
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Prevent background scrolling while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  // Initialize Google Shaka Player with ABR, DRM Decryption & Quality Menu
  useEffect(() => {
    if (!video?._id) return

    const videoEl = videoRef.current
    const containerEl = containerRef.current
    if (!videoEl || !containerEl) return

    const shakaLib = window.shaka || shaka
    shakaLib.polyfill.installAll()

    if (!shakaLib.Player.isBrowserSupported()) {
      setErrorMessage('Your browser does not support Encrypted Media Extensions (EME).')
      setLoading(false)
      return
    }

    let isMounted = true
    setLoading(true)
    setErrorMessage('')

    async function initShaka() {
      try {
        const player = new shakaLib.Player()
        const ui = new shakaLib.ui.Overlay(player, containerEl, videoEl)

        playerRef.current = player
        uiRef.current = ui

        // Configure UI controls
        ui.configure({
          controlPanelElements: [
            'play_pause',
            'time_and_duration',
            'spacer',
            'mute',
            'volume',
            'quality',
            'playback_rate',
            'fullscreen'
          ],
          overflowMenuButtons: ['quality', 'playback_rate'],
          addSeekBar: true,
          doubleClickForFullscreen: true,
          singleClickForPlayAndPause: true,
          enableKeyboardPlaybackControls: true,
          showBufferingSpinner: true
        })

        // 🛡️ Attach Authorization Bearer token to all manifest, chunk, and AES key requests
        player.getNetworkingEngine().registerRequestFilter((type, request) => {
          const token = localStorage.getItem('mac_token')
          if (token) {
            request.headers['Authorization'] = `Bearer ${token}`
          }
          request.allowCrossSiteCredentials = true

          // Ensure any root-relative URLs point to API backend
          const backendBase = API_URL.replace(/\/api$/, '')
          request.uris = request.uris.map((uri) => {
            if (uri.startsWith('/') && !uri.startsWith('//')) {
              return `${backendBase}${uri}`
            }
            return uri
          })
        })

        player.addEventListener('error', (event) => {
          const err = event.detail
          console.error('[Admin Preview] Shaka Error:', err)
          if (err && err.severity === shakaLib.util.Error.Severity.CRITICAL && isMounted) {
            setErrorMessage(`Playback Error: ${err.message || 'Could not decrypt stream.'}`)
            setLoading(false)
          }
        })

        player.addEventListener('adaptation', () => {
          if (!isMounted) return
          const variantTracks = player.getVariantTracks()
          setTracks(variantTracks)
        })

        const manifestUrl = `${API_URL}/videos/${encodeURIComponent(video._id)}/hls/manifest.m3u8`
        await player.attach(videoEl)
        await player.load(manifestUrl, null, 'application/x-mpegurl')

        if (isMounted) {
          setLoading(false)
          setTracks(player.getVariantTracks())
        }
      } catch (err) {
        if (!isMounted) return
        console.error('[Admin Preview] Initialization Error:', err)
        setErrorMessage(err.message || 'Failed to load video stream.')
        setLoading(false)
      }
    }

    initShaka()

    return () => {
      isMounted = false
      if (uiRef.current) {
        try {
          uiRef.current.destroy()
        } catch (_) {}
      }
      if (playerRef.current) {
        playerRef.current.destroy().catch(() => {})
      }
    }
  }, [video?._id])

  if (!video) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Video lesson stream preview"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadein"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="bg-card w-full max-w-4xl rounded-2xl shadow-2xl border border-ink/15 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-ink/10 bg-paper2/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gold/15 text-gold flex items-center justify-center shrink-0">
              <Film size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-ink truncate leading-tight">
                {video.title}
              </h3>
              <p className="text-xs text-ink/50 font-mono mt-0.5 truncate flex items-center gap-2">
                <span>Admin Stream Quality Inspection</span>
                <span>•</span>
                <span className="text-teal font-medium flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  HLS ABR Ready
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink/50 hover:text-ink hover:bg-paper2 transition-colors shrink-0"
            title="Close Preview (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Player Stage */}
        <div className="relative bg-black flex-1 flex items-center justify-center min-h-[320px] max-h-[60vh] overflow-hidden">
          {/* Shaka Video Container */}
          <div
            ref={containerRef}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full aspect-video flex items-center justify-center relative select-none"
          >
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              playsInline
              autoPlay
            />
          </div>

          {/* Loading Overlay */}
          {loading && !errorMessage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/75 z-20 text-white">
              <Loader2 size={32} className="animate-spin text-gold" />
              <p className="text-xs font-mono text-white/80">
                Decrypting AES-128 master playlist & initializing Shaka ABR engine…
              </p>
            </div>
          )}

          {/* Error Overlay */}
          {errorMessage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 z-20 text-white p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-rust/20 text-rust flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <h4 className="text-sm font-semibold text-white">Stream Preview Unavailable</h4>
              <p className="text-xs text-white/70 max-w-md font-mono">{errorMessage}</p>
              <button
                type="button"
                onClick={onClose}
                className="btn-outline btn-sm text-xs mt-2 text-white border-white/20 hover:bg-white/10"
              >
                Close Preview
              </button>
            </div>
          )}
        </div>

        {/* Inspector Footer & Stream Diagnostics */}
        <div className="p-4 bg-paper border-t border-ink/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Diagnostic Badges */}
          <div className="flex flex-wrap items-center gap-2 font-mono">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal/10 text-teal border border-teal/20 text-[11px] font-semibold">
              <ShieldCheck size={13} />
              <span>AES-128 DRM Active</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gold/10 text-gold border border-gold/20 text-[11px] font-semibold">
              <Layers size={13} />
              <span>Multi-Bitrate: 1080p · 720p · 360p</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card text-ink/70 border border-ink/10 text-[11px]">
              <HardDrive size={13} className="text-ink/50" />
              <span>MinIO Object Store</span>
            </span>
          </div>

          {/* Action guidance */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-ink/50 font-mono hidden md:inline">
              Press <kbd className="px-1.5 py-0.5 rounded bg-paper2 border border-ink/20 text-ink/80 text-[10px]">Esc</kbd> to exit
            </span>
            <button
              type="button"
              onClick={onClose}
              className="btn-sm rounded-lg bg-gold text-white font-semibold hover:bg-gold/90 shadow-sm text-xs px-4"
            >
              Done Testing
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

