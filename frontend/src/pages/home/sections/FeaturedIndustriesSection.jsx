import { Factory, HeartPulse, Laptop2, Building2 } from 'lucide-react'
import Industry3DCard from '../../../components/three/Industry3DCard'

export default function FeaturedIndustriesSection({ cms = {}, faqs = [], stats = [], industries = [] }) {
  return (

      <section data-font-section="home.featuredIndustries" className="section bg-paper2">
        <div className="wrap">
          <div className="max-w-[720px] mb-12">
            <span className="eyebrow">Top Industries on GeM</span>
            <h2 className="h2 mt-3">Built for the categories that move fastest on GeM</h2>
            <p className="lede mt-4">Interactive 3D industry cards make the homepage more visual while keeping the information useful on mobile, tablet, laptop and foldable screens.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Industry3DCard type="manufacturing" icon={Factory} title="Manufacturing" description="Industrial goods, machinery, components and OEM-led supply opportunities." />
            <Industry3DCard type="healthcare" icon={HeartPulse} title="Healthcare" description="Medical supplies, equipment, diagnostics and healthcare services." />
            <Industry3DCard type="it" icon={Laptop2} title="IT & Digital" description="Software, hardware, technology services and digital solutions." />
            <Industry3DCard type="services" icon={Building2} title="Business Services" description="Professional, facility, manpower, training and operational services." />
          </div>
        </div>
      </section>

      
  )
}
