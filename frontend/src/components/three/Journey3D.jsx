import { FileCheck2, ListChecks, SearchCheck, ShoppingCart, BarChart3 } from 'lucide-react'

const defaults = [
  {step:'01', title:'Registration & Documents', body:'PAN, GST, Udyam and category-specific documents are checked and organised before portal work begins.', icon:'file'},
  {step:'02', title:'Catalog & Listing', body:'Products, services, brands and specifications are prepared for accurate GeM cataloguing.', icon:'list'},
  {step:'03', title:'Tender & Bidding', body:'Eligible opportunities are reviewed, bid documents are prepared and submission support is provided.', icon:'bid'},
  {step:'04', title:'Orders & Fulfilment', body:'Purchase orders, L1 outcomes, invoicing and order-closure tasks stay visible in one workflow.', icon:'order'},
  {step:'05', title:'Reporting & Growth', body:'Performance, tender activity and account issues are reviewed so the next action is clear.', icon:'report'},
]
const icons = {file:FileCheck2,list:ListChecks,bid:SearchCheck,order:ShoppingCart,report:BarChart3}

export default function Journey3D({items}) {
  const stages = items?.length ? items : defaults
  return (
    <div className="relative mt-14 overflow-hidden rounded-[28px] border border-ink/10 bg-card px-4 py-8 sm:px-7 lg:px-10 shadow-card">
      <div className="absolute inset-x-10 top-1/2 hidden h-px bg-primary/10 lg:block" />
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5 lg:gap-5">
        {stages.map((item, i) => {
          const Icon = icons[item.icon] || FileCheck2
          const raised = i % 2 === 0
          return (
            <div key={item.title || i} className={`relative flex min-h-[310px] flex-col ${raised ? 'lg:-translate-y-7' : 'lg:translate-y-7'}`}>
              <div className="journey-platform" aria-hidden="true">
                <div className="journey-glow" />
                <div className="journey-icon"><Icon size={28} strokeWidth={1.7}/></div>
              </div>
              <div className="journey-line" aria-hidden="true"><span /></div>
              <div className="relative z-10 mt-8 rounded-2xl border border-primary/15 bg-background/95 p-5 backdrop-blur transition-all duration-500 hover:-translate-y-2 hover:[transform:perspective(900px)_rotateX(4deg)_rotateY(-4deg)]">
                <div className="font-mono text-[11px] tracking-[.18em] text-primary">{item.step || String(i+1).padStart(2,'0')}</div>
                <h3 className="mt-2 font-display text-lg leading-tight">{item.title}</h3>
                <p className="mt-2.5 text-sm leading-6 text-muted">{item.body}</p>
              </div>
              {i < stages.length - 1 && <div className="journey-arrow hidden lg:block" aria-hidden="true">→</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
