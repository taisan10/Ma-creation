import { Link } from 'react-router-dom'
export default function AboutHeroSection({ cms = {} }) {
  return <>
    <div className="wrap pt-6 font-mono text-xs text-ink/50"><Link to="/" className="hover:text-ink">Home</Link> / About Us</div>
    {/* <section data-font-section="about.hero" className="pt-10 pb-14 border-b border-ink/10">
      <div className="wrap">
        <span className="eyebrow">{cms.eyebrow || 'About MA Creation'}</span>
        <h1 className="mt-4 font-display font-semibold text-[32px] sm:text-[40px] lg:text-[48px] leading-[1.08] text-ink">{cms.title || 'A consultancy built around one file: yours.'}</h1>
        <p className="mt-4 text-lg text-ink/70 max-w-[62ch]">{cms.intro || 'We started MA Creation to close the gap between businesses and the Government e‑Marketplace — where compliance, documentation and bidding strategy matter.'}</p>
      </div>
    </section> */}
  </>
}
