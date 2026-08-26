import { useEffect, useRef } from 'react'

// Dependency-free 3D fallback used in the sandbox build. The production package.json
// declares @react-three/fiber + three so this surface can be swapped to a full WebGL
// scene after dependency installation without changing the page contract.
export default function ThreeHero() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let frame = 0
    let animationId
    const tick = () => { frame += 0.006; el.style.setProperty('--rx', `${Math.sin(frame) * 7}deg`); el.style.setProperty('--ry', `${frame * 24}deg`); animationId = requestAnimationFrame(tick) }
    animationId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationId)
  }, [])
  return <div ref={ref} aria-hidden="true" className="hero-3d"><div className="hero-3d-grid"/><div className="hero-3d-core"><span>GeM</span></div><div className="hero-3d-ring ring-a"/><div className="hero-3d-ring ring-b"/></div>
}

