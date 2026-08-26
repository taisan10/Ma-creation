import { useEffect, useState } from 'react'
import AdminShell from '../../components/admin/AdminShell'
import { api } from '../../lib/api'

function Editor({ resource }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [text, setText] = useState('')
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setLoadError('')
    try {
      const r = await api(`/admin/resources/${resource}`)
      setItems(Array.isArray(r.items) ? r.items : [])
    } catch (e) {
      setLoadError(e.message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function start(item) {
    setEditing(item ? item._id : 'new')
    setText(JSON.stringify(item ? item : (resource === 'services'
      ? { category: 'registration', service: 'New Service', planName: '', price: 0, priceLabel: '', features: '', active: true }
      : { category: 'training', name: 'New Plan', price: 0, billing: 'one-time', duration: '', description: '', features: [], featured: false, active: true }), null, 2))
    setError('')
  }

  async function save() {
    try {
      const data = JSON.parse(text)
      if (editing === 'new') await api(`/admin/resources/${resource}`, { method: 'POST', body: JSON.stringify(data) })
      else await api(`/admin/resources/${resource}/${editing}`, { method: 'PATCH', body: JSON.stringify(data) })
      setEditing(null)
      load()
    } catch (e) { setError(e.message) }
  }

  async function del(id) {
    if (!confirm('Delete this item?')) return
    try {
      await api(`/admin/resources/${resource}/${id}`, { method: 'DELETE' })
      load()
    } catch (e) { setLoadError(e.message) }
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center gap-3">
        <h2 className="font-display text-xl capitalize">{resource}</h2>
        <button className="btn-gold btn-sm" onClick={() => start()}>Add</button>
      </div>
      {loadError && <p className="mt-3 text-rust text-sm">{loadError}</p>}
      <div className="mt-5 space-y-2">
        {loading ? (
          <p className="text-ink/50 text-sm">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-ink/50 text-sm">Nothing here yet.</p>
        ) : items.map(item => (
          <div key={item._id} className="flex items-center justify-between gap-3 border border-ink/10 rounded-lg p-3">
            <div className="min-w-0">
              <b className="text-sm">{item.service || item.name}</b>
              <div className="text-xs text-ink/50">₹{item.price ?? 0} · {item.active ? 'active' : 'hidden'}</div>
            </div>
            <div className="flex gap-2">
              <button className="btn-outline btn-sm" onClick={() => start(item)}>Edit</button>
              <button className="btn-outline btn-sm text-rust" onClick={() => del(item._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <div className="mt-5 border-t border-ink/10 pt-5">
          <label className="field-label">Edit as JSON</label>
          <textarea className="field-input font-mono text-xs min-h-[280px]" value={text} onChange={e => setText(e.target.value)} />
          {error && <p className="text-rust text-sm mt-2">{error}</p>}
          <div className="flex gap-2 mt-3">
            <button className="btn-gold btn-sm" onClick={save}>Save</button>
            <button className="btn-outline btn-sm" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminCatalog() {
  return (
    <AdminShell>
      <h1 className="h2">Services & Plans</h1>
      <p className="mt-2 text-ink/60">The public Services and Plans pages read these records from MongoDB. Edit pricing/content here.</p>
      <div className="grid xl:grid-cols-2 gap-6 mt-7">
        <Editor resource="services" />
        <Editor resource="plans" />
      </div>
    </AdminShell>
  )
}
