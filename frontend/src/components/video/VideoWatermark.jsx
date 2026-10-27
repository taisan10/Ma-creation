import { useState, useEffect } from 'react'

/**
 * Dynamic Forensic Watermark for Video Playback
 * Displays user identity (email, ID, timestamp) floating across random
 * screen coordinates every 6-8 seconds.
 * 
 * - Pointer-events: none ensures full native video controls responsiveness.
 * - Semi-transparent high-contrast drop-shadow ensures legibility on both dark & light scenes.
 * - Prevents anonymous screen recording / leakages.
 */
export default function VideoWatermark({ user, clientIp }) {
  const [position, setPosition] = useState({ top: '25%', left: '20%' })
  const [currentTime, setCurrentTime] = useState('')

  // Update live clock every second
  useEffect(() => {
    function updateClock() {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour12: false }))
    }
    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  // Randomize watermark position every 7 seconds
  useEffect(() => {
    function moveWatermark() {
      const top = Math.floor(Math.random() * 55) + 20 + '%' 
         const left = Math.floor(Math.random() * 50) + 20 + '%'
      setPosition({ top, left })
    }

    moveWatermark()
    const interval = setInterval(moveWatermark, 7000)
    return () => clearInterval(interval)
  }, [])

  const identifier = user?.email || user?.name || 'Authorized Learner'
  const userId = user?.id || user?._id || ''
  const displayId = userId ? `ID: ${String(userId).slice(-6).toUpperCase()}` : ''

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden z-10"
      aria-hidden="true"
    >
      {/* Primary Floating Forensic Watermark */}
      <div
      id="forensic-watermark"
        style={{ top: position.top, left: position.left }}
        className="absolute transition-all duration-1000 ease-in-out px-3 py-1.5 rounded bg-black/25 backdrop-blur-[1px] border border-white/10"
      >
        <div className="flex flex-col items-start gap-0.5 font-mono text-[11px] sm:text-xs text-white/50 tracking-wider drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
          <span className="font-semibold">{identifier} {user?.phone ? `• ${user.phone}` : ''} </span>
          <span className="text-[10px] text-white/40">{displayId} • {currentTime}
          {clientIp ? `• IP: ${clientIp}` : ''}
          </span>
        </div>
      </div>

      {/* Subtle Corner Secondary Marker */}
      <div className="absolute bottom-16 right-4 font-mono text-[9px] text-white/20 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {identifier}
      </div>
    </div>
  )
}
