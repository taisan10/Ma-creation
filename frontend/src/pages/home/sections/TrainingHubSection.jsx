import { Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'

export default function TrainingHubSection({ cms = {}, faqs = [], stats = [], industries = [] }) {
  return (

      <section data-font-section="home.trainingHub" id="training" className="bg-paper2 section">
        <div className="wrap grid grid-cols-1 lg:grid-cols-[.9fr_1.1fr] gap-12 items-center">
          <div>
            <span className="eyebrow">Training & Learning Hub</span>
            <h2 className="h2 mt-3">Learn the portal, then run it with confidence</h2>
            <p className="lede mt-4">Reference research recommends tutorials and a training hub to build authority. Use this section to promote live batches, recordings and practical exercises.</p>
            <Link to="/plans" className="btn-gold btn-sm mt-7 inline-flex">Explore training plans</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(cms.trainingHighlights?.length ? cms.trainingHighlights : [
              {title:'Live batches',body:'Practical portal walkthroughs for sellers and teams.'},
              {title:'Video tutorials',body:'Short explainers for listings, bids and dashboard tasks.'},
              {title:'Case exercises',body:'Real-world style scenarios to build decision-making skills.'},
              {title:'Post-training support',body:'Guidance after class so the learning turns into action.'},
            ]).map((x,i)=><div key={x.title||i} className="tile !items-start">
              <div className="w-10 h-10 rounded-xl bg-card border border-primary/15 text-primary grid place-items-center shrink-0"><GraduationCap size={20}/></div>
              <div><h3 className="font-semibold text-sm">{x.title}</h3><p className="mt-1.5 text-xs leading-5 text-muted">{x.body}</p></div>
            </div>)}
          </div>
        </div>
      </section>

      
  )
}
