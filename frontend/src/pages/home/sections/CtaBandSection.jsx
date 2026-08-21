

export default function CtaBandSection({ cms = {}, faqs = [], stats = [], industries = [] }) {
  return (
<>

      <section data-font-section="home.cta" className="bg-ink section-tight">
        <div className="wrap flex items-center justify-between flex-wrap gap-5">
          <div>
            <span className="eyebrow-light">Ready when you are</span>
            <h2 className="mt-2.5 font-display font-semibold text-[22px] md:text-[28px] text-paper">
              Your guide to GeM success starts with a conversation.
            </h2>
          </div>
          <a href="#demo" className="btn-gold">Book Free Demo</a>
        </div>
      </section>
    </>
  )
}

