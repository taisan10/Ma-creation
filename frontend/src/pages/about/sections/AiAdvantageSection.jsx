import { BarChart3, ClipboardCheck, SearchCheck, Sparkles } from 'lucide-react'

export default function AiAdvantageSection({ cms = {} }) {
  return (

      <section data-font-section="about.aiAdvantage" id="ai-tools" className="section">
        <div className="wrap">
          <div className="max-w-[720px] mb-12">
            <span className="eyebrow">Beyond Consultancy</span>
            <h2 className="h2 mt-3">{cms.aiTitle||'Smart tools that make GeM work easier'}</h2>
            <p className="lede mt-4">{cms.aiText||'MA Creation can pair human consultancy with practical digital assistance for documents, tenders, questions and structured proposal work.'}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(cms.aiTools?.length ? cms.aiTools : [
              {title:'AI Chatbot',body:'Instant answers to common GeM questions and process guidance.',icon:'chat'},
              {title:'AI Doc Checker',body:'Spot common GST, PAN, Udyam and document mismatches before submission.',icon:'doc'},
              {title:'AI Tender Finder',body:'Surface relevant tender opportunities based on your category and profile.',icon:'tender'},
              {title:'AI Proposal Writer',body:'Draft structured tender responses faster while keeping final review with your team.',icon:'bot'},
            ]).map((item,i)=>{
              const icons={chat:Sparkles,doc:ClipboardCheck,tender:SearchCheck,bot:BarChart3}; const Icon=icons[item.icon]||Sparkles
              return <div key={item.title||i} className="card group relative overflow-hidden [transform-style:preserve-3d] hover:[transform:perspective(900px)_rotateX(3deg)_rotateY(-3deg)]">
                <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-primary/10 transition-transform duration-700 group-hover:scale-[2.8]"/>
                <div className="relative w-12 h-12 rounded-2xl bg-backgroundAlt text-primary grid place-items-center border border-primary/15 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110"><Icon size={23}/></div>
                <span className="relative mt-5 block font-mono text-[10px] tracking-[.16em] text-primary">SMART LAYER · {String(i+1).padStart(2,'0')}</span>
                <h3 className="relative mt-2 font-display text-lg">{item.title}</h3>
                <p className="relative mt-2 text-sm text-muted leading-6">{item.body}</p>
              </div>
            })}
          </div>
        </div>
      </section>

      
  )
}
