import { ShieldCheck, BarChart3, Users, ClipboardCheck } from 'lucide-react'

export default function WhyDifferentSection({ cms = {} }) {
  return (

      <section data-font-section="about.whyDifferent" id="different" className="section">
        <div className="wrap">
          <div className="max-w-[700px] mb-12">
            <span className="eyebrow">Why MA Creation</span>
            <h2 className="h2 mt-3">More than a service listing</h2>
            <p className="lede mt-4">The reference review found many GeM websites to be service-listing heavy. Our positioning is built around experience, process visibility, trust and future-facing tools.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(cms.differentiators?.length ? cms.differentiators : [
              {title:'Process visibility',body:'See what happens from documents to order closure.',icon:'process'},
              {title:'Compliance first',body:'Cleaner documentation and category-aware execution.',icon:'shield'},
              {title:'Data-led advice',body:'Use portal and competition signals instead of guesswork.',icon:'data'},
              {title:'Human support',body:'Consultants stay available when a portal task gets complicated.',icon:'people'},
            ]).map((x,i)=>{
              const icons={process:ClipboardCheck,shield:ShieldCheck,data:BarChart3,people:Users}; const Icon=icons[x.icon]||Sparkles
              return <div key={x.title||i} className="card group [transform-style:preserve-3d] hover:[transform:perspective(900px)_rotateX(2deg)_rotateY(-2deg)]">
                <div className="w-11 h-11 rounded-xl bg-backgroundAlt text-primary grid place-items-center transition duration-500 group-hover:translate-y-[-2px]"><Icon size={21}/></div>
                <h3 className="mt-5 font-display text-lg">{x.title}</h3>
                <p className="mt-2 text-sm text-muted leading-6">{x.body}</p>
              </div>
            })}
          </div>
        </div>
      </section>

      
  )
}
