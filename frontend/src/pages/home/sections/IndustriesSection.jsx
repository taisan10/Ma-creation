import { Link } from 'react-router-dom'
import Industry3DCard from '../../../components/three/Industry3DCard'

export default function IndustriesSection({ cms = {}, faqs = [], stats = [], industries = [] }) {
  return (

      <section data-font-section="home.industries" id="industries" className="bg-paper2 section">
        <div className="wrap">
          <div className="max-w-[640px] mb-12">
            <span className="eyebrow">Top Industries on GeM</span>
            <h2 className="h2 mt-3">Industries we support</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(industries.length ? industries : [
              {type:'arts',label:'Arts & Crafts',description:'Handicrafts, décor, creative products and artisan supplies.'},
              {type:'chemical',label:'Chemical',description:'Industrial, laboratory and process chemical categories.'},
              {type:'civil',label:'Civil Work',description:'Construction materials, infrastructure and civil supplies.'},
              {type:'solar',label:'Solar Products',description:'Solar panels, lighting, energy and renewable solutions.'},
              {type:'hardware',label:'Hardware & Fasteners',description:'Tools, fasteners, industrial hardware and components.'},
              {type:'fire',label:'Fire Fighting Equipment',description:'Safety systems, extinguishers and fire protection equipment.'},
              {type:'furniture',label:'Furniture Items',description:'Office, institutional and public-sector furniture supply.'},
              {type:'packaging',label:'Packaging Material',description:'Boxes, protective packaging and material-handling supplies.'},
            ]).map(item => (
              <Industry3DCard key={item.label} type={item.type} title={item.label} description={item.description} />
            ))}
          </div>
          <Link to="/services" className="btn-outline btn-sm mt-8 inline-flex">Explore tenders in your industry →</Link>
        </div>
      </section>

      
  )
}
