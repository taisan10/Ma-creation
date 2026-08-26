import { PenTool, Sofa, HeartPulse, Pipette } from "lucide-react";
import Industry3DCard from "../../../components/three/Industry3DCard";

export default function FeaturedIndustriesSection({
  cms = {},
  faqs = [],
  stats = [],
  industries = [],
}) {
  return (
    <section
      data-font-section="home.featuredIndustries"
      className="section bg-paper2"
    >
      <div className="wrap">
        <div className="max-w-[720px] mb-12">
          <span className="eyebrow">Top Industries on GeM</span>
          <h2 className="h2 mt-3">
            Built for the categories that move fastest on GeM
          </h2>
          <p className="lede mt-4">
            Interactive 3D industry cards make the homepage more visual while
            keeping the information useful on mobile, tablet, laptop and
            foldable screens.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Industry3DCard
            type="stationery"
            icon={PenTool}
            title="Stationery Items"
            description="Pens, notebooks, files, office supplies and stationery products for government and institutional procurement."
          />
          <Industry3DCard
            type="furniture"
            icon={Sofa}
            title="Furniture"
            description="Office desks, chairs, shelving systems, modular furniture and institutional furniture supply."
          />
          <Industry3DCard
            type="medical"
            icon={HeartPulse}
            title="Medical Products"
            description="Surgical instruments, hospital equipment, diagnostic devices and healthcare consumables."
          />
          <Industry3DCard
            type="pipes"
            icon={Pipette}
            title="Pipes and Fittings"
            description="PVC, CPVC, GI pipes, valves, connectors, plumbing fittings and infrastructure supply solutions."
          />
        </div>
      </div>
    </section>
  );
}
