import React from 'react'
import ReactDOM from 'react-dom/client'
// import { BrowserRouter } from 'react-router-dom'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { LiveUpdatesProvider } from './context/LiveUpdatesContext'
import * as Sentry from "@sentry/react";

const isElectron = typeof window !== 'undefined' && window.electronAPI?.isDesktopApp
const Router = isElectron ? HashRouter : BrowserRouter

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    // Sentry.feedbackIntegration(),
    // Sentry.captureConsoleIntegration(),

  ],

  // Tracing
  tracesSampleRate: 1.0,

  // ✅ Frontend aur Backend APIs ko connect karne ke liye:
  // tracePropagationTargets: ["localhost", /^https:\/\/api\.macreation\.in/],

  // Session Reply: Error aane pr 100% video record kro 
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* <BrowserRouter> */}
    <Router>
      <LiveUpdatesProvider>
        <App />
      </LiveUpdatesProvider>
    </Router>
    {/* </BrowserRouter> */}
  </React.StrictMode>,
)
