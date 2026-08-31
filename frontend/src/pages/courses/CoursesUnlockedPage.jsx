import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchMyCourses } from '../../lib/videoApi'
import { getUser } from '../../lib/api'

export default function CoursesUnlockedPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!getUser()) {
      navigate('/login', { replace: true })
      return
    }
    let active = true
    setLoading(true)
    fetchMyCourses()
      .then(data => {
        if (!active) return
        setCategories(Array.isArray(data.categories) ? data.categories : [])
      })
      .catch(e => {
        if (active) setError(e.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [navigate])

  const hasAnyCourses = categories.some(group => group.courses?.length > 0)

  return (
    <section className="section min-h-[calc(100vh-240px)]">
      <div className="wrap max-w-[1100px]">
        <div className="mb-9">
          <h1 className="font-display text-3xl">Your Courses</h1>
          <p className="mt-2 text-sm text-ink/60">
            Everything unlocked by the plans you've purchased.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-rust/20 bg-rust/5 p-4 text-sm text-rust">{error}</div>
        )}

        {loading ? (
          <p className="text-sm text-ink/50">Loading your courses…</p>
        ) : !hasAnyCourses && !error ? (
          <div className="card text-center py-12">
            <h2 className="font-display text-2xl">No courses unlocked yet</h2>
            <p className="mt-2 text-sm text-ink/60">
              Buy a training plan and its courses will show up here automatically once payment is verified.
            </p>
            <Link to="/plans" className="btn-gold btn-sm mt-6 inline-flex">Explore plans</Link>
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map(group => (
              <div key={group.category?._id || 'uncategorized'}>
                <h2 className="font-display text-xl mb-4">
                  {group.category?.name || 'Other Courses'}
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.courses.map(course => (
                    <Link
                      key={course._id}
                      to={`/courses/${course._id}`}
                      className="card block hover:border-gold/40 transition-colors"
                    >
                      {course.thumbnailUrl && (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-36 object-cover rounded-md mb-3"
                        />
                      )}
                      <h3 className="font-display text-lg">{course.title}</h3>
                      {course.description && (
                        <p className="mt-1 text-sm text-ink/60 line-clamp-2">{course.description}</p>
                      )}
                      {course.planName && (
                        <p className="mt-3 text-[11px] uppercase tracking-wide text-ink/40">
                          {course.planName}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
