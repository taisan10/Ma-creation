import { Link } from 'react-router-dom'
import Tabs from '../../../components/Tabs'
import ServiceTable from './ServiceTable'
import PackageCard from './PackageCard'
export default function ServiceCatalogSection({ registration=[], oem=[], addon=[], packagePlans=[] }) {
  const tabs = [{id:'reg',label:'Registration Services'},{id:'pkg',label:'GeM Service Packages'},{id:'oem',label:'OEM & Vendor Services'},{id:'addon',label:'Add-On Services'}]
  const dataMap = { reg: registration, pkg: packagePlans, oem, addon }
  const defaultTab = tabs.find(t => dataMap[t.id]?.length > 0)?.id || tabs[0].id
  return <section data-font-section="services.catalog" id="registration" className="section"><div className="wrap"><Tabs tabs={tabs} defaultTab={defaultTab}>{active=><>{active==='reg'&&<ServiceTable rows={registration}/>} {active==='pkg'&&(packagePlans.length?<div id="packages" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{packagePlans.map(p=><PackageCard key={p._id} plan={p}/>)}</div>:<div className="card text-muted">No active service packages. Add them from Admin → Services & Plans.</div>)} {active==='oem'&&<div id="oem"><ServiceTable rows={oem}/></div>} {active==='addon'&&<ServiceTable rows={addon}/>}</>}</Tabs><p className="mt-5 text-xs text-muted">Need training instead? See <Link to="/plans#training" className="text-primary underline">GeM Training Programs</Link>.</p></div></section>
}
