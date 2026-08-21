import { ArrowRight } from 'lucide-react'

export default function HowWeWorkSection({ cms = {} }) {
  return (

      <section data-font-section="about.howWeWork" id="method" className="bg-paper2 section">
        <div className="wrap">
          <div className="max-w-[680px] mb-12">
            <span className="eyebrow">How We Work</span>
            <h2 className="h2 mt-3">A simple operating model for complex portal work</h2>
            <p className="lede mt-4">Every engagement starts with a clean brief and ends with a documented next step.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(cms.method?.length ? cms.method : [
              {step:'01',title:'Discover',body:'Understand your business, products, documents and GeM goals.'},
              {step:'02',title:'Prepare',body:'Check documents, categories, specifications and bid readiness.'},
              {step:'03',title:'Execute',body:'Register, list, bid, train and monitor according to the chosen scope.'},
              {step:'04',title:'Improve',body:'Review performance, fix issues and identify the next growth opportunity.'},
            ]).map((x,i)=><div key={x.title||i} className="relative rounded-2xl bg-card border border-ink/10 p-6 shadow-card group overflow-hidden">
              <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-primary/10 transition-transform duration-700 group-hover:scale-[2.6]"/>
              <span className="relative font-mono text-[11px] text-primary">{x.step}</span>
              <h3 className="relative mt-3 font-display text-xl">{x.title}</h3>
              <p className="relative mt-2.5 text-sm text-muted leading-6">{x.body}</p>
              {i<3&&<ArrowRight className="hidden md:block absolute -right-3 top-1/2 text-primary bg-paper2 rounded-full" size={18}/>} 
            </div>)}
          </div>
        </div>
      </section>

      
  )
}
