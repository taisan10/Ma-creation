// import { Canvas, useFrame } from '@react-three/fiber'
// import { Float, Html, RoundedBox } from '@react-three/drei'
// import { useRef } from 'react'
// import { useTheme } from '../../theme'
// import { CheckCircle2, FileCheck2, Gavel, PackageCheck } from 'lucide-react'

// const steps = [
//   { label: 'Documents', status: 'Verified', icon: FileCheck2, tone: 'success' },
//   { label: 'GeM Listing', status: 'Live', icon: PackageCheck, tone: 'secondary' },
//   { label: 'Bid Filed', status: 'Submitted', icon: Gavel, tone: 'primary' },
// ]

// function Folder({ theme }) {
//   const ref = useRef()
//   useFrame((_, delta) => {
//     if (ref.current) ref.current.rotation.y += delta * 0.16
//   })
//   return (
//     <group ref={ref}>
//       <RoundedBox args={[2.8, 2.0, .22]} radius={.18} smoothness={5} position={[0, -.1, 0]}>
//         <meshStandardMaterial color={theme.primary} roughness={.3} metalness={.15} />
//       </RoundedBox>
//       <RoundedBox args={[1.1, .38, .26]} radius={.08} smoothness={4} position={[-.72, 1.0, 0]}>
//         <meshStandardMaterial color={theme.primaryDark} roughness={.35} metalness={.1} />
//       </RoundedBox>
//       <RoundedBox args={[2.45, 1.45, .28]} radius={.12} smoothness={4} position={[0, .05, .2]} rotation={[.05, 0, -.04]}>
//         <meshStandardMaterial color={theme.surface} roughness={.5} metalness={.05} />
//       </RoundedBox>
//     </group>
//   )
// }

// function Scene({ theme }) {
//   return (
//     <>
//       <ambientLight intensity={1.6} />
//       <directionalLight position={[4, 5, 6]} intensity={3} />
//       <pointLight position={[-4, 2, 2]} intensity={1.4} />
//       <Float speed={1.6} rotationIntensity={.25} floatIntensity={.8}>
//         <Folder theme={theme} />
//         <Html center position={[0, -.1, .5]} transform distanceFactor={3.8}>
//           <div className="pointer-events-none select-none text-center w-28">
//             <div className="text-[10px] font-mono uppercase tracking-[.18em] text-muted">Case File</div>
//             <div className="mt-1 font-display text-lg font-semibold text-text">MAC / GEM</div>
//           </div>
//         </Html>
//       </Float>
//       <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]}>
//         <planeGeometry args={[8, 8]} />
//         <meshStandardMaterial color={theme.backgroundAlt} transparent opacity={.55} />
//       </mesh>
//     </>
//   )
// }

// export default function ThreeCaseFile() {
//   const { theme } = useTheme()
//   return (
//     <div className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-border bg-backgroundAlt/70">
//       <Canvas camera={{ position: [0, 0, 5.8], fov: 38 }} dpr={[1, 1.5]}>
//         <Scene theme={theme} />
//       </Canvas>
//       <div className="absolute inset-x-4 bottom-4 grid grid-cols-3 gap-2 sm:inset-x-6 sm:bottom-5 sm:gap-3">
//         {steps.map(({ label, status, icon: Icon, tone }) => (
//           <div key={label} className="rounded-xl border border-border/70 bg-surface/90 p-2.5 backdrop-blur sm:p-3">
//             <div className="flex items-center gap-2"><Icon size={15} className={tone === 'primary' ? 'text-primary' : tone === 'secondary' ? 'text-secondary' : 'text-success'} /><span className="font-mono text-[9px] uppercase tracking-wide text-muted sm:text-[10px]">{label}</span></div>
//             <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-text"><CheckCircle2 size={12} className="text-success"/>{status}</div>
//           </div>
//         ))}
//       </div>
//     </div>
//   )
// }


import { useEffect, useRef } from 'react'
import {
  CheckCircle2,
  FileCheck2,
  Gavel,
  PackageCheck,
} from 'lucide-react'
import { useTheme } from '../../theme'

const steps = [
  {
    label: 'Documents',
    status: 'Verified',
    icon: FileCheck2,
    tone: 'success',
  },
  {
    label: 'GeM Listing',
    status: 'Live',
    icon: PackageCheck,
    tone: 'secondary',
  },
  {
    label: 'Bid Filed',
    status: 'Submitted',
    icon: Gavel,
    tone: 'primary',
  },
]

export default function ThreeCaseFile() {
  const ref = useRef(null)
  const { theme } = useTheme()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let frame = 0
    let animationId

    const tick = () => {
      frame += 0.006

      el.style.setProperty(
        '--rx',
        `${Math.sin(frame) * 7}deg`
      )

      el.style.setProperty(
        '--ry',
        `${frame * 24}deg`
      )

      el.style.setProperty(
        '--float-y',
        `${Math.sin(frame * 1.5) * 8}px`
      )

      animationId = requestAnimationFrame(tick)
    }

    animationId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(animationId)
  }, [])

  const getToneClass = (tone) => {
    if (tone === 'primary') return 'text-primary'
    if (tone === 'secondary') return 'text-secondary'
    return 'text-success'
  }

  return (
    <div
      className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-border bg-backgroundAlt/70"
      style={{
        '--theme-primary': theme.primary,
        '--theme-secondary': theme.secondary,
        '--theme-success': theme.success,
        '--theme-surface': theme.surface,
        '--theme-background': theme.backgroundAlt,
      }}
    >
      {/* 3D HERO */}
      <div
        ref={ref}
        aria-hidden="true"
        className="hero-3d-case-file absolute inset-0"
      >
        {/* Background Grid */}
        <div className="hero-3d-grid" />

        {/* Ambient Glow */}
        <div className="hero-3d-glow" />

        {/* Central GeM Core */}
        <div className="hero-3d-core">
          <div className="hero-3d-core-inner">
            <span className="hero-3d-core-small">
              CASE FILE
            </span>

            <span className="hero-3d-core-title">
              GeM
            </span>

            <span className="hero-3d-core-status">
              ACTIVE
            </span>
          </div>
        </div>

        {/* Orbit Rings */}
        <div className="hero-3d-ring ring-a" />
        <div className="hero-3d-ring ring-b" />

        {/* Orbit Nodes */}
        <div className="hero-3d-node node-a">
          <FileCheck2 size={15} />
        </div>

        <div className="hero-3d-node node-b">
          <PackageCheck size={15} />
        </div>

        <div className="hero-3d-node node-c">
          <Gavel size={15} />
        </div>
      </div>

      {/* Bottom Status Cards */}
      <div className="absolute inset-x-4 bottom-4 grid grid-cols-3 gap-2 sm:inset-x-6 sm:bottom-5 sm:gap-3">
        {steps.map(
          ({ label, status, icon: Icon, tone }) => (
            <div
              key={label}
              className="rounded-xl border border-border/70 bg-surface/90 p-2.5 backdrop-blur sm:p-3"
            >
              <div className="flex items-center gap-2">
                <Icon
                  size={15}
                  className={getToneClass(tone)}
                />

                <span className="font-mono text-[9px] uppercase tracking-wide text-muted sm:text-[10px]">
                  {label}
                </span>
              </div>

              <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-text">
                <CheckCircle2
                  size={12}
                  className="text-success"
                />

                {status}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}