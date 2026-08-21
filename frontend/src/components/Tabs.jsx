import { useState } from 'react'

/**
 * tabs: [{ id: string, label: string }]
 * children: (activeId) => JSX   — render prop so each panel can stay a
 * plain conditional inside the caller, keeping page files readable.
 */
export default function Tabs({ tabs, children }) {
  const [active, setActive] = useState(tabs[0]?.id)

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-ink/10 mb-8">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`px-4 py-3 text-sm font-semibold -mb-px border-b-2 transition-colors ${
              active === t.id ? 'text-ink border-gold' : 'text-ink/50 border-transparent hover:text-ink/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div key={active} className="animate-fadein">
        {children(active)}
      </div>
    </div>
  )
}
