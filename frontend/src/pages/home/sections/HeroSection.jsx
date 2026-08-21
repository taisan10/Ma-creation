import { Link } from 'react-router-dom'
import { StampSeal } from '../../../components/Seal'
import ThreeCaseFile from '../../../components/three/ThreeCaseFile'

function CaseFileRow({ label, status, tone = 'teal' }) {
  const tones = {
    teal: 'text-teal border-teal/20 bg-teal/5',
    gold: 'text-gold2 border-gold/20 bg-gold/5',
    rust: 'text-rust border-rust/20 bg-rust/5',
  }
  return <div className={`flex items-center justify-between gap-3 py-2.5 border-b border-ink/10 last:border-0 text-sm`}>
    <span className="text-ink/70">{label}</span>
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tones[tone] || tones.teal}`}>{status}</span>
  </div>
}

export default function HeroSection({ cms = {}, faqs = [], stats = [], industries = [] }) {
  return (

      <section data-font-section="home.hero" className="pt-16 md:pt-20 pb-10">
        <div className="wrap grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
          <div>
            <span className="eyebrow">{cms.heroEyebrow||'GeM Consultancy · File Ref. MAC/GEM/2025'}</span>
            <h1 className="mt-4 font-display font-semibold text-[38px] sm:text-[48px] lg:text-[58px] leading-[1.05] text-ink">
              {(cms.heroTitle||'Every government tender starts with a clean file.').split(' ').map((word,i)=><span key={i}>{word}{' '}</span>)}
            </h1>
            <p className="mt-6 text-lg text-ink/70 max-w-[48ch]">
              {cms.heroText||'MA Creation registers, lists, trains and bids on your behalf on the Government e‑Marketplace — so your business shows up compliant, verified, and ready for orders.'}
            </p>
            <div className="mt-8 flex gap-3.5 flex-wrap">
              <a href="#demo" className="btn-gold">Book Free Live Demo</a>
              <Link to="/plans" className="btn-outline">View Retainer Plans</Link>
            </div>
            <p className="mt-5 font-mono text-xs text-ink/50">
              PAN‑INDIA SUPPORT · GOLD &amp; SILVER GeM‑CERTIFIED CONSULTANTS · 24×7 HELPDESK
            </p>
          </div>

          <div className="relative flex items-center justify-center min-h-[360px]"><ThreeCaseFile /></div>
          <div className="relative bg-card border border-ink/10 rounded-[10px] p-6 shadow-card hidden">
            <div className="absolute -top-4 -right-4">
              <StampSeal className="w-[110px] h-[110px]" />
            </div>
            <span className="eyebrow">Case File Status</span>
            <div className="mt-4">
              <CaseFileRow label="01 · Documents" status="Verified" tone="teal" />
              <CaseFileRow label="02 · GeM Listing" status="Live" tone="teal" />
              <CaseFileRow label="03 · Bid Filed" status="Submitted" tone="gold" />
              <CaseFileRow label="04 · Order" status="Awaiting L1" tone="rust" />
            </div>
          </div>
        </div>
      </section>

      
  )
}
