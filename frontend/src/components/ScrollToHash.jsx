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
        const scroll = () => el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(() => requestAnimationFrame(scroll))
        } else {
          setTimeout(scroll, 60)
        }
        return
      }
    }
    window.scrollTo(0, 0)
  }, [hash, pathname])

  return null
}
