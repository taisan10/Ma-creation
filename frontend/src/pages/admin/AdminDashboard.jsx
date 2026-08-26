import { useEffect, useState } from 'react'
import AdminShell from '../../components/admin/AdminShell'
import { api } from '../../lib/api'
import DashboardStats from './components/DashboardStats'
import DashboardQuickActions from './components/DashboardQuickActions'

const labels = { users:'Users', leads:'Demo Leads', payments:'Payments', services:'Services', plans:'Plans', pages:'CMS Pages', faqs:'FAQs', partners:'Partners', books:'GeM Books' }

export default function AdminDashboard(){
  const [stats,setStats]=useState({}); const [error,setError]=useState('')
  useEffect(()=>{api('/admin/dashboard').then(r=>setStats(r.stats||{})).catch(e=>setError(e.message))},[])
  return <AdminShell><div><p className="eyebrow">Control room</p><h1 className="h2 mt-2">Admin Dashboard</h1><p className="mt-2 text-ink/60">Manage website content, customers, enquiries, catalog and payments without touching source code.</p></div>{error&&<p className="mt-4 text-rust text-sm">{error}</p>}<DashboardStats stats={stats} labels={labels}/><DashboardQuickActions/></AdminShell>
}
