import { Canvas, useFrame } from '@react-three/fiber'
import { Float, RoundedBox } from '@react-three/drei'
import { useRef } from 'react'
import { useTheme } from '../../theme'

function StatObject({ type, theme }) {
  const group = useRef()
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.55
  })

  const primary = theme.primary
  const secondary = theme.secondary
  const accent = theme.accent2
  const surface = theme.surface

  return (
    <group ref={group}>
      {type === 'clients' && (
        <>
          <mesh position={[-0.42, 0.32, 0]}>
            <sphereGeometry args={[0.27, 24, 24]} />
            <meshStandardMaterial color={primary} metalness={0.35} roughness={0.25} />
          </mesh>
          <mesh position={[0.42, 0.32, 0]}>
            <sphereGeometry args={[0.27, 24, 24]} />
            <meshStandardMaterial color={secondary} metalness={0.35} roughness={0.25} />
          </mesh>
          <RoundedBox args={[0.62, 0.55, 0.38]} radius={0.12} smoothness={4} position={[0, -0.25, 0]}>
            <meshStandardMaterial color={accent} metalness={0.15} roughness={0.3} />
          </RoundedBox>
        </>
      )}

      {type === 'business' && (
        <>
          {[0, 0.24, 0.48].map((y, i) => (
            <mesh key={y} position={[0, y - 0.25, 0]}>
              <cylinderGeometry args={[0.57, 0.57, 0.16, 32]} />
              <meshStandardMaterial color={i === 2 ? accent : primary} metalness={0.7} roughness={0.2} />
            </mesh>
          ))}
          <mesh position={[0, 0.67, 0]}>
            <torusGeometry args={[0.22, 0.055, 12, 32]} />
            <meshStandardMaterial color={secondary} metalness={0.65} roughness={0.2} />
          </mesh>
        </>
      )}

      {type === 'brands' && (
        <>
          <mesh rotation={[0.25, 0.35, 0]}>
            <icosahedronGeometry args={[0.7, 1]} />
            <meshStandardMaterial color={primary} metalness={0.55} roughness={0.2} />
          </mesh>
          <mesh rotation={[0.25, 0.35, 0]} scale={0.48}>
            <icosahedronGeometry args={[0.7, 1]} />
            <meshStandardMaterial color={surface} metalness={0.2} roughness={0.35} />
          </mesh>
        </>
      )}

      {type === 'products' && (
        <>
          <RoundedBox args={[0.7, 0.7, 0.7]} radius={0.08} smoothness={3} position={[-0.34, 0, 0]}>
            <meshStandardMaterial color={primary} metalness={0.3} roughness={0.28} />
          </RoundedBox>
          <RoundedBox args={[0.7, 0.7, 0.7]} radius={0.08} smoothness={3} position={[0.34, 0.22, 0.08]}>
            <meshStandardMaterial color={secondary} metalness={0.3} roughness={0.28} />
          </RoundedBox>
        </>
      )}
    </group>
  )
}

export default function Stat3DIcon({ type }) {
  const { theme } = useTheme()
  return (
    <div className="stat-3d-icon" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 3.4], fov: 42 }} dpr={[1, 1.5]}>
        <ambientLight intensity={1.7} />
        <directionalLight position={[3, 4, 5]} intensity={2.4} />
        <Float speed={2} rotationIntensity={0.25} floatIntensity={0.65}>
          <StatObject type={type} theme={theme} />
        </Float>
      </Canvas>
    </div>
  )
}
