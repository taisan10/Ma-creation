// Reusable "official seal" motifs used across the site: the header
// monogram, the rotating hero stamp, and the gold/silver certification
// badges. Kept as SVG so they stay crisp at any size.

export function SealMark({ className = 'w-9 h-9' }) {
  return (
    <img
      src="/logo.jpg"
      alt="MA Creation"
      className={`${className} rounded-full object-cover shrink-0`}
    />
  )
}

export function StampSeal({ className = 'w-[120px] h-[120px]' }) {
  return (
    <svg className={className} viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--secondary)' }}>
      <g className="animate-sealspin" style={{ transformOrigin: '80px 80px' }}>
        <path id="stampCircle" d="M80,80 m-64,0 a64,64 0 1,1 128,0 a64,64 0 1,1 -128,0" fill="none" />
        <text fontFamily="'IBM Plex Mono', monospace" fontSize="9.5" letterSpacing="3" fill="currentColor">
          <textPath href="#stampCircle" startOffset="2%">
            GeM READY · MA CREATION · GeM READY · MA CREATION ·
          </textPath>
        </text>
      </g>
      <circle cx="80" cy="80" r="38" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <text x="80" y="76" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="15" fill="currentColor">VERIFIED</text>
      <text x="80" y="93" textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize="9" fill="currentColor">SELLER FILE</text>
    </svg>
  )
}

export function CertSeal({ tier = 'gold', className = 'w-[120px] h-[120px]' }) {
  const isGold = tier === 'gold'
  const color = isGold ? 'var(--primary)' : 'rgb(var(--background-rgb) / .55)'
  const label = isGold ? 'GOLD' : 'SILVER'
  const sub = isGold ? 'GeM EXPERT' : 'PORTAL USER'
  return (
    <svg className={className} viewBox="0 0 120 120" style={{ color }}>
      <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" />
      <text x="60" y="56" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="13" fill="currentColor">{label}</text>
      <text x="60" y="72" textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize="8" fill="currentColor">{sub}</text>
    </svg>
  )
}
