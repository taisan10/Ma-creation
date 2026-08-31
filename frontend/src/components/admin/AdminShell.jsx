import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Inbox, CreditCard, Boxes, FileText, HelpCircle, Settings, LogOut, ArrowLeft, Menu, X, BookOpen, GraduationCap } from 'lucide-react'
import { clearSession, getUser } from '../../lib/api'

const links=[['/admin','Dashboard',LayoutDashboard],['/admin/users','Users',Users],['/admin/leads','Demo Leads',Inbox],['/admin/payments','Payments',CreditCard],['/admin/catalog','Services & Plans',Boxes],['/admin/pages','Pages / CMS',FileText],['/admin/faqs','FAQs',HelpCircle],['/admin/partners','Partners',Users],['/admin/settings','Site Settings',Settings],['/admin/books','GeM Books',BookOpen],['/admin/courses','Courses & Videos',GraduationCap]]

function AdminNav({ onNavigate }) {
  return <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
    {links.map(([to,label,Icon])=><NavLink key={to} to={to} end={to==='/admin'} onClick={onNavigate} className={({isActive})=>`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${isActive?'bg-gold text-white shadow-sm':'text-paper/70 hover:bg-paper/10 hover:text-paper'}`}><Icon size={17}/><span>{label}</span></NavLink>)}
  </nav>
}

export default function AdminShell({children}){
  const nav=useNavigate()
  const user=getUser()
  const [mobileOpen,setMobileOpen]=useState(false)
  function logout(){clearSession();nav('/login')}
  function closeMobile(){setMobileOpen(false)}

  return <div className="min-h-screen bg-paper2 flex">
    <aside className="w-64 bg-ink text-paper hidden lg:flex flex-col fixed inset-y-0 left-0 z-40">
      <div className="px-6 py-6 border-b border-paper/10"><div className="font-display text-xl">MA Creation</div><div className="text-xs text-paper/50 mt-1">Admin Console</div></div>
      <AdminNav />
      <div className="p-4 border-t border-paper/10"><div className="text-xs text-paper/50 truncate">{user?.email}</div><button onClick={logout} className="mt-3 flex items-center gap-2 text-sm text-paper/70 hover:text-paper"><LogOut size={16}/>Logout</button></div>
    </aside>

    {mobileOpen && <button aria-label="Close admin navigation" className="fixed inset-0 z-40 bg-black/45 lg:hidden" onClick={closeMobile}/>} 
    <aside className={`fixed inset-y-0 left-0 z-50 w-[min(86vw,320px)] bg-ink text-paper flex flex-col shadow-2xl transition-transform duration-200 lg:hidden ${mobileOpen?'translate-x-0':'-translate-x-full'}`}>
      <div className="px-5 py-5 border-b border-paper/10 flex items-center justify-between gap-3">
        <div><div className="font-display text-lg">MA Creation</div><div className="text-xs text-paper/50 mt-1">Admin Console</div></div>
        <button type="button" aria-label="Close menu" onClick={closeMobile} className="w-9 h-9 rounded-lg border border-paper/15 grid place-items-center hover:bg-paper/10"><X size={18}/></button>
      </div>
      <AdminNav onNavigate={closeMobile}/>
      <div className="p-4 border-t border-paper/10"><div className="text-xs text-paper/50 truncate">{user?.email}</div><button onClick={logout} className="mt-3 flex items-center gap-2 text-sm text-paper/70 hover:text-paper"><LogOut size={16}/>Logout</button></div>
    </aside>

    <main className="flex-1 min-w-0 lg:ml-64">
      <div className="lg:hidden sticky top-0 z-30 bg-ink text-paper px-3 sm:px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
        <button type="button" aria-label="Open admin navigation" aria-expanded={mobileOpen} onClick={()=>setMobileOpen(true)} className="w-9 h-9 rounded-lg border border-paper/15 grid place-items-center shrink-0 hover:bg-paper/10"><Menu size={18}/></button>
        <b className="text-sm sm:text-base truncate">MA Creation Admin</b>
        <button type="button" aria-label="Logout" onClick={logout} className="w-9 h-9 rounded-lg border border-paper/15 grid place-items-center shrink-0 hover:bg-paper/10"><LogOut size={16}/></button>
      </div>
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full overflow-x-hidden">{children}</div>
    </main>
  </div>
}
export function BackToSite(){return <NavLink to="/" className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink"><ArrowLeft size={15}/>Back to website</NavLink>}