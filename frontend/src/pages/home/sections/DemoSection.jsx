import DemoForm from '../../../components/DemoForm'

export default function DemoSection({ cms = {}, faqs = [], stats = [], industries = [] }) {
  return (

      <section data-font-section="home.demo" id="demo" className="bg-paper2 section">
        <div className="wrap grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-start">
          <div>
            <span className="eyebrow">Get Started</span>
            <h2 className="h2 mt-3 text-[26px] md:text-[32px]">Book your free GeM consultancy &amp; live demo</h2>
            <p className="mt-4 text-ink/70 max-w-[48ch]">
              Connect with our GeM experts for personalised guidance. Tell us a little about your business and we&rsquo;ll arrange a live walkthrough of the portal.
            </p>

            <div className="flex gap-4 items-center mt-8">
              <div className="w-16 h-16 rounded-full bg-ink text-paper flex items-center justify-center font-display text-2xl shrink-0">C</div>
              <div>
                <p className="font-semibold">Chanchal</p>
                <p className="text-[13px] text-ink/70">Founder &amp; GeM Consultant — leads every onboarding call personally</p>
              </div>
            </div>

            <ul className="mt-7 space-y-2.5 text-sm text-ink/70">
              <li>✓ Response within 24 hours of your request</li>
              <li>✓ No obligation — the first consultation is free</li>
              <li>✓ Pan‑India, in your language</li>
            </ul>
          </div>

          <DemoForm />
        </div>
      </section>

      
  )
}
