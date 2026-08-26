import { Canvas, useFrame } from '@react-three/fiber'
import { Float, RoundedBox, Environment } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../../../theme'

/* =========================================================
   3D MATERIAL
========================================================= */

function Material({ color, metalness = 0.45, roughness = 0.22 }) {
  return (
    <meshStandardMaterial
      color={color}
      metalness={metalness}
      roughness={roughness}
    />
  )
}

/* =========================================================
   3D MODELS
========================================================= */

function Gem3DModel({ type, theme }) {
  const group = useRef()

  useFrame((state, delta) => {
    if (!group.current) return

    // Continuous horizontal rotation
    group.current.rotation.y += delta * 0.65

    // Slight vertical movement
    group.current.position.y =
      Math.sin(state.clock.elapsedTime * 1.5) * 0.06
  })

  const primary = theme.primary
  const primaryDark = theme.primaryDark
  const secondary = theme.secondary
  const accent = theme.accent
  const accent2 = theme.accent2
  const surface = theme.surface

  /* ---------------------------------------------------------
     1. PRODUCT CATEGORIES
  --------------------------------------------------------- */

  if (type === 'products') {
    return (
      <group ref={group}>
        <RoundedBox
          args={[0.65, 0.65, 0.65]}
          radius={0.08}
          smoothness={4}
          position={[-0.42, -0.05, 0]}
        >
          <Material
            color={primary}
            metalness={0.55}
            roughness={0.2}
          />
        </RoundedBox>

        <RoundedBox
          args={[0.65, 0.65, 0.65]}
          radius={0.08}
          smoothness={4}
          position={[0.42, -0.05, 0]}
        >
          <Material
            color={secondary}
            metalness={0.55}
            roughness={0.2}
          />
        </RoundedBox>

        <RoundedBox
          args={[0.65, 0.65, 0.65]}
          radius={0.08}
          smoothness={4}
          position={[0, 0.62, 0]}
        >
          <Material
            color={accent2}
            metalness={0.55}
            roughness={0.2}
          />
        </RoundedBox>

        <mesh position={[0, -0.48, 0]}>
          <cylinderGeometry args={[0.82, 0.9, 0.12, 48]} />
          <Material
            color={surface}
            metalness={0.75}
            roughness={0.18}
          />
        </mesh>

        <pointLight
          position={[0, 1, 1]}
          intensity={2}
          color={accent2}
        />
      </group>
    )
  }

  /* ---------------------------------------------------------
     2. PAYMENT
  --------------------------------------------------------- */

  if (type === 'payment') {
    return (
      <group ref={group}>
        <RoundedBox
          args={[1.35, 0.9, 0.14]}
          radius={0.12}
          smoothness={5}
          rotation={[0.18, 0, -0.08]}
        >
          <Material
            color={primary}
            metalness={0.65}
            roughness={0.18}
          />
        </RoundedBox>

        <mesh position={[0, 0.1, 0.1]}>
          <boxGeometry args={[1.05, 0.08, 0.035]} />
          <Material
            color={accent}
            metalness={0.25}
            roughness={0.3}
          />
        </mesh>

        <mesh position={[-0.38, -0.18, 0.1]}>
          <boxGeometry args={[0.25, 0.18, 0.035]} />
          <Material
            color={accent2}
            metalness={0.3}
            roughness={0.25}
          />
        </mesh>

        <mesh position={[0.2, -0.2, 0.1]}>
          <cylinderGeometry args={[0.12, 0.12, 0.035, 32]} />
          <Material
            color={secondary}
            metalness={0.5}
            roughness={0.2}
          />
        </mesh>

        <pointLight
          position={[0, 0, 1]}
          intensity={2}
          color={accent2}
        />
      </group>
    )
  }

  /* ---------------------------------------------------------
     3. PROCUREMENT / BID
  --------------------------------------------------------- */

  if (type === 'procurement') {
    return (
      <group ref={group}>
        {/* Gavel head */}
        <RoundedBox
          args={[0.72, 0.38, 0.38]}
          radius={0.08}
          smoothness={4}
          position={[0.25, 0.35, 0]}
          rotation={[0, 0, -0.4]}
        >
          <Material
            color={primary}
            metalness={0.65}
            roughness={0.2}
          />
        </RoundedBox>

        {/* Handle */}
        <mesh
          position={[-0.3, -0.02, 0]}
          rotation={[0, 0, -0.4]}
        >
          <cylinderGeometry args={[0.075, 0.075, 1.2, 24]} />
          <Material
            color={secondary}
            metalness={0.45}
            roughness={0.25}
          />
        </mesh>

        {/* Base */}
        <mesh position={[0, -0.58, 0]}>
          <cylinderGeometry args={[0.55, 0.65, 0.16, 40]} />
          <Material
            color={surface}
            metalness={0.7}
            roughness={0.18}
          />
        </mesh>

        <mesh position={[0, -0.44, 0]}>
          <cylinderGeometry args={[0.35, 0.42, 0.15, 40]} />
          <Material
            color={primaryDark}
            metalness={0.55}
            roughness={0.2}
          />
        </mesh>

        <pointLight
          position={[0, 1, 1]}
          intensity={2}
          color={accent}
        />
      </group>
    )
  }

  /* ---------------------------------------------------------
     4. TRANSPARENCY / SPEED
  --------------------------------------------------------- */

  if (type === 'transparency') {
    return (
      <group ref={group}>
        {/* Magnifying glass */}
        <mesh position={[0, 0.2, 0]}>
          <torusGeometry args={[0.48, 0.11, 16, 48]} />
          <Material
            color={accent2}
            metalness={0.7}
            roughness={0.16}
          />
        </mesh>

        <mesh
          position={[0.42, -0.35, 0]}
          rotation={[0, 0, -0.6]}
        >
          <cylinderGeometry args={[0.09, 0.09, 0.85, 24]} />
          <Material
            color={primary}
            metalness={0.55}
            roughness={0.2}
          />
        </mesh>

        {/* Data bars */}
        {[0, 1, 2].map((index) => (
          <RoundedBox
            key={index}
            args={[
              0.16,
              0.35 + index * 0.18,
              0.12,
            ]}
            radius={0.04}
            smoothness={3}
            position={[
              -0.48 + index * 0.3,
              -0.35 + (index * 0.09),
              -0.12,
            ]}
          >
            <Material
              color={
                index === 1
                  ? secondary
                  : primary
              }
              metalness={0.45}
              roughness={0.22}
            />
          </RoundedBox>
        ))}

        <pointLight
          position={[0, 0, 1]}
          intensity={2}
          color={accent2}
        />
      </group>
    )
  }

  /* ---------------------------------------------------------
     5. ONLINE ORDERING
  --------------------------------------------------------- */

  if (type === 'ordering') {
    return (
      <group ref={group}>
        {/* Document */}
        <RoundedBox
          args={[0.9, 1.18, 0.12]}
          radius={0.08}
          smoothness={4}
          position={[0, 0.08, 0]}
          rotation={[0, 0, -0.08]}
        >
          <Material
            color={surface}
            metalness={0.25}
            roughness={0.28}
          />
        </RoundedBox>

        {/* Document lines */}
        {[0.32, 0.05, -0.22].map((y) => (
          <mesh key={y} position={[0, y, 0.09]}>
            <boxGeometry args={[0.55, 0.06, 0.035]} />
            <Material
              color={primary}
              metalness={0.3}
              roughness={0.25}
            />
          </mesh>
        ))}

        {/* Pen */}
        <mesh
          position={[0.45, -0.25, 0.25]}
          rotation={[0.2, 0, -0.65]}
        >
          <cylinderGeometry args={[0.055, 0.055, 0.85, 20]} />
          <Material
            color={secondary}
            metalness={0.7}
            roughness={0.16}
          />
        </mesh>

        {/* Base */}
        <mesh position={[0, -0.65, 0]}>
          <cylinderGeometry args={[0.68, 0.78, 0.12, 40]} />
          <Material
            color={primaryDark}
            metalness={0.65}
            roughness={0.18}
          />
        </mesh>

        <pointLight
          position={[0, 1, 1]}
          intensity={2}
          color={accent}
        />
      </group>
    )
  }

  return null
}

