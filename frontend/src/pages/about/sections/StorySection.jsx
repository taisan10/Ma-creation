

export default function StorySection({ cms = {} }) {
  return (

      <section data-font-section="about.story" className="section">
        <div className="wrap grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 items-start">
          <div>
            <span className="eyebrow">Our Story</span>
            <h2 className="h2 mt-3 text-[26px] md:text-[34px]">{cms.storyTitle||'Why MA Creation exists'}</h2>
            {(cms.storyParagraphs?.length ? cms.storyParagraphs : ['GeM opened government procurement to any registered business — but the portal itself is unforgiving. A single incorrect specification can get a listing rejected; a missed deadline can cost a bid. Most sellers don’t have a full-time team to watch the portal every day.','MA Creation was built to be that team — handling registration, cataloguing, training and bidding so our clients can focus on fulfilling orders, not chasing paperwork. We work as an extension of your business, not a one-time vendor.']).map((paragraph,i)=><p key={i} className="mt-4 text-ink/70 text-[16.5px] max-w-[56ch]">{paragraph}</p>)}
            <div className="mt-7 flex gap-3.5 flex-wrap">
              <span className="badge">Gold GeM Certified Team</span>
              <span className="badge">Pan‑India Support</span>
              <span className="badge">24×7 Helpdesk</span>
            </div>
          </div>

          <div className="card">
            <span className="eyebrow">What We Believe</span>
            <ul className="mt-4.5 space-y-4">
              {(cms.values||[]).map((v,i)=><li key={v} className="text-[14.5px] text-ink/70"><strong className="block mb-0.5 text-ink">{v}</strong>MA Creation applies this principle across client work.</li>)}
              <li className="text-[14.5px] text-ink/70">
                <strong className="block mb-0.5 text-ink">Documentation is strategy.</strong>
                A clean file wins more often than a low price.
              </li>
              <li className="text-[14.5px] text-ink/70">
                <strong className="block mb-0.5 text-ink">Consultancy should be data‑driven.</strong>
                Every recommendation is backed by portal analytics, not guesswork.
              </li>
              <li className="text-[14.5px] text-ink/70">
                <strong className="block mb-0.5 text-ink">Training builds independence.</strong>
                We&rsquo;d rather teach your team to fish than keep every key to your account.
              </li>
            </ul>
          </div>
        </div>
      </section>

      
  )
}
