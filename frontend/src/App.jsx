import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToHash from './components/ScrollToHash'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './theme'
import { useLiveUpdates } from './context/LiveUpdatesContext'
import AppRoutes from './routes/AppRoutes'
import { api } from './lib/api'

export default function App() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')
  const { revision } = useLiveUpdates()

  // Real-time Single Device Session Validator
  useEffect(() => {
    if (pathname === '/login' || !localStorage.getItem('mac_token')) return

    let isChecking = false
    const verifySession = async () => {
      if (isChecking || !localStorage.getItem('mac_token')) return
      isChecking = true
      try {
        await api('/auth/me')
      } catch {
        // api() automatically catches 401, verifies SESSION_REPLACED,
        // sets auth_notice, clears tokens, and redirects to /login.
      } finally {
        isChecking = false
      }
    }

    // 1. Check periodically every 5 seconds
    const interval = setInterval(verifySession, 5000)

    // 2. Check immediately when user switches back to this tab / window
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        verifySession()
      }
    }

    // 3. Check immediately when storage changes in another tab
    const onStorage = (e) => {
      if (e.key === 'mac_token' || e.key === 'mac_user') {
        verifySession()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', onVisibilityChange)
    window.addEventListener('storage', onStorage)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', onVisibilityChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [pathname])

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <ScrollToHash />
        {!isAdmin && <Header revision={revision} />}
        <main className="flex-1">
          <ErrorBoundary key={pathname}>
            <AppRoutes />
          </ErrorBoundary>
        </main>
        {!isAdmin && <Footer revision={revision} />}
      </div>
    </ThemeProvider>
  )
}
