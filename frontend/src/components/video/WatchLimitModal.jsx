import { Link } from 'react-router-dom'

// Shown when the backend responds with 403 WATCH_LIMIT_REACHED (see Part 5's
// requestPlaybackToken) -- i.e. the user has already watched this exact
// video the maximum number of times allowed on their plan.
export default function WatchLimitModal({ watchCount, maxWatchCount, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card max-w-md w-full text-center py-8 px-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rust/10 text-rust text-2xl">
          !
        </div>
        <h2 className="font-display text-xl">Watch limit reached</h2>
        <p className="mt-2 text-sm text-ink/60">
          You've already watched this video {watchCount} out of {maxWatchCount} allowed times under your
          current plan. Please see the Plan Guidelines for details, or extend your watch plan to keep
          watching.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/plans" className="btn-gold btn-sm">Extend Watch Plan</Link>
          <button type="button" onClick={onClose} className="btn-outline btn-sm">Close</button>
        </div>
      </div>
    </div>
  )
}