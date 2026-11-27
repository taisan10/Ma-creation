import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../lib/utils'

function parseValue(value) {
  const raw = String(value ?? '').trim()
  const match = raw.match(/^(.*?)([0-9][0-9,]*(?:\.[0-9]+)?)(.*)$/)
  if (!match) return null
  // Skip composite values like "24×7" that have additional digits in the suffix.
  if (/\d/.test(match[3])) return null
  const number = Number(match[2].replace(/,/g, ''))
  if (!Number.isFinite(number)) return null
  return {
    prefix: match[1],
    number,
    suffix: match[3],
    decimals: (match[2].split('.')[1] || '').length,
  }
}

function formatNumber(value, decimals) {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export default function CountUp({ value, duration = 1400, className = '' }) {
  const rawValue = String(value ?? '')
  const parsed = useMemo(() => parseValue(rawValue), [rawValue])

  const ref = useRef(null)
  const frameRef = useRef(null)
  const animatedKeyRef = useRef('')
  const [display, setDisplay] = useState(rawValue)

  useEffect(() => {
    setDisplay(rawValue)
  }, [rawValue])

  useEffect(() => {
    if (!parsed || !ref.current) return
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion || animatedKeyRef.current === rawValue) {
      setDisplay(rawValue)
      return
    }

    const element = ref.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || animatedKeyRef.current === rawValue) return
        animatedKeyRef.current = rawValue
        observer.disconnect()

        if (frameRef.current) cancelAnimationFrame(frameRef.current)
        const start = performance.now()
        const to = parsed.number

        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setDisplay(
            `${parsed.prefix}${formatNumber(to * eased, parsed.decimals)}${parsed.suffix}`
          )
          if (progress < 1) {
            frameRef.current = requestAnimationFrame(tick)
          } else {
            setDisplay(rawValue)
          }
        }
        frameRef.current = requestAnimationFrame(tick)
      },
      { threshold: 0.25 }
    )

    observer.observe(element)
    return () => {
      observer.disconnect()
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [rawValue, parsed, duration])

  return (
    <span ref={ref} className={cn('tabular-nums', className)} aria-label={rawValue}>
      <span className="sr-only">{rawValue}</span>
      <span aria-hidden="true">{display}</span>
    </span>
  )
}
