import { Target, Eye } from 'lucide-react'

export default function MissionVisionSection({ cms = {} }) {
  return (

      <section data-font-section="about.missionVision" id="mission" className="bg-paper2 section">
        <div className="wrap grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card group">
            <div className="w-12 h-12 rounded-2xl bg-backgroundAlt text-primary grid place-items-center transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110"><Target size={24}/></div>
            <span className="eyebrow mt-5">Our Mission</span>
            <h2 className="h2 mt-3 text-[25px]">Make government procurement easier to understand and execute</h2>
            <p className="lede mt-4">{cms.mission||'We simplify the operational side of GeM so businesses can spend less time chasing paperwork and more time serving customers.'}</p>
          </div>
          <div className="card group">
            <div className="w-12 h-12 rounded-2xl bg-backgroundAlt text-secondary grid place-items-center transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"><Eye size={24}/></div>
            <span className="eyebrow mt-5">Our Vision</span>
            <h2 className="h2 mt-3 text-[25px]">A more capable, data-aware GeM seller ecosystem</h2>
            <p className="lede mt-4">{cms.vision||'We want every client to have clear processes, measurable performance and access to better digital tools for GeM growth.'}</p>
          </div>
        </div>
      </section>

      
  )
}
