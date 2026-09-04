import { Link } from 'react-router-dom'

function formatTime(seconds) {
  if (!seconds || seconds <= 0) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export default function WatchLimitModal({ totalWatchedSeconds, maxAllowedSeconds, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card max-w-md w-full text-center py-8 px-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rust/10 text-rust text-2xl">
          !
        </div>
        <h2 className="font-display text-xl">Watch limit reached</h2>
        <p className="mt-2 text-sm text-ink/60">
          You've already watched {formatTime(totalWatchedSeconds)} out of {formatTime(maxAllowedSeconds)} allowed time under your
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