/* =========================================================
   3D CANVAS
========================================================= */

function Gem3DIcon({ type, theme }) {
  return (
    <div className="h-[150px] w-full">
      <Canvas
        camera={{
          position: [0, 0, 3.4],
          fov: 42,
        }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: true,
        }}
      >
        <ambientLight intensity={1.8} />

        <directionalLight
          position={[3, 4, 5]}
          intensity={2.5}
        />

        <directionalLight
          position={[-3, 1, -2]}
          intensity={1.2}
        />

        <Float
          speed={2}
          rotationIntensity={0.18}
          floatIntensity={0.5}
        >
          <Gem3DModel
            type={type}
            theme={theme}
          />
        </Float>

        <Environment preset="city" environmentIntensity={0.25} />
      </Canvas>
    </div>
  )
}

/* =========================================================
   LAZY LOAD 3D
========================================================= */

function LazyGem3DIcon({ type, theme }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current

    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '250px',
        threshold: 0.01,
      }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="w-full">
      {visible ? (
        <Gem3DIcon
          type={type}
          theme={theme}
        />
      ) : (
        <div className="h-[150px]" />
      )}
    </div>
  )
}

/* =========================================================
   STAT CARD
========================================================= */

function StatItem({
  number,
  label,
  type,
  theme,
}) {
  return (
    <div className="relative flex flex-col items-center justify-center px-5 py-8 text-center">
      <LazyGem3DIcon
        type={type}
        theme={theme}
      />

      <div
        className="
          -mt-2
          text-[34px]
          font-bold
          tracking-tight
          md:text-[40px]
        "
        style={{ color: 'var(--text)' }}
      >
        {number}
      </div>

      <div
        className="
          mt-1
          text-[14px]
          font-semibold
          uppercase
          tracking-[0.06em]
        "
        style={{ color: 'var(--primary)' }}
      >
        {label}
      </div>
    </div>
  )
}

