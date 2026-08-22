

export default function GemOverviewSection({ cms = {}, faqs = [], stats = [], industries = [] }) {
  return (

      <section data-font-section="home.gemOverview" className="section bg-paper2">
        <div className="wrap grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 items-start">
          <div>
            <span className="eyebrow">Government e‑Marketplace</span>
            <h2 className="h2 mt-3 text-[26px] md:text-[34px]">{cms.gemTitle||'What is Gem ? '}</h2>
            <p className="mt-4 text-ink/70 text-[16.5px] max-w-[56ch]">{cms.gemText||'Government e-Marketplace (GeM) is the Public Procurement Portal for procurement of goods and services for all Central Government and State Government Ministries, Departments, Public Sector Units (PSUs) and affiliated.GeM endeavours to make public procurement process transparent, efficient and inclusive.'}</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="tile">
              <svg className="w-8 h-8 text-teal shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2l7 4v6c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-4z" /></svg>
              <span className="font-semibold text-[14.5px]">Open, transparent procurement for every registered seller</span>
            </div>
            <div className="tile">
              <svg className="w-8 h-8 text-teal shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
              <span className="font-semibold text-[14.5px]">Faster order placement, cataloguing and fulfilment cycles</span>
            </div>
            <div className="tile">
              <svg className="w-8 h-8 text-teal shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg>
              <span className="font-semibold text-[14.5px]">Competitive pricing through reverse e‑auction &amp; bidding</span>
            </div>
          </div>
        </div>
      </section>

      
  )
}
