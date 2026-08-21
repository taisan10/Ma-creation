import { useEffect, useState } from 'react'
import { Check, ExternalLink, Info, Palette, RotateCcw, Save, Type, WandSparkles } from 'lucide-react'
import AdminShell from '../../components/admin/AdminShell'
import { api } from '../../lib/api'
import { DEFAULT_FONT_FAMILY, DEFAULT_SECTION_FONTS, DEFAULT_THEME, FONT_SECTIONS, THEME_LABELS, normalizeColor, normalizeFontFamily, useTheme } from '../../theme'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'

const groups=[['Brand',['primary','primaryDark','secondary','secondaryDark','accent','accent2']],['Surface & Text',['background','backgroundAlt','backgroundSoft','surface','text','textSoft','muted','border']],['Status & 3D',['success','warning','danger','shadow']]]
const sections=[
 ['Header / Navigation','/',['primary','surface','text','border'],'Logo, navigation, Login and Book Free Demo CTA.'],
 ['Hero / Case File','/',['primary','secondary','accent','accent2','background','text','shadow'],'Hero copy, CTA buttons and 3D case-file animation.'],
 ['Case File Summary','/#record',['primary','secondary','accent2','surface','text','muted','border','shadow'],'Four 3D stat icons, values and stat cards.'],
 ['GeM Journey','/#journey',['primary','surface','backgroundAlt','text','muted','border','shadow'],'Five-step visual flow: documents, listing, bidding, orders and payment.'],
 ['AI Advantage','/#ai-tools',['primary','secondary','accent2','surface','text','muted','border'],'AI tool cards for chatbot, document checking, tender finding and proposal drafting.'],
 ['Training Hub','/#training',['primary','surface','backgroundAlt','text','muted','border'],'Live batches, tutorials, case exercises and post-training support.'],
 ['Partner Success','/#partners',['primary','surface','text','muted','border','backgroundAlt'],'Partner/client trust grid.'],
 ['Client Testimonials','/#testimonials',['primary','surface','text','muted','border'],'CMS-ready client story cards.'],
 ['Top Industries on GeM','/#industries',['primary','secondary','accent','accent2','backgroundAlt','surface','text','shadow'],'Eight 3D industry cards and gradients.'],
 ['Services','/services',['primary','secondary','background','backgroundAlt','surface','text','muted','border'],'Live services catalog, packages, pillars and documents.'],
 ['About','/about',['primary','background','backgroundAlt','surface','text','muted','border'],'Story, values, founder, team and roadmap CMS content.'],
 ['About Mission & Vision','/about#mission',['primary','secondary','surface','backgroundAlt','text','muted','border'],'Mission and vision cards.'],
 ['Why MA Creation','/about#different',['primary','surface','backgroundAlt','text','muted','border','shadow'],'Differentiator cards explaining the MA Creation model.'],
 ['How We Work','/about#method',['primary','surface','backgroundAlt','text','muted','border'],'Discover, prepare, execute and improve workflow.'],
 ['Capability Map','/about#capabilities',['primary','secondary','surface','text','muted','border'],'Registration, catalog, tender, training, analytics and OEM workstreams.'],
 ['Client Outcomes','/about#outcomes',['primary','surface','backgroundAlt','text','muted','border'],'CMS-ready outcome metrics.'],
 ['Plans & Pricing','/plans',['primary','secondary','surface','backgroundAlt','text','muted','border'],'Live MongoDB plans, pricing and checkout.'],
 ['Admin Dashboard','/admin',['primary','surface','backgroundAlt','text','muted','border'],'Admin navigation, cards, forms and statuses.'],
]

