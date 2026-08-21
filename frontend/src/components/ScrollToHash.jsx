import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Scrolls to #hash targets on route change (React Router doesn't do this
// automatically), and resets scroll to top on plain page navigations.
export default function ScrollToHash() {
  const { hash, pathname } = useLocation()

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.replace('#', ''))
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
        return
      }
    }
    window.scrollTo(0, 0)
  }, [hash, pathname])

  return null
}
