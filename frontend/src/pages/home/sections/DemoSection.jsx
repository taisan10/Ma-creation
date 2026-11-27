import { useState } from 'react'
import { CheckCircle2, Clock, PhoneCall, ShieldCheck } from 'lucide-react'
import DemoForm from '../../../components/DemoForm'

const CONSULTATION_STEPS = [
  'Quick review of your business profile, products, or service vertical',
  'Live GeM portal walkthrough for registration, catalog, or bidding',
  'Clear next-step roadmap with zero obligation to buy a plan',
]

export default function DemoSection({ cms = {} }) {
  const [avatarFailed, setAvatarFailed] = useState(false)

  const title = cms.demoTitle || 'Book Your Free GeM Expert Consultation'
  const summary =
    cms.demoText ||
    'Whether you run an established company, a startup, or an individual proprietorship, share a few details and our GeM advisors will map the fastest compliant path on the Government e-Marketplace.'
  const founderName = cms.founderName || 'Chanchal Mangal'
  const founderRole =
    cms.founderRole || 'Founder & GeM Consultant — leads onboarding strategy personally'
  const founderImage = cms.founderImage || '/assets/chanchal.jpeg'
  const helpline = cms.phone || '+91-8387937000'

  return (
    <section
      data-font-section="home.demo"
      id="demo"
      aria-labelledby="demo-section-heading"
      className="bg-paper2 section scroll-mt-20 md:scroll-mt-24 border-t border-ink/10"
    >
      <div className="wrap grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-12 items-start">
        <div className="min-w-0 lg:sticky lg:top-24">
          <h2
            id="demo-section-heading"
            className="h2 tracking-[-0.02em] text-balance"
          >
            {title}
          </h2>

          <p className="mt-4 text-[15.5px] leading-relaxed text-ink/80 max-w-[48ch] text-pretty">
            {summary}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-card/80 px-3 py-1 text-xs font-semibold text-secondaryDark">
            <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Free 15-min consultation · Reply within 24 hours</span>
          </div>

          <div className="mt-7 flex items-center gap-4 pt-6 border-t border-ink/10">
            {!avatarFailed ? (
              <img
                src={founderImage}
                alt={`${founderName}, ${founderRole}`}
                width={64}
                height={64}
                decoding="async"
                onError={() => setAvatarFailed(true)}
                className="w-16 h-16 rounded-full object-cover border border-ink/15 shadow-sm shrink-0 bg-card"
              />
            ) : (
              <div
                aria-hidden="true"
                className="w-16 h-16 rounded-full bg-ink text-paper flex items-center justify-center font-display text-2xl shrink-0"
              >
                {founderName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-base text-ink">{founderName}</p>
              <p className="text-[13.5px] text-ink/75 leading-snug mt-0.5">
                {founderRole}
              </p>
            </div>
          </div>

          <div className="mt-7 pt-6 border-t border-ink/10">
            <h3 className="text-sm font-semibold text-ink">
              What we cover on your call
            </h3>
            <ul className="mt-3.5 space-y-3 text-[14.5px] text-ink/80">
              {CONSULTATION_STEPS.map((step) => (
                <li key={step} className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="w-4 h-4 text-secondary shrink-0 mt-1"
                    aria-hidden="true"
                  />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-7 pt-5 border-t border-ink/10 flex flex-wrap items-center justify-between gap-3 text-[13.5px] text-ink/75">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-secondary shrink-0" aria-hidden="true" />
              <span>100% free · No spam or cold sales calls</span>
            </span>
            <a
              href={`tel:${helpline.replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-1.5 font-semibold text-primaryDark hover:text-primary underline-offset-4 hover:underline"
            >
              <PhoneCall className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Call {helpline}</span>
            </a>
          </div>
        </div>

        <DemoForm helpline={helpline} />
      </div>
    </section>
  )
}
