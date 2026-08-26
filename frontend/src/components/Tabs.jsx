import { useState } from 'react'

/**
 * tabs: [{ id: string, label: string }]
 * children: (activeId) => JSX   — render prop so each panel can stay a
 * plain conditional inside the caller, keeping page files readable.
 */
export default function Tabs({ tabs, children, defaultTab }) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id)

  return (
    <div>
      <div role="tablist" className="flex flex-wrap gap-2 border-b border-ink/10 mb-8">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            aria-controls={`tabpanel-${t.id}`}
            id={`tab-${t.id}`}
            onClick={() => setActive(t.id)}
            className={`px-4 py-3 text-sm font-semibold -mb-px border-b-2 transition-colors ${
              active === t.id ? 'text-ink border-gold' : 'text-ink/50 border-transparent hover:text-ink/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`tabpanel-${active}`} aria-labelledby={`tab-${active}`} key={active} className="animate-fadein">
        {children(active)}
      </div>
    </div>
  )
}
