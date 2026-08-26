import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="py-20 min-h-[calc(100vh-320px)] flex items-center">
      <div className="wrap text-center">
        <p className="font-mono text-6xl font-bold text-ink/15">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Page not found</h1>
        <p className="mt-3 text-ink/60 text-sm max-w-[42ch] mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="btn-gold btn-sm mt-8 inline-flex">Back to home</Link>
      </div>
    </section>
  )
}
