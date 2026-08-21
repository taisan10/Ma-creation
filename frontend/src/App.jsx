import { useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToHash from './components/ScrollToHash'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './theme'
import { useLiveUpdates } from './context/LiveUpdatesContext'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')
  const { revision } = useLiveUpdates()

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <ScrollToHash />
        {!isAdmin && <Header key={`header-${revision}`} />}
        <main className="flex-1">
          <ErrorBoundary key={pathname}>
            <AppRoutes />
          </ErrorBoundary>
        </main>
        {!isAdmin && <Footer key={`footer-${revision}`} />}
      </div>
    </ThemeProvider>
  )
}
