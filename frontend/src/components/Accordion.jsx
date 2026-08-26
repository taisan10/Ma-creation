import { useState } from 'react'

/**
 * items: [{ q: string, a: string }]
 * defaultOpen: index to start expanded, or -1 for none
 */
export default function Accordion({ items, defaultOpen = 0 }) {
  const [openIndex, setOpenIndex] = useState(defaultOpen)

  return (
    <div>
      {items.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div key={i} className="border-b border-ink/10 first:border-t">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-5 py-5 text-left font-semibold text-[15.5px] text-ink"
            >
              <span>{item.q}</span>
              <span
                className={`font-mono text-lg text-gold2 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}
                aria-hidden="true"
              >
                +
              </span>
            </button>
            <div
              className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${isOpen ? 'max-h-[9999px]' : 'max-h-0'}`}
            >
              <p className="pb-5 text-[14.5px] text-ink/70 max-w-[70ch]">{item.a}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
