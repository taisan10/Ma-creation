import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { requestPlaybackToken, reportWatchEvent } from '../../lib/videoApi'
import { getUser } from '../../lib/api'
import WatchLimitModal from './WatchLimitModal'

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

  const [state, setState] = useState('loading') // loading | ready | blocked | error | recording_blocked
  const [playback, setPlayback] = useState(null) // { url, watchCount, maxWatchCount }
  const [errorMessage, setErrorMessage] = useState('')

  const loadToken = useCallback(async () => {
    setState('loading')
    countedRef.current = false
    try {
      const data = await requestPlaybackToken(videoId)
      sessionRef.current = { token: data.sessionToken }
      setPlayback(data)
      setState('ready')
    } catch (e) {
      if (e.code === 'WATCH_LIMIT_REACHED') {
        setState('blocked')
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

  // Fires on every native <video> timeupdate event -- we only act once
  // currentTime crosses COUNT_AFTER_SECONDS, and only once per session
  // (countedRef), then report 'started' to the backend so WatchLog.count
  // actually increments (see Part 5's reportWatchEvent).
  function handleTimeUpdate() {
    const el = videoRef.current
    if (!el || countedRef.current) return
    if (el.currentTime >= COUNT_AFTER_SECONDS) {
      countedRef.current = true
      const token = sessionRef.current?.token
      if (token) reportWatchEvent(videoId, token, 'started').catch(() => {})
    }
  }

  function handleEnded() {
    const token = sessionRef.current?.token
    if (token) reportWatchEvent(videoId, token, 'ended').catch(() => {})
  }

  // This is the function Part 8 calls to unmount playback + report the flag.
  // useImperativeHandle makes it callable as playerRef.current.triggerSuspicious(...)
  // from any parent/detection code holding a ref to this component.
  useImperativeHandle(ref, () => ({
    triggerSuspicious(reason) {
      const token = sessionRef.current?.token
      if (token) reportWatchEvent(videoId, token, reason).catch(() => {})
      // Blanking the <video> src BEFORE changing state is what actually
      // "unmounts" playback immediately, rather than waiting for React's
      // next render pass to remove the element.
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
        watchCount={playback?.watchCount ?? 3}
        maxWatchCount={playback?.maxWatchCount ?? 3}
        onClose={() => window.history.back()}
      />
    )
  }

  if (state === 'recording_blocked') {
    // Part 8 renders its own RecordingDetectedModal alongside this state --
    // placeholder message here so the player is still safely unmounted even
    // before Part 8 adds the richer popup.
    return (
      <div className="card py-16 text-center text-sm text-rust">
        Playback stopped due to suspicious activity. Please stop screen recording before watching.
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
      <video
        ref={videoRef}
        key={playback.url} // forces a fresh <video> element per new token, never reuses a stale src
        src={playback.url}
        controls
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        onContextMenu={e => e.preventDefault()} // deters casual right-click "Save video as"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="w-full rounded-lg bg-black aspect-video"
      />
      <p className="mt-2 text-xs text-ink/40">
        {title} — {playback.watchesRemaining} watch{playback.watchesRemaining === 1 ? '' : 'es'} remaining
      </p>
    </div>
  )
})

export default ProtectedVideoPlayer