/* =========================================================
   FEATURE CARD
========================================================= */

function FeatureItem({
  type,
  title,
  description,
  theme,
}) {
  return (
    <div
      className="
        group
        relative
        min-w-0
        border-t
        px-4
        py-8
        text-center
        transition-all
        duration-500
        hover:-translate-y-2
        md:border-t-0
        md:border-l
        md:first:border-l-0
      "
      style={{
        borderColor: 'rgb(var(--border-rgb) / 0.65)',
      }}
    >
      {/* Hover glow */}
      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-12
          h-28
          w-28
          -translate-x-1/2
          rounded-full
          opacity-0
          blur-3xl
          transition-opacity
          duration-500
          group-hover:opacity-40
        "
        style={{
          background: 'var(--primary)',
        }}
      />

      <div className="relative">
        <LazyGem3DIcon
          type={type}
          theme={theme}
        />

        <h3
          className="
            mx-auto
            max-w-[220px]
            text-[15px]
            font-bold
            leading-5
          "
          style={{ color: 'var(--text)' }}
        >
          {title}
        </h3>

        <p
          className="
            mx-auto
            mt-3
            max-w-[230px]
            text-[13px]
            leading-6
          "
          style={{ color: 'var(--muted)' }}
        >
          {description}
        </p>
      </div>
    </div>
  )
}

/* =========================================================
   MAIN SECTION
========================================================= */

