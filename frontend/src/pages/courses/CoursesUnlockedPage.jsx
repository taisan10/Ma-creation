
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchMyCourses } from '../../lib/videoApi'
import { getUser } from '../../lib/api'

// 👇 Yahan apni Mobile App ka Google Play Store link daalein:
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.raha.app.mymoney.free&hl=en-US'

export default function CoursesUnlockedPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)

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

  const hasAnyCategories = categories.length > 0

  return (
    <section className="section min-h-[calc(100vh-240px)]">
      <div className="wrap max-w-[1100px]">
        <div className="mb-9">
          <h1 className="font-display text-3xl">Your Unlocked Categories</h1>
          <p className="mt-2 text-sm text-ink/60">
            Select a category below to watch all training videos on our official Mobile App.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-rust/20 bg-rust/5 p-4 text-sm text-rust">{error}</div>
        )}

        {loading ? (
          <p className="text-sm text-ink/50">Loading your unlocked categories…</p>
        ) : !hasAnyCategories && !error ? (
          <div className="card text-center py-12">
            <h2 className="font-display text-2xl">No categories unlocked yet</h2>
            <p className="mt-2 text-sm text-ink/60">
              Buy a training plan and your unlocked categories will show up here automatically once payment is verified.
            </p>
            <Link to="/plans" className="btn-gold btn-sm mt-6 inline-flex">Explore plans</Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(group => {
              const categoryName = group.category?.name || 'Unlocked Training'
              const courseCount = group.courses?.length || 0
              return (
                <button
                  key={group.category?._id || 'uncategorized'}
                  type="button"
                  onClick={() => setSelectedCategory(categoryName)}
                  className="card text-left block hover:border-gold/40 transition-colors cursor-pointer"
                >
                  <span className="inline-block text-[11px] uppercase tracking-wider text-gold font-medium mb-2">
                    Unlocked Plan
                  </span>
                  <h2 className="font-display text-xl">{categoryName}</h2>
                  <p className="mt-2 text-sm text-ink/60">
                    {courseCount} {courseCount === 1 ? 'Course' : 'Courses'} available in Mobile App
                  </p>
                  <p className="mt-4 text-xs font-medium text-gold">
                    Watch on Google Play App &rarr;
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Google Play Store Popup Modal */}
      {selectedCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedCategory(null)}
        >
          <div
            className="card max-w-md w-full p-6 text-center relative bg-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="absolute top-3 right-3 text-ink/50 hover:text-ink text-lg px-2"
              aria-label="Close"
            >
              ✕
            </button>

            <span className="inline-block text-[11px] uppercase tracking-wider text-gold font-medium mb-2">
              Mobile App Exclusive
            </span>
            <h3 className="font-display text-2xl">{selectedCategory}</h3>
            <p className="mt-3 text-sm text-ink/70">
              All training videos for this category are available exclusively on our official Android Mobile App. Login with your same email &amp; password on the app to start watching!
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold w-full justify-center"
              >
                Download on Google Play Store
              </a>
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="btn-outline btn-sm w-full justify-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}