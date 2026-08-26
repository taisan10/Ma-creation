import { useEffect, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { SealMark } from './Seal'
import { getUser, api } from '../lib/api'
import { useTheme } from '../theme'

const navLinks = [
  { to: '/about', label: 'About Us' },
  { to: '/services', label: 'Services' },
  { to: '/plans', label: 'Plans & Servicing' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const user=getUser()
  const [brand,setBrand]=useState({})
  const { theme } = useTheme()
  useEffect(()=>{let active=true;api('/public/settings/brand').then(r=>{if(active)setBrand(r.setting?.value||{})}).catch(()=>{});return()=>{active=false}},[])

  return (
    <header className="sticky top-0 z-[70] bg-paper/90 backdrop-blur border-b border-ink/10">
      <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg,${theme.primary} 0 33.3%, ${theme.secondary} 33.3% 66.6%, ${theme.accent} 66.6% 100%)` }} />
      <div className="wrap site-header-inner flex items-center justify-between gap-5 py-3.5">
        <Link to="/" className="flex items-center gap-2.5 font-display text-xl font-semibold text-ink shrink-0">
          <SealMark className="w-8 h-8 shrink-0" />
          <span className="header-brand-name">{brand.name||'MA Creation'}</span>
        </Link>

        <nav
          className={`site-nav ${open ? 'mobile-nav-open' : ''} hidden md:flex flex-col md:flex-row md:items-center gap-0.5 md:gap-6
                      fixed md:static inset-x-0 top-[65px] md:top-auto bottom-0 md:bottom-auto
                      bg-paper md:bg-transparent px-7 md:px-0 py-4 md:py-0 md:overflow-visible overflow-y-auto`}
        >
          {navLinks.map((l) =>
            l.external ? (
              <a
                key={l.label}
                href={l.to}
                onClick={() => setOpen(false)}
                className="text-[15px] md:text-sm text-ink/70 hover:text-ink py-3.5 md:py-1.5 border-b md:border-0 border-ink/10"
              >
                {l.label}
              </a>
            ) : (
              <NavLink
                key={l.label}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `relative text-[15px] md:text-sm py-3.5 md:py-1.5 border-b md:border-0 border-ink/10 ${
                    isActive
                      ? 'text-ink md:after:content-[""] md:after:absolute md:after:left-0 md:after:right-0 md:after:-bottom-1.5 md:after:h-0.5 md:after:bg-gold'
                      : 'text-ink/70 hover:text-ink'
                  }`
                }
              >
                {l.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {user?.role==='admin'?<Link to="/admin" className="hidden sm:inline-flex btn-outline btn-sm">Admin</Link>:user?<Link to="/account" className="hidden sm:inline-flex btn-outline btn-sm">My Account</Link>:<Link to="/login" className="hidden sm:inline-flex btn-outline btn-sm">Login</Link>}
          <Link to="/#demo" className="btn-gold btn-sm header-demo-cta">Book Free Demo</Link>
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="md:hidden w-9 h-9 border border-ink/25 rounded flex items-center justify-center shrink-0"
          >
            <span className="relative block w-4 h-[1.5px] bg-ink before:content-[''] before:absolute before:w-4 before:h-[1.5px] before:bg-ink before:-top-[5px] after:content-[''] after:absolute after:w-4 after:h-[1.5px] after:bg-ink after:top-[5px]" />
          </button>
        </div>
      </div>
    </header>
  )
}
