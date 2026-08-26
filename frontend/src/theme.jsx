import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLiveUpdates } from './context/LiveUpdatesContext'
import { api } from './lib/api'

export const DEFAULT_FONT_FAMILY = '"IBM Plex Sans", "Segoe UI", sans-serif'

export const FONT_SECTIONS = [
  ['home.hero', 'Home · Hero'],
  ['home.gemOverview', 'Home · GeM Overview'],
  ['home.featuredIndustries', 'Home · Featured Industries'],
  ['home.servicesOverview', 'Home · Services Overview'],
  ['home.certifications', 'Home · Certifications'],
  ['home.demo', 'Home · Demo'],
  ['home.caseFileSummary', 'Home · Case File Summary'],
  ['home.industries', 'Home · Industries'],
  ['home.documentation', 'Home · Documentation'],
  ['home.partners', 'Home · Partners'],
  ['home.trainingHub', 'Home · Training Hub'],
  ['home.testimonials', 'Home · Testimonials'],
  ['home.faq', 'Home · FAQ'],
  ['home.cta', 'Home · CTA'],
  ['about.hero', 'About · Hero'],
  ['about.story', 'About · Story'],
  ['about.founder', 'About · Founder'],
  ['about.missionVision', 'About · Mission & Vision'],
  ['about.whyDifferent', 'About · Why MA Creation'],
  ['about.howWeWork', 'About · How We Work'],
  ['about.capabilityMap', 'About · Capability Map'],
  ['about.clientOutcomes', 'About · Client Outcomes'],
  ['about.gemJourney', 'About · GeM Journey'],
  ['about.aiAdvantage', 'About · AI Advantage'],
  ['about.aiRoadmap', 'About · AI Roadmap'],
  ['about.certificationsCta', 'About · Certifications CTA'],
  ['services.hero', 'Services · Hero'],
  ['services.catalog', 'Services · Catalog'],
  ['services.pillars', 'Services · Pillars'],
  ['services.documents', 'Services · Documents'],
  ['plans.hero', 'Plans · Hero'],
  ['plans.retainer', 'Plans · Retainer'],
  ['plans.packages', 'Plans · Packages'],
  ['plans.training', 'Plans · Training'],
  ['plans.trust', 'Plans · Trust Builder'],
  ['plans.faq', 'Plans · FAQ'],
]

export const DEFAULT_SECTION_FONTS = Object.fromEntries(FONT_SECTIONS.map(([key]) => [key, '']))

export const DEFAULT_THEME = {
  primary: '#5B4FE0', primaryDark: '#4038A8', secondary: '#2E8C82', secondaryDark: '#1F5F58',
  accent: '#BFF4DE', accent2: '#9FD8E8', background: '#F3F8F5', backgroundAlt: '#E9F3ED',
  backgroundSoft: '#DCEAE2', surface: '#FFFFFF', text: '#0A0A12', textSoft: '#15141F',
  muted: '#667085', border: '#D6E0DB', success: '#2E8C82', warning: '#B7791F', danger: '#A6402E',
  shadow: '#0B1F3A', fontFamily: DEFAULT_FONT_FAMILY, sectionFonts: DEFAULT_SECTION_FONTS,
}

export const THEME_LABELS = {
  primary: 'Primary', primaryDark: 'Primary Dark', secondary: 'Secondary', secondaryDark: 'Secondary Dark',
  accent: 'Accent', accent2: 'Accent 2', background: 'Background', backgroundAlt: 'Background Alt',
  backgroundSoft: 'Background Soft', surface: 'Surface / Card', text: 'Text', textSoft: 'Text Soft',
  muted: 'Muted Text', border: 'Border', success: 'Success', warning: 'Warning', danger: 'Danger', shadow: '3D Shadow'
}

function parseColor(value) {
  const input = String(value || '').trim()
  if (!input) return null
  let hex = input
  if (/^#?[0-9a-f]{3}$/i.test(input)) {
    hex = input.replace('#', '').split('').map(c => c + c).join('')
  } else if (/^#?[0-9a-f]{6}$/i.test(input)) {
    hex = input.replace('#', '')
  } else {
    const rgb = input.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/i)
    if (rgb) {
      const nums = rgb.slice(1, 4).map(Number)
      if (nums.every(n => n >= 0 && n <= 255)) return `#${nums.map(n => n.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
    }
    const spaceRgb = input.match(/^rgba?\(\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})(?:\s*\/\s*[\d.]+)?\s*\)$/i)
    if (spaceRgb) {
      const nums = spaceRgb.slice(1, 4).map(Number)
      if (nums.every(n => n >= 0 && n <= 255)) return `#${nums.map(n => n.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
    }
    return null
  }
  return `#${hex}`.toUpperCase()
}

