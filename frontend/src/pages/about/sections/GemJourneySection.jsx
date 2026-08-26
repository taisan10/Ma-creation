import Journey3D from '../../../components/three/Journey3D'

export default function GemJourneySection({ cms = {} }) {
  return (

      <section data-font-section="about.gemJourney" id="journey" className="bg-paper2 section">
        <div className="wrap">
          <div className="max-w-[760px]">
            <span className="eyebrow">{cms.journeyEyebrow||'The MA Creation GeM Journey'}</span>
            <h2 className="h2 mt-3">{cms.journeyTitle||'From clean documents to measurable GeM growth'}</h2>
            <p className="lede mt-4">{cms.journeyText||'We turn the GeM workflow into a clear, trackable journey — preparing the file, building the catalog, supporting bids, following orders and reviewing performance.'}</p>
          </div>
          <Journey3D items={cms.journey}/>
        </div>
      </section>

      
  )
}
