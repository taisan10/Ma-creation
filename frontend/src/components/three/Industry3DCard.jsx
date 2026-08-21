import { Canvas, useFrame } from '@react-three/fiber'
import { Float, RoundedBox } from '@react-three/drei'
import { useRef } from 'react'
import { useTheme } from '../../theme'

function IndustryObject({ type, theme }) {
  const ref = useRef()
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.5
  })

  const material = (color, metalness = 0.45, roughness = 0.24) => (
    <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
  )

  return (
    <group ref={ref}>
      {type === 'manufacturing' && (
        <>
          <mesh>{<torusGeometry args={[0.68, 0.18, 16, 48]} />}{material(theme.primary, 0.65, 0.2)}</mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>{<cylinderGeometry args={[0.3, 0.3, 0.8, 24]} />}{material(theme.surface, 0.45, 0.28)}</mesh>
        </>
      )}

      {type === 'healthcare' && (
        <>
          <RoundedBox args={[1.05, 1.05, 0.3]} radius={0.14} smoothness={4}>{material(theme.secondary, 0.25, 0.28)}</RoundedBox>
          <RoundedBox args={[0.25, 0.75, 0.38]} radius={0.04} smoothness={3} position={[0, 0, 0.2]}>{material(theme.surface, 0.2, 0.32)}</RoundedBox>
          <RoundedBox args={[0.75, 0.25, 0.38]} radius={0.04} smoothness={3} position={[0, 0, 0.2]}>{material(theme.surface, 0.2, 0.32)}</RoundedBox>
        </>
      )}

      {type === 'it' && (
        <>
          <RoundedBox args={[1.4, 0.9, 0.18]} radius={0.08} smoothness={4}>{material(theme.accent2, 0.5, 0.22)}</RoundedBox>
          <mesh position={[0, -0.62, 0]}>{<boxGeometry args={[0.8, 0.12, 0.5]} />}{material(theme.primary, 0.45, 0.25)}</mesh>
        </>
      )}

      {type === 'services' && (
        <>
          <mesh>{<icosahedronGeometry args={[0.78, 1]} />}{material(theme.primaryDark, 0.55, 0.22)}</mesh>
          <mesh scale={0.52}>{<icosahedronGeometry args={[0.78, 1]} />}{material(theme.accent, 0.2, 0.32)}</mesh>
        </>
      )}

      {type === 'arts' && (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]}>{<torusGeometry args={[0.62, 0.18, 18, 48]} />}{material(theme.primary, 0.55, 0.22)}</mesh>
          <mesh position={[0, 0.18, 0]}>{<sphereGeometry args={[0.32, 24, 24]} />}{material(theme.accent2, 0.25, 0.3)}</mesh>
        </>
      )}

      {type === 'chemical' && (
        <>
          <mesh position={[0, -0.12, 0]}>{<cylinderGeometry args={[0.42, 0.62, 0.9, 32]} />}{material(theme.secondary, 0.4, 0.25)}</mesh>
          <mesh position={[0, 0.55, 0]}>{<cylinderGeometry args={[0.17, 0.17, 0.42, 24]} />}{material(theme.primary, 0.45, 0.22)}</mesh>
          <mesh position={[0.22, -0.02, 0]} rotation={[0, 0, -0.35]}>{<torusGeometry args={[0.24, 0.055, 12, 28]} />}{material(theme.accent2, 0.5, 0.2)}</mesh>
        </>
      )}

      {type === 'civil' && (
        <>
          <RoundedBox args={[1.15, 0.5, 0.58]} radius={0.06} smoothness={3} position={[0, -0.42, 0]}>{material(theme.primaryDark, 0.55, 0.25)}</RoundedBox>
          <RoundedBox args={[0.8, 0.65, 0.58]} radius={0.06} smoothness={3} position={[-0.18, 0.18, 0]}>{material(theme.secondary, 0.45, 0.27)}</RoundedBox>
          <RoundedBox args={[0.48, 0.58, 0.58]} radius={0.06} smoothness={3} position={[0.28, 0.7, 0]}>{material(theme.accent2, 0.4, 0.25)}</RoundedBox>
        </>
      )}

      {type === 'solar' && (
        <>
          <RoundedBox args={[1.45, 0.9, 0.1]} radius={0.05} smoothness={3} rotation={[-0.35, 0.15, 0]}>{material(theme.primary, 0.65, 0.18)}</RoundedBox>
          <mesh position={[0, -0.6, 0]} rotation={[0, 0, 0.15]}>{<cylinderGeometry args={[0.08, 0.08, 0.95, 20]} />}{material(theme.secondary, 0.65, 0.22)}</mesh>
        </>
      )}

      {type === 'hardware' && (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]}>{<torusGeometry args={[0.62, 0.2, 6, 6]} />}{material(theme.primaryDark, 0.75, 0.18)}</mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>{<cylinderGeometry args={[0.28, 0.28, 0.32, 6]} />}{material(theme.surface, 0.35, 0.28)}</mesh>
        </>
      )}

      {type === 'fire' && (
        <>
          <RoundedBox args={[0.8, 1.35, 0.65]} radius={0.18} smoothness={5}>{material(theme.danger, 0.45, 0.22)}</RoundedBox>
          <mesh position={[0.2, 0.9, 0]} rotation={[0, 0, Math.PI / 2]}>{<torusGeometry args={[0.25, 0.055, 12, 28]} />}{material(theme.primaryDark, 0.55, 0.2)}</mesh>
          <mesh position={[0, -0.78, 0]}>{<cylinderGeometry args={[0.18, 0.18, 0.12, 24]} />}{material(theme.accent2, 0.4, 0.25)}</mesh>
        </>
      )}

      {type === 'furniture' && (
        <>
          <RoundedBox args={[1.35, 0.18, 0.72]} radius={0.06} smoothness={3} position={[0, 0.42, 0]}>{material(theme.primary, 0.4, 0.3)}</RoundedBox>
          {[-0.5, 0.5].map(x => <mesh key={x} position={[x, -0.25, 0]}>{<cylinderGeometry args={[0.08, 0.08, 1.2, 16]} />}{material(theme.secondary, 0.45, 0.25)}</mesh>)}
        </>
      )}

      {type === 'packaging' && (
        <>
          <RoundedBox args={[1.05, 1.05, 1.05]} radius={0.08} smoothness={3}>{material(theme.accent2, 0.4, 0.28)}</RoundedBox>
          <mesh position={[0, 0, 0.55]}>{<boxGeometry args={[0.12, 1.05, 0.04]} />}{material(theme.primary, 0.35, 0.25)}</mesh>
          <mesh position={[0, 0, 0.57]} rotation={[0, 0, Math.PI / 2]}>{<boxGeometry args={[0.12, 1.05, 0.04]} />}{material(theme.primary, 0.35, 0.25)}</mesh>
        </>
      )}
    </group>
  )
}

export default function Industry3DCard({ title, description, type }) {
  const { theme } = useTheme()
  return (
    <div className="group card p-0 overflow-hidden hover:-translate-y-2">
      <div className="industry-3d-scene bg-brand-gradient/30">
        <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }} dpr={[1, 1.5]}>
          <ambientLight intensity={1.7} />
          <directionalLight position={[3, 4, 5]} intensity={2.5} />
          <pointLight position={[-3, 1, 3]} intensity={1.2} />
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.8}>
            <IndustryObject type={type} theme={theme} />
          </Float>
        </Canvas>
        <div className="industry-3d-label">3D</div>
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl font-semibold text-text">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      </div>
    </div>
  )
}
