import { CertSeal } from '../../../components/Seal'

export default function CertificationsSection({ cms = {}, faqs = [], stats = [], industries = [] }) {
  return (

      <section data-font-section="home.certifications" className="bg-ink text-paper section">
        <div className="wrap grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center">
          <div className="flex gap-8 flex-wrap">
            <div className="text-center">
              <CertSeal tier="gold" className="w-[110px] h-[110px]" />
              <p className="mt-1.5 text-[12.5px] text-paper/60">Advanced functionality</p>
            </div>
            <div className="text-center">
              <CertSeal tier="silver" className="w-[110px] h-[110px]" />
              <p className="mt-1.5 text-[12.5px] text-paper/60">Basic functionality</p>
            </div>
          </div>
          <div>
            <span className="eyebrow-light">Certification Programs</span>
            <h2 className="mt-3 font-display font-semibold text-[24px] md:text-[32px] text-paper">
              Build trust with official GeM certifications
            </h2>
            <p className="mt-4 text-paper/75 max-w-[52ch]">
              Our consultants hold Gold and Silver GeM certifications and prepare client teams for the same — covering both foundational and advanced portal functionality.
            </p>
            <div className="mt-7 border-l-2 border-goldlight pl-5 font-display text-xl leading-relaxed text-paper">
              Data‑driven consultancy, not guesswork — every recommendation is backed by portal analytics and competition insight.
              <cite className="block mt-3 not-italic font-mono text-xs text-paper/55">— Chanchal, Founder &amp; GeM Consultant</cite>
            </div>
          </div>
        </div>
      </section>

      
  )
}
