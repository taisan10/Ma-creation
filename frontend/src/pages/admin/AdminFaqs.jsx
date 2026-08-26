import { useEffect, useState } from 'react'
import AdminShell from '../../components/admin/AdminShell'
import { api } from '../../lib/api'

const blank = { question: '', answer: '', order: 0, active: true }

export default function AdminFaqs() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState(blank)
  const [edit, setEdit] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setLoadError('')
    try {
      const r = await api('/admin/resources/faqs')
      setItems(Array.isArray(r.items) ? r.items : [])
    } catch (e) {
      setLoadError(e.message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function reset() { setEdit(null); setForm({ ...blank, order: items.length }) }

  async function save() {
    try {
      const body = { ...form, order: Number(form.order) || 0 }
      if (edit) await api(`/admin/resources/faqs/${edit}`, { method: 'PATCH', body: JSON.stringify(body) })
      else await api('/admin/resources/faqs', { method: 'POST', body: JSON.stringify(body) })
      setError('')
      reset()
      load()
    } catch (e) { setError(e.message) }
  }

  async function del(id) {
    if (!confirm('Delete FAQ?')) return
    try {
      await api(`/admin/resources/faqs/${id}`, { method: 'DELETE' })
      load()
    } catch (e) { setLoadError(e.message) }
  }

  return (
    <AdminShell>
      <h1 className="h2">FAQs</h1>
      {loadError && <p className="mt-3 text-rust text-sm">{loadError}</p>}
      <div className="grid lg:grid-cols-[1fr_380px] gap-6 mt-7">
        <div className="space-y-3">
          {loading ? (
            <p className="text-ink/50 text-sm">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-ink/50 text-sm">No FAQs yet.</p>
          ) : items.map(x => (
            <div className="card" key={x._id}>
              <div className="flex justify-between gap-3">
                <b>{x.question}</b>
                <span className="text-xs text-ink/40">#{x.order}</span>
              </div>
              <p className="text-sm text-ink/60 mt-2">{x.answer}</p>
              <div className="mt-3 flex gap-2">
                <button className="btn-outline btn-sm" onClick={() => { setEdit(x._id); setForm(x) }}>Edit</button>
                <button className="btn-outline btn-sm text-rust" onClick={() => del(x._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
        <div className="card h-fit">
          <h2 className="font-display text-xl">{edit ? 'Edit FAQ' : 'Add FAQ'}</h2>
          <label className="field-label mt-5">Question</label>
          <input className="field-input" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} />
          <label className="field-label mt-4">Answer</label>
          <textarea className="field-input min-h-[150px]" value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} />
          <label className="field-label mt-4">Order</label>
          <input type="number" className="field-input" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) || 0 })} />
          {error && <p className="text-rust text-sm mt-2">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button className="btn-gold btn-sm" onClick={save}>Save</button>
            <button className="btn-outline btn-sm" onClick={reset}>Clear</button>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
