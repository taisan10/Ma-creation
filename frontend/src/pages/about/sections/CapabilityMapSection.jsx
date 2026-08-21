import { Handshake } from 'lucide-react'

export default function CapabilityMapSection({ cms = {} }) {
  return (

      <section data-font-section="about.capabilityMap" id="capabilities" className="section">
        <div className="wrap grid grid-cols-1 lg:grid-cols-[.8fr_1.2fr] gap-12 items-start">
          <div>
            <span className="eyebrow">Capability Map</span>
            <h2 className="h2 mt-3">The workstreams behind every account</h2>
            <p className="lede mt-4">From registration to training and analytics, different specialists can plug into the same client workflow.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(cms.capabilities?.length ? cms.capabilities : [
              {title:'Registration & documentation',body:'Seller setup, compliance and document readiness.'},
              {title:'Catalog & brand management',body:'Product upload, corrections and catalogue maintenance.'},
              {title:'Tender & bid support',body:'Eligibility checks, pricing strategy and submission.'},
              {title:'Training & enablement',body:'Live learning, tutorials, exercises and post-training support.'},
              {title:'Analytics & reporting',body:'Performance reviews, competition signals and account insights.'},
              {title:'OEM & assessment support',body:'Vendor assessment, OEM inclusion and category-specific guidance.'},
            ]).map((x,i)=><div key={x.title||i} className="tile !items-start group">
              <div className="w-10 h-10 rounded-xl bg-backgroundAlt text-primary grid place-items-center shrink-0 transition-transform duration-500 group-hover:rotate-6"><Handshake size={19}/></div>
              <div><h3 className="font-semibold text-sm">{x.title}</h3><p className="mt-1.5 text-xs leading-5 text-muted">{x.body}</p></div>
            </div>)}
          </div>
        </div>
      </section>

      
  )
}
