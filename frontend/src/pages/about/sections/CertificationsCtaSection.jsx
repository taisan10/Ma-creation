import { CertSeal } from '../../../components/Seal'

export default function CertificationsCtaSection({ cms = {} }) {
  return (
<>
      <section data-font-section="about.certificationsCta" className="bg-ink section-tight">
        <div className="wrap flex items-center gap-10 flex-wrap justify-between">
          <div className="flex gap-6 items-center">
            <CertSeal tier="gold" className="w-20 h-20" />
            <div>
              <h3 className="text-paper font-display text-xl">Certified on both tiers of the GeM assessment</h3>
              <p className="mt-1.5 text-paper/65 text-sm max-w-[46ch]">
                Covering basic portal use through advanced functionality, vendor assessment and bid strategy.
              </p>
            </div>
          </div>
          <a href="/#demo" className="btn-gold">Talk to Our Team</a>
        </div>
      </section>
    </>
  )
}

