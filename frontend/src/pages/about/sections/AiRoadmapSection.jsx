

export default function AiRoadmapSection({ cms = {} }) {
  return (

      <section data-font-section="about.aiRoadmap" className="bg-paper2 section">
        <div className="wrap">
          <div className="max-w-[640px] mb-12">
            <span className="eyebrow">On the Roadmap</span>
            <h2 className="h2 mt-3">{cms.roadmapTitle||'Where MA Creation is headed next'}</h2>
            <p className="lede mt-4">{cms.roadmapText||'Digital tools will sit alongside human support so clients can work through recurring GeM tasks faster.'}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(cms.roadmap?.length ? cms.roadmap : [{title:'AI Chatbot',body:'Instant answers to common GeM questions, any time of day.'},{title:'AI Doc Checker',body:'Flags document mismatches before submission.'},{title:'AI Tender Finder',body:'Surfaces relevant open tenders for each client’s category.'},{title:'AI Bid Predictor',body:'Future scoring support for pricing and bid decisions.'}]).map(item => (
              <div key={item.title} className="card">
                <span className="font-mono text-[13px] text-gold2">Roadmap</span>
                <h3 className="mt-3 font-display text-[17px]">{item.title}</h3>
                <p className="mt-2 text-muted text-[14px]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      
  )
}
