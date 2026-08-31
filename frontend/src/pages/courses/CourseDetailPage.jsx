import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchCourseVideos } from '../../lib/videoApi'
import { getUser } from '../../lib/api'

function formatDuration(seconds) {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function CourseDetailPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!getUser()) {
      navigate('/login', { replace: true })
      return
    }
    let active = true
    setLoading(true)
    fetchCourseVideos(courseId)
      .then(data => {
        if (!active) return
        setCourse(data.course)
        setVideos(Array.isArray(data.videos) ? data.videos : [])
      })
      .catch(e => {
        // requireCourseEntitlement returns 403 if this user never actually
        // paid for the plan that unlocks this course -- surfaced here as a
        // plain message rather than a raw error code.
        if (active) setError(e.status === 403 ? "You don't have access to this course." : e.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [courseId, navigate])

  return (
    <section className="section min-h-[calc(100vh-240px)]">
      <div className="wrap max-w-[900px]">
        <Link to="/courses" className="text-sm text-ink/50 hover:text-ink/80">&larr; Back to your courses</Link>

        {error && (
          <div className="mt-6 rounded-lg border border-rust/20 bg-rust/5 p-4 text-sm text-rust">{error}</div>
        )}

        {loading ? (
          <p className="mt-6 text-sm text-ink/50">Loading…</p>
        ) : course && (
          <>
            <div className="mt-6 mb-8">
              <h1 className="font-display text-3xl">{course.title}</h1>
              {course.description && <p className="mt-2 text-sm text-ink/60">{course.description}</p>}
            </div>

            <div className="space-y-3">
              {videos.map((video, idx) => (
                <div key={video._id} className="card flex items-center gap-4 py-4">
                  <span className="font-display text-lg text-ink/30 w-6 text-center">{idx + 1}</span>
                  {video.thumbnailUrl && (
                    <img src={video.thumbnailUrl} alt={video.title} className="w-24 h-16 object-cover rounded-md" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{video.title}</h3>
                    {video.description && <p className="text-xs text-ink/50 mt-0.5">{video.description}</p>}
                  </div>
                  {video.durationSeconds > 0 && (
                    <span className="text-xs text-ink/40">{formatDuration(video.durationSeconds)}</span>
                  )}
                  {/* Part 7 replaces this Link with the actual
                      ProtectedVideoPlayer, wired to requestPlaybackToken()
                      and the watch-limit / recording-detection logic. */}
                  <Link to={`/courses/${courseId}/watch/${video._id}`} className="btn-gold btn-sm">
                    Play
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}