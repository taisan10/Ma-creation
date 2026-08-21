import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Palette, Sparkles } from 'lucide-react'
import { useTheme, THEME_LABELS } from '../theme'

export default function Theme() {
  const { theme, loading } = useTheme()
  const entries = Object.entries(THEME_LABELS)
  return (
    <div className="section">
      <div className="wrap">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-text mb-8"><ArrowLeft size={16}/>Back to website</Link>
        <div className="max-w-3xl">
          <span className="eyebrow"><Palette size={14}/> Design System</span>
          <h1 className="h2 mt-3">MA Creation colour system</h1>
          <p className="lede mt-4">Every primary UI colour is controlled from one theme object. Administrators can paste HEX or RGB values and apply them across the complete website.</p>
        </div>
        {loading ? <div className="mt-10 text-muted">Loading theme…</div> : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-10">
              {entries.map(([key, label]) => (
                <div key={key} className="theme-swatch card p-4 hover:translate-y-0" style={{ '--swatch': theme[key] }}>
                  <div className="h-24 rounded-xl border border-border/60" style={{ background: theme[key] }} />
                  <div className="mt-4 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{background: theme[key]}}/><span className="font-semibold text-sm">{label}</span></div>
                  <code className="mt-1 block text-xs text-muted uppercase">{theme[key]}</code>
                </div>
              ))}
            </div>
            <div className="mt-10 grid md:grid-cols-3 gap-5">
              <div className="card"><CheckCircle2 className="text-success"/><h3 className="mt-3 font-display text-xl">One source of truth</h3><p className="mt-2 text-muted text-sm">Header, buttons, cards, forms, admin, 3D scenes and status colours read the same CSS tokens.</p></div>
              <div className="card"><Sparkles className="text-primary"/><h3 className="mt-3 font-display text-xl">Live theme update</h3><p className="mt-2 text-muted text-sm">Save the theme in Admin → Site Theme and refresh the public pages to load the saved palette.</p></div>
              <div className="card"><Palette className="text-secondary"/><h3 className="mt-3 font-display text-xl">HEX + RGB</h3><p className="mt-2 text-muted text-sm">The editor accepts #RRGGBB, #RGB, rgb() and rgba() input and normalizes it to HEX.</p></div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
