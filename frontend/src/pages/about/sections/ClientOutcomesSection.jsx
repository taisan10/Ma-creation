import CountUp from '../../../components/CountUp'


export default function ClientOutcomesSection({ cms = {} }) {
  return (

      <section data-font-section="about.clientOutcomes" id="outcomes" className="bg-paper2 section">
        <div className="wrap">
          <div className="max-w-[680px] mb-10">
            <span className="eyebrow">Client Outcomes</span>
            <h2 className="h2 mt-3">Measure the work, not just the activity</h2>
            <p className="lede mt-4">Replace the placeholders below with verified client metrics from your actual operations.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(cms.outcomes?.length ? cms.outcomes : [
              {value:'500+',label:'Clients & partners'},
              {value:'5,000+',label:'Products published'},
              {value:'24×7',label:'Support availability'},
              {value:'Pan-India',label:'Service coverage'},
            ]).map((x,i)=><div key={x.label||i} className="card text-center group">
              <CountUp value={x.value} className="font-mono text-2xl md:text-3xl text-primary transition-transform duration-500 group-hover:scale-110" />
              <div className="mt-2 text-xs md:text-sm text-muted">{x.label}</div>
            </div>)}
          </div>
        </div>
      </section>

      
  )
}
