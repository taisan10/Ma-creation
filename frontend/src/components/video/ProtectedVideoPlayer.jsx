import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { requestPlaybackToken, reportWatchEvent } from '../../lib/videoApi'
import { getUser, API_URL } from '../../lib/api'
import WatchLimitModal from './WatchLimitModal'
import VideoWatermark from './VideoWatermark'
import shaka from 'shaka-player/dist/shaka-player.ui.js'
import 'shaka-player/dist/controls.css'

// How many seconds of GENUINE playback must happen before we count this as
// a real "watch" -- avoids counting an accidental click or a page that
// briefly auto-played then was closed.
const COUNT_AFTER_SECONDS = 3

/**
 * Exposed via ref (see useImperativeHandle below) so Part 8's detection
 * code can call playerRef.current.triggerSuspicious('recording_suspected')
 * from OUTSIDE this component -- e.g. from a document-level event listener
 * that isn't part of this component's own render tree. This component does
 * not implement any detection itself, it only exposes the unmount/report
 * machinery that Part 8 plugs into.
 */
const ProtectedVideoPlayer = forwardRef(function ProtectedVideoPlayer({ videoId, title, onSuspicious }, ref) {
  const videoRef = useRef(null)
  const sessionRef = useRef(null) // { token }
  const countedRef = useRef(false) // guards against double-counting client-side too
  const startTimeRef = useRef(null) // tracks when playback started for duration calc
  const heartbeatRef = useRef(null)
  const playerRef = useRef(null)
  const uiRef = useRef(null)
  const containerRef = useRef(null)

  const [state, setState] = useState('loading') // loading | ready | blocked | error | recording_blocked | locked_pending_admin
  const [playback, setPlayback] = useState(null) // { url, watchCount, maxWatchCount }
  const [errorMessage, setErrorMessage] = useState('')
  const [isBlurred, setIsBlurred] = useState(false)

  // Auto-pause and blackout when window loses focus (OBS / Game Bar background capture defense)
  useEffect(() => {
    function handleBlur() {
      setIsBlurred(true)
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause()
      }
    }
    function handleFocus() {
      setIsBlurred(false)
    }
    function handleVisibility() {
      if (document.hidden) {
        handleBlur()
      } else {
        handleFocus()
      }
    }

    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  const loadToken = useCallback(async () => {
    setState('loading')
    countedRef.current = false
    startTimeRef.current = null
    heartbeatRef.current = null
    try {
      const data = await requestPlaybackToken(videoId)
      sessionRef.current = { token: data.sessionToken }
      setPlayback(data)
      setState('ready')
    } catch (e) {
      if (e.code === 'WATCH_LIMIT_REACHED') {
        setState('blocked')
      } else if (e.code === 'PLAYBACK_LOCKED_PENDING_ADMIN' || e.code === 'PLAYBACK_LOCKED') {
        setErrorMessage(e.message)
        setState('locked_pending_admin')
      } else {
        setErrorMessage(e.message || 'Could not load this video.')
        setState('error')
      }
    }
  }, [videoId])

  useEffect(() => {
    if (!getUser()) return
    loadToken()
  }, [loadToken])

  // Attach video stream: Supports encrypted HLS & DASH via Google Shaka Player with ABR & UI
  useEffect(() => {
    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container || !playback?.url) return

    const shakaLib = window.shaka || shaka
    shakaLib.polyfill.installAll()

    if (!shakaLib.Player.isBrowserSupported()) {
      setErrorMessage('Your browser does not support protected streaming.')
      setState('error')
      return
    }

    let isMounted = true

    async function initShaka() {
      try {
        const player = new shakaLib.Player()
        const ui = new shakaLib.ui.Overlay(player, container, video)

        playerRef.current = player
        uiRef.current = ui

        // Configure Shaka UI Controls
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
          overflowMenuButtons: [
            'quality',
            'playback_rate'
          ],
          contextMenuElements: [], // 🛡️ Security: Disable right-click frame save / copy
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
          request.uris = request.uris.map(uri => {
            if (uri.startsWith('/') && !uri.startsWith('//')) {
              return `${backendBase}${uri}`
            }
            return uri
          })
        })

        player.addEventListener('error', (event) => {
          const err = event.detail
          console.error('Shaka Player Error:', err)
          if (err && err.severity === shakaLib.util.Error.Severity.CRITICAL && isMounted) {
            setErrorMessage(`Playback error: ${err.message || 'Stream error'}`)
            setState('error')
          }
        })

        const url = playback.url.startsWith('/') 
          ? `${API_URL.replace(/\/api$/, '')}${playback.url}` 
          : playback.url

        await player.attach(video)
        await player.load(url, null, url.includes('.m3u8') ? 'application/x-mpegurl' : null)
      } catch (err) {
        if (!isMounted) return
        console.error('Failed to initialize Shaka Player:', err)
        setErrorMessage('Could not load encrypted video player.')
        setState('error')
      }
    }

    initShaka()

    return () => {
      isMounted = false
      if (uiRef.current) {
        uiRef.current.destroy().catch(() => {})
        uiRef.current = null
      }
      if (playerRef.current) {
        playerRef.current.destroy().catch(() => {})
        playerRef.current = null
      }
    }
  }, [playback?.url])

  // Fires on every native <video> timeupdate event -- we only act once
  // currentTime crosses COUNT_AFTER_SECONDS, and only once per session
  // (countedRef), then report 'started' to the backend so WatchLog.count
  // actually increments (see Part 5's reportWatchEvent).

  function handleTimeUpdate() {
    const el = videoRef.current
    if (!el) return

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now()
    }

    if (!countedRef.current && el.currentTime >= COUNT_AFTER_SECONDS) {
      countedRef.current = true
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const token = sessionRef.current?.token
      if (token) reportWatchEvent(videoId, token, 'started', elapsed).catch(() => {})
        startTimeRef.current = Date.now()
         heartbeatRef.current = Date.now()

    }

    // Heartbeat: every 30 seconds, report accumulated time
    const now = Date.now()
    if (!heartbeatRef.current || now - heartbeatRef.current >= 30000) {
      heartbeatRef.current = now
      const elapsed = Math.floor((now - startTimeRef.current) / 1000)
      const token = sessionRef.current?.token
       if (token && countedRef.current) {
        reportWatchEvent(videoId, token, 'heartbeat', elapsed)
          .then(res => {
            if (res?.watchLimitReached) {
              setState('blocked')
            }
          })
          .catch(() => {})
        // Reset startTimeRef so next heartbeat measures from this point
        startTimeRef.current = now
      }
    }
  }

   function handleEnded() {
    const token = sessionRef.current?.token
    if (token) {
      const elapsed = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0
      if (elapsed > 0) reportWatchEvent(videoId, token, 'ended', elapsed).catch(() => {})
    }
     countedRef.current = false
    startTimeRef.current = null
    heartbeatRef.current = null
  }

  // This is the function Part 8 calls to unmount playback + report the flag.
  // useImperativeHandle makes it callable as playerRef.current.triggerSuspicious(...)
  // from any parent/detection code holding a ref to this component.
    const triggerSuspicious = useCallback((reason) => {
    const token = sessionRef.current?.token
    if (token) reportWatchEvent(videoId, token, reason).catch(() => {})
    if (uiRef.current) {
      uiRef.current.destroy().catch(() => {})
      uiRef.current = null
    }
    if (playerRef.current) {
      playerRef.current.destroy().catch(() => {})
      playerRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.removeAttribute('src')
      videoRef.current.load()
    }
    setState(reason === 'incognito_suspected' ? 'incognito_blocked' : 'recording_blocked')
    if (onSuspicious) onSuspicious(reason)
  }, [videoId, onSuspicious])

  useImperativeHandle(ref, () => ({
    triggerSuspicious
  }), [triggerSuspicious])

  // 🛡️ Anti-Tamper Guard: Destroys player if watermark is deleted or hidden via DevTools
  useEffect(() => {
    if (state !== 'ready') return
    const container = containerRef.current
    if (!container) return
    function verifyWatermark() {
      const el = container.querySelector('#forensic-watermark')
      if (!el) {
        triggerSuspicious('recording_suspected')
        return
      }
      const style = window.getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.1) {
        triggerSuspicious('recording_suspected')
      }
    }
    const observer = new MutationObserver(() => verifyWatermark())
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden']
    })
    const interval = setInterval(verifyWatermark, 2500)
    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [state, triggerSuspicious])

  if (state === 'loading') {
    return <div className="card py-16 text-center text-sm text-ink/50">Preparing your video…</div>
  }

  if (state === 'blocked') {
    return (
      <WatchLimitModal
        totalWatchedSeconds={playback?.totalWatchedSeconds ?? 0}
        maxAllowedSeconds={playback?.maxAllowedSeconds ?? 0}

        onClose={() => window.history.back()}
      />
    )
  }

  if (state === 'incognito_blocked') {
    return (
      <div className="relative w-full rounded-lg overflow-hidden bg-neutral-950 aspect-video flex flex-col items-center justify-center p-6 text-center text-white border border-amber-500/30 shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400 shadow-lg">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-amber-400 mb-2">Private / Incognito Window Detected</h3>
        <p className="text-xs sm:text-sm text-gray-300 max-w-lg mb-4 leading-relaxed">
          Course playback is restricted in private browsing mode. Please open this course in a normal browser window to continue learning.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-5 py-2 text-xs font-medium rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 transition shadow"
        >
          Reload in Regular Window
        </button>
      </div>
    )
  }

  if (state === 'recording_blocked' || state === 'locked_pending_admin') {
    return (
      <div className="relative w-full rounded-lg overflow-hidden bg-black aspect-video flex flex-col items-center justify-center p-6 text-center text-white border border-red-900/50 shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-red-950/80 border border-red-600/40 flex items-center justify-center mb-4 text-red-500 shadow-lg animate-pulse">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-400 mb-2">⚠️ Security Lockdown: Playback Suspended</h3>
        <p className="text-xs sm:text-sm text-gray-300 max-w-lg mb-4 leading-relaxed">
          Screen recording, window capture, or screenshot shortcut activity was detected. To protect copyrighted course content, your playback has been locked and a security incident report has been submitted to the Admin.
        </p>
        <div className="bg-red-950/40 border border-red-800/40 rounded px-4 py-2 text-xs text-red-300 mb-5">
          Your watch timestamp is safely preserved. Once the Administrator reviews and approves your session, you will resume from this exact position.
        </div>
        <button
          type="button"
          onClick={loadToken}
          className="px-5 py-2 text-xs font-medium rounded-md bg-red-600/80 hover:bg-red-600 text-white transition shadow"
        >
          Check Admin Approval & Refresh Status
        </button>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="card py-16 text-center">
        <p className="text-sm text-rust">{errorMessage}</p>
        <button type="button" onClick={loadToken} className="btn-outline btn-sm mt-4">Try again</button>
      </div>
    )
  }

  return (
    <div>
      <div
        ref={containerRef}
        data-shaka-player-container
        className="shaka-video-container relative w-full rounded-lg overflow-hidden bg-black aspect-video select-none"
      >
        <video
          ref={videoRef}
          data-shaka-player
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          onContextMenu={(e) => e.preventDefault()}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          className="shaka-video w-full h-full object-contain"
        />

        {/* 🛡️ Forensic Watermark (Floats above video, pointer-events none so it never blocks controls) */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          <VideoWatermark user={getUser()} clientIp={playback?.clientIp} />
        </div>

        {/* 🛡️ 100% PURE BLACK OVERLAY ON WINDOW BLUR / OBS CAPTURE TRAP */}
        {isBlurred && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-6 text-center z-[100] select-none">
            <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center mb-3 text-neutral-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-neutral-200">Window Inactive — Playback Blacked Out</p>
            <p className="text-xs text-neutral-500 mt-1">Click back onto this tab to continue watching.</p>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-ink/40">
        <span>
          {title} — {Math.floor(playback.remainingSeconds / 60)}m {playback.remainingSeconds % 60}s remaining
        </span>
        <span className="text-[11px] text-ink/50 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Shaka Protected Player (AES-128 DRM)
        </span>
      </div>
    </div>
  )
})

export default ProtectedVideoPlayer