export default function AdminSettings(){
  const {theme,setTheme,refreshTheme}=useTheme()
  const [draft,setDraft]=useState(DEFAULT_THEME)
  const [quick,setQuick]=useState('')
  const [brand,setBrand]=useState('{}')
  const [loading,setLoading]=useState(true)
  const [message,setMessage]=useState('')
  const [error,setError]=useState('')

  useEffect(()=>{
    Promise.all([api('/admin/settings/theme'),api('/admin/settings/brand')])
      .then(([t,b])=>{
        const incoming=t.setting?.value||{}
        setDraft({
          ...DEFAULT_THEME,
          ...incoming,
          fontFamily: normalizeFontFamily(incoming.fontFamily, DEFAULT_FONT_FAMILY),
          sectionFonts: {...DEFAULT_SECTION_FONTS,...(incoming.sectionFonts||{})},
        })
        setBrand(JSON.stringify(b.setting?.value||{},null,2))
      })
      .catch(e=>setError(e.message))
      .finally(()=>setLoading(false))
  },[])

  function update(k,v){setDraft(x=>({...x,[k]:v}));setError('')}
  function updateSectionFont(key,value){setDraft(x=>({...x,sectionFonts:{...x.sectionFonts,[key]:value}}));setError('')}
  function applyQuick(){
    const c=normalizeColor(quick)
    if(!c){setError('Enter valid HEX or RGB, e.g. #5B4FE0 or rgb(91,79,224).');return}
    setError('')
    setDraft(x=>({...x,primary:c,primaryDark:c,secondary:c,secondaryDark:c,accent:c,accent2:c,success:c,warning:c,danger:c}))
    setMessage('Quick colour preview updated. Click Save Theme to persist it.')
  }
  async function save(){
    try{
      const normalizedColors=Object.fromEntries(Object.keys(DEFAULT_THEME).filter(k=>!['fontFamily','sectionFonts'].includes(k)).map(k=>[k,normalizeColor(draft[k])||theme[k]||DEFAULT_THEME[k]]))
      const normalized={
        ...normalizedColors,
        fontFamily: normalizeFontFamily(draft.fontFamily, DEFAULT_FONT_FAMILY),
        sectionFonts: Object.fromEntries(FONT_SECTIONS.map(([key])=>[key,normalizeFontFamily(draft.sectionFonts?.[key], '')])),
      }
      await api('/admin/settings/theme',{method:'PUT',body:JSON.stringify({value:normalized})})
      setDraft(normalized)
      setTheme(normalized)
      await refreshTheme()
      setMessage('Theme and typography saved. Connected visitors update instantly.')
      setError('')
    }catch(e){setError(e.message)}
  }
  async function saveBrand(){
    try{await api('/admin/settings/brand',{method:'PUT',body:JSON.stringify({value:JSON.parse(brand)})});setMessage('Brand settings saved. Connected visitors update instantly.');setError('')}
    catch(e){setError(e.message)}
  }

  return <AdminShell>
    <div className="flex flex-wrap justify-between gap-4">
      <div><div className="eyebrow"><Palette size={14}/>Theme CMS</div><h1 className="h2 mt-2">Global Theme + Section Mapping</h1><p className="mt-2 text-muted">Change colours and typography centrally. Blank section font values inherit the global site font.</p></div>
      <Button variant="outline" size="sm" onClick={()=>{setDraft({...DEFAULT_THEME,sectionFonts:{...DEFAULT_SECTION_FONTS}});setQuick('')}}><RotateCcw size={15}/>Reset defaults</Button>
    </div>
    {error&&<div className="mt-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}
    {message&&<div className="mt-5 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success flex items-center gap-2"><Check size={16}/>{message}</div>}

    <Card className="mt-7">
      <CardHeader><div className="flex items-center gap-2"><Type size={18} className="text-primary"/><h2 className="font-display text-xl font-semibold">Typography</h2></div><p className="text-sm text-muted mt-1">Set one font for the entire website, then override individual public sections only when needed.</p></CardHeader>
      <CardContent>
        <div className="rounded-xl border border-border bg-backgroundAlt/40 p-4">
          <label className="field-label">Global site font-family</label>
          <Input value={draft.fontFamily||''} onChange={e=>update('fontFamily',e.target.value)} placeholder={DEFAULT_FONT_FAMILY}/>
          <p className="text-xs text-muted mt-2">Example: <code>Inter, "Segoe UI", sans-serif</code>. This becomes the default everywhere, including headings and mono labels.</p>
        </div>
        <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
          <div><h3 className="font-display text-lg font-semibold">Section-specific font-family</h3><p className="text-xs text-muted mt-1">Leave a field empty to inherit the global value. No page refresh is required after saving.</p></div>
          <a href="/" target="_blank" rel="noreferrer"><Button variant="outline" size="sm"><ExternalLink size={15}/>Preview website</Button></a>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {FONT_SECTIONS.map(([key,label])=><div key={key} className="rounded-xl border border-border p-3 bg-backgroundAlt/50">
            <label className="field-label">{label}</label>
            <Input value={draft.sectionFonts?.[key]||''} onChange={e=>updateSectionFont(key,e.target.value)} placeholder="Inherit global font"/>
            <div className="mt-2 flex justify-between gap-2 text-[11px] text-muted"><code>{key}</code><span>{draft.sectionFonts?.[key] ? 'Override active' : 'Using global'}</span></div>
          </div>)}
        </div>
      </CardContent>
    </Card>

    <Card className="mt-7"><CardHeader><div className="flex items-center gap-2"><WandSparkles size={18} className="text-primary"/><h2 className="font-display text-xl font-semibold">Quick colour</h2></div><p className="text-sm text-muted mt-1">Paste one HEX/RGB value to preview the main brand palette together.</p></CardHeader><CardContent><div className="grid md:grid-cols-[1fr_auto] gap-3"><Input value={quick} onChange={e=>setQuick(e.target.value)} placeholder="#5B4FE0 or rgb(91,79,224)"/><Button variant="gold" onClick={applyQuick}><WandSparkles size={16}/>Apply to all</Button></div></CardContent></Card>

    <Card className="mt-7"><CardHeader><div className="flex gap-2 items-center"><Info size={18} className="text-secondary"/><h2 className="font-display text-xl font-semibold">Where the theme is applied</h2></div><p className="text-sm text-muted mt-1">Each section shows the exact colour tokens it consumes.</p></CardHeader><CardContent><div className="space-y-4">{sections.map(([name,path,tokens,note])=><div key={name} className="rounded-xl border border-border p-4"><div className="flex justify-between gap-3 flex-wrap"><div><b>{name}</b><p className="text-xs text-muted mt-1">{note}</p></div><Button variant="outline" size="sm" onClick={()=>window.open(path,'_blank','noopener,noreferrer')}><ExternalLink size={14}/>Open</Button></div><div className="flex flex-wrap gap-2 mt-3">{tokens.map(k=><span key={k} className="inline-flex items-center gap-2 text-xs border border-border rounded-full px-2.5 py-1"><i className="w-3.5 h-3.5 rounded-full border border-black/10" style={{background:theme[k]}}/><b>{THEME_LABELS[k]}</b><code className="text-muted">{theme[k]}</code></span>)}</div></div>)}</div></CardContent></Card>

    {loading?<div className="mt-7 text-muted">Loading settings…</div>:<>
      {groups.map(([group,keys])=><Card key={group} className="mt-6"><CardHeader><h2 className="font-display text-xl font-semibold">{group}</h2></CardHeader><CardContent><div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{keys.map(k=><div key={k} className="rounded-xl border border-border p-3 bg-backgroundAlt/50"><label className="field-label">{THEME_LABELS[k]}</label><div className="flex gap-2"><input type="color" value={normalizeColor(draft[k])||'#000000'} onChange={e=>update(k,e.target.value)} className="h-11 w-12 rounded-lg border border-border p-1 cursor-pointer"/><Input value={draft[k]||''} onChange={e=>update(k,e.target.value)} placeholder="#RRGGBB or rgb(...)"/></div><div className="h-7 mt-2 rounded-lg border border-border" style={{background:normalizeColor(draft[k])||'#000'}}/><p className="text-[11px] text-muted mt-2">Used in {sections.filter(s=>s[2].includes(k)).length} mapped section(s)</p></div>)}</div></CardContent></Card>)}
      <div className="sticky bottom-4 z-20 mt-7 rounded-2xl border border-border bg-surface/95 p-3 shadow-card backdrop-blur"><Button variant="gold" onClick={save}><Save size={16}/>Save Theme + Typography</Button><span className="text-xs text-muted ml-3">HEX, 3-digit HEX, rgb(), rgba() · Font values are plain CSS font-family stacks.</span></div>
      <Card className="mt-7"><CardHeader><h2 className="font-display text-xl font-semibold">Brand / Contact</h2></CardHeader><CardContent><textarea className="field-input min-h-[220px] font-mono text-xs" value={brand} onChange={e=>setBrand(e.target.value)}/><Button variant="gold" size="sm" className="mt-3" onClick={saveBrand}><Save size={15}/>Save brand settings</Button></CardContent></Card>
    </>}
  </AdminShell>
}
