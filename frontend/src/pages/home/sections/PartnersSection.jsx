import { Link } from 'react-router-dom'
import { Handshake } from 'lucide-react'

export default function PartnersSection({ cms = {}, faqs = [], stats = [], industries = [] }) {
  return (

      <section data-font-section="home.partners" id="partners" className="section">
        <div className="wrap">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-10">
            <div className="max-w-[680px]">
              <span className="eyebrow">Trusted by Businesses Across India</span>
              <h2 className="h2 mt-3">Our esteemed partners in success</h2>
              <p className="lede mt-4">A moving wall of partner names gives visitors a quick trust signal without turning the page into a static logo dump.</p>
            </div>
            <Link to="/about#partners" className="btn-outline btn-sm">View our approach →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {(cms.partners?.length ? cms.partners : ['Apex Industries','Bharat Tools','Nova Healthcare','SunGrid Energy','Urban Furnishings','Prime Packaging','Shree Chemicals','Vertex Digital','NorthStar Services','Civic Works']).map((partner,i)=>(
              <div key={`${partner}-${i}`} className="card !p-5 min-h-[105px] flex flex-col justify-between group">
                <Handshake className="text-primary transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110" size={24}/>
                <div className="font-semibold text-sm mt-4">{partner}</div>
                <div className="font-mono text-[10px] text-muted mt-1">PARTNER · {String(i+1).padStart(2,'0')}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      
  )
}
