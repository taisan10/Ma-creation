

import { Canvas, useFrame } from '@react-three/fiber'
import { Float, RoundedBox } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../../theme'

function IndustryObject({ type, theme }) {
  const ref = useRef()

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.5
    }
  })

  const mat = (color, metalness = 0.15, roughness = 0.65) => (
    <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
  )

  return (
    <group ref={ref}>

      {/* STATIONERY — Pen + Notebook + Paperclip */}
      {type === 'stationery' && (
        <group>
          {/* Pen body */}
          <mesh position={[0.22, 0.05, 0]} rotation={[0, 0, 0.18]}>
            <cylinderGeometry args={[0.055, 0.055, 1.1, 20]} />
            {mat('#1a1a2e', 0.3, 0.4)}
          </mesh>
          {/* Pen grip section */}
          <mesh position={[0.12, -0.32, 0]} rotation={[0, 0, 0.18]}>
            <cylinderGeometry args={[0.06, 0.055, 0.22, 20]} />
            {mat('#2d2d44', 0.1, 0.7)}
          </mesh>
          {/* Pen tip */}
          <mesh position={[0.06, -0.58, 0]} rotation={[0, 0, 0.18]}>
            <coneGeometry args={[0.04, 0.15, 16]} />
            {mat('#888888', 0.6, 0.2)}
          </mesh>
          {/* Pen clip */}
          <mesh position={[0.32, 0.25, 0]} rotation={[0, 0, 0.18]}>
            <boxGeometry args={[0.015, 0.35, 0.04]} />
            {mat('#c0c0c0', 0.7, 0.15)}
          </mesh>
          {/* Notebook */}
          <RoundedBox args={[0.82, 0.62, 0.06]} radius={0.02} smoothness={4} position={[-0.22, 0.02, 0]}>
            {mat('#e8dcc8', 0.05, 0.85)}
          </RoundedBox>
          {/* Notebook spine */}
          <mesh position={[-0.63, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.62, 12]} />
            {mat('#8b6914', 0.2, 0.6)}
          </mesh>
          {/* Paperclip */}
          <mesh position={[0.45, 0.38, 0.04]} rotation={[0.2, 0, 0.3]}>
            <torusGeometry args={[0.06, 0.012, 8, 20, Math.PI * 1.5]} />
            {mat('#c0c0c0', 0.75, 0.12)}
          </mesh>
        </group>
      )}

      {/* FURNITURE — Office desk + Chair */}
      {type === 'furniture' && (
        <group>
          {/* Desk top */}
          <RoundedBox args={[1.3, 0.08, 0.65]} radius={0.02} smoothness={3} position={[0, 0.28, 0]}>
            {mat('#8B6914', 0.08, 0.75)}
          </RoundedBox>
          {/* Desk legs */}
          {[[-0.55, -0.25, -0.25], [0.55, -0.25, -0.25], [-0.55, -0.25, 0.25], [0.55, -0.25, 0.25]].map((p, i) => (
            <mesh key={i} position={p}>
              <cylinderGeometry args={[0.035, 0.035, 1.0, 10]} />
              {mat('#5a4a1e', 0.15, 0.65)}
            </mesh>
          ))}
          {/* Drawer */}
          <RoundedBox args={[0.4, 0.12, 0.5]} radius={0.02} smoothness={3} position={[0.35, 0.12, 0]}>
            {mat('#a07830', 0.06, 0.78)}
          </RoundedBox>
          {/* Drawer handle */}
          <mesh position={[0.35, 0.12, 0.28]}>
            <boxGeometry args={[0.12, 0.02, 0.02]} />
            {mat('#888888', 0.65, 0.2)}
          </mesh>
          {/* Chair seat */}
          <RoundedBox args={[0.42, 0.06, 0.4]} radius={0.02} smoothness={3} position={[-0.05, -0.05, 0.55]}>
            {mat('#2a2a2a', 0.05, 0.82)}
          </RoundedBox>
          {/* Chair backrest */}
          <RoundedBox args={[0.38, 0.45, 0.05]} radius={0.02} smoothness={3} position={[-0.05, 0.22, 0.74]}>
            {mat('#2a2a2a', 0.05, 0.82)}
          </RoundedBox>
          {/* Chair stem */}
          <mesh position={[-0.05, -0.28, 0.55]}>
            <cylinderGeometry args={[0.025, 0.025, 0.4, 10]} />
            {mat('#555555', 0.5, 0.3)}
          </mesh>
        </group>
      )}

      {/* MEDICAL — Stethoscope + Medicine box */}
      {type === 'medical' && (
        <group>
          {/* Medicine box */}
          <RoundedBox args={[0.65, 0.55, 0.35]} radius={0.04} smoothness={4} position={[-0.15, -0.1, 0]}>
            {mat('#f0f0f0', 0.03, 0.9)}
          </RoundedBox>
          {/* Box cross */}
          <mesh position={[-0.15, -0.1, 0.19]}>
            <boxGeometry args={[0.08, 0.3, 0.02]} />
            {mat('#d42b2b', 0.05, 0.7)}
          </mesh>
          <mesh position={[-0.15, -0.1, 0.19]}>
            <boxGeometry args={[0.3, 0.08, 0.02]} />
            {mat('#d42b2b', 0.05, 0.7)}
          </mesh>
          {/* Stethoscope tubing */}
          <mesh position={[0.3, 0.15, 0]} rotation={[Math.PI / 2, 0, 0.3]}>
            <torusGeometry args={[0.22, 0.025, 12, 32, Math.PI * 1.3]} />
            {mat('#333333', 0.1, 0.75)}
          </mesh>
          {/* Stethoscope chest piece */}
          <mesh position={[0.48, -0.05, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.04, 20]} />
            {mat('#888888', 0.7, 0.15)}
          </mesh>
          {/* Earpieces */}
          <mesh position={[0.12, 0.38, 0.06]}>
            <sphereGeometry args={[0.03, 12, 12]} />
            {mat('#888888', 0.7, 0.15)}
          </mesh>
          <mesh position={[0.12, 0.38, -0.06]}>
            <sphereGeometry args={[0.03, 12, 12]} />
            {mat('#888888', 0.7, 0.15)}
          </mesh>
        </group>
      )}

      {/* PIPES — Industrial pipe + Valve + Flanges */}
      {type === 'pipes' && (
        <group>
          {/* Main vertical pipe */}
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 1.0, 24]} />
            {mat('#4a6a8a', 0.55, 0.3)}
          </mesh>
          {/* Horizontal pipe */}
          <mesh position={[0.32, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.12, 0.12, 0.55, 24]} />
            {mat('#4a6a8a', 0.55, 0.3)}
          </mesh>
          {/* Elbow connector */}
          <mesh position={[0.05, 0.35, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.18, 0.12, 16, 20, Math.PI / 2]} />
            {mat('#3a5a7a', 0.6, 0.25)}
          </mesh>
          {/* Top flange */}
          <mesh position={[0, 0.48, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.06, 24]} />
            {mat('#5a7a9a', 0.65, 0.2)}
          </mesh>
          {/* Bottom flange */}
          <mesh position={[0, -0.55, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.06, 24]} />
            {mat('#5a7a9a', 0.65, 0.2)}
          </mesh>
          {/* Valve wheel */}
          <mesh position={[0.05, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.1, 0.018, 8, 20]} />
            {mat('#cc4444', 0.3, 0.5)}
          </mesh>
          {/* Valve stem */}
          <mesh position={[0.05, 0.5, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.1, 8]} />
            {mat('#555555', 0.5, 0.3)}
          </mesh>
        </group>
      )}

      {/* IT — Laptop computer */}
      {type === 'it' && (
        <group>
          {/* Screen (tilted back) */}
          <RoundedBox args={[1.1, 0.72, 0.04]} radius={0.025} smoothness={4} position={[0, 0.28, -0.22]} rotation={[-0.25, 0, 0]}>
            {mat('#1a1a2e', 0.2, 0.55)}
          </RoundedBox>
          {/* Screen bezel */}
          <RoundedBox args={[1.0, 0.62, 0.01]} radius={0.02} smoothness={3} position={[0, 0.28, -0.19]} rotation={[-0.25, 0, 0]}>
            {mat('#111111', 0.1, 0.8)}
          </RoundedBox>
          {/* Screen display (lit area) */}
          <RoundedBox args={[0.92, 0.55, 0.005]} radius={0.01} smoothness={3} position={[0, 0.28, -0.17]} rotation={[-0.25, 0, 0]}>
            {mat('#2244aa', 0.05, 0.3)}
          </RoundedBox>
          {/* Keyboard base */}
          <RoundedBox args={[1.1, 0.04, 0.7]} radius={0.02} smoothness={3} position={[0, -0.12, 0.1]}>
            {mat('#c0c0c0', 0.5, 0.3)}
          </RoundedBox>
          {/* Keyboard keys area */}
          <RoundedBox args={[0.85, 0.015, 0.35]} radius={0.01} smoothness={3} position={[0, -0.095, 0.08]}>
            {mat('#2a2a2a', 0.1, 0.7)}
          </RoundedBox>
          {/* Trackpad */}
          <RoundedBox args={[0.28, 0.01, 0.18]} radius={0.01} smoothness={3} position={[0, -0.095, 0.35]}>
            {mat('#999999', 0.3, 0.4)}
          </RoundedBox>
          {/* Camera dot */}
          <mesh position={[0, 0.6, -0.24]} rotation={[-0.25, 0, 0]}>
            <sphereGeometry args={[0.012, 10, 10]} />
            {mat('#222222', 0.2, 0.6)}
          </mesh>
        </group>
      )}

      {/* AUTOMOBILES — Sedan car */}
      {type === 'automobiles' && (
        <group>
          {/* Car body lower */}
          <RoundedBox args={[1.5, 0.32, 0.65]} radius={0.08} smoothness={4} position={[0, -0.05, 0]}>
            {mat('#2a3a5a', 0.35, 0.4)}
          </RoundedBox>
          {/* Car cabin */}
          <RoundedBox args={[0.75, 0.32, 0.58]} radius={0.1} smoothness={4} position={[0.05, 0.25, 0]}>
            {mat('#2a3a5a', 0.35, 0.4)}
          </RoundedBox>
          {/* Windshield */}
          <RoundedBox args={[0.02, 0.28, 0.52]} radius={0.01} smoothness={3} position={[-0.3, 0.24, 0]} rotation={[0, 0, 0.2]}>
            {mat('#aaccff', 0.1, 0.15)}
          </RoundedBox>
          {/* Rear window */}
          <RoundedBox args={[0.02, 0.25, 0.5]} radius={0.01} smoothness={3} position={[0.38, 0.24, 0]} rotation={[0, 0, -0.15]}>
            {mat('#aaccff', 0.1, 0.15)}
          </RoundedBox>
          {/* Headlights */}
          <mesh position={[-0.76, -0.02, 0.22]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            {mat('#ffffcc', 0.1, 0.3)}
          </mesh>
          <mesh position={[-0.76, -0.02, -0.22]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            {mat('#ffffcc', 0.1, 0.3)}
          </mesh>
          {/* Tail lights */}
          <mesh position={[0.76, -0.02, 0.25]}>
            <sphereGeometry args={[0.04, 10, 10]} />
            {mat('#cc2222', 0.1, 0.4)}
          </mesh>
          <mesh position={[0.76, -0.02, -0.25]}>
            <sphereGeometry args={[0.04, 10, 10]} />
            {mat('#cc2222', 0.1, 0.4)}
          </mesh>
          {/* Wheels */}
          {[[-0.42, -0.25, 0.34], [0.42, -0.25, 0.34], [-0.42, -0.25, -0.34], [0.42, -0.25, -0.34]].map((p, i) => (
            <group key={i} position={p} rotation={[Math.PI / 2, 0, 0]}>
              <mesh>
                <cylinderGeometry args={[0.13, 0.13, 0.08, 24]} />
                {mat('#1a1a1a', 0.1, 0.85)}
              </mesh>
              <mesh>
                <cylinderGeometry args={[0.07, 0.07, 0.09, 12]} />
                {mat('#888888', 0.6, 0.25)}
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* ELECTRICAL — Power plug + Cable */}
      {type === 'electrical' && (
        <group>
          {/* Plug body */}
          <RoundedBox args={[0.5, 0.65, 0.32]} radius={0.08} smoothness={4} position={[0, 0.15, 0]}>
            {mat('#f0f0f0', 0.03, 0.88)}
          </RoundedBox>
          {/* Plug face */}
          <RoundedBox args={[0.42, 0.55, 0.02]} radius={0.04} smoothness={3} position={[0, 0.15, 0.18]}>
            {mat('#e0e0e0', 0.03, 0.9)}
          </RoundedBox>
          {/* Prongs */}
          <mesh position={[-0.08, 0.25, 0.3]}>
            <boxGeometry args={[0.04, 0.28, 0.06]} />
            {mat('#c0c0c0', 0.75, 0.12)}
          </mesh>
          <mesh position={[0.08, 0.25, 0.3]}>
            <boxGeometry args={[0.04, 0.28, 0.06]} />
            {mat('#c0c0c0', 0.75, 0.12)}
          </mesh>
          {/* Ground pin */}
          <mesh position={[0, 0.12, 0.3]}>
            <boxGeometry args={[0.04, 0.15, 0.06]} />
            {mat('#c0c0c0', 0.75, 0.12)}
          </mesh>
          {/* Cable */}
          <mesh position={[0, -0.3, 0]} rotation={[0, 0, 0.15]}>
            <cylinderGeometry args={[0.04, 0.04, 0.5, 12]} />
            {mat('#2a2a2a', 0.05, 0.85)}
          </mesh>
          {/* Cable strain relief */}
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.06, 0.04, 0.08, 12]} />
            {mat('#3a3a3a', 0.05, 0.8)}
          </mesh>
        </group>
      )}

      {/* ELECTRONICS — Microchip / CPU */}
      {type === 'electronics' && (
        <group>
          {/* PCB board */}
          <RoundedBox args={[0.95, 0.95, 0.06]} radius={0.02} smoothness={3} position={[0, 0, -0.05]}>
            {mat('#1a5c1a', 0.08, 0.75)}
          </RoundedBox>
          {/* CPU die */}
          <RoundedBox args={[0.5, 0.5, 0.08]} radius={0.015} smoothness={3} position={[0, 0, 0.02]}>
            {mat('#333333', 0.4, 0.35)}
          </RoundedBox>
          {/* CPU heat spreader */}
          <RoundedBox args={[0.44, 0.44, 0.02]} radius={0.01} smoothness={3} position={[0, 0, 0.07]}>
            {mat('#888888', 0.7, 0.18)}
          </RoundedBox>
          {/* Pin rows (top) */}
          {[-0.18, -0.06, 0.06, 0.18].map((x, i) => (
            <mesh key={`t${i}`} position={[x, 0.35, -0.02]}>
              <boxGeometry args={[0.025, 0.1, 0.02]} />
              {mat('#c0a030', 0.7, 0.15)}
            </mesh>
          ))}
          {/* Pin rows (bottom) */}
          {[-0.18, -0.06, 0.06, 0.18].map((x, i) => (
            <mesh key={`b${i}`} position={[x, -0.35, -0.02]}>
              <boxGeometry args={[0.025, 0.1, 0.02]} />
              {mat('#c0a030', 0.7, 0.15)}
            </mesh>
          ))}
          {/* Pin rows (left) */}
          {[-0.18, -0.06, 0.06, 0.18].map((y, i) => (
            <mesh key={`l${i}`} position={[-0.35, y, -0.02]}>
              <boxGeometry args={[0.1, 0.025, 0.02]} />
              {mat('#c0a030', 0.7, 0.15)}
            </mesh>
          ))}
          {/* Pin rows (right) */}
          {[-0.18, -0.06, 0.06, 0.18].map((y, i) => (
            <mesh key={`r${i}`} position={[0.35, y, -0.02]}>
              <boxGeometry args={[0.1, 0.025, 0.02]} />
              {mat('#c0a030', 0.7, 0.15)}
            </mesh>
          ))}
          {/* Capacitors */}
          {[[-0.3, 0.3, 0.02], [0.3, 0.3, 0.02], [-0.3, -0.3, 0.02], [0.3, -0.3, 0.02]].map((p, i) => (
            <mesh key={`c${i}`} position={p}>
              <cylinderGeometry args={[0.03, 0.03, 0.06, 10]} />
              {mat('#222222', 0.1, 0.7)}
            </mesh>
          ))}
        </group>
      )}

      {/* TEXTILES — Fabric roll + Thread spool */}
      {type === 'textiles' && (
        <group>
          {/* Main fabric roll */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.32, 0.32, 1.0, 32]} />
            {mat('#5a3a8a', 0.05, 0.85)}
          </mesh>
          {/* Roll end caps */}
          <mesh position={[-0.52, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.34, 0.34, 0.04, 24]} />
            {mat('#8B6914', 0.1, 0.7)}
          </mesh>
          <mesh position={[0.52, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.34, 0.34, 0.04, 24]} />
            {mat('#8B6914', 0.1, 0.7)}
          </mesh>
          {/* Fabric drape flowing down */}
          <mesh position={[0, -0.35, 0.3]} rotation={[0.4, 0, 0]}>
            <planeGeometry args={[0.7, 0.5]} />
            {mat('#6a4a9a', 0.03, 0.88)}
          </mesh>
          {/* Thread spool */}
          <mesh position={[0.4, 0.42, 0.15]}>
            <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
            {mat('#c04040', 0.05, 0.7)}
          </mesh>
          {/* Spool flanges */}
          <mesh position={[0.4, 0.53, 0.15]}>
            <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
            {mat('#d4a060', 0.1, 0.65)}
          </mesh>
          <mesh position={[0.4, 0.32, 0.15]}>
            <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
            {mat('#d4a060', 0.1, 0.65)}
          </mesh>
        </group>
      )}

      {/* MANUFACTURING — Gear/Cog + Machine base */}
      {type === 'manufacturing' && (
        <group>
          {/* Main gear outer ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.45, 0.12, 12, 32]} />
            {mat('#5a6a7a', 0.6, 0.25)}
          </mesh>
          {/* Gear teeth (simulated with boxes) */}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i / 12) * Math.PI * 2
            const x = Math.cos(angle) * 0.45
            const z = Math.sin(angle) * 0.45
            return (
              <mesh key={i} position={[x, 0, z]} rotation={[Math.PI / 2, angle, 0]}>
                <boxGeometry args={[0.08, 0.08, 0.15]} />
                {mat('#4a5a6a', 0.65, 0.22)}
              </mesh>
            )
          })}
          {/* Gear hub */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.28, 20]} />
            {mat('#3a4a5a', 0.55, 0.3)}
          </mesh>
          {/* Axle */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.5, 12]} />
            {mat('#666666', 0.7, 0.18)}
          </mesh>
          {/* Small gear */}
          <mesh position={[0.6, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.18, 0.06, 10, 20]} />
            {mat('#7a8a9a', 0.55, 0.28)}
          </mesh>
        </group>
      )}

      {/* HEALTHCARE — Medical cross + Heartbeat */}
      {type === 'healthcare' && (
        <group>
          {/* Cross vertical */}
          <RoundedBox args={[0.22, 0.7, 0.2]} radius={0.04} smoothness={4} position={[0, 0, 0]}>
            {mat('#ffffff', 0.05, 0.85)}
          </RoundedBox>
          {/* Cross horizontal */}
          <RoundedBox args={[0.7, 0.22, 0.2]} radius={0.04} smoothness={4} position={[0, 0, 0]}>
            {mat('#ffffff', 0.05, 0.85)}
          </RoundedBox>
          {/* Background shield */}
          <RoundedBox args={[0.9, 0.9, 0.08]} radius={0.15} smoothness={4} position={[0, 0, -0.12]}>
            {mat('#2a8a5a', 0.1, 0.65)}
          </RoundedBox>
          {/* Heartbeat line (simplified as thin boxes) */}
          <mesh position={[0, -0.55, 0.14]}>
            <boxGeometry args={[0.6, 0.015, 0.02]} />
            {mat('#cc3333', 0.1, 0.5)}
          </mesh>
          {/* Heartbeat peaks */}
          <mesh position={[0, -0.52, 0.14]} rotation={[0, 0, 0.4]}>
            <boxGeometry args={[0.08, 0.06, 0.02]} />
            {mat('#cc3333', 0.1, 0.5)}
          </mesh>
          <mesh position={[0.1, -0.58, 0.14]} rotation={[0, 0, -0.6]}>
            <boxGeometry args={[0.08, 0.1, 0.02]} />
            {mat('#cc3333', 0.1, 0.5)}
          </mesh>
        </group>
      )}

      {/* SERVICES — Briefcase */}
      {type === 'services' && (
        <group>
          {/* Briefcase body */}
          <RoundedBox args={[1.0, 0.65, 0.35]} radius={0.06} smoothness={4} position={[0, -0.05, 0]}>
            {mat('#5a3a1e', 0.1, 0.72)}
          </RoundedBox>
          {/* Briefcase lid line */}
          <mesh position={[0, 0.15, 0.18]}>
            <boxGeometry args={[0.92, 0.015, 0.01]} />
            {mat('#4a2a10', 0.1, 0.75)}
          </mesh>
          {/* Handle */}
          <mesh position={[0, 0.38, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.12, 0.02, 8, 16, Math.PI]} />
            {mat('#3a2a10', 0.15, 0.65)}
          </mesh>
          {/* Clasps */}
          <mesh position={[-0.18, 0.15, 0.19]}>
            <boxGeometry args={[0.06, 0.04, 0.02]} />
            {mat('#c0a030', 0.7, 0.15)}
          </mesh>
          <mesh position={[0.18, 0.15, 0.19]}>
            <boxGeometry args={[0.06, 0.04, 0.02]} />
            {mat('#c0a030', 0.7, 0.15)}
          </mesh>
          {/* Side buckle detail */}
          <mesh position={[0.51, -0.05, 0]}>
            <boxGeometry args={[0.02, 0.08, 0.15]} />
            {mat('#c0a030', 0.7, 0.15)}
          </mesh>
          <mesh position={[-0.51, -0.05, 0]}>
            <boxGeometry args={[0.02, 0.08, 0.15]} />
            {mat('#c0a030', 0.7, 0.15)}
          </mesh>
        </group>
      )}

      {/* ARTS — Paintbrush + Palette */}
      {type === 'arts' && (
        <group>
          {/* Palette */}
          <mesh position={[-0.1, -0.05, 0]} rotation={[0.15, 0, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 0.04, 32]} />
            {mat('#c8a060', 0.05, 0.8)}
          </mesh>
          {/* Thumb hole */}
          <mesh position={[-0.25, -0.03, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.06, 0.015, 8, 16]} />
            {mat('#b89050', 0.05, 0.82)}
          </mesh>
          {/* Paint blobs */}
          <mesh position={[-0.1, 0.0, -0.15]}>
            <sphereGeometry args={[0.045, 12, 12]} />
            {mat('#cc3333', 0.05, 0.7)}
          </mesh>
          <mesh position={[0.05, 0.0, -0.1]}>
            <sphereGeometry args={[0.04, 10, 10]} />
            {mat('#3333cc', 0.05, 0.7)}
          </mesh>
          <mesh position={[0.15, 0.0, 0.05]}>
            <sphereGeometry args={[0.035, 10, 10]} />
            {mat('#33aa33', 0.05, 0.7)}
          </mesh>
          <mesh position={[-0.2, 0.0, 0.05]}>
            <sphereGeometry args={[0.04, 10, 10]} />
            {mat('#ccaa33', 0.05, 0.7)}
          </mesh>
          {/* Brush handle */}
          <mesh position={[0.35, 0.18, 0.05]} rotation={[0, 0, -0.5]}>
            <cylinderGeometry args={[0.02, 0.02, 0.65, 10]} />
            {mat('#8B6914', 0.1, 0.7)}
          </mesh>
          {/* Brush ferrule */}
          <mesh position={[0.22, 0.05, 0.05]} rotation={[0, 0, -0.5]}>
            <cylinderGeometry args={[0.035, 0.02, 0.06, 10]} />
            {mat('#c0c0c0', 0.7, 0.15)}
          </mesh>
          {/* Brush bristles */}
          <mesh position={[0.19, 0.0, 0.05]} rotation={[0, 0, -0.5]}>
            <coneGeometry args={[0.035, 0.1, 10]} />
            {mat('#d4a060', 0.05, 0.8)}
          </mesh>
        </group>
      )}

      {/* CHEMICAL — Laboratory flask */}
      {type === 'chemical' && (
        <group>
          {/* Flask base (conical) */}
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.15, 0.4, 0.65, 24]} />
            {mat('#e8e8e8', 0.05, 0.2)}
          </mesh>
          {/* Flask neck */}
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.1, 0.15, 0.4, 20]} />
            {mat('#e8e8e8', 0.05, 0.2)}
          </mesh>
          {/* Flask rim */}
          <mesh position={[0, 0.5, 0]}>
            <torusGeometry args={[0.12, 0.02, 8, 20]} />
            {mat('#d0d0d0', 0.1, 0.3)}
          </mesh>
          {/* Liquid inside */}
          <mesh position={[0, -0.22, 0]}>
            <cylinderGeometry args={[0.12, 0.32, 0.35, 24]} />
            {mat('#44aa66', 0.05, 0.3)}
          </mesh>
          {/* Bubbles */}
          <mesh position={[0.05, -0.15, 0.08]}>
            <sphereGeometry args={[0.025, 10, 10]} />
            {mat('#66cc88', 0.05, 0.2)}
          </mesh>
          <mesh position={[-0.08, -0.05, -0.06]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            {mat('#66cc88', 0.05, 0.2)}
          </mesh>
          {/* Cork/stopper */}
          <mesh position={[0, 0.52, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 0.08, 12]} />
            {mat('#c8a060', 0.05, 0.8)}
          </mesh>
        </group>
      )}

      {/* CIVIL — Building structure */}
      {type === 'civil' && (
        <group>
          {/* Building base */}
          <RoundedBox args={[0.85, 0.35, 0.6]} radius={0.03} smoothness={3} position={[0, -0.4, 0]}>
            {mat('#7a7a7a', 0.15, 0.7)}
          </RoundedBox>
          {/* Main building */}
          <RoundedBox args={[0.7, 0.75, 0.55]} radius={0.03} smoothness={3} position={[0, 0.12, 0]}>
            {mat('#b0b0b0', 0.1, 0.75)}
          </RoundedBox>
          {/* Windows */}
          {[-0.18, 0.18].map((x) =>
            [0.3, 0.05, -0.2].map((y, j) => (
              <mesh key={`${x}${j}`} position={[x, y, 0.28]}>
                <boxGeometry args={[0.12, 0.1, 0.02]} />
                {mat('#88bbee', 0.05, 0.2)}
              </mesh>
            ))
          )}
          {/* Door */}
          <RoundedBox args={[0.14, 0.22, 0.02]} radius={0.02} smoothness={3} position={[0, -0.3, 0.29]}>
            {mat('#5a3a1e', 0.05, 0.75)}
          </RoundedBox>
          {/* Roof accent */}
          <mesh position={[0, 0.52, 0]}>
            <boxGeometry args={[0.75, 0.04, 0.58]} />
            {mat('#4a5a6a', 0.3, 0.5)}
          </mesh>
        </group>
      )}

      {/* SOLAR — Solar panel on mount */}
      {type === 'solar' && (
        <group>
          {/* Panel frame */}
          <RoundedBox args={[1.1, 0.75, 0.06]} radius={0.02} smoothness={3} position={[0, 0.15, 0]} rotation={[-0.3, 0, 0]}>
            {mat('#888888', 0.6, 0.25)}
          </RoundedBox>
          {/* Panel surface (dark blue) */}
          <RoundedBox args={[1.02, 0.67, 0.01]} radius={0.01} smoothness={3} position={[0, 0.15, 0.04]} rotation={[-0.3, 0, 0]}>
            {mat('#1a2a5a', 0.1, 0.4)}
          </RoundedBox>
          {/* Grid lines (horizontal) */}
          {[-0.2, 0, 0.2].map((y, i) => (
            <mesh key={`h${i}`} position={[0, 0.15 + y, 0.07]} rotation={[-0.3, 0, 0]}>
              <boxGeometry args={[1.0, 0.008, 0.005]} />
              {mat('#3a4a7a', 0.15, 0.5)}
            </mesh>
          ))}
          {/* Grid lines (vertical) */}
          {[-0.35, -0.12, 0.12, 0.35].map((x, i) => (
            <mesh key={`v${i}`} position={[x, 0.15, 0.07]} rotation={[-0.3, 0, 0]}>
              <boxGeometry args={[0.008, 0.67, 0.005]} />
              {mat('#3a4a7a', 0.15, 0.5)}
            </mesh>
          ))}
          {/* Mount pole */}
          <mesh position={[0, -0.35, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.5, 10]} />
            {mat('#666666', 0.55, 0.3)}
          </mesh>
          {/* Base plate */}
          <mesh position={[0, -0.62, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.04, 16]} />
            {mat('#555555', 0.5, 0.35)}
          </mesh>
        </group>
      )}

      {/* HARDWARE — Bolt + Nut + Washer */}
      {type === 'hardware' && (
        <group>
          {/* Bolt shaft */}
          <mesh position={[0, -0.1, 0]} rotation={[0.3, 0, 0.1]}>
            <cylinderGeometry args={[0.06, 0.06, 0.9, 16]} />
            {mat('#888888', 0.7, 0.18)}
          </mesh>
          {/* Bolt head (hex) */}
          <mesh position={[0, 0.38, 0]} rotation={[0.3, 0, 0.1]}>
            <cylinderGeometry args={[0.12, 0.12, 0.12, 6]} />
            {mat('#777777', 0.72, 0.16)}
          </mesh>
          {/* Nut */}
          <mesh position={[0, 0.05, 0.05]} rotation={[0.3, 0, 0.1]}>
            <cylinderGeometry args={[0.11, 0.11, 0.08, 6]} />
            {mat('#666666', 0.7, 0.2)}
          </mesh>
          {/* Washer */}
          <mesh position={[0, 0.2, 0.02]} rotation={[0.3, 0, 0.1]}>
            <torusGeometry args={[0.09, 0.02, 8, 20]} />
            {mat('#999999', 0.65, 0.22)}
          </mesh>
          {/* Thread detail (ridges) */}
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} position={[0, -0.1 + i * 0.06, 0]} rotation={[0.3, 0, 0.1]}>
              <torusGeometry args={[0.065, 0.008, 6, 16]} />
              {mat('#7a7a7a', 0.68, 0.2)}
            </mesh>
          ))}
        </group>
      )}

      {/* FIRE — Fire extinguisher */}
      {type === 'fire' && (
        <group>
          {/* Main cylinder body */}
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.9, 24]} />
            {mat('#cc2222', 0.15, 0.55)}
          </mesh>
          {/* Top dome */}
          <mesh position={[0, 0.42, 0]}>
            <sphereGeometry args={[0.22, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            {mat('#cc2222', 0.15, 0.55)}
          </mesh>
          {/* Handle */}
          <mesh position={[0.12, 0.52, 0]} rotation={[0, 0, 0.8]}>
            <boxGeometry args={[0.25, 0.04, 0.04]} />
            {mat('#222222', 0.1, 0.75)}
          </mesh>
          {/* Safety pin */}
          <mesh position={[0.18, 0.48, 0.04]}>
            <cylinderGeometry args={[0.012, 0.012, 0.08, 8]} />
            {mat('#c0c0c0', 0.7, 0.15)}
          </mesh>
          {/* Nozzle */}
          <mesh position={[0, 0.58, 0.12]} rotation={[0.6, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.02, 0.15, 10]} />
            {mat('#222222', 0.1, 0.7)}
          </mesh>
          {/* Pressure gauge */}
          <mesh position={[0, 0.35, 0.23]} rotation={[0.3, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
            {mat('#f0f0f0', 0.05, 0.85)}
          </mesh>
          {/* Label band */}
          <mesh position={[0, -0.05, 0.23]}>
            <boxGeometry args={[0.3, 0.25, 0.01]} />
            {mat('#f0f0f0', 0.03, 0.9)}
          </mesh>
        </group>
      )}

      {/* PACKAGING — Cardboard box with tape */}
      {type === 'packaging' && (
        <group>
          {/* Box body */}
          <RoundedBox args={[0.85, 0.65, 0.7]} radius={0.03} smoothness={3} position={[0, -0.05, 0]}>
            {mat('#c8a060', 0.03, 0.88)}
          </RoundedBox>
          {/* Box flap left */}
          <RoundedBox args={[0.42, 0.03, 0.68]} radius={0.01} smoothness={3} position={[-0.22, 0.29, 0]} rotation={[0.05, 0, 0]}>
            {mat('#b89050', 0.03, 0.9)}
          </RoundedBox>
          {/* Box flap right */}
          <RoundedBox args={[0.42, 0.03, 0.68]} radius={0.01} smoothness={3} position={[0.22, 0.29, 0]} rotation={[-0.05, 0, 0]}>
            {mat('#b89050', 0.03, 0.9)}
          </RoundedBox>
          {/* Tape center strip */}
          <mesh position={[0, 0.31, 0]}>
            <boxGeometry args={[0.08, 0.008, 0.72]} />
            {mat('#c8a840', 0.02, 0.6)}
          </mesh>
          {/* Tape cross strip */}
          <mesh position={[0, 0.31, 0]}>
            <boxGeometry args={[0.87, 0.008, 0.08]} />
            {mat('#c8a840', 0.02, 0.6)}
          </mesh>
          {/* Corrugation lines (side detail) */}
          {[-0.15, 0, 0.15].map((y, i) => (
            <mesh key={i} position={[0.43, -0.05 + y, 0]}>
              <boxGeometry args={[0.008, 0.005, 0.68]} />
              {mat('#b89050', 0.03, 0.9)}
            </mesh>
          ))}
        </group>
      )}

    </group>
  )
}

