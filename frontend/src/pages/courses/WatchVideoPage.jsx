import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchCourseVideos } from '../../lib/videoApi'
import { getUser } from '../../lib/api'
import ProtectedVideoPlayer from '../../components/video/ProtectedVideoPlayer'
import RecordingDetectedModal from '../../components/video/RecordingDetectedModal'
import { useRecordingGuard } from '../../lib/useRecordingGuard'

export default function WatchVideoPage() {
  const { courseId, videoId } = useParams()
  const navigate = useNavigate()
  const [video, setVideo] = useState(null)
  const [courseTitle, setCourseTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [suspiciousReason, setSuspiciousReason] = useState(null) // 'recording_suspected' | 'incognito_suspected' | null

  // Ref into ProtectedVideoPlayer (built in Part 7 with forwardRef +
  // useImperativeHandle specifically for this) -- lets this page call
  // playerRef.current.triggerSuspicious(reason) from OUTSIDE the player's
  // own render tree, i.e. from the document-level detection signals below.
  const playerRef = useRef(null)

  const handleDetected = useCallback(reason => {
    // This is the actual trigger: pause/unmount the video, disable further
    // playback, and report the flag to the backend (see Part 5's
    // reportWatchEvent -- it gets recorded on WatchLog.history for audit).
    playerRef.current?.triggerSuspicious(reason)
    setSuspiciousReason(reason)
  }, [])

  // Runs for the entire time this page is mounted -- i.e. for as long as a
  // protected video could be on screen. Disabled once we've already shown
  // the modal once, since useRecordingGuard only ever fires its callback a
  // single time per mount anyway (see firedRef inside the hook).
  useRecordingGuard(handleDetected, { enabled: !suspiciousReason })

  useEffect(() => {
    if (!getUser()) {
      navigate('/login', { replace: true })
      return
    }
    let active = true
    setLoading(true)
    // Re-uses the same entitlement-checked endpoint from Part 4/6 -- if this
    // user doesn't own the plan for this course, the request fails before we
    // even get to rendering a player, and the actual video URL is never
    // requested at all.
    fetchCourseVideos(courseId)
      .then(data => {
        if (!active) return
        setCourseTitle(data.course?.title || '')
        const match = (data.videos || []).find(v => v._id === videoId)
        if (!match) {
          setError('Video not found in this course.')
        } else {
          setVideo(match)
        }
      })
      .catch(e => {
        if (active) setError(e.status === 403 ? "You don't have access to this course." : e.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [courseId, videoId, navigate])

  return (
    <section className="section min-h-[calc(100vh-240px)]">
      <div className="wrap max-w-[900px]">
        <Link to={`/courses/${courseId}`} className="text-sm text-ink/50 hover:text-ink/80">
          &larr; Back to {courseTitle || 'course'}
        </Link>

        {error && (
          <div className="mt-6 rounded-lg border border-rust/20 bg-rust/5 p-4 text-sm text-rust">{error}</div>
        )}

        {loading ? (
          <p className="mt-6 text-sm text-ink/50">Loading…</p>
        ) : video && (
          <div className="mt-6">
            <h1 className="font-display text-2xl mb-4">{video.title}</h1>
            <ProtectedVideoPlayer ref={playerRef} videoId={videoId} title={video.title} />
          </div>
        )}

        {suspiciousReason && (
          <RecordingDetectedModal
            reason={suspiciousReason}
            onReload={() => window.location.reload()}
          />
        )}
      </div>
    </section>
  )
}