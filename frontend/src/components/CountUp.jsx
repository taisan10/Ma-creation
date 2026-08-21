import { useEffect, useRef, useState } from 'react'

function parseValue(value) {
  const raw = String(value ?? '')
  const match = raw.match(/^(.*?)([0-9][0-9,]*(?:\.[0-9]+)?)(.*)$/)
  if (!match) return null
  const number = Number(match[2].replace(/,/g, ''))
  if (!Number.isFinite(number)) return null
  return { prefix: match[1], number, suffix: match[3], decimals: (match[2].split('.')[1] || '').length }
}

function formatNumber(value, decimals) {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export default function CountUp({ value, duration = 1600, className = '' }) {
  const ref = useRef(null)
  const frameRef = useRef(null)
  const [display, setDisplay] = useState(String(value ?? ''))
  const startedRef = useRef(false)
  const parsed = parseValue(value)

  useEffect(() => {
    if (!parsed || !ref.current || startedRef.current) return
    const element = ref.current
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || startedRef.current) return
      startedRef.current = true
      const start = performance.now()
      const from = 0
      const to = parsed.number

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplay(`${parsed.prefix}${formatNumber(from + (to - from) * eased, parsed.decimals)}${parsed.suffix}`)
        if (progress < 1) frameRef.current = requestAnimationFrame(tick)
      }
      frameRef.current = requestAnimationFrame(tick)
      observer.disconnect()
    }, { threshold: 0.5 })

    observer.observe(element)
    return () => {
      observer.disconnect()
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [parsed?.number, parsed?.prefix, parsed?.suffix, parsed?.decimals, duration])

  return <span ref={ref} className={className}>{display}</span>
}
