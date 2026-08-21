import { Link } from 'react-router-dom'

export default function ServicesOverviewSection({ cms = {}, faqs = [], stats = [], industries = [] }) {
  return (

      <section data-font-section="home.servicesOverview" id="services" className="section">
        <div className="wrap">
          <div className="max-w-[640px] mb-12">
            <span className="eyebrow">Our GeM Services</span>
            <h2 className="h2 mt-3">Your one‑stop partner for everything on the Government e‑Marketplace</h2>
            <p className="lede mt-4">From first registration to your hundredth bid, MA Creation&rsquo;s consultants stay attached to your account.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <span className="font-mono text-[13px] text-gold2">01</span>
              <h3 className="mt-3.5 font-display text-xl">GeM Consultation</h3>
              <p className="mt-2 font-semibold text-[14.5px]">Registration to order processing — complete expert support.</p>
              <p className="mt-2.5 text-ink/70 text-[14.5px]">We handle seller registration, listings, compliance and full operational assistance for a seamless GeM experience.</p>
            </div>
            <div className="card">
              <span className="font-mono text-[13px] text-gold2">02</span>
              <h3 className="mt-3.5 font-display text-xl">GeM Trainings</h3>
              <p className="mt-2 font-semibold text-[14.5px]">Custom training designed around your products &amp; services.</p>
              <p className="mt-2.5 text-ink/70 text-[14.5px]">Hands‑on sessions covering dashboard management, listings, and bid / reverse‑auction participation, tailored to your business.</p>
            </div>
            <div className="card">
              <span className="font-mono text-[13px] text-gold2">03</span>
              <h3 className="mt-3.5 font-display text-xl">Bids &amp; Reverse Auction</h3>
              <p className="mt-2 font-semibold text-[14.5px]">End‑to‑end guidance for bid &amp; RA participation.</p>
              <p className="mt-2.5 text-ink/70 text-[14.5px]">We support the full bidding process — eligibility checks, documentation, pricing strategy and final submission.</p>
            </div>
          </div>

          <Link to="/services" className="btn-outline btn-sm mt-8 inline-flex">See the full service catalog →</Link>
        </div>
      </section>

      
  )
}
