import { useEffect, useState } from 'react'
import AdminShell from '../../components/admin/AdminShell'
import { api } from '../../lib/api'

const blank = { name: '', logoUrl: '', website: '', partnerSince: '', active: true, order: 0 }

export default function AdminPartners() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState(blank)
  const [edit, setEdit] = useState(null)

  async function load() {
    setLoading(true)
    setLoadError('')
    try {
      const r = await api('/admin/resources/partners')
      setItems(Array.isArray(r.items) ? r.items : [])
    } catch (e) {
      setLoadError(e.message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function save() {
    try {
      const body = { ...form, order: Number(form.order) || 0 }
      if (edit) await api(`/admin/resources/partners/${edit}`, { method: 'PATCH', body: JSON.stringify(body) })
      else await api('/admin/resources/partners', { method: 'POST', body: JSON.stringify(body) })
      setEdit(null)
      setForm(blank)
      load()
    } catch (e) { setLoadError(e.message) }
  }

  async function del(id) {
    if (!confirm('Delete partner?')) return
    try {
      await api(`/admin/resources/partners/${id}`, { method: 'DELETE' })
      load()
    } catch (e) { setLoadError(e.message) }
  }

  return (
    <AdminShell>
      <h1 className="h2">Partners / Client Logos</h1>
      <p className="mt-2 text-ink/60">Add partner names and logo URLs. The public site can consume these records.</p>
      {loadError && <p className="mt-3 text-rust text-sm">{loadError}</p>}
      <div className="grid lg:grid-cols-[1fr_380px] gap-6 mt-7">
        <div className="grid sm:grid-cols-2 gap-4">
          {loading ? (
            <p className="text-ink/50 text-sm">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-ink/50 text-sm">No partners yet.</p>
          ) : items.map(x => (
            <div className="card" key={x._id}>
              {x.logoUrl && <img src={x.logoUrl} alt="" className="h-12 max-w-[180px] object-contain mb-3" />}
              <b>{x.name}</b>
              <p className="text-xs text-ink/50 mt-1">{x.partnerSince || 'Partner'}</p>
              <div className="mt-3 flex gap-2">
                <button className="btn-outline btn-sm" onClick={() => { setEdit(x._id); setForm(x) }}>Edit</button>
                <button className="btn-outline btn-sm text-rust" onClick={() => del(x._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
        <div className="card h-fit">
          <h2 className="font-display text-xl">{edit ? 'Edit Partner' : 'Add Partner'}</h2>
          {[['name', 'Name'], ['logoUrl', 'Logo URL'], ['website', 'Website'], ['partnerSince', 'Partner Since'], ['order', 'Display Order']].map(([key, label]) => (
            <div key={key}>
              <label className="field-label mt-4">{label}</label>
              <input className="field-input" value={form[key] ?? ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
          <div className="mt-4 flex gap-2">
            <button className="btn-gold btn-sm" onClick={save}>Save</button>
            <button className="btn-outline btn-sm" onClick={() => { setEdit(null); setForm(blank) }}>Clear</button>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