/*
  IMPORTANT FIX

  Pehle har card page load hote hi Canvas create karta tha.

  Ab IntersectionObserver use ho raha hai.
  Sirf visible/near-visible card ka Canvas create hoga.
*/
function LazyIndustryCanvas({ type, theme }) {
  const containerRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = containerRef.current

    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)

          // Ek baar load hone ke baad observer ki zarurat nahi
          observer.disconnect()
        }
      },
      {
        rootMargin: '300px',
        threshold: 0.01,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="industry-3d-scene bg-brand-gradient/30"
    >
      {isVisible ? (
        <Canvas
          camera={{
            position: [0, 0, 4.2],
            fov: 45,
          }}
          dpr={[1, 1.25]}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
          }}
        >
          <ambientLight intensity={1.7} />

          <directionalLight
            position={[3, 4, 5]}
            intensity={2.5}
          />

          <pointLight
            position={[-3, 1, 3]}
            intensity={1.2}
          />

          <Float
            speed={2}
            rotationIntensity={0.5}
            floatIntensity={0.8}
          >
            <IndustryObject
              type={type}
              theme={theme}
            />
          </Float>
        </Canvas>
      ) : null}

      <div className="industry-3d-label">
        3D
      </div>
    </div>
  )
}

export default function Industry3DCard({
  title,
  description,
  type,
}) {
  const { theme } = useTheme()

  return (
    <div className="group card p-0 overflow-hidden hover:-translate-y-2">

      <LazyIndustryCanvas
        type={type}
        theme={theme}
      />

      <div className="p-5">
        <h3 className="font-display text-xl font-semibold text-text">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-muted">
          {description}
        </p>
      </div>

    </div>
  )
}