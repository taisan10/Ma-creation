import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, RefreshCw, Save } from 'lucide-react'
import AdminShell from '../../components/admin/AdminShell'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import CmsPageSelector from './components/CmsPageSelector'
import CmsFieldEditor from './components/CmsFieldEditor'
import { fields, slugs } from './components/cmsFields'

export default function AdminPages() {
  const [items,setItems]=useState([]); const [selected,setSelected]=useState('home'); const [content,setContent]=useState({}); const [advanced,setAdvanced]=useState('{}')
  const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [error,setError]=useState(''); const [message,setMessage]=useState('')

  async function load(){
    setLoading(true)
    try{const response=await api('/admin/resources/pages');const list=response.items||[];setItems(list);const page=list.find(x=>x.slug===selected)||list[0];if(page){setSelected(page.slug);setContent(page.content||{});setAdvanced(JSON.stringify(page.content||{},null,2))}}
    catch(e){setError(e.message)} finally{setLoading(false)}
  }
  useEffect(()=>{load()},[])

  const page=items.find(x=>x.slug===selected); const pageFields=useMemo(()=>fields[selected]||[],[selected])
  function choose(slug){const next=items.find(x=>x.slug===slug);if(!next)return;setSelected(slug);setContent(next.content||{});setAdvanced(JSON.stringify(next.content||{},null,2));setError('');setMessage('')}
  function update(key,value){setContent(current=>({...current,[key]:value}));setError('')}
  async function save(data=content){if(!page)return;try{setSaving(true);await api(`/admin/resources/pages/${page._id}`,{method:'PATCH',body:JSON.stringify({content:data})});setMessage(`${selected} page saved successfully.`);setAdvanced(JSON.stringify(data,null,2));await load()}catch(e){setError(e.message)}finally{setSaving(false)}}
  function saveAdvanced(){try{save(JSON.parse(advanced))}catch{setError('Advanced JSON is invalid.')}}

  return <AdminShell>
    <div className="flex flex-wrap justify-between gap-4"><div><div className="eyebrow">Content Management</div><h1 className="h2 mt-2">Pages / CMS</h1><p className="mt-2 text-muted">Edit page content without touching source code. Catalog items stay under Services & Plans.</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={load}><RefreshCw size={15}/>Refresh</Button>{page&&<a href={selected==='home'?'/':`/${selected}`} target="_blank" rel="noreferrer"><Button variant="outline" size="sm"><ExternalLink size={15}/>Preview</Button></a>}{selected==='about'&&<><a href="/about#journey" target="_blank" rel="noreferrer"><Button variant="outline" size="sm">Journey Preview</Button></a><a href="/about#ai-tools" target="_blank" rel="noreferrer"><Button variant="outline" size="sm">AI Preview</Button></a></>}</div></div>
    {message&&<p className="mt-4 rounded-lg bg-success/10 border border-success/20 text-success text-sm px-4 py-3">{message}</p>}{error&&<p className="mt-4 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-3">{error}</p>}
    {loading?<p className="mt-7 text-muted">Loading…</p>:<div className="grid xl:grid-cols-[210px_1fr] gap-5 mt-7"><CmsPageSelector slugs={slugs} selected={selected} onSelect={choose}/><div className="space-y-5"><div className="card"><div className="flex justify-between items-center"><h2 className="font-display text-xl capitalize">{selected} content</h2><Button variant="gold" size="sm" onClick={()=>save()} disabled={saving}><Save size={15}/>{saving?'Saving…':'Save page'}</Button></div><CmsFieldEditor fields={pageFields} content={content} onChange={update} onError={setError}/></div><div className="card"><div className="flex justify-between items-center"><div><h3 className="font-display text-lg">Advanced JSON</h3><p className="text-xs text-muted mt-1">For any CMS fields not shown above.</p></div><Button variant="outline" size="sm" onClick={saveAdvanced}><Save size={14}/>Save JSON</Button></div><textarea className="field-input font-mono text-xs min-h-[300px] mt-4" value={advanced} onChange={e=>setAdvanced(e.target.value)}/></div></div></div>}
  </AdminShell>
}
