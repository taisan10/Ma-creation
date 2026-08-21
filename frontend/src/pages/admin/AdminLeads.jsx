import { useEffect, useState } from 'react'
import AdminShell from '../../components/admin/AdminShell'
import { api } from '../../lib/api'

export default function AdminLeads() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const r = await api('/admin/leads')
      setItems(Array.isArray(r.leads) ? r.leads : [])
    } catch (e) {
      setError(e.message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function status(id, status) {
    try {
      await api(`/admin/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      load()
    } catch (e) { setError(e.message) }
  }

  async function del(id) {
    if (!confirm('Delete this enquiry?')) return
    try {
      await api(`/admin/leads/${id}`, { method: 'DELETE' })
      load()
    } catch (e) { setError(e.message) }
  }

  return (
    <AdminShell>
      <h1 className="h2">Demo / Callback Leads</h1>
      <p className="mt-2 text-ink/60">Every public demo request is stored here.</p>
      {error && <p className="mt-4 text-rust text-sm">{error}</p>}
      {loading ? (
        <p className="mt-7 text-ink/50 text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-7 text-ink/50 text-sm">No leads yet.</p>
      ) : (
        <div className="table-wrap mt-7">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr>
                <th className="th-cell">Contact</th>
                <th className="th-cell">Company</th>
                <th className="th-cell">Type</th>
                <th className="th-cell">Message</th>
                <th className="th-cell">Status</th>
                <th className="th-cell">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map(x => (
                <tr key={x._id}>
                  <td className="td-cell">
                    <b>{x.name}</b>
                    <div className="text-xs text-ink/50">{x.email}<br />{x.phone}</div>
                  </td>
                  <td className="td-cell">{x.company || '—'}</td>
                  <td className="td-cell">{x.type}</td>
                  <td className="td-cell max-w-[300px]">{x.message || '—'}</td>
                  <td className="td-cell">
                    <select className="field-input py-2" value={x.status} onChange={e => status(x._id, e.target.value)}>
                      <option>new</option>
                      <option>contacted</option>
                      <option>closed</option>
                    </select>
                  </td>
                  <td className="td-cell">
                    <button className="btn-outline btn-sm text-rust" onClick={() => del(x._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  )
}