export default function WhyChooseGemSection({
  cms = {},
}) {
  const { theme } = useTheme()

  const stats = [
    {
      number:
        cms.gemProductCategories ||
        '10,642',
      label:
        cms.gemProductCategoriesLabel ||
        'Product Categories',
      type: 'products',
    },
    {
      number:
        cms.gemOrderValue ||
        '2,022,751',
      label:
        cms.gemOrderValueLabel ||
        'Order Value (Cr.)',
      type: 'payment',
    },
    {
      number:
        cms.gemServiceCategories ||
        '350',
      label:
        cms.gemServiceCategoriesLabel ||
        'Service Categories',
      type: 'products',
    },
  ]

  const features = [
    {
      type: 'products',
      title:
        cms.gemFeature1Title ||
        'Rich Listing of Products / Services',
      description:
        cms.gemFeature1Text ||
        'Wide range of quality products and services from verified sellers.',
    },
    {
      type: 'payment',
      title:
        cms.gemFeature2Title ||
        'Integrated Payment System',
      description:
        cms.gemFeature2Text ||
        'Secure and seamless payment experience for procurement.',
    },
    {
      type: 'procurement',
      title:
        cms.gemFeature3Title ||
        'Multiple Procurement Modes',
      description:
        cms.gemFeature3Text ||
        'Direct Purchase, Bid, RA and more for every business requirement.',
    },
    {
      type: 'transparency',
      title:
        cms.gemFeature4Title ||
        'Great Transparency and Speed',
      description:
        cms.gemFeature4Text ||
        'Transparent procurement process ensuring faster and better outcomes.',
    },
    {
      type: 'ordering',
      title:
        cms.gemFeature5Title ||
        'Online Ordering and Contract Generation',
      description:
        cms.gemFeature5Text ||
        'End-to-end online ordering and contract management.',
    },
  ]

  return (
    <section
      data-font-section="home.whyChooseGem"
      className="
        section
        relative
        overflow-hidden
      "
      style={{
        background:
          'linear-gradient(135deg, var(--background) 0%, var(--backgroundAlt) 100%)',
      }}
    >
      {/* =================================================
          BACKGROUND 3D ORBS
      ================================================= */}

      <div
        className="
          pointer-events-none
          absolute
          -left-24
          top-20
          h-72
          w-72
          rounded-full
          blur-3xl
          opacity-20
        "
        style={{
          background: 'var(--primary)',
        }}
      />

      <div
        className="
          pointer-events-none
          absolute
          -right-24
          bottom-10
          h-80
          w-80
          rounded-full
          blur-3xl
          opacity-20
        "
        style={{
          background: 'var(--secondary)',
        }}
      />

      <div className="wrap relative z-10">
        {/* =================================================
            HEADING
        ================================================= */}

        <div className="mx-auto max-w-3xl text-center">
          <span
            className="eyebrow"
          >
            {cms.gemPowerEyebrow ||
              'The Power of GeM'}
          </span>

          <h2
            className="
              h2
              mt-3
              text-[28px]
              md:text-[38px]
            "
          >
            {cms.gemPowerTitle ||
              'Why you should choose GeM'}
          </h2>

          <p
            className="
              mx-auto
              mt-4
              max-w-[650px]
              text-[15px]
              leading-7
            "
            style={{
              color:
                'rgb(var(--muted-rgb) / 0.9)',
            }}
          >
            {cms.gemPowerText ||
              'GeM offers a transparent, efficient and inclusive platform for government procurement of products and services.'}
          </p>
        </div>

        {/* =================================================
            MAIN GLASS / 3D PANEL
        ================================================= */}

        <div
          className="
            relative
            mt-12
            overflow-hidden
            rounded-[28px]
            border
            p-4
            shadow-xl
            backdrop-blur-xl
            md:p-6
          "
          style={{
            background:
              'rgb(var(--surface-rgb) / 0.78)',
            borderColor:
              'rgb(var(--primary-rgb) / 0.22)',
            boxShadow:
              '0 24px 70px rgb(var(--shadow-rgb) / 0.12)',
          }}
        >
          {/* Top glow */}
          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              top-0
              h-1
              w-[70%]
              -translate-x-1/2
              rounded-full
              blur-sm
            "
            style={{
              background:
                'linear-gradient(90deg, transparent, var(--primary), var(--secondary), transparent)',
            }}
          />

          {/* =================================================
              STATS
          ================================================= */}

          <div
            className="
              grid
              grid-cols-1
              divide-y
              md:grid-cols-3
              md:divide-x
              md:divide-y-0
            "
            style={{
              '--tw-divide-opacity': 1,
            }}
          >
            {stats.map((stat) => (
              <StatItem
                key={stat.label}
                {...stat}
                theme={theme}
              />
            ))}
          </div>

          {/* Divider */}
          <div
            className="my-2 h-px"
            style={{
              background:
                'rgb(var(--border-rgb) / 0.7)',
            }}
          />

          {/* =================================================
              FEATURES
          ================================================= */}

          <div className="grid grid-cols-1 md:grid-cols-5">
            {features.map((feature) => (
              <FeatureItem
                key={feature.title}
                {...feature}
                theme={theme}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}