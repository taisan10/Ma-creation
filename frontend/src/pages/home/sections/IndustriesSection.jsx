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
              {type:'it',label:'IT Products',description:'Computers, laptops, printers, networking equipment and IT peripherals.'},
              {type:'automobiles',label:'Automobiles',description:'Vehicles, spare parts, tyres, batteries and automotive accessories.'},
              {type:'furniture',label:'Furniture',description:'Office desks, chairs, shelving systems and institutional furniture supply.'},
              {type:'medical',label:'Medical Products',description:'Surgical instruments, hospital equipment, diagnostic devices and consumables.'},
              {type:'stationery',label:'Stationery Items',description:'Pens, notebooks, files, office supplies and stationery products.'},
              {type:'electrical',label:'Electrical Appliances',description:'Wires, cables, switchgear, transformers and electrical components.'},
              {type:'electronics',label:'Electronic Equipments',description:'Semiconductors, PCBs, sensors, test instruments and electronic components.'},
              {type:'textiles',label:'Textiles Products',description:'Fabrics, uniforms, protective clothing, home textiles and garment supplies.'},
              {type:'pipes',label:'Pipes and Fittings',description:'PVC, CPVC, GI pipes, valves, connectors and plumbing fittings.'},
            ]).map(item => (
              <Industry3DCard key={item.label} type={item.type} title={item.label} description={item.description} />
            ))}
          </div>
          <Link to="/services" className="btn-outline btn-sm mt-8 inline-flex">Explore tenders in your industry →</Link>
        </div>
      </section>

      
  )
}
