import React from 'react'
import ReactDOM from 'react-dom/client'
// import { BrowserRouter } from 'react-router-dom'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { LiveUpdatesProvider } from './context/LiveUpdatesContext'

const isElectron = typeof window !== 'undefined' && window.electronAPI?.isDesktopApp
const Router = isElectron ? HashRouter : BrowserRouter

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
