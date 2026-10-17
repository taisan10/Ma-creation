import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { requestPlaybackToken, reportWatchEvent } from '../../lib/videoApi'
import { getUser } from '../../lib/api'
import WatchLimitModal from './WatchLimitModal'
import VideoWatermark from './VideoWatermark'
import Hls from 'hls.js'

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
  const hlsRef = useRef(null)

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

  // Attach video stream: Supports encrypted HLS (.m3u8) via Hls.js with native MP4 fallback
  useEffect(() => {
    const video = videoRef.current
    if (!video || !playback?.url) return

    const url = playback.url
    const isHls = url.includes('.m3u8')

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr) => {
          const token = localStorage.getItem('mac_token')
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`)
          }
        }
      })
      hls.loadSource(url)
      hls.attachMedia(video)
      hlsRef.current = hls

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError()
              break
            default:
              hls.destroy()
              break
          }
        }
      })
    } else {
      video.src = url
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
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
  useImperativeHandle(ref, () => ({
    triggerSuspicious(reason) {
      const token = sessionRef.current?.token
      if (token) reportWatchEvent(videoId, token, reason).catch(() => {})
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.removeAttribute('src')
        videoRef.current.load()
      }
      setState('recording_blocked')
      if (onSuspicious) onSuspicious(reason)
    }
  }), [videoId, onSuspicious])

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
      <div className="relative w-full rounded-lg overflow-hidden bg-black aspect-video">
        <video
          ref={videoRef}
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          onContextMenu={e => e.preventDefault()} // deters casual right-click "Save video as"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          className="w-full h-full object-contain"
        />
        <VideoWatermark user={getUser()} />

        {/* 100% PURE BLACK OVERLAY ON WINDOW BLUR / OBS CAPTURE TRAP */}
        {isBlurred && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-6 text-center z-30 select-none">
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
      <p className="mt-2 text-xs text-ink/40">
        {title} — {Math.floor(playback.remainingSeconds / 60)}m {playback.remainingSeconds % 60}s remaining
      </p>
    </div>
  )
})

export default ProtectedVideoPlayer