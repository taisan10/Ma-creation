




export default function FounderSection({ cms = {} }) {
  const founders = [
    {
      name: cms.founderName || "Chanchal Mangal",
      role: cms.founderRole || "Founder & GeM Consultant",
      bio:
        cms.founderBio ||
        "Leads client onboarding personally and supports advanced portal functionality, vendor assessment, bid strategy and OEM inclusion.",
      image: cms.founderImage || "/assets/chanchal.jpeg",
    },
    {
      name: cms.coFounderName || "Pankaj Mangal",
      role: cms.coFounderRole || "Co-Founder & GeM Consultant",
      bio:
        cms.coFounderBio ||
        "Works closely alongside the founder to guide sellers through registration, cataloguing and bid strategy across every account.",
      image: cms.coFounderImage || "/assets/pankaj-mangal.jpeg",
    },
  ];

  return (

      <section data-font-section="about.founder" className="bg-paper2 section">
        <div className="wrap grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-start">
          <div>
            <div className="flex flex-col gap-8">
              {founders.map((f, i) => (
                <div key={i} className="flex gap-6 items-start flex-wrap">
                  <img
                    src={f.image}
                    alt={f.name}
                    className="w-[130px] h-[130px] rounded-full object-cover shrink-0"
                  />
                  <div>
                    <span className="eyebrow">{f.role}</span>
                    <h3 className="mt-2.5 font-display text-2xl">{f.name}</h3>
                    <p className="mt-2.5 text-muted max-w-[44ch]">{f.bio}</p>
                  </div>
                </div>
              ))}
            </div>

          
          </div>

          <div className="card">
            <span className="eyebrow">Consultancy &amp; Training Team</span>
            <h3 className="mt-3 font-display text-xl">{cms.teamTitle||'Behind every account'}</h3>
            <p className="mt-2.5 text-muted text-[14.5px]">{cms.teamText||'A dedicated pod of registration specialists, catalog managers and bid strategists supports every retainer client.'}</p>
            <ul className="mt-4.5 space-y-2.5 text-[13.8px] text-muted">{(cms.teamBullets?.length?cms.teamBullets:['Registration & documentation specialists','Catalog & listing managers','Bid & reverse-auction strategists','Training facilitators, online & in-person']).map(x=><li key={x}>✓ {x}</li>)}</ul>
          </div>
        </div>
      </section>

      
  )
}