function sanitizeFontFamily(value, fallback = DEFAULT_FONT_FAMILY) {
  const input = String(value ?? '').trim()
  if (!input) return fallback
  if (/[{};<>]/.test(input) || input.length > 300) return fallback
  return input
}

function normalizeSectionFonts(value = {}) {
  return Object.fromEntries(FONT_SECTIONS.map(([key]) => [key, sanitizeFontFamily(value?.[key], '') === DEFAULT_FONT_FAMILY ? '' : sanitizeFontFamily(value?.[key], '')]))
}

function hexToRgb(hex) {
  const normalized = parseColor(hex) || '#000000'
  return [1, 3, 5].map(i => parseInt(normalized.slice(i, i + 2), 16))
}

export function isValidColor(value) { return Boolean(parseColor(value)) }
export function normalizeColor(value) { return parseColor(value) }
export function normalizeFontFamily(value, fallback = DEFAULT_FONT_FAMILY) { return sanitizeFontFamily(value, fallback) }

export function applyTheme(theme) {
  const root = document.documentElement
  Object.entries(theme).forEach(([key, value]) => {
    const normalized = parseColor(value)
    if (!normalized) return
    const rgb = hexToRgb(normalized).join(' ')
    root.style.setProperty(`--${key}`, normalized)
    root.style.setProperty(`--${key}-rgb`, rgb)
  })
  root.style.setProperty('--site-font-family', sanitizeFontFamily(theme.fontFamily))
  root.style.setProperty('--effective-font-family', sanitizeFontFamily(theme.fontFamily))
  Object.entries(theme.sectionFonts || {}).forEach(([section, value]) => {
    const safeKey = section.replace(/[^a-zA-Z0-9_-]/g, '-')
    const property = `--section-font-${safeKey}`
    const safeValue = sanitizeFontFamily(value, '')
    if (safeValue) root.style.setProperty(property, safeValue)
    else root.style.removeProperty(property)
  })
  root.style.setProperty('--brand-gradient', `linear-gradient(135deg, ${theme.accent || DEFAULT_THEME.accent} 0%, ${theme.accent2 || DEFAULT_THEME.accent2} 45%, ${theme.primary || DEFAULT_THEME.primary} 100%)`)
  root.style.setProperty('--brand-ribbon', `linear-gradient(120deg, ${theme.primary || DEFAULT_THEME.primary} 0%, ${theme.secondary || DEFAULT_THEME.secondary} 55%, ${theme.accent || DEFAULT_THEME.accent} 100%)`)
}

if (typeof document !== 'undefined') applyTheme(DEFAULT_THEME)

const ThemeContext = createContext({ theme: DEFAULT_THEME, loading: false, refreshTheme: async () => {} })

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(DEFAULT_THEME)
  const [loading, setLoading] = useState(true)
  const { lastUpdate } = useLiveUpdates()

  const refreshTheme = useCallback(async () => {
    try {
      const result = await api('/public/settings/theme')
      const incoming = result.setting?.value || {}
      const colors = Object.fromEntries(Object.keys(DEFAULT_THEME).filter(key => !['fontFamily', 'sectionFonts'].includes(key)).map(key => [key, parseColor(incoming[key]) || DEFAULT_THEME[key]]))
      const safe = {
        ...colors,
        fontFamily: sanitizeFontFamily(incoming.fontFamily, DEFAULT_FONT_FAMILY),
        sectionFonts: normalizeSectionFonts(incoming.sectionFonts || DEFAULT_SECTION_FONTS),
      }
      setTheme(safe)
    } catch {
      setTheme(DEFAULT_THEME)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refreshTheme() }, [refreshTheme])
  useEffect(() => {
    if (!lastUpdate) return
    const isThemeUpdate = lastUpdate.resource === 'theme' || (lastUpdate.resource === 'settings' && lastUpdate.key === 'theme')
    if (isThemeUpdate) refreshTheme()
  }, [lastUpdate, refreshTheme])
  useEffect(() => { applyTheme(theme) }, [theme])

  const value = useMemo(() => ({ theme, setTheme, loading, refreshTheme }), [theme, loading, refreshTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() { return useContext(ThemeContext) }
