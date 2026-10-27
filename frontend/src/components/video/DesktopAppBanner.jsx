import { useState } from 'react'
import { Monitor, Download, ShieldCheck, CheckCircle2, Laptop, Lock } from 'lucide-react'

/**
 * DesktopAppBanner Component
 * - variant="banner": Courses list page par show hota hai
 * - variant="player": Video player ki jagah par show hota hai jab user web browser mein ho
 */
export default function DesktopAppBanner({ variant = 'banner', title = '', className = '' }) {
  const isDesktop = typeof window !== 'undefined' && Boolean(window.electronAPI?.isDesktopApp)
  const [downloading, setDownloading] = useState(false)

  // Default download URL for the built Windows installer
  const downloadUrl = '/downloads/MA-Creation-Setup.exe'

  function handleDownload() {
    setDownloading(true)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = 'MA-Creation-Setup.exe'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => setDownloading(false), 2000)
  }

  // Agar user pehle se hi Electron Desktop App ke andar chal raha hai
  if (isDesktop) {
    if (variant === 'player') return null // Player variant desktop app mein normal video player chalne deta hai
    return (
      <div className={`rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 sm:p-5 flex items-center justify-between gap-4 text-emerald-300 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 grid place-items-center text-emerald-400 shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              Official Desktop App Active
            </div>
            <div className="text-sm font-medium text-white/90 mt-0.5">
              Ultra DRM & Screen Recording Defense is actively protecting this playback session.
            </div>
          </div>
        </div>
        <span className="hidden sm:inline-flex text-[11px] font-mono px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
          v1.0.0 Secured
        </span>
      </div>
    )
  }

  // Variant 1: "player" (Jab web browser mein user video play karne ki koshish kare)
  if (variant === 'player') {
    return (
      <div className={`relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 border border-gold/30 aspect-video flex flex-col items-center justify-center p-6 sm:p-8 text-center text-white shadow-2xl ${className}`}>
        {/* Ambient Gold Glow */}
        <div className="absolute inset-0 bg-radial-gradient from-gold/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gold/15 border border-gold/40 flex items-center justify-center mb-4 text-gold shadow-lg shadow-gold/20 animate-pulse">
            <Lock size={28} />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-gold/20 text-gold border border-gold/30 uppercase tracking-wider mb-2">
            <ShieldCheck size={13} />
            Desktop App Playback Required
          </span>

          <h2 className="text-lg sm:text-2xl font-display font-semibold text-white tracking-tight mb-2">
            Video Dekhne Ke Liye Desktop Package Install Karein
          </h2>

          <p className="text-xs sm:text-sm text-neutral-300 mb-6 leading-relaxed max-w-md">
            {title ? `"${title}"` : 'Course videos'} copyright aur screen-recording protection se secured hain. Bina kisi rukawat ke video dekhne ke liye MA Creation desktop package install karein.
          </p>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="px-6 py-3.5 rounded-xl bg-gold hover:bg-gold/90 text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-gold/25 transition-all hover:scale-105 active:scale-95"
          >
            <Download size={18} className={downloading ? 'animate-bounce' : ''} />
            <span>{downloading ? 'Downloading Setup…' : 'Install Desktop App (.exe)'}</span>
          </button>

          <div className="mt-4 flex items-center gap-3 text-[11px] text-neutral-400 font-mono">
            <span>Windows 10/11</span>
            <span>•</span>
            <span>Version 1.0.0</span>
            <span>•</span>
            <span>AES-128 HLS DRM</span>
          </div>
        </div>
      </div>
    )
  }

  // Variant 2: "banner" (Standard card)
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-paper/20 bg-gradient-to-r from-ink via-ink/95 to-paper2/90 text-paper p-5 sm:p-6 shadow-xl ${className}`}>
      <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-gold/15 blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold/20 text-gold border border-gold/30">
              <ShieldCheck size={14} />
              Protected Video Requirement
            </span>
            <span className="text-xs text-paper/50">· Windows 10 / 11 (64-bit)</span>
          </div>

          <div>
            <h2 className="font-display text-xl sm:text-2xl text-paper tracking-tight flex items-center gap-2">
              <Monitor className="text-gold" size={24} />
              Course Videos Dekhne Ke Liye Desktop Package Install Karein
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-paper/75 leading-relaxed">
              Video lessons high-definition encrypted DRM format mein hain. Screen capture, piracy rokne aur bina kisi rukawat smooth video playback ke liye <b>MA Creation Desktop App</b> install karna zaroori hai.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-paper/70 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              AES-128 HLS Playback
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Anti-Screen Recording Guard
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Offline Timestamp Sync
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gold hover:bg-gold/90 text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-gold/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download size={18} className={downloading ? 'animate-bounce' : ''} />
            <span>{downloading ? 'Downloading Setup…' : 'Install Desktop App (.exe)'}</span>
          </button>
          <div className="text-[11px] text-paper/40 flex items-center gap-1.5">
            <Laptop size={12} />
            <span>Size: ~85 MB · Setup 1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}
