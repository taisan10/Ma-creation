import Stat3DIcon from '../../../components/three/Stat3DIcon'
import CountUp from '../../../components/CountUp'

export default function CaseFileSummarySection({ cms = {}, faqs = [], stats = [], industries = [] }) {
  return (

      <section data-font-section="home.caseFileSummary" id="record" className="section">
        <div className="wrap">
          <div className="max-w-[640px] mb-12">
            <span className="eyebrow">Case File Summary</span>
            <h2 className="h2 mt-3">We work as your partner for the Government e‑Marketplace</h2>
            <p className="lede mt-4">Trusted by businesses across India — figures below are placeholders, ready for your latest numbers.</p>
          </div>
          <div className="table-wrap">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {(stats.length ? stats : [
                {type:'clients',value:'500+',label:'Happy clients & partners'},
                {type:'business',value:'₹50 Cr+',label:'Business executed on GeM'},
                {type:'brands',value:'200+',label:'Brands registered'},
                {type:'products',value:'5,000+',label:'Products published'},
              ]).map((item,i) => (
                <div key={item.label || i} className={`relative px-5 py-6 md:px-6 md:py-7 ${i !== 0 ? 'border-l border-ink/10' : ''}`}>
                  <Stat3DIcon type={item.type || ['clients','business','brands','products'][i]} />
                  <CountUp value={item.value || item.num} className="font-mono text-[26px] md:text-[30px] text-text" />
                  <div className="mt-1.5 text-[13px] text-muted">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      
  